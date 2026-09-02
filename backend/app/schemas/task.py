import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):
    title: str
    source: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "pending"

    model_config = ConfigDict(extra='forbid')


class TaskRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    source: Optional[str] = None
    status: str
    due_date: Optional[date] = None
    snoozed_until: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    snoozed_until: Optional[date] = None

    model_config = ConfigDict(extra='forbid')
