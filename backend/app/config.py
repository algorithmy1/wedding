from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Wedding App"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
