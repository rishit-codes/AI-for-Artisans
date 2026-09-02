import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MarketplaceProductRead(BaseModel):
    id: uuid.UUID
    artisan_id: uuid.UUID
    artisan_name: str
    artisan_craft_type: Optional[str] = None
    artisan_location: Optional[str] = None
    name: str
    material: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    price: Decimal
    stock_qty: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MarketplaceOrderCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(default=1, ge=1)
    shipping_address: str = Field(min_length=1, max_length=500)
    shipping_city: str = Field(min_length=1, max_length=100)
    shipping_state: str = Field(min_length=1, max_length=100)
    shipping_pincode: str = Field(min_length=1, max_length=10)
    buyer_phone: Optional[str] = Field(default=None, max_length=20)

    model_config = ConfigDict(extra="forbid")
