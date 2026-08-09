"""
GST calculation logic for the Reports > GST Filing Helper.

Rates approximate real Indian GST slabs for handicraft categories (HSN-based,
simplified for a small-artisan tool — not a substitute for a CA's filing):
handloom textiles and pottery/terracotta are typically taxed at the lower 5%
slab, while worked metal and wood items usually fall under the 12% slab.
"""
from collections import defaultdict
from datetime import date
from typing import Dict, List, Optional

CATEGORY_GST_RATES: Dict[str, float] = {
    "Textiles": 5.0,
    "Pottery": 5.0,
    "Metalwork": 12.0,
    "Woodwork": 12.0,
}
DEFAULT_GST_RATE = 12.0

def get_gst_rate_for_category(category: Optional[str]) -> float:
    if not category:
        return DEFAULT_GST_RATE
    return CATEGORY_GST_RATES.get(category, DEFAULT_GST_RATE)

def build_gst_summary(
    sale_rows: List[dict],
    purchase_rows: List[dict],
    period_start: date,
    period_end: date,
) -> dict:
    """
    sale_rows: [{"category": str | None, "revenue": float}, ...]
    purchase_rows: [{"amount": float, "gst_rate": float}, ...]
    """
    category_totals: Dict[str, float] = defaultdict(float)
    for row in sale_rows:
        category = row["category"] or "Uncategorized"
        category_totals[category] += row["revenue"]

    category_breakdown = []
    output_gst = 0.0
    total_sales = 0.0
    for category, revenue in sorted(category_totals.items()):
        rate = get_gst_rate_for_category(category if category != "Uncategorized" else None)
        gst_amount = round(revenue * rate / 100, 2)
        category_breakdown.append({
            "category": category,
            "taxable_value": round(revenue, 2),
            "gst_rate": rate,
            "output_gst": gst_amount,
        })
        output_gst += gst_amount
        total_sales += revenue

    input_gst = sum(round(p["amount"] * p["gst_rate"] / 100, 2) for p in purchase_rows)
    output_gst = round(output_gst, 2)
    input_gst = round(input_gst, 2)
    net_payable = round(max(0.0, output_gst - input_gst), 2)

    return {
        "period_start": period_start,
        "period_end": period_end,
        "total_sales": round(total_sales, 2),
        "taxable_value": round(total_sales, 2),
        "output_gst": output_gst,
        "input_gst": input_gst,
        "net_payable": net_payable,
        "category_breakdown": category_breakdown,
        "sale_count": len(sale_rows),
        "purchase_count": len(purchase_rows),
    }
