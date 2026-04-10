from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str
    ALPHA_VANTAGE_API_KEY: str = "demo"
    GROQ_API_KEY: str = ""
    FRONTEND_URL: str
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
