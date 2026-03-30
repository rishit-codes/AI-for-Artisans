import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class SaleBase(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)
    price_per_unit: float = Field(ge=0)
    channel: str | None = None
    sale_date: date
    notes: str | None = None

class SaleCreate(SaleBase):
    pass

class SaleResponse(BaseModel):
    id: uuid.UUID
    total_amount: float
    profit: float
    updated_stock: int

    model_config = ConfigDict(from_attributes=True)

class SaleHistoryRow(BaseModel):
    ds: str
    y: float
    product_id: uuid.UUID | str | None = None
