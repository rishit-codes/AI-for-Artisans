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
    product_id: Optional[uuid.UUID]
    quantity: int
    total_price: Decimal
    currency: str
    status: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderUpdate(BaseModel):
    status: str  # pending, fulfilled, cancelled
