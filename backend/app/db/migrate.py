import asyncio
import logging
from pathlib import Path

from alembic.config import Config
from alembic import command

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


def _upgrade_head_sync() -> None:
    alembic_cfg = Config(str(_BACKEND_ROOT / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(_BACKEND_ROOT / "alembic"))
    command.upgrade(alembic_cfg, "head")


async def run_migrations() -> None:
    """
    Apply any pending Alembic migrations before the app starts serving.

    This exists because app.db.base.init_db()'s create_all() only creates
    tables that don't exist yet — it silently does nothing for new columns
    added to existing tables. That gap let the deployed database's schema
    drift out of sync with the models for a long time (multiple migrations'
    worth of columns were simply missing in production, causing startup
    crashes on the very first query that touched one of them). Running
    migrations here makes every deploy self-healing instead of relying on
    someone remembering to run `alembic upgrade head` by hand.

    Alembic's own env.py drives the upgrade via asyncio.run(), which can't
    be called from inside a loop that's already running (FastAPI's lifespan
    is async) — so this runs it in a separate thread instead.
    """
    try:
        await asyncio.to_thread(_upgrade_head_sync)
        logger.info("Alembic migrations applied (or already up to date).")
    except Exception:
        # Don't let a migration hiccup take the whole app down silently in a
        # way that's harder to diagnose than the crash it's meant to
        # prevent — log loudly and re-raise so the deploy fails visibly
        # instead of serving requests against a half-migrated schema.
        logger.exception("Failed to apply Alembic migrations on startup.")
        raise
