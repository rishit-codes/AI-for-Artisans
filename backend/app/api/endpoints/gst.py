import io
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
import csv

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.sale import Sale
from app.models.product import Product
from app.models.purchase import Purchase
from app.schemas.gst import GstSummary
from app.services.gst import build_gst_summary

router = APIRouter()

def _default_period(from_date: Optional[date], to_date: Optional[date]) -> tuple[date, date]:
    today = date.today()
    if not to_date:
        to_date = today
    if not from_date:
        from_date = today.replace(day=1)
    return from_date, to_date

async def _gather_summary(db: AsyncSession, artisan_id, from_date: date, to_date: date) -> dict:
    sales_res = await db.execute(
        select(Sale.quantity, Sale.price_per_unit, Product.category)
        .join(Product, Product.id == Sale.product_id, isouter=True)
        .where(Sale.user_id == artisan_id, Sale.sale_date >= from_date, Sale.sale_date <= to_date)
    )
    sale_rows = [
        {"category": category, "revenue": float(qty) * float(price)}
        for qty, price, category in sales_res.all()
    ]

    purchases_res = await db.execute(
        select(Purchase.amount, Purchase.gst_rate)
        .where(Purchase.artisan_id == artisan_id, Purchase.purchase_date >= from_date, Purchase.purchase_date <= to_date)
    )
    purchase_rows = [{"amount": float(amount), "gst_rate": float(gst_rate)} for amount, gst_rate in purchases_res.all()]

    return build_gst_summary(sale_rows, purchase_rows, from_date, to_date)

@router.get("/summary", response_model=GstSummary)
async def get_gst_summary(
    from_date: date = Query(None),
    to_date: date = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    from_date, to_date = _default_period(from_date, to_date)
    return await _gather_summary(db, current_user.id, from_date, to_date)

@router.get("/export-csv")
async def export_gst_summary_csv(
    from_date: date = Query(None),
    to_date: date = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from_date, to_date = _default_period(from_date, to_date)
    summary = await _gather_summary(db, current_user.id, from_date, to_date)

    buf = io.StringIO()
    buf.write("﻿")
    writer = csv.writer(buf)
    writer.writerow(["ArtisanGPS GST Summary"])
    writer.writerow(["Period", f"{summary['period_start']} to {summary['period_end']}"])
    writer.writerow(["Artisan", current_user.full_name])
    writer.writerow([])
    writer.writerow(["Category", "Taxable Value", "GST Rate %", "Output GST"])
    for row in summary["category_breakdown"]:
        writer.writerow([row["category"], row["taxable_value"], row["gst_rate"], row["output_gst"]])
    writer.writerow([])
    writer.writerow(["Total Taxable Sales", summary["total_sales"]])
    writer.writerow(["Total Output GST", summary["output_gst"]])
    writer.writerow(["Total Input GST (from logged purchases)", summary["input_gst"]])
    writer.writerow(["Net GST Payable", summary["net_payable"]])

    filename = f"GST-Summary-{summary['period_start']}-to-{summary['period_end']}.csv"
    return Response(
        content=buf.getvalue().encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export-pdf")
async def export_gst_summary_pdf(
    from_date: date = Query(None),
    to_date: date = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from_date, to_date = _default_period(from_date, to_date)
    summary = await _gather_summary(db, current_user.id, from_date, to_date)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("GstTitle", parent=styles["Title"], fontSize=16, spaceAfter=2)
    sub_style = ParagraphStyle("GstSub", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
    section_style = ParagraphStyle("GstSection", parent=styles["Heading3"], fontSize=11, spaceBefore=12, spaceAfter=6)

    elements = [
        Paragraph("ArtisanGPS &middot; GST Summary Report", title_style),
        Paragraph(
            f"Artisan: {current_user.full_name} &nbsp;|&nbsp; Period: {summary['period_start']} to {summary['period_end']}",
            sub_style,
        ),
        Spacer(1, 10),
        Paragraph("Category-wise Output GST", section_style),
    ]

    cat_rows = [["Category", "Taxable Value", "GST Rate", "Output GST"]]
    for row in summary["category_breakdown"]:
        cat_rows.append([
            row["category"],
            f"Rs. {row['taxable_value']:,.2f}",
            f"{row['gst_rate']:.1f}%",
            f"Rs. {row['output_gst']:,.2f}",
        ])
    if len(cat_rows) == 1:
        cat_rows.append(["No sales in this period", "-", "-", "-"])
    cat_table = Table(cat_rows, colWidths=[55 * mm, 40 * mm, 30 * mm, 40 * mm])
    cat_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e5e5")),
    ]))
    elements.append(cat_table)

    elements.append(Paragraph("Summary", section_style))
    summary_table = Table([
        ["Total Taxable Sales", f"Rs. {summary['total_sales']:,.2f}"],
        ["Total Output GST (collected)", f"Rs. {summary['output_gst']:,.2f}"],
        ["Total Input GST (from logged purchases)", f"Rs. {summary['input_gst']:,.2f}"],
        ["Net GST Payable", f"Rs. {summary['net_payable']:,.2f}"],
    ], colWidths=[90 * mm, 60 * mm])
    summary_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e5e5")),
        ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.HexColor("#111827")),
    ]))
    elements.append(summary_table)

    elements.append(Spacer(1, 14))
    elements.append(Paragraph(
        f"Based on {summary['sale_count']} logged sale(s) and {summary['purchase_count']} logged purchase(s) for this period. "
        "GST rates are approximated per product category for a small-artisan summary and are not a substitute for a "
        "chartered accountant's filing.",
        sub_style,
    ))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("Generated by ArtisanGPS Market Intelligence Platform v0.4", sub_style))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm, leftMargin=18 * mm, rightMargin=18 * mm)
    doc.build(elements)
    pdf_bytes = buf.getvalue()
    buf.close()

    filename = f"GST-Summary-{summary['period_start']}-to-{summary['period_end']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
