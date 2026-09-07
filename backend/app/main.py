import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os

from app.core.config import settings
from app.core.limiter import limiter
from app.core.exceptions import ArtisanNotFoundError, ArtisanForbiddenError, ArtisanConflictError, InvalidCredentialsError
from app.api.endpoints import api_router
from app.db.base import init_db
from app.db.migrate import run_migrations
from app.db.seed import seed_database
from app.services.scheduler import setup_scheduler, shutdown_scheduler

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migrations first (the authoritative source of schema truth), then
    # create_all() as a defensive fallback for anything not yet covered by
    # a migration — safe/idempotent since by this point those tables and
    # columns already exist, so create_all() has nothing left to do for them.
    await run_migrations()
    await init_db()
    await seed_database()
    setup_scheduler()
    yield
    shutdown_scheduler()

app = FastAPI(title="ArtisanGPS API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

origins = [
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",   # Vite dev server secondary
    "http://localhost:3000",
    "https://ai-for-artisans.vercel.app"
]

# Add production URL if configured
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Exception Handlers
@app.exception_handler(ArtisanNotFoundError)
async def artisan_not_found_handler(request: Request, exc: ArtisanNotFoundError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(ArtisanForbiddenError)
async def artisan_forbidden_handler(request: Request, exc: ArtisanForbiddenError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(ArtisanConflictError)
async def artisan_conflict_handler(request: Request, exc: ArtisanConflictError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(InvalidCredentialsError)
async def invalid_credentials_handler(request: Request, exc: InvalidCredentialsError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    if settings.ENVIRONMENT == "production":
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    return JSONResponse(status_code=500, content={"detail": str(exc)})

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_ROOT.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")

app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}

@app.get("/")
async def root():
    return {"message": "Welcome to ArtisanGPS API"}
