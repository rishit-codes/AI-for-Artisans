from datetime import date
from typing import List
from pydantic import BaseModel

class GstCategoryBreakdown(BaseModel):
    category: str
    taxable_value: float
    gst_rate: float
    output_gst: float

class GstSummary(BaseModel):
    period_start: date
    period_end: date
    total_sales: float
    taxable_value: float
    output_gst: float
    input_gst: float
    net_payable: float
    category_breakdown: List[GstCategoryBreakdown]
    sale_count: int
    purchase_count: int
