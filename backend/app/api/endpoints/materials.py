import csv
import io
import json
import logging
from typing import List, Optional
from datetime import datetime, timezone
import random
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.schemas.material import CommodityRead, MandiComparisonRead
from app.crud.material import list_commodities, get_mandi_comparison
from app.services.commodity_fetcher import update_commodity_prices
from app.services.mandi_scraper import fetch_mandi_prices_async
from app.models.mandi_log import MandiScrapingLog, MandiPrice

# Every route below reads or triggers spend against shared, rate-limited resources
# (Groq/Alpha Vantage quota, outbound scrapes to agmarknet.gov.in, DB writes) — none
# of them are meant to be reachable pre-login, and nothing in the frontend calls them
# from an unauthenticated page. Enforced once here rather than per-route so nothing
# can be added later and accidentally left open.
router = APIRouter(dependencies=[Depends(get_current_user)])
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

CITY_HINDI_NAMES = {
    "Varanasi": "वाराणसी",
    "Surat": "सूरत",
    "Delhi": "दिल्ली",
    "Jaipur": "जयपुर",
    "Mumbai": "मुंबई",
}
ALL_CITIES = ["Varanasi", "Surat", "Delhi", "Jaipur", "Mumbai"]

@router.get("/mandi-arbitrage")
async def get_mandi_arbitrage(
    local_city: str = Query("Varanasi", description="Artisan cluster's home mandi city — drives which column is 'Local'"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get 5-city cross-mandi comparative price sheet, arbitrage savings, and supplier recommendations,
    reordered and recalculated relative to `local_city` (the artisan's selected cluster).
    """
    if local_city not in ALL_CITIES:
        local_city = "Varanasi"

    res = await db.execute(select(MandiPrice).order_by(MandiPrice.id))
    mandi_records = res.scalars().all()

    if not mandi_records:
        await fetch_mandi_prices_async(db)
        res = await db.execute(select(MandiPrice).order_by(MandiPrice.id))
        mandi_records = res.scalars().all()

    # Local city always shown first; the rest keep their usual order.
    city_order = [local_city] + [c for c in ALL_CITIES if c != local_city]
    cities = [f"Local · {CITY_HINDI_NAMES[local_city]}"] + city_order[1:]

    rows = []
    suppliers = []

    for r in mandi_records:
        city_price_map = {
            "Varanasi": r.varanasi_price,
            "Surat": r.surat_price,
            "Delhi": r.delhi_price,
            "Jaipur": r.jaipur_price,
            "Mumbai": r.mumbai_price,
        }
        prices = [city_price_map[c] for c in city_order]
        local_price = prices[0]

        other_prices = prices[1:]
        min_price = min(other_prices) if other_prices else local_price
        if min_price < local_price:
            min_index = other_prices.index(min_price) + 1
            lowest_city = city_order[min_index]
        else:
            min_price = local_price
            lowest_city = local_city
        savings = round(local_price - min_price, 2)

        try:
            sparkline = json.loads(r.sparkline_points) if r.sparkline_points else []
        except (json.JSONDecodeError, TypeError):
            sparkline = []

        rows.append({
            "item": r.commodity_name,
            "hindi": r.hindi_name,
            "category": r.category,
            "unit": r.unit,
            "prices": prices,
            "delta": r.delta_7d,
            "sparkline": sparkline,
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
                "savings": f"Save ₹{int(savings)}{r.unit} (-{round((savings / local_price) * 100, 1)}%)",
                "mandi": lowest_city
            })

    return {
        "local_city": local_city,
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

@router.post("/download-sourcing-sheet-csv")
async def download_sourcing_sheet_csv(
    payload: ArbitrageCalcRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct HTTP file attachment download for Co-op Sourcing Order Sheet (.csv).
    """
    calc = await calculate_arbitrage(payload, db)
    ref_id = f"AG-MANDI-{random.randint(100000, 999999)}"
    date_str = datetime.now().strftime("%d/%m/%Y")

    buf = io.StringIO()
    buf.write("﻿")
    writer = csv.writer(buf)
    writer.writerow(["ArtisanGPS Sourcing Order Sheet"])
    writer.writerow(["Reference ID", ref_id])
    writer.writerow(["Date", date_str])
    writer.writerow([])
    writer.writerow(["Destination Cluster", f"{calc['local_city']} Artisan Cluster"])
    writer.writerow(["Recommended Sourcing Mandi", f"{calc['recommended_mandi']} Wholesale Co-op"])
    writer.writerow([])
    writer.writerow(["Commodity", calc["commodity_name"], calc["hindi_name"]])
    writer.writerow(["Quantity Required", calc["quantity"], calc["unit"]])
    writer.writerow(["Delivered Unit Rate", calc["recommended_delivered_unit_price"]])
    writer.writerow(["Freight Surcharge", calc["freight_cost"]])
    writer.writerow(["Total Delivered", calc["recommended_total_delivered_cost"]])
    writer.writerow([])
    writer.writerow(["Local Procurement Cost", calc["local_total_cost"]])
    writer.writerow(["Net Savings", calc["net_savings"], f"{calc['net_savings_pct']}%"])
    writer.writerow([])
    writer.writerow(["Mandi Hub", "Unit Rate", "Freight Cost", "Total Delivered", "Lead Time", "Recommended"])
    for b in calc["breakdown"]:
        writer.writerow([
            b["mandi_city"], b["unit_price"], b["freight_cost"], b["total_delivered_cost"],
            b["lead_time"], "YES" if b["is_best"] else ""
        ])

    filename = f"Sourcing-Order-Sheet-{ref_id}.csv"
    return Response(
        content=buf.getvalue().encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post("/download-sourcing-sheet-pdf")
async def download_sourcing_sheet_pdf(
    payload: ArbitrageCalcRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct HTTP file attachment download for Co-op Sourcing Order Sheet (.pdf).
    """
    calc = await calculate_arbitrage(payload, db)
    ref_id = f"AG-MANDI-{random.randint(100000, 999999)}"
    date_str = datetime.now().strftime("%d/%m/%Y")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("SheetTitle", parent=styles["Title"], fontSize=16, spaceAfter=2)
    sub_style = ParagraphStyle("SheetSub", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
    section_style = ParagraphStyle("SheetSection", parent=styles["Heading3"], fontSize=11, spaceBefore=12, spaceAfter=6)

    elements = [
        Paragraph("ArtisanGPS &middot; Sourcing Order Sheet", title_style),
        Paragraph(f"Reference ID: {ref_id} &nbsp;|&nbsp; Date: {date_str}", sub_style),
        Spacer(1, 10),
        Paragraph(
            f"<b>Destination Cluster:</b> {calc['local_city']} Artisan Cluster &nbsp;&nbsp; "
            f"<b>Recommended Sourcing Mandi:</b> {calc['recommended_mandi']} Wholesale Co-op",
            styles["Normal"]
        ),
        Paragraph("Commodity Details", section_style),
    ]

    commodity_table = Table([
        ["Commodity", f"{calc['commodity_name']} ({calc['hindi_name']})"],
        ["Quantity Required", f"{calc['quantity']} {calc['unit']}"],
        ["Delivered Unit Rate", f"Rs. {calc['recommended_delivered_unit_price']} / unit"],
        ["Freight Surcharge", f"Rs. {calc['freight_cost']}"],
        ["Total Delivered", f"Rs. {calc['recommended_total_delivered_cost']:,}"],
    ], colWidths=[55 * mm, 100 * mm])
    commodity_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e5e5")),
    ]))
    elements.append(commodity_table)

    elements.append(Paragraph("Arbitrage Advantage", section_style))
    elements.append(Paragraph(
        f"Local Procurement Cost ({calc['local_city']}): <b>Rs. {calc['local_total_cost']:,}</b><br/>"
        f"Best Wholesale Delivered Cost ({calc['recommended_mandi']}): <b>Rs. {calc['recommended_total_delivered_cost']:,}</b><br/>"
        f"<font color='#047857'><b>Net Delivered Savings: Save Rs. {calc['net_savings']:,} (-{calc['net_savings_pct']}%)</b></font>",
        styles["Normal"]
    ))

    elements.append(Paragraph("Delivered Cost Breakdown Across All 5 Mandi Hubs", section_style))
    hub_rows = [["Mandi Hub", "Unit Rate", "Freight", "Total Delivered", "Lead Time", ""]]
    for b in calc["breakdown"]:
        hub_rows.append([
            b["mandi_city"],
            f"Rs. {b['unit_price']}",
            f"Rs. {b['freight_cost']}",
            f"Rs. {b['total_delivered_cost']:,}",
            b["lead_time"],
            "BEST" if b["is_best"] else "",
        ])
    hub_table = Table(hub_rows, colWidths=[28 * mm, 25 * mm, 25 * mm, 32 * mm, 30 * mm, 15 * mm])
    hub_style = [
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e5e5")),
    ]
    for i, b in enumerate(calc["breakdown"], start=1):
        if b["is_best"]:
            hub_style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#ecfdf5")))
            hub_style.append(("TEXTCOLOR", (0, i), (-1, i), colors.HexColor("#047857")))
    hub_table.setStyle(TableStyle(hub_style))
    elements.append(hub_table)

    elements.append(Spacer(1, 14))
    elements.append(Paragraph("Generated by ArtisanGPS Market Intelligence Platform v0.4", sub_style))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm, leftMargin=18 * mm, rightMargin=18 * mm)
    doc.build(elements)
    pdf_bytes = buf.getvalue()
    buf.close()

    filename = f"Sourcing-Order-Sheet-{ref_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
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
