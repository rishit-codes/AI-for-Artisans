from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    craft_type: Optional[str] = None
    location: Optional[str] = None
    # Honeypot — a hidden field real users never see or fill (Login.tsx keeps it
    # visually hidden but present in the DOM). A bot naively filling every input
    # populates it; any non-empty value here rejects the signup. Sandboxed
    # stand-in for a real CAPTCHA (no reCAPTCHA/hCaptcha site key exists).
    website: Optional[str] = None

    model_config = ConfigDict(extra='forbid')

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    model_config = ConfigDict(extra='forbid')

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict  # Will be populated with UserRead

class DeleteAccountRequest(BaseModel):
    password: str

    model_config = ConfigDict(extra='forbid')

class LoginResponse(BaseModel):
    """Either a normal login (access_token + user) or, when 2FA is enabled,
    a pending_token that /auth/2fa/login exchanges for the real one."""
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    user: Optional[dict] = None
    requires_2fa: bool = False
    pending_token: Optional[str] = None

class TwoFASetupResponse(BaseModel):
    secret: str
    otpauth_uri: str
    qr_code_data_uri: str

class TwoFAVerifyRequest(BaseModel):
    code: str

    model_config = ConfigDict(extra='forbid')

class TwoFADisableRequest(BaseModel):
    password: str

    model_config = ConfigDict(extra='forbid')

class TwoFALoginRequest(BaseModel):
    pending_token: str
    code: str

    model_config = ConfigDict(extra='forbid')

class PasswordResetRequest(BaseModel):
    email: EmailStr

    model_config = ConfigDict(extra='forbid')

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    model_config = ConfigDict(extra='forbid')
