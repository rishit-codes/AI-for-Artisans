import logging
from typing import List, Optional
from datetime import datetime, timezone
import random
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.schemas.material import CommodityRead, MandiComparisonRead
from app.crud.material import list_commodities, get_mandi_comparison
from app.services.commodity_fetcher import update_commodity_prices
from app.services.mandi_scraper import fetch_mandi_prices_async
from app.models.mandi_log import MandiScrapingLog, MandiPrice

router = APIRouter()
logger = logging.getLogger(__name__)

class ArbitrageCalcRequest(BaseModel):
    commodity_name: str
    quantity: float = 50.0
    destination_city: str = "Varanasi"

# Regional Freight Matrix (Flat Handling Base + Per-Unit Transit Surcharge)
FREIGHT_RULES = {
    "Surat": {"base_fee": 150.0, "per_unit": 0.6, "lead_days": "2 days"},
    "Delhi": {"base_fee": 120.0, "per_unit": 0.5, "lead_days": "2 days"},
    "Jaipur": {"base_fee": 180.0, "per_unit": 0.7, "lead_days": "3 days"},
    "Mumbai": {"base_fee": 220.0, "per_unit": 0.8, "lead_days": "3 days"},
    "Varanasi": {"base_fee": 0.0, "per_unit": 0.0, "lead_days": "Same day (Local)"}
}

@router.get("/commodities", response_model=List[CommodityRead])
async def get_commodities(db: AsyncSession = Depends(get_db)):
    """Get all commodity price cards."""
    commodities = await list_commodities(db)
    return commodities

@router.get("/mandi", response_model=List[MandiComparisonRead])
async def get_mandi(
    category: str = Query("Textiles", description="Category: Textiles or Metals"),
    db: AsyncSession = Depends(get_db),
):
    """Get local mandi comparison data for a given category."""
    comparison = await get_mandi_comparison(db, category)
    return comparison

@router.get("/mandi-arbitrage")
async def get_mandi_arbitrage(db: AsyncSession = Depends(get_db)):
    """
    Get 5-city cross-mandi comparative price sheet, arbitrage savings, and supplier recommendations.
    """
    res = await db.execute(select(MandiPrice).order_by(MandiPrice.id))
    mandi_records = res.scalars().all()
    
    if not mandi_records:
        await fetch_mandi_prices_async(db)
        res = await db.execute(select(MandiPrice).order_by(MandiPrice.id))
        mandi_records = res.scalars().all()

    cities = ["Local · वाराणसी", "Surat", "Delhi", "Jaipur", "Mumbai"]
    city_names = ["Varanasi", "Surat", "Delhi", "Jaipur", "Mumbai"]
    
    rows = []
    suppliers = []

    for r in mandi_records:
        prices = [
            r.varanasi_price,
            r.surat_price,
            r.delhi_price,
            r.jaipur_price,
            r.mumbai_price
        ]
        
        min_price = min(prices)
        min_index = prices.index(min_price)
        lowest_city = city_names[min_index]
        savings = round(r.varanasi_price - min_price, 2)
        
        rows.append({
            "item": r.commodity_name,
            "hindi": r.hindi_name,
            "category": r.category,
            "unit": r.unit,
            "prices": prices,
            "delta": r.delta_7d,
            "supply": r.supply_status,
            "lowest_mandi": lowest_city,
            "arbitrage_savings": f"₹{int(savings)}{r.unit}" if savings > 0 else "Best Local Rate",
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        })

        if savings > 0:
            suppliers.append({
                "name": f"{lowest_city} Wholesale Craft Co-op",
                "item": r.commodity_name,
                "lead": FREIGHT_RULES.get(lowest_city, {}).get("lead_days", "2-3 days"),
                "trust": 4.8,
                "savings": f"Save ₹{int(savings)}{r.unit} (-{round((savings / r.varanasi_price) * 100, 1)}%)",
                "mandi": lowest_city
            })

    return {
        "markets": cities,
        "rows": rows,
        "suppliers": suppliers[:4]
    }

@router.post("/calculate-arbitrage")
async def calculate_arbitrage(
    payload: ArbitrageCalcRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Interactive Arbitrage Quantity Calculator & Freight Surcharge Engine.
    Calculates delivered bulk procurement costs across 5 wholesale hubs.
    """
    res = await db.execute(
        select(MandiPrice).where(
            (MandiPrice.commodity_name == payload.commodity_name) |
            (MandiPrice.commodity_name.ilike(f"%{payload.commodity_name}%")) |
            (MandiPrice.hindi_name.ilike(f"%{payload.commodity_name}%"))
        ).limit(1)
    )
    rec = res.scalar_one_or_none()
    
    if not rec:
        all_res = await db.execute(select(MandiPrice).limit(1))
        rec = all_res.scalar_one_or_none()
        if not rec:
            await fetch_mandi_prices_async(db)
            all_res = await db.execute(select(MandiPrice).limit(1))
            rec = all_res.scalar_one_or_none()

    if not rec:
        raise HTTPException(status_code=404, detail="No mandi commodity pricing available.")

    qty = max(1.0, payload.quantity)
    
    city_map = {
        "Varanasi": rec.varanasi_price,
        "Surat": rec.surat_price,
        "Delhi": rec.delhi_price,
        "Jaipur": rec.jaipur_price,
        "Mumbai": rec.mumbai_price
    }

    local_price = city_map.get(payload.destination_city, rec.varanasi_price)
    local_total = round(local_price * qty, 2)

    breakdown = []
    best_option = None
    min_delivered_cost = float('inf')

    for city, raw_unit_price in city_map.items():
        freight_info = FREIGHT_RULES.get(city, {"base_fee": 150.0, "per_unit": 0.5, "lead_days": "2-3 days"})
        
        raw_mat_cost = round(raw_unit_price * qty, 2)
        freight_cost = 0.0 if city == payload.destination_city else round(freight_info["base_fee"] + (freight_info["per_unit"] * qty), 2)
        total_delivered = round(raw_mat_cost + freight_cost, 2)
        savings_vs_local = round(local_total - total_delivered, 2)

        entry = {
            "mandi_city": city,
            "unit_price": raw_unit_price,
            "raw_material_cost": raw_mat_cost,
            "freight_cost": freight_cost,
            "total_delivered_cost": total_delivered,
            "savings_vs_local": savings_vs_local,
            "lead_time": freight_info["lead_days"],
            "is_best": False
        }
        
        if total_delivered < min_delivered_cost:
            min_delivered_cost = total_delivered
            best_option = city

        breakdown.append(entry)

    for entry in breakdown:
        if entry["mandi_city"] == best_option:
            entry["is_best"] = True

    best_entry = next((e for e in breakdown if e["mandi_city"] == best_option), breakdown[0])
    net_savings = max(0.0, round(local_total - best_entry["total_delivered_cost"], 2))
    savings_pct = round((net_savings / local_total) * 100, 1) if local_total > 0 else 0.0

    return {
        "commodity_name": rec.commodity_name,
        "hindi_name": rec.hindi_name,
        "unit": rec.unit,
        "quantity": qty,
        "local_city": payload.destination_city,
        "local_unit_price": local_price,
        "local_total_cost": local_total,
        "recommended_mandi": best_option,
        "recommended_delivered_unit_price": round(best_entry["total_delivered_cost"] / qty, 2),
        "recommended_total_delivered_cost": best_entry["total_delivered_cost"],
        "freight_cost": best_entry["freight_cost"],
        "net_savings": net_savings,
        "net_savings_pct": savings_pct,
        "breakdown": breakdown
    }

@router.get("/export-csv")
async def export_mandi_csv(db: AsyncSession = Depends(get_db)):
    """
    Direct HTTP file attachment download for 5-city Mandi Prices CSV.
    Guarantees `.csv` extension on Windows/Mac browsers.
    """
    res = await db.execute(select(MandiPrice).order_by(MandiPrice.id))
    mandi_records = res.scalars().all()
    
    if not mandi_records:
        await fetch_mandi_prices_async(db)
        res = await db.execute(select(MandiPrice).order_by(MandiPrice.id))
        mandi_records = res.scalars().all()

    header = "Commodity,Hindi Name,Unit,Varanasi (Local),Surat,Delhi,Jaipur,Mumbai,Supply Status\n"
    rows = []
    for r in mandi_records:
        rows.append(f'"{r.commodity_name}","{r.hindi_name}","{r.unit}",{r.varanasi_price},{r.surat_price},{r.delhi_price},{r.jaipur_price},{r.mumbai_price},"{r.supply_status}"')

    csv_content = "\uFEFF" + header + "\n".join(rows)
    filename = f"mandi-arbitrage-prices-{datetime.now().strftime('%Y-%m-%d')}.csv"
    
    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post("/download-sourcing-sheet")
async def download_sourcing_sheet_file(
    payload: ArbitrageCalcRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct HTTP file attachment download for Co-op Sourcing Order Sheet (.txt).
    Guarantees `.txt` extension on Windows/Mac browsers.
    """
    calc = await calculate_arbitrage(payload, db)
    ref_id = f"AG-MANDI-{random.randint(100000, 999999)}"
    date_str = datetime.now().strftime("%d/%m/%Y")

    breakdown_rows = []
    for b in calc["breakdown"]:
        best_tag = " [★ RECOMMENDED BEST HUB]" if b["is_best"] else ""
        breakdown_rows.append(f"{b['mandi_city'].padEnd(12)} | Unit Rate: ₹{b['unit_price']} | Freight: ₹{b['freight_cost']} | Total Delivered: ₹{b['total_delivered_cost']:,} | Lead: {b['lead_time']}{best_tag}")

    text_content = f"""===============================================================
ARTISANGPS · कारीगर मंडी खरीद पर्चा (Sourcing Order Sheet)
Reference ID: {ref_id} | Date: {date_str}
===============================================================

DESTINATION CLUSTER: {calc['local_city']} Artisan Cluster
RECOMMENDED SOURCING MANDI: {calc['recommended_mandi']} Wholesale Co-op

COMMODITY DETAILS:
---------------------------------------------------------------
Commodity Name:      {calc['commodity_name']} ({calc['hindi_name']})
Quantity Required:   {calc['quantity']} {calc['unit']}
Delivered Unit Rate: ₹{calc['recommended_delivered_unit_price']} / unit
Freight Surcharge:   ₹{calc['freight_cost']}
Total Delivered:     ₹{calc['recommended_total_delivered_cost']:,}

ARBITRAGE ADVANTAGE:
---------------------------------------------------------------
Local Procurement Cost ({calc['local_city']}): ₹{calc['local_total_cost']:,}
Best Wholesale Delivered Cost ({calc['recommended_mandi']}): ₹{calc['recommended_total_delivered_cost']:,}
NET DELIVERED SAVINGS: Save ₹{calc['net_savings']:,} (-{calc['net_savings_pct']}%)

DELIVERED COST BREAKDOWN ACROSS ALL 5 MANDI HUBS:
---------------------------------------------------------------
{chr(10).join(breakdown_rows)}

===============================================================
Generated by ArtisanGPS Market Intelligence Platform v0.4
"""
    filename = f"Sourcing-Order-Sheet-{ref_id}.txt"
    return Response(
        content=text_content.encode("utf-8"),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/scraping-logs")
async def get_mandi_scraping_logs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit log history from `mandi_scraping_logs` (Section 8.2 & ERD Figure 3).
    """
    res = await db.execute(
        select(MandiScrapingLog)
        .order_by(desc(MandiScrapingLog.scraped_at))
        .limit(limit)
    )
    logs = res.scalars().all()
    
    return [
        {
            "id": l.id,
            "log_id": l.log_id,
            "mandi_city": l.mandi_city,
            "commodity_name": l.commodity_name,
            "price_per_unit": l.price_per_unit,
            "unit": l.unit,
            "status_code": l.status_code,
            "response_time_ms": l.response_time_ms,
            "scraped_at": l.scraped_at.isoformat() if l.scraped_at else None
        }
        for l in logs
    ]

@router.post("/sync")
async def sync_live_commodities(db: AsyncSession = Depends(get_db)):
    """Manually trigger fetching live commodity prices from Alpha Vantage."""
    await update_commodity_prices(db)
    return {"status": "success", "message": "Live commodity prices successfully synced from Alpha Vantage"}

@router.post("/trigger-mandi-scrape")
async def trigger_mandi_scrape(db: AsyncSession = Depends(get_db)):
    """Manually trigger Agmarknet 5-city mandi scraper and audit logger."""
    result = await fetch_mandi_prices_async(db)
    return result
