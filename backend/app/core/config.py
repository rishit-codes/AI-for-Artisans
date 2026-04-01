from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str
    ALPHA_VANTAGE_API_KEY: str = "demo"
    FRONTEND_URL: str
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
