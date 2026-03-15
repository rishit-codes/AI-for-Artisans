import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.core.exceptions import ArtisanNotFoundError, ArtisanForbiddenError, ArtisanConflictError, InvalidCredentialsError
from app.api.endpoints import api_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "production":
        # Run Alembic migrations on startup in production
        import subprocess
        logger.info("Running alembic migrations...")
        subprocess.run(["alembic", "upgrade", "head"], check=True)
    yield
    # Shutdown logic if any

app = FastAPI(title="ArtisanGPS API", lifespan=lifespan)

origins = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:5174",   # Vite dev server secondary
    "http://localhost:3000",
]

# Add production URL if configured
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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

app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}

@app.get("/")
async def root():
    return {"message": "Welcome to ArtisanGPS API"}

