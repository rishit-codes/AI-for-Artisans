from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.material import Material

# The 8 craft types offered on the signup page don't line up 1:1 with the
# handful of category strings Material rows actually carry. An exact-string
# match on User.craft_type left the mandi table blank for Metalwork (mismatched
# string against "Metals") and for Woodwork/Jewelry/Painting/Leather/Other (no
# matching category at all). The mandi scraper's Material sync only ever
# populates comparison prices for Textiles/Metals/Pottery — "Paper" and
# "Handicrafts" rows exist but never get local_price/surat_price set — so
# mapping to those would trade one empty table for another. Every craft type
# below points at one of the three categories that actually carries live data.
CRAFT_TYPE_TO_MATERIAL_CATEGORY = {
    "textiles": "Textiles",
    "pottery": "Pottery",
    "metalwork": "Metals",
    "jewelry": "Metals",
    "woodwork": "Textiles",
    "painting": "Textiles",
    "leather": "Textiles",
    "other": "Textiles",
}


async def list_commodities(db: AsyncSession) -> list[Material]:
    result = await db.execute(select(Material))
    return list(result.scalars().all())


async def get_mandi_comparison(db: AsyncSession, category: str = "Textiles") -> list[dict]:
    resolved_category = CRAFT_TYPE_TO_MATERIAL_CATEGORY.get(category.strip().lower(), category)
    result = await db.execute(
        select(Material).where(Material.category == resolved_category)
    )
    materials = result.scalars().all()
    return [
        {
            "commodity": m.commodity_full_name or m.name,
            "sub": m.sub_unit,
            "local_price": m.local_price,
            "local_best": bool(m.local_best),
            "surat_price": m.surat_price,
            "surat_best": bool(m.surat_best),
            "delhi_price": m.delhi_price,
            "delhi_best": bool(m.delhi_best),
            "action": m.action,
        }
        for m in materials
        if m.local_price  # only include materials that have mandi data
    ]
