"""Application configuration settings."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    PROJECT_NAME: str = "Enterprise App"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False  # SECURITY: Default to False, enable via env var for development
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = [
        # Local development
        "http://localhost:3000",
        "http://localhost:3809",
        "http://localhost:3830",
        "http://localhost:5173",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3809",
        "http://127.0.0.1:3830",
        "http://127.0.0.1:5173",
        # Firebase Hosting - DEV
        "https://wego-dev-a5a13.web.app",
        "https://wego-dev-a5a13.firebaseapp.com",
        # Custom domain - DEV
        "https://dev.wegocol.com",
        # Firebase Hosting - PROD
        "https://wego-bac88.web.app",
        "https://wego-bac88.firebaseapp.com",
        # Custom domain - PROD
        "https://app.wegocol.com",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list | str):
            return v
        raise ValueError(v)

    # Firebase
    FIREBASE_PROJECT_ID: str = "demo-project"
    FIREBASE_CREDENTIALS_PATH: str = ""  # Path to service account JSON
    USE_FIREBASE_EMULATOR: bool = True
    FIREBASE_EMULATOR_HOST: str = "localhost"
    FIREBASE_EMULATOR_PORT: int = 8080

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Email
    EMAIL_ENABLED: bool = False
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@example.com"

    # Monitoring
    SENTRY_DSN: str = ""

    # AI/Agent Services
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    LLM_PROVIDER: str = "openai"  # openai, anthropic, or local
    LLM_MODEL: str = "gpt-4-turbo-preview"
    ENABLE_RAG: bool = False
    VECTOR_STORE_TYPE: str = "inmemory"  # inmemory, chroma, pinecone
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT == "development"


# Global settings instance
settings = Settings()  # type: ignore
