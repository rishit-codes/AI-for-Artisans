from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid
from decimal import Decimal
from typing import Optional


class OrderCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
    total_price: Decimal = Decimal("0.00")
    currency: str = "INR"


class OrderRead(BaseModel):
    id: uuid.UUID
    artisan_id: uuid.UUID
    buyer_id: Optional[uuid.UUID] = None
    product_id: Optional[uuid.UUID]
    quantity: int
    total_price: Decimal
    currency: str
    status: str
    created_at: datetime | None = None

    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_pincode: Optional[str] = None

    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    payment_status: str = "pending"
    payment_ref: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderUpdate(BaseModel):
    # pending -> confirmed -> shipped -> delivered, or cancelled before shipped
    status: Optional[str] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None

    model_config = ConfigDict(extra='forbid')
