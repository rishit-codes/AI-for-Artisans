import pytest
from httpx import AsyncClient

@pytest.fixture
async def auth_headers(client: AsyncClient):
    # User 1
    await client.post("/auth/register", json={
        "email": "artisan1@example.com",
        "full_name": "Artisan 1",
        "password": "password123"
    })
    res = await client.post("/auth/login", data={
        "username": "artisan1@example.com",
        "password": "password123"
    })
    token1 = res.json()["access_token"]
    
    # User 2
    await client.post("/auth/register", json={
        "email": "artisan2@example.com",
        "full_name": "Artisan 2",
        "password": "password123"
    })
    res2 = await client.post("/auth/login", data={
        "username": "artisan2@example.com",
        "password": "password123"
    })
    token2 = res2.json()["access_token"]
    
    return {"user1": {"Authorization": f"Bearer {token1}"}, "user2": {"Authorization": f"Bearer {token2}"}}

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, auth_headers):
    res = await client.post("/products", json={
        "name": "Silk Saree",
        "price": 5000,
        "stock_qty": 5
    }, headers=auth_headers["user1"])
    assert res.status_code == 201
    assert res.json()["name"] == "Silk Saree"
    return res.json()["id"]

@pytest.mark.asyncio
async def test_read_products(client: AsyncClient, auth_headers):
    # Create a product first (fresh DB per test)
    await client.post("/products", json={"name": "Weave Craft", "price": 100, "stock_qty": 10}, headers=auth_headers["user1"])
    res = await client.get("/products", headers=auth_headers["user1"])
    assert res.status_code == 200
    assert len(res.json()) >= 1

@pytest.mark.asyncio
async def test_edit_product_ownership(client: AsyncClient, auth_headers):
    # User 1 creates product
    res1 = await client.post("/products", json={"name": "test", "price": 10, "stock_qty": 0}, headers=auth_headers["user1"])
    product_id = res1.json()["id"]
    
    # User 2 tries to edit
    res2 = await client.put(f"/products/{product_id}", json={"name": "test modified"}, headers=auth_headers["user2"])
    assert res2.status_code == 403
    
    # User 1 edits
    res1_edit = await client.put(f"/products/{product_id}", json={"name": "test modified"}, headers=auth_headers["user1"])
    assert res1_edit.status_code == 200
    assert res1_edit.json()["name"] == "test modified"
