from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, TokenResponse, LoginRequest
from app.schemas.user import UserRead
from app.crud.user import get_by_email, create
from app.core.security import verify_password, create_access_token
from app.core.exceptions import InvalidCredentialsError, ArtisanConflictError

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    user = await get_by_email(db, email=data.email)
    if user:
        raise ArtisanConflictError(detail="Email already registered")
    
    new_user = await create(db, obj_in=data)
    access_token = create_access_token(subject=new_user.id)
    user_dict = UserRead.model_validate(new_user).model_dump()
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.post("/login", response_model=TokenResponse)
async def login(
    data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
) -> Any:
    user = await get_by_email(db, email=data.username) # OAuth2 uses username
    if not user or not verify_password(data.password, user.hashed_password):
        raise InvalidCredentialsError(detail="Incorrect email or password")
    
    access_token = create_access_token(subject=user.id)
    user_dict = UserRead.model_validate(user).model_dump()
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

# Also support JSON payload for login just in case frontend prefers it
@router.post("/login/json", response_model=TokenResponse)
async def login_json(
    data: LoginRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    user = await get_by_email(db, email=data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise InvalidCredentialsError(detail="Incorrect email or password")
    
    access_token = create_access_token(subject=user.id)
    user_dict = UserRead.model_validate(user).model_dump()
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}
