from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    DATABASE_URL: str

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if not v:
            return v
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # asyncpg does not support sslmode or channel_binding
        v = v.replace("sslmode=require", "ssl=require")
        v = v.replace("&channel_binding=require", "")
        v = v.replace("?channel_binding=require&", "?")
        v = v.replace("?channel_binding=require", "")
        
        return v
    JWT_SECRET_KEY: str
    JWT_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str = ""   # Not used — app uses Groq
    ALPHA_VANTAGE_API_KEY: str = "demo"
    GROQ_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    UNSPLASH_API_KEY: str = ""
    ENVIRONMENT: str = "development"
    STORAGE_BACKEND: str = "local"  # only "local" is implemented — see app.services.storage
    
    # Optional phase 3 configurations
    UPSTOX_API_KEY: str = ""
    UPSTOX_API_SECRET: str = ""
    UPSTOX_ACCESS_TOKEN: str = ""
    MCX_API_KEY: str = ""
    ENABLE_COMMODITY_PRICES: str = "false"
    ENABLE_SHARED_CRAFT_MODELS: str = "false"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
