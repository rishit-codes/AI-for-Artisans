import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_dashboard_summary(client: AsyncClient):
    # Register and login
    await client.post("/auth/register", json={
        "email": "dash@example.com",
        "full_name": "Dash Artisan",
        "password": "password123"
    })
    res_login = await client.post("/auth/login", data={
        "username": "dash@example.com",
        "password": "password123"
    })
    headers = {"Authorization": f"Bearer {res_login.json()['access_token']}"}
    
    # Add products
    await client.post("/products", json={"name": "P1", "price": 100, "stock_qty": 2, "is_listed": True}, headers=headers)
    await client.post("/products", json={"name": "P2", "price": 200, "stock_qty": 5, "is_listed": False}, headers=headers)
    
    # Get dashboard
    res = await client.get("/dashboard/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_products"] == 2
    assert data["total_stock_value"] == (100 * 2) + (200 * 5)
    assert data["listed_count"] == 1
    assert data["unlisted_count"] == 1
    assert len(data["low_stock_items"]) == 1
    assert data["low_stock_items"][0]["name"] == "P1"
