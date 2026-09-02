import hmac
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def create_access_token(subject: str | int, token_version: int = 0) -> str:
    # `tv` is checked against User.token_version on every request. Bumping the
    # column (e.g. on "sign out of all devices") makes every previously-issued
    # token for that user fail validation immediately, without needing a
    # per-token blocklist — this JWT setup has no jti/session table to revoke by.
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS)
    to_encode = {"exp": expire, "iat": datetime.now(timezone.utc), "sub": str(subject), "tv": token_version}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_pending_2fa_token(subject: str | int) -> str:
    """Issued instead of a real access token when the password check passes
    but the account has 2FA enabled — short-lived and marked `pending_2fa` so
    it can't be used as a normal bearer token; /auth/2fa/login exchanges it
    (plus a valid TOTP code) for the real access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    to_encode = {"exp": expire, "iat": datetime.now(timezone.utc), "sub": str(subject), "pending_2fa": True}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def compare_strings_constant_time(val1: str, val2: str) -> bool:
    return hmac.compare_digest(val1.encode("utf-8"), val2.encode("utf-8"))
