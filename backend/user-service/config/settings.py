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
    """统一配置：敏感项放 config/.env，邮件/验证码等放 config/settings.yaml。"""

    def __init__(self) -> None:
        load_dotenv(CONFIG_DIR / ".env")
        self._yaml = _load_yaml()

    @property
    def database_url(self) -> str:
        return os.getenv("DATABASE_URL", "")

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
        return int(r.get("db") or os.getenv("REDIS_DB", "0"))

    @property
    def smtp(self) -> dict:
        return self._yaml.get("smtp") or {}

    @property
    def mail_from(self) -> dict:
        return self._yaml.get("from") or {}

    @property
    def verification(self) -> dict:
        v = self._yaml.get("verification") or {}
        expire_seconds = int(v.get("expire_seconds", 60))
        return {
            "code_length": int(v.get("code_length", 6)),
            "expire_seconds": expire_seconds,
            "expire_minutes": max(expire_seconds // 60, 1),
            "resend_interval_seconds": int(v.get("resend_interval_seconds", 60)),
        }

    def smtp_host(self) -> str:
        return self.smtp.get("host") or os.getenv("MAIL_SMTP_HOST", "")

    def smtp_port(self) -> int:
        return int(self.smtp.get("port") or os.getenv("MAIL_SMTP_PORT", "465"))

    def smtp_use_ssl(self) -> bool:
        return bool(self.smtp.get("use_ssl", True))

    def smtp_username(self) -> str:
        return self.smtp.get("username") or os.getenv("MAIL_SENDER", "")

    def smtp_password(self) -> str:
        return self.smtp.get("password") or os.getenv("MAIL_AUTH_CODE", "")

    def mail_from_address(self) -> str:
        return self.mail_from.get("address") or self.smtp_username()

    def mail_from_name(self) -> str:
        return self.mail_from.get("name", "")


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()

