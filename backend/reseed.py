import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text
from app.models.material import Material

materials_data = [
    # ---- TEXTILES ----
    {
        "name": "Cotton\nYarn", "price": "₹245", "unit": "/ kg", "change_pct": "-2.4%",
        "trend": "down", "color": "#22c55e", "category": "Textiles",
        "sparkline_points": "0,20 20,25 40,18 60,28 80,22 100,30 120,35",
        "commodity_full_name": "Cotton yarn (40s)", "sub_unit": "Per kg",
        "local_price": "₹245", "local_best": 0, "surat_price": "₹230", "surat_best": 1, "delhi_price": "₹240", "delhi_best": 0,
        "action": "Buy",
    },
    {
        "name": "Natural\nIndigo", "price": "₹1840", "unit": "/ kg", "change_pct": "+1.8%",
        "trend": "up", "color": "#3b82f6", "category": "Textiles",
        "sparkline_points": "0,10 20,15 40,12 60,20 80,18 100,25 120,30",
        "commodity_full_name": "Natural indigo dye", "sub_unit": "Per kg",
        "local_price": "₹1840", "local_best": 0, "surat_price": "₹1790", "surat_best": 1, "delhi_price": "₹1860", "delhi_best": 0,
        "action": "Wait",
    },
    {
        "name": "Banarasi\nSilk", "price": "₹2840", "unit": "/ m", "change_pct": "0.0%",
        "trend": "flat", "color": "#a855f7", "category": "Textiles",
        "sparkline_points": "0,20 20,20 40,20 60,20 80,20 100,20 120,20",
        "commodity_full_name": "Banarasi silk", "sub_unit": "Per m",
        "local_price": "₹2840", "local_best": 0, "surat_price": "₹2900", "surat_best": 0, "delhi_price": "₹2810", "delhi_best": 1,
        "action": "Source from Delhi",
    },
    {
        "name": "Zari\nThread", "price": "₹142", "unit": "/ m", "change_pct": "-0.8%",
        "trend": "down", "color": "#fbbf24", "category": "Textiles",
        "sparkline_points": "0,25 20,24 40,22 60,20 80,18 100,15 120,12",
        "commodity_full_name": "Zari thread (gold)", "sub_unit": "Per m",
        "local_price": "₹142", "local_best": 0, "surat_price": "₹138", "surat_best": 1, "delhi_price": "₹145", "delhi_best": 0,
        "action": "Buy",
    },
    {
        "name": "Jute\nTwine", "price": "₹85", "unit": "/ kg", "change_pct": "-1.2%",
        "trend": "down", "color": "#84cc16", "category": "Textiles",
        "sparkline_points": "0,30 20,29 40,28 60,25 80,24 100,20 120,18",
        "commodity_full_name": "Jute twine (fine)", "sub_unit": "Per kg",
        "local_price": "₹85", "local_best": 0, "surat_price": "₹88", "surat_best": 0, "delhi_price": "₹82", "delhi_best": 1,
        "action": "Source from Delhi",
    },
    {
        "name": "Linen\nFabric", "price": "₹420", "unit": "/ m", "change_pct": "+2.1%",
        "trend": "up", "color": "#14b8a6", "category": "Textiles",
        "sparkline_points": "0,15 20,18 40,16 60,20 80,24 100,22 120,28",
        "commodity_full_name": "Linen fabric (pure)", "sub_unit": "Per m",
        "local_price": "₹420", "local_best": 0, "surat_price": "₹410", "surat_best": 1, "delhi_price": "₹435", "delhi_best": 0,
        "action": "Wait",
    },
    
    # ---- METALS / BRASSWARE ----
    {
        "name": "Copper\nWire", "price": "₹790", "unit": "/ kg", "change_pct": "+3.1%",
        "trend": "up", "color": "#ef4444", "category": "Metals",
        "sparkline_points": "0,38 20,32 40,34 60,28 80,22 100,16 120,8",
        "commodity_full_name": "Copper Wire", "sub_unit": "Per kg",
        "local_price": "₹790", "local_best": 0, "surat_price": "₹810", "surat_best": 0, "delhi_price": "₹770", "delhi_best": 1,
        "action": "Buy",
    },
    {
        "name": "Brass\nSheet", "price": "₹612", "unit": "/ kg", "change_pct": "-1.1%",
        "trend": "down", "color": "#eab308", "category": "Metals",
        "sparkline_points": "0,30 20,28 40,25 60,22 80,24 100,20 120,18",
        "commodity_full_name": "Brass sheet", "sub_unit": "Per kg",
        "local_price": "₹612", "local_best": 0, "surat_price": "₹598", "surat_best": 1, "delhi_price": "₹605", "delhi_best": 0,
        "action": "Buy",
    },
    {
        "name": "Lac\nBase", "price": "₹920", "unit": "/ kg", "change_pct": "+0.6%",
        "trend": "up", "color": "#ec4899", "category": "Metals",
        "sparkline_points": "0,20 20,22 40,21 60,23 80,22 100,24 120,25",
        "commodity_full_name": "Lac base", "sub_unit": "Per kg",
        "local_price": "₹920", "local_best": 1, "surat_price": "₹940", "surat_best": 0, "delhi_price": "₹935", "delhi_best": 0,
        "action": "Source from Local",
    },
    {
        "name": "Zinc\nIngot", "price": "₹285", "unit": "/ kg", "change_pct": "+1.4%",
        "trend": "up", "color": "#64748b", "category": "Metals",
        "sparkline_points": "0,15 20,16 40,18 60,22 80,20 100,24 120,26",
        "commodity_full_name": "Zinc ingot", "sub_unit": "Per kg",
        "local_price": "₹285", "local_best": 0, "surat_price": "₹295", "surat_best": 0, "delhi_price": "₹278", "delhi_best": 1,
        "action": "Wait",
    },
    {
        "name": "Mango\nWood", "price": "₹1200", "unit": "/ cft", "change_pct": "0.0%",
        "trend": "flat", "color": "#b45309", "category": "Metals", # using Metals bucket for Decor
        "sparkline_points": "0,20 20,20 40,20 60,20 80,20 100,20 120,20",
        "commodity_full_name": "Mango wood (seasoned)", "sub_unit": "Per cft",
        "local_price": "₹1200", "local_best": 1, "surat_price": "₹1350", "surat_best": 0, "delhi_price": "₹1250", "delhi_best": 0,
        "action": "Buy Local",
    },

    # ---- POTTERY ----
    {
        "name": "Terracotta\nClay", "price": "₹480", "unit": "/ qtl", "change_pct": "+2.6%",
        "trend": "up", "color": "#d97706", "category": "Pottery",
        "sparkline_points": "0,15 20,18 40,22 60,20 80,25 100,28 120,32",
        "commodity_full_name": "Terracotta clay", "sub_unit": "Per qtl",
        "local_price": "₹480", "local_best": 0, "surat_price": "₹510", "surat_best": 0, "delhi_price": "₹495", "delhi_best": 0,
        "action": "Wait",
    },
    {
        "name": "Madhubani\nPaper", "price": "₹38", "unit": "/ sheet", "change_pct": "+1.1%",
        "trend": "up", "color": "#6b7280", "category": "Pottery",
        "sparkline_points": "0,10 20,12 40,11 60,13 80,14 100,15 120,16",
        "commodity_full_name": "Madhubani paper", "sub_unit": "Per sheet",
        "local_price": "₹38", "local_best": 1, "surat_price": "₹41", "surat_best": 0, "delhi_price": "₹39", "delhi_best": 0,
        "action": "Wait",
    },
    {
        "name": "Kaolin\nClay", "price": "₹950", "unit": "/ qtl", "change_pct": "-3.4%",
        "trend": "down", "color": "#f8fafc", "category": "Pottery",
        "sparkline_points": "0,35 20,32 40,28 60,25 80,20 100,15 120,10",
        "commodity_full_name": "Kaolin clay (China clay)", "sub_unit": "Per qtl",
        "local_price": "₹950", "local_best": 0, "surat_price": "₹920", "surat_best": 1, "delhi_price": "₹960", "delhi_best": 0,
        "action": "Buy",
    },
    {
        "name": "Ceramic\nGlaze", "price": "₹320", "unit": "/ kg", "change_pct": "+0.5%",
        "trend": "up", "color": "#6366f1", "category": "Pottery",
        "sparkline_points": "0,20 20,21 40,20 60,22 80,21 100,23 120,24",
        "commodity_full_name": "Ceramic glaze (transparent)", "sub_unit": "Per kg",
        "local_price": "₹320", "local_best": 0, "surat_price": "₹340", "surat_best": 0, "delhi_price": "₹310", "delhi_best": 1,
        "action": "Source from Delhi",
    },
    {
        "name": "Quartz\nPowder", "price": "₹210", "unit": "/ qtl", "change_pct": "0.0%",
        "trend": "flat", "color": "#94a3b8", "category": "Pottery",
        "sparkline_points": "0,15 20,15 40,15 60,15 80,15 100,15 120,15",
        "commodity_full_name": "Quartz powder (fine)", "sub_unit": "Per qtl",
        "local_price": "₹210", "local_best": 0, "surat_price": "₹215", "surat_best": 0, "delhi_price": "₹205", "delhi_best": 1,
        "action": "Buy",
    }
]

async def reseed():
    async with AsyncSessionLocal() as db:
        await db.execute(text('DELETE FROM materials'))
        for m in materials_data:
            db.add(Material(**m))
        await db.commit()
    print("Reseeded materials with expanded list")

if __name__ == '__main__':
    asyncio.run(reseed())
