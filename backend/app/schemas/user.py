import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class PublicProductCard(BaseModel):
    """Deliberately narrow — the public Karigar card must never leak artisan_id,
    stock_qty, is_listed, or timestamps the way the authenticated ProductRead does."""
    id: uuid.UUID
    name: str
    material: Optional[str] = None
    image_url: Optional[str] = None
    price: float

    model_config = ConfigDict(from_attributes=True)

class PublicKarigarProfile(BaseModel):
    id: uuid.UUID
    full_name: str
    craft_type: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    craft_story: Optional[str] = None
    gi_certified: bool = False
    gi_year: Optional[str] = None
    languages: Optional[str] = None
    member_since: int
    products: List[PublicProductCard] = []

    model_config = ConfigDict(from_attributes=True)

class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    craft_type: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    role: str
    email_verified: bool = False
    totp_enabled: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    craft_type: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(extra='forbid')
