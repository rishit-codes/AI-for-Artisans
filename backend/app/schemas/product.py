import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ProductBase(BaseModel):
    name: str
    material: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    price: float = Field(gt=0)
    stock_qty: int = Field(ge=0, default=0)
    is_listed: Optional[bool] = True

class ProductCreate(ProductBase):
    model_config = ConfigDict(extra='forbid')

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock_qty: Optional[int] = Field(None, ge=0)
    is_listed: Optional[bool] = None

    model_config = ConfigDict(extra='forbid')

class ProductRead(ProductBase):
    id: uuid.UUID
    artisan_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
