import pytest
from httpx import AsyncClient
import uuid
from datetime import date
from app.models.product import Product
from app.models.sale import Sale

@pytest.mark.asyncio
async def test_trigger_upgrade_endpoint(client, auth_headers, test_user, db_session):
    pid = uuid.uuid4()
    prod = Product(id=pid, artisan_id=test_user.id, name="p", description="", category="textile", price=10, stock_qty=5)
    db_session.add(prod)
    
    # insert 60 sales
    import random
    from datetime import date, timedelta
    today = date.today()
    for i in range(60):
        s_date = today - timedelta(days=i)
        sale = Sale(user_id=test_user.id, product_id=pid, quantity=1, price_per_unit=10, sale_date=s_date)
        db_session.add(sale)
    await db_session.commit()
    
    # Needs 60 sales
    response = await client.post("/predictions/trigger-upgrade", json={"product_id": str(pid)}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["upgrade_queued"] == True
    assert data["record_count"] == 60

@pytest.mark.asyncio
async def test_trigger_upgrade_insufficient(client, auth_headers, test_user, db_session):
    pid = uuid.uuid4()
    prod = Product(id=pid, artisan_id=test_user.id, name="p", description="", category="textile", price=10, stock_qty=5)
    db_session.add(prod)
    
    for i in range(10):
        sale = Sale(user_id=test_user.id, product_id=pid, quantity=1, price_per_unit=10, sale_date=date.today())
        db_session.add(sale)
    await db_session.commit()
    
    response = await client.post("/predictions/trigger-upgrade", json={"product_id": str(pid)}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["upgrade_queued"] == False
    assert data["record_count"] == 10
    assert data["records_needed"] == 50

@pytest.mark.asyncio
async def test_seasonal_endpoint_model_type_field(client, auth_headers, test_user, db_session):
    pid = uuid.uuid4()
    prod = Product(id=pid, artisan_id=test_user.id, name="p", description="", category="textile", price=10, stock_qty=5)
    db_session.add(prod)
    await db_session.commit()
    
    response = await client.get(f"/predictions/seasonal?product_id={pid}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "model_type" in data
    assert "upgrade_available" in data
    assert "records_to_upgrade" in data
    assert data["upgrade_available"] == False
