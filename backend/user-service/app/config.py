from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/user-service/
SERVICE_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(SERVICE_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "postgresql+psycopg2://team_user:YOUR_DB_PASSWORD@127.0.0.1:5432/project_db"
    )
    avatar_max_size_mb: int = 2
    avatar_allowed_extensions: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp")


@lru_cache
def get_settings() -> Settings:
    return Settings()
