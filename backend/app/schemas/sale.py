import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class SaleBase(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)
    price_per_unit: float = Field(ge=0)
    unit_cost: float | None = Field(None, ge=0, description="Raw-material cost per unit, if known. Omit if unknown — profit then falls back to revenue rather than a fabricated number.")
    channel: str | None = None
    sale_date: date
    notes: str | None = None

class SaleCreate(SaleBase):
    pass

class SaleResponse(BaseModel):
    id: uuid.UUID
    total_amount: float
    profit: float
    profit_is_estimated: bool = Field(description="True when unit_cost wasn't provided, so profit == revenue rather than a real margin.")
    updated_stock: int

    model_config = ConfigDict(from_attributes=True)

class SaleHistoryRow(BaseModel):
    ds: str
    y: float
    product_id: uuid.UUID | str | None = None
