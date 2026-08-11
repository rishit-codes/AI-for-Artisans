import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductRead

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
    products: List[ProductRead] = []

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
