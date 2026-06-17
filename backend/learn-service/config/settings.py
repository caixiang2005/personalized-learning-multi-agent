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
    """统一配置：敏感项放 config/.env，业务配置放 config/settings.yaml。"""

    def __init__(self) -> None:
        # 优先加载 config/.env，override=True 确保覆盖已有系统变量
        load_dotenv(CONFIG_DIR / ".env", override=True)
        # 二次加载项目根 .env 作为兜底
        load_dotenv(SERVICE_ROOT.parent.parent / ".env", override=False)
        self._yaml = _load_yaml()

    @property
    def database_url(self) -> str:
        return os.getenv("DATABASE_URL", "")

    @property
    def redis_host(self) -> str:
        r = self._yaml.get("redis") or {}
        return str(r.get("host") or os.getenv("REDIS_HOST", "127.0.0.1"))

    @property
    def redis_port(self) -> int:
        r = self._yaml.get("redis") or {}
        return int(r.get("port") or os.getenv("REDIS_PORT", "6379"))

    @property
    def redis_db(self) -> int:
        return int(os.getenv("REDIS_DB", "1"))

    @property
    def service_port(self) -> int:
        return int(os.getenv("SERVICE_PORT", "8002"))


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
