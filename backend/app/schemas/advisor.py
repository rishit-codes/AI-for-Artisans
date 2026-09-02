import uuid
from typing import List, Optional
from pydantic import BaseModel


class RecommendationOut(BaseModel):
    product_id: uuid.UUID
    product_name: str
    material: Optional[str] = None
    image_url: Optional[str] = None
    unit_revenue: float
    unit_cost: Optional[float] = None  # avg of real logged Sale.unit_cost, null if never logged
    suggested_batch: int
    confidence: int  # 0..100, derived from real forecast MAPE or a disclosed lower band for category-prior
    trend_pct: Optional[float] = None  # real festival-multiplier-derived lift, same signal as Dashboard
    festival: Optional[str] = None
    festival_days_away: Optional[int] = None
    rationale: str
    model_version: str
    has_enough_data: bool


class MaterialForCraft(BaseModel):
    commodity: str
    sub: Optional[str] = None
    local_price: Optional[str] = None
    local_best: bool = False
    surat_price: Optional[str] = None
    surat_best: bool = False
    delhi_price: Optional[str] = None
    delhi_best: bool = False
    trend: Optional[str] = None
    action: Optional[str] = None


class RecentPace(BaseModel):
    avg_units_per_week: float
    avg_revenue_per_month: float
    weeks_of_history: int


class AdvisorRecommendationsResponse(BaseModel):
    recommendations: List[RecommendationOut]
    materials: List[MaterialForCraft]
    recent_pace: RecentPace


class PlanItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int
    week: int = 1


class PlanItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    image_url: Optional[str] = None
    quantity: int
    week: int
    unit_revenue: float
    unit_cost: Optional[float] = None
