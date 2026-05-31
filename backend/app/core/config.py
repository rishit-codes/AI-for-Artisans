from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    DATABASE_URL: str

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    JWT_SECRET_KEY: str
    JWT_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str = ""   # Not used — app uses Groq
    ALPHA_VANTAGE_API_KEY: str = "demo"
    GROQ_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    UNSPLASH_API_KEY: str = ""
    ENVIRONMENT: str = "development"
    
    # Optional phase 3 configurations
    UPSTOX_API_KEY: str = ""
    UPSTOX_API_SECRET: str = ""
    UPSTOX_ACCESS_TOKEN: str = ""
    MCX_API_KEY: str = ""
    ENABLE_COMMODITY_PRICES: str = "false"
    ENABLE_SHARED_CRAFT_MODELS: str = "false"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
