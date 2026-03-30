import pytest
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.models.model_version import ModelVersion
from app.models.user import User
from app.models.product import Product

@pytest.mark.asyncio
async def test_model_versions_unique_active(client):
    from app.main import app
    from app.db.session import get_db
    
    db_gen = app.dependency_overrides.get(get_db, get_db)()
    db = await anext(db_gen)
    
    uid = uuid.uuid4()
    pid = uuid.uuid4()
    
    test_user = User(id=uid, full_name="test_mv", email="test_mv@a.com", hashed_password="xx", craft_type="textile")
    db.add(test_user)
    
    test_product = Product(id=pid, artisan_id=uid, name="p1", description="x", category="textile", price=10, stock_qty=5)
    db.add(test_product)
    await db.flush()
    
    mv1 = ModelVersion(user_id=uid, product_id=pid, model_type="sarima_v1", is_active=True)
    db.add(mv1)
    await db.commit()
    
    mv2 = ModelVersion(user_id=uid, product_id=pid, model_type="deepar_v1", is_active=True)
    db.add(mv2)
    
    with pytest.raises(IntegrityError):
        await db.commit()
        
    await db.rollback()
