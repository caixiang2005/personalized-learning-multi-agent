import os
from functools import lru_cache
from pathlib import Path

import yaml
from dotenv import load_dotenv

CONFIG_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = CONFIG_DIR.parent


def _load_yaml() -> dict:
    path = CONFIG_DIR / "settings.yaml"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


class AppSettings:
    """Unified config: secrets in config/.env, business settings in settings.yaml."""

    def __init__(self) -> None:
        # File .env fills missing keys only — do NOT override Compose/K8s env
        # (otherwise REDIS_HOST=127.0.0.1 in image .env beats REDIS_HOST=redis).
        load_dotenv(CONFIG_DIR / ".env", override=False)
        # Reuse user-service DB config (same project_db)
        load_dotenv(SERVICE_ROOT.parent / "user-service" / "config" / ".env", override=False)
        # Project root .env as fallback
        load_dotenv(SERVICE_ROOT.parent.parent / ".env", override=False)
        self._yaml = _load_yaml()

    @property
    def database_url(self) -> str:
        url = os.getenv("DATABASE_URL", "").strip()
        if not url:
            raise RuntimeError(
                "DATABASE_URL is not set. Create learn-service/config/.env "
                "or ensure user-service/config/.env has DATABASE_URL."
            )
        return url

    @property
    def redis_host(self) -> str:
        r = self._yaml.get("redis") or {}
        return str(os.getenv("REDIS_HOST") or r.get("host") or "127.0.0.1")

    @property
    def redis_port(self) -> int:
        r = self._yaml.get("redis") or {}
        return int(r.get("port") or os.getenv("REDIS_PORT", "6379"))

    @property
    def redis_db(self) -> int:
        r = self._yaml.get("redis") or {}
        if r.get("db") is not None:
            return int(r["db"])
        return int(os.getenv("REDIS_DB", "0"))

    @property
    def service_port(self) -> int:
        return int(os.getenv("SERVICE_PORT", "8002"))


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
