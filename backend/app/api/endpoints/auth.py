import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, TokenResponse, LoginRequest, DeleteAccountRequest, LoginResponse,
    TwoFASetupResponse, TwoFAVerifyRequest, TwoFADisableRequest, TwoFALoginRequest,
    PasswordResetRequest, PasswordResetConfirm,
)
from app.schemas.user import UserRead, UserUpdate
from app.crud.user import get_by_email, create
from app.crud.email_token import create_token, consume_token
from app.core.security import verify_password, create_access_token, create_pending_2fa_token, get_password_hash
from app.core.exceptions import InvalidCredentialsError, ArtisanConflictError, ArtisanForbiddenError
from app.core.limiter import limiter
from app.api.dependencies import get_current_user
from app.services.email import send_email
from app.services.two_factor import generate_totp_secret, build_otpauth_uri, qr_code_data_uri, verify_totp_code

router = APIRouter()

FRONTEND_URL = settings.FRONTEND_URL or "http://localhost:5173"


def _user_response(user) -> dict:
    return {"access_token": create_access_token(subject=user.id, token_version=user.token_version),
            "token_type": "bearer", "user": UserRead.model_validate(user).model_dump()}


# Credential-guessing and account-enumeration surfaces — capped independently of
# the rest of the API's traffic.
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    if data.website:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration rejected")

    user = await get_by_email(db, email=data.email)
    if user:
        raise ArtisanConflictError(detail="Email already registered")

    new_user = await create(db, obj_in=data)

    token = await create_token(db, new_user.id, "verify_email", hours_valid=48)
    verify_link = f"{FRONTEND_URL}/verify-email?token={token.token}"
    await send_email(
        db, new_user.email, "Verify your ArtisanGPS email",
        f"Hi {new_user.full_name},\n\nVerify your email: {verify_link}\n\nThis link expires in 48 hours.",
    )

    return _user_response(new_user)

@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(
    request: Request, data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
) -> Any:
    user = await get_by_email(db, email=data.username) # OAuth2 uses username
    if not user or not verify_password(data.password, user.hashed_password):
        raise InvalidCredentialsError(detail="Incorrect email or password")
    if not user.is_active:
        raise ArtisanForbiddenError(detail="This account has been suspended. Contact support.")

    if user.totp_enabled:
        return {"requires_2fa": True, "pending_token": create_pending_2fa_token(user.id)}
    return _user_response(user)

# Also support JSON payload for login just in case frontend prefers it
@router.post("/login/json", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login_json(
    request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    user = await get_by_email(db, email=data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise InvalidCredentialsError(detail="Incorrect email or password")
    if not user.is_active:
        raise ArtisanForbiddenError(detail="This account has been suspended. Contact support.")

    if user.totp_enabled:
        return {"requires_2fa": True, "pending_token": create_pending_2fa_token(user.id)}
    return _user_response(user)

@router.post("/2fa/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def two_fa_login(
    request: Request, data: TwoFALoginRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    """Exchanges the short-lived pending_token from /auth/login (issued when
    the password was correct but 2FA is enabled) plus a TOTP code for a real
    access token."""
    try:
        payload = jwt.decode(data.pending_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        if not payload.get("pending_2fa"):
            raise InvalidCredentialsError(detail="Invalid or expired 2FA session")
        user_id = payload["sub"]
    except JWTError:
        raise InvalidCredentialsError(detail="Invalid or expired 2FA session")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.totp_enabled or not user.totp_secret:
        raise InvalidCredentialsError(detail="Invalid or expired 2FA session")
    if not verify_totp_code(user.totp_secret, data.code):
        raise InvalidCredentialsError(detail="Incorrect 2FA code")

    return _user_response(user)

@router.post("/2fa/setup", response_model=TwoFASetupResponse)
async def setup_2fa(
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Generates a new TOTP secret (not yet enabled — /2fa/verify confirms
    the user actually scanned it before turning enforcement on)."""
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    current_user.totp_enabled = False
    db.add(current_user)
    await db.commit()

    otpauth_uri = build_otpauth_uri(secret, current_user.email)
    return {"secret": secret, "otpauth_uri": otpauth_uri, "qr_code_data_uri": qr_code_data_uri(otpauth_uri)}

@router.post("/2fa/verify", status_code=status.HTTP_204_NO_CONTENT)
async def verify_2fa_setup(
    data: TwoFAVerifyRequest,
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    if not current_user.totp_secret:
        raise ArtisanConflictError(detail="Call /2fa/setup first")
    if not verify_totp_code(current_user.totp_secret, data.code):
        raise InvalidCredentialsError(detail="Incorrect code")
    current_user.totp_enabled = True
    db.add(current_user)
    await db.commit()

@router.post("/2fa/disable", status_code=status.HTTP_204_NO_CONTENT)
async def disable_2fa(
    data: TwoFADisableRequest,
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    if not verify_password(data.password, current_user.hashed_password):
        raise InvalidCredentialsError(detail="Incorrect password")
    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.add(current_user)
    await db.commit()

@router.post("/verify-email/request", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/minute")
async def request_email_verification(
    request: Request,
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    if current_user.email_verified:
        return
    token = await create_token(db, current_user.id, "verify_email", hours_valid=48)
    verify_link = f"{FRONTEND_URL}/verify-email?token={token.token}"
    await send_email(
        db, current_user.email, "Verify your ArtisanGPS email",
        f"Hi {current_user.full_name},\n\nVerify your email: {verify_link}\n\nThis link expires in 48 hours.",
    )

@router.get("/verify-email/{token}", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_email_verification(token: str, db: AsyncSession = Depends(get_db)) -> None:
    email_token = await consume_token(db, token, "verify_email")
    if not email_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link")
    result = await db.execute(select(User).where(User.id == email_token.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.email_verified = True
    db.add(user)
    await db.commit()

@router.post("/password-reset/request", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/minute")
async def request_password_reset(
    request: Request, data: PasswordResetRequest, db: AsyncSession = Depends(get_db)
) -> None:
    """Always returns 204 regardless of whether the email exists, so this
    endpoint can't be used to enumerate registered accounts."""
    user = await get_by_email(db, email=data.email)
    if user:
        token = await create_token(db, user.id, "reset_password", hours_valid=1)
        reset_link = f"{FRONTEND_URL}/reset-password?token={token.token}"
        await send_email(
            db, user.email, "Reset your ArtisanGPS password",
            f"Hi {user.full_name},\n\nReset your password: {reset_link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.",
        )

@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def confirm_password_reset(
    request: Request, data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
) -> None:
    email_token = await consume_token(db, data.token, "reset_password")
    if not email_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")
    result = await db.execute(select(User).where(User.id == email_token.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = get_password_hash(data.new_password)
    user.token_version += 1  # reset also signs out every existing session
    db.add(user)
    await db.commit()

@router.put("/me", response_model=UserRead)
async def update_current_user(
    data: UserUpdate,
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Need to import update function from crud.user
    from app.crud.user import update as update_user
    updated_user = await update_user(db, db_obj=current_user, obj_in=data)
    return updated_user

@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all_devices(
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Invalidate every token issued for this user so far, on every device —
    bumping token_version makes get_current_user reject them all immediately."""
    current_user.token_version += 1
    db.add(current_user)
    await db.commit()

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    data: DeleteAccountRequest,
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Permanently deletes the account and everything owned by it. Deletes
    child rows explicitly rather than relying on the DB's ON DELETE CASCADE —
    SQLite doesn't enforce foreign keys unless a per-connection PRAGMA turns
    it on (this app doesn't), so cascade-only deletion would silently orphan
    rows in local/SQLite dev even though it'd work under Postgres. Requires
    re-entering the password so a hijacked/idle session can't wipe an account
    silently."""
    if not verify_password(data.password, current_user.hashed_password):
        raise InvalidCredentialsError(detail="Incorrect password")

    from sqlalchemy import delete as sql_delete
    from app.models.product import Product
    from app.models.order import Order
    from app.models.sale import Sale
    from app.models.purchase import Purchase
    from app.models.task import Task
    from app.models.plan_item import PlanItem
    from app.models.prediction import Prediction
    from app.models.model_version import ModelVersion
    from app.models.email_token import EmailToken

    uid = current_user.id
    await db.execute(sql_delete(PlanItem).where(PlanItem.user_id == uid))
    await db.execute(sql_delete(Task).where(Task.user_id == uid))
    await db.execute(sql_delete(Order).where(Order.artisan_id == uid))
    await db.execute(sql_delete(Sale).where(Sale.user_id == uid))
    await db.execute(sql_delete(Purchase).where(Purchase.artisan_id == uid))
    await db.execute(sql_delete(Prediction).where(Prediction.user_id == uid))
    await db.execute(sql_delete(ModelVersion).where(ModelVersion.user_id == uid))
    await db.execute(sql_delete(EmailToken).where(EmailToken.user_id == uid))
    await db.execute(sql_delete(Product).where(Product.artisan_id == uid))
    await db.delete(current_user)
    await db.commit()
