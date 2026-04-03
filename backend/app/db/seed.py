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
        # result = await db.execute(select(User).limit(1))
        # if result.scalar_one_or_none() is not None:
        #    return  # Already seeded

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
                "commodity_full_name": "Cotton Yarn (40s)", "sub_unit": "Per kg",
                "local_price": "₹245", "local_best": 0,
                "surat_price": "₹230", "surat_best": 1,
                "delhi_price": "₹240", "delhi_best": 0,
                "action": "Source from Surat",
            },
            {
                "name": "Copper\nWire", "price": "₹790", "unit": "/ kg", "change_pct": "+3.1%",
                "trend": "up", "color": "#ef4444", "category": "Metals",
                "sparkline_points": "0,38 20,32 40,34 60,28 80,22 100,16 120,8",
                "commodity_full_name": "Copper Wire", "sub_unit": "Per kg",
                "local_price": "₹790", "local_best": 0,
                "surat_price": "₹810", "surat_best": 0,
                "delhi_price": "₹770", "delhi_best": 1,
                "action": "Source from Delhi",
            }
        ]
        for m in materials_data:
            db.add(Material(**m))

        await db.commit()
        print("✅ Database seeded successfully!")
