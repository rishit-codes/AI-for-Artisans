import pytest
from httpx import AsyncClient

# Helper to register + login and get headers
async def create_user_and_login(client: AsyncClient, email: str, password: str = "strongpassword123") -> str:
    await client.post("/auth/register", json={
        "email": email, "full_name": "Test Artisan", "password": password
    })
    res = await client.post("/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/auth/register", json={
        "email": "test@example.com",
        "full_name": "Test Artisan",
        "password": "strongpassword123",
        "craft_type": "Weaving"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    # Register first
    await client.post("/auth/register", json={
        "email": "test@example.com", "full_name": "Test Artisan", "password": "strongpassword123"
    })
    # Try to register again with same email
    response = await client.post("/auth/register", json={
        "email": "test@example.com", "full_name": "Test Artisan 2", "password": "strongpassword123"
    })
    assert response.status_code == 409

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register user first
    await client.post("/auth/register", json={
        "email": "test@example.com", "full_name": "Test Artisan", "password": "strongpassword123"
    })
    response = await client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "strongpassword123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "test@example.com", "full_name": "Test Artisan", "password": "strongpassword123"
    })
    response = await client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_read_users_me(client: AsyncClient):
    token = await create_user_and_login(client, "test@example.com")
    res = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"
