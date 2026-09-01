from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.db.session import engine


class Base(DeclarativeBase):
    """SQLAlchemy declarative base class for all models."""
    pass


async def init_db():
    """Create all database tables (if they don't already exist)."""
    # app.models's own __init__ imports every model so each one registers with
    # Base.metadata — previously only a handful were listed here explicitly, and
    # the rest (sales, purchases, predictions, model_versions, market_signals,
    # mandi_*) only ever got registered incidentally because something else
    # imported them first during router setup.
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        await conn.run_sync(Base.metadata.create_all)
