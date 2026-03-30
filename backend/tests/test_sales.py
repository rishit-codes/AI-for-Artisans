import pytest
from httpx import AsyncClient

@pytest.fixture
async def auth_headers(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "sales_artisan@example.com",
        "full_name": "Sales Artisan",
        "password": "password123"
    })
    res = await client.post("/auth/login", data={
        "username": "sales_artisan@example.com",
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_record_sale_writes_db(client: AsyncClient, auth_headers):
    # 1. Create a product
    res_prod = await client.post("/products", json={
        "name": "Test Pot",
        "price": 500,
        "stock_qty": 10
    }, headers=auth_headers)
    assert res_prod.status_code == 201
    product_id = res_prod.json()["id"]

    # 2. Record a sale
    res_sale = await client.post("/sales/record", json={
        "product_id": product_id,
        "quantity": 2,
        "price_per_unit": 500.0,
        "channel": "online",
        "sale_date": "2025-10-01"
    }, headers=auth_headers)
    assert res_sale.status_code == 200
    
    data = res_sale.json()
    assert data["updated_stock"] == 8
    assert data["total_amount"] == 1000.0

    # 3. Verify stock in DB by querying product
    res_check = await client.get("/products", headers=auth_headers)
    products = res_check.json()
    assert products[0]["stock_qty"] == 8

@pytest.mark.asyncio
async def test_sales_history_aggregation(client: AsyncClient, auth_headers):
    # 1. Create product
    res_prod = await client.post("/products", json={
        "name": "Test Pot 2",
        "price": 100,
        "stock_qty": 50
    }, headers=auth_headers)
    product_id = res_prod.json()["id"]

    # 2. Insert 5 raw rows across 3 dates
    sales_data = [
        {"product_id": product_id, "quantity": 2, "price_per_unit": 100, "sale_date": "2025-10-01"},
        {"product_id": product_id, "quantity": 3, "price_per_unit": 100, "sale_date": "2025-10-01"},
        {"product_id": product_id, "quantity": 1, "price_per_unit": 100, "sale_date": "2025-10-02"},
        {"product_id": product_id, "quantity": 4, "price_per_unit": 100, "sale_date": "2025-10-03"},
        {"product_id": product_id, "quantity": 2, "price_per_unit": 100, "sale_date": "2025-10-03"},
    ]

    for sd in sales_data:
        res = await client.post("/sales/record", json=sd, headers=auth_headers)
        assert res.status_code == 200

    # 3. Call GET /sales/history
    res_hist = await client.get("/sales/history", headers=auth_headers)
    assert res_hist.status_code == 200
    history = res_hist.json()

    # 4. Assert ds/y grouping is correct
    assert len(history) == 3
    date_map = {row["ds"]: row["y"] for row in history}
    
    assert date_map["2025-10-01"] == 5
    assert date_map["2025-10-02"] == 1
    assert date_map["2025-10-03"] == 6
