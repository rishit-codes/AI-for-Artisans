import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.db.session import get_db
from app.models.user import Base
from app.core.config import settings

# Test DB — uses postgres:postgres credentials matching Docker Compose
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/artisangps_test"

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
