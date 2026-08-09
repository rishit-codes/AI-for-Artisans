import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class PurchaseBase(BaseModel):
    material_name: str
    amount: float = Field(gt=0)
    gst_rate: float = Field(ge=0, le=28)
    purchase_date: date
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    model_config = ConfigDict(extra='forbid')

class PurchaseRead(PurchaseBase):
    id: uuid.UUID
    artisan_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
