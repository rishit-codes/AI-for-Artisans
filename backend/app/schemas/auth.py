from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    craft_type: Optional[str] = None
    location: Optional[str] = None
    
    model_config = ConfigDict(extra='forbid')

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    model_config = ConfigDict(extra='forbid')

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict  # Will be populated with UserRead
