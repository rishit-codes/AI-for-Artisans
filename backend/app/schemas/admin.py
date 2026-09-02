import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class AdminUserRow(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    craft_type: Optional[str] = None
    location: Optional[str] = None
    role: str
    is_active: bool
    gi_certified: bool = False
    gi_year: Optional[str] = None
    product_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUsersPage(BaseModel):
    users: List[AdminUserRow]
    total: int
    page: int
    page_size: int


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    gi_certified: Optional[bool] = None
    gi_year: Optional[str] = None

    model_config = ConfigDict(extra='forbid')


class CraftTypeCount(BaseModel):
    craft_type: str
    count: int


class BulkUserUpdate(BaseModel):
    user_ids: List[uuid.UUID]
    is_active: Optional[bool] = None
    role: Optional[str] = None


class BulkUpdateResult(BaseModel):
    updated: int
    skipped: List[str]  # emails skipped (e.g. self, or invalid role)


class EmailOutboxEntry(BaseModel):
    id: uuid.UUID
    to_email: str
    subject: str
    body_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogEntry(BaseModel):
    id: uuid.UUID
    admin_email: str
    target_email: str
    action: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminMetrics(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    admin_users: int
    signups_last_30_days: int
    total_products: int
    listed_products: int
    total_orders: int
    total_sales_value: float
    users_by_craft_type: List[CraftTypeCount]
