import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    craft_type: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    craft_type: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None

    model_config = ConfigDict(extra='forbid')
