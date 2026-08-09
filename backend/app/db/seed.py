"""Seeds the database with data currently hardcoded in the frontend JSX files."""
import uuid
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.material import Material
from app.core.security import get_password_hash


async def seed_database():
    """Insert seed data if the database is empty."""
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            return  # Already seeded

        # ── User (Auth V2 schema fallback) ──────────────
        user_id = uuid.UUID("48ca70ea-7851-4a3d-bb92-13b29229237a")
        user = User(
            id=user_id,
            email="ramesh@example.com",
            full_name="Ramesh Kumar",
            hashed_password=get_password_hash("password123"),
            craft_type="Textiles",
            location="Jaipur, India",
            bio=(
                "I am a third-generation master weaver based in the heart of Jaipur, "
                "Rajasthan. My family has been dedicated to the intricate art of "
                "Banarasi silk weaving for over seven decades."
            )
        )
        db.add(user)
        await db.flush()

        # ── Products (from MyCrafts.jsx) ──────────────────────────────────
        products_data = [
            {"name": "Banarasi Silk Saree", "material": "Hand-woven traditional silk", "stock_qty": 12, "price": 18500.0, "image_url": "/images/banarasi_saree.jpg", "category": "Textiles"},
            {"name": "Hand-painted Pot", "material": "Organic clay terracotta", "stock_qty": 45, "price": 850.0, "image_url": "/images/terracotta_pot.jpg", "category": "Pottery"},
            {"name": "Brass Dhokra Art", "material": "Lost-wax metal casting", "stock_qty": 8, "price": 4200.0, "image_url": "/images/brass_dhokra.jpg", "category": "Metalwork"},
            {"name": "Pashmina Shawl", "material": "Premium hand-spun wool", "stock_qty": 5, "price": 25000.0, "image_url": "/images/pashmina_shawl.jpg", "category": "Textiles"},
            {"name": "Channapatna Toys", "material": "Lacquered wood craft", "stock_qty": 32, "price": 1250.0, "image_url": "/images/channapatna_toy.jpg", "category": "Woodwork"},
            {"name": "Jaipur Blue Pottery", "material": "Quartz-based ceramic vase", "stock_qty": 18, "price": 3400.0, "image_url": "/images/ceramic_vase.jpg", "category": "Pottery"},
        ]
        for p in products_data:
            db.add(Product(artisan_id=user.id, **p))

        # ── Materials (from Constraints.jsx) ────
        materials_data = [
            {
                "name": "Cotton\nYarn", "price": "₹245", "unit": "/ kg", "change_pct": "-2.4%",
                "trend": "down", "color": "#22c55e", "category": "Textiles",
                "sparkline_points": "0,20 20,25 40,18 60,28 80,22 100,30 120,35",
                "commodity_full_name": "Cotton yarn (40s)", "sub_unit": "Per kg",
                "local_price": "₹245", "local_best": 0,
                "surat_price": "₹230", "surat_best": 1,
                "delhi_price": "₹240", "delhi_best": 0,
                "action": "Buy",
            },
            {
                "name": "Copper\nWire", "price": "₹790", "unit": "/ kg", "change_pct": "+3.1%",
                "trend": "up", "color": "#ef4444", "category": "Metals",
                "sparkline_points": "0,38 20,32 40,34 60,28 80,22 100,16 120,8",
                "commodity_full_name": "Copper Wire", "sub_unit": "Per kg",
                "local_price": "₹790", "local_best": 0,
                "surat_price": "₹810", "surat_best": 0,
                "delhi_price": "₹770", "delhi_best": 1,
                "action": "Buy",
            },
            {
                "name": "Natural\nIndigo", "price": "₹1840", "unit": "/ kg", "change_pct": "+1.8%",
                "trend": "up", "color": "#3b82f6", "category": "Textiles",
                "sparkline_points": "0,10 20,15 40,12 60,20 80,18 100,25 120,30",
                "commodity_full_name": "Natural indigo dye", "sub_unit": "Per kg",
                "local_price": "₹1840", "local_best": 0,
                "surat_price": "₹1790", "surat_best": 1,
                "delhi_price": "₹1860", "delhi_best": 0,
                "action": "Wait",
            },
            {
                "name": "Banarasi\nSilk", "price": "₹2840", "unit": "/ m", "change_pct": "0.0%",
                "trend": "flat", "color": "#a855f7", "category": "Textiles",
                "sparkline_points": "0,20 20,20 40,20 60,20 80,20 100,20 120,20",
                "commodity_full_name": "Banarasi silk", "sub_unit": "Per m",
                "local_price": "₹2840", "local_best": 0,
                "surat_price": "₹2900", "surat_best": 0,
                "delhi_price": "₹2810", "delhi_best": 1,
                "action": "Source from Delhi",
            },
            {
                "name": "Brass\nSheet", "price": "₹612", "unit": "/ kg", "change_pct": "-1.1%",
                "trend": "down", "color": "#eab308", "category": "Metals",
                "sparkline_points": "0,30 20,28 40,25 60,22 80,24 100,20 120,18",
                "commodity_full_name": "Brass sheet", "sub_unit": "Per kg",
                "local_price": "₹612", "local_best": 0,
                "surat_price": "₹598", "surat_best": 1,
                "delhi_price": "₹605", "delhi_best": 0,
                "action": "Buy",
            },
            {
                "name": "Terracotta\nClay", "price": "₹480", "unit": "/ qtl", "change_pct": "+2.6%",
                "trend": "up", "color": "#d97706", "category": "Pottery",
                "sparkline_points": "0,15 20,18 40,22 60,20 80,25 100,28 120,32",
                "commodity_full_name": "Terracotta clay", "sub_unit": "Per qtl",
                "local_price": "₹480", "local_best": 0,
                "surat_price": "₹510", "surat_best": 0,
                "delhi_price": "₹495", "delhi_best": 0,
                "action": "Wait",
            },
            {
                "name": "Lac\nBase", "price": "₹920", "unit": "/ kg", "change_pct": "+0.6%",
                "trend": "up", "color": "#ec4899", "category": "Metals",
                "sparkline_points": "0,20 20,22 40,21 60,23 80,22 100,24 120,25",
                "commodity_full_name": "Lac base", "sub_unit": "Per kg",
                "local_price": "₹920", "local_best": 1,
                "surat_price": "₹940", "surat_best": 0,
                "delhi_price": "₹935", "delhi_best": 0,
                "action": "Source from Local",
            },
            {
                "name": "Zari\nThread", "price": "₹142", "unit": "/ m", "change_pct": "-0.8%",
                "trend": "down", "color": "#fbbf24", "category": "Textiles",
                "sparkline_points": "0,25 20,24 40,22 60,20 80,18 100,15 120,12",
                "commodity_full_name": "Zari thread (gold)", "sub_unit": "Per m",
                "local_price": "₹142", "local_best": 0,
                "surat_price": "₹138", "surat_best": 1,
                "delhi_price": "₹145", "delhi_best": 0,
                "action": "Buy",
            },
            {
                "name": "Madhubani\nPaper", "price": "₹38", "unit": "/ sheet", "change_pct": "+1.1%",
                "trend": "up", "color": "#6b7280", "category": "Pottery",
                "sparkline_points": "0,10 20,12 40,11 60,13 80,14 100,15 120,16",
                "commodity_full_name": "Madhubani paper", "sub_unit": "Per sheet",
                "local_price": "₹38", "local_best": 1,
                "surat_price": "₹41", "surat_best": 0,
                "delhi_price": "₹39", "delhi_best": 0,
                "action": "Wait",
            }
        ]
        for m in materials_data:
            db.add(Material(**m))

        await db.commit()
        print("[OK] Database seeded successfully!")
