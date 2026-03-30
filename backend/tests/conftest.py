import pytest
import pytest_asyncio
import os

# Set required env vars for testing BEFORE importing app components
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "test_secret_key")
os.environ["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_API_KEY", "test_anthropic_key")
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "test_groq_key")
os.environ["FRONTEND_URL"] = os.getenv("FRONTEND_URL", "http://localhost:3000")

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.db.session import get_db
from app.models.user import Base
from app.core.config import settings

# Test DB URL is configurable and docker-aware.
if os.getenv("TEST_DATABASE_URL"):
    TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
elif os.path.exists("/.dockerenv"):
    TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/artisangps_test"
else:
    TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncClient:
    """
    Each test function gets a fresh DB schema and its own client.
    This avoids event-loop/session-scope conflicts in pytest-asyncio.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    # Create tables fresh for each test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    # Teardown
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

import uuid
from app.models.user import User

@pytest_asyncio.fixture
async def db_session(client):
    db_gen = app.dependency_overrides.get(get_db, get_db)()
    db = await anext(db_gen)
    yield db

@pytest_asyncio.fixture
async def test_user(db_session):
    user_id = uuid.uuid4()
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("test1234")
    
    user = User(
        id=user_id,
        email="artisan1@test.com",
        full_name="Test Artisan",
        hashed_password=hashed,
        craft_type="textile",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest_asyncio.fixture
async def auth_headers(client, test_user):
    response = await client.post(
        "/auth/login",
        data={"username": test_user.email, "password": "test1234"}
    )
    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

