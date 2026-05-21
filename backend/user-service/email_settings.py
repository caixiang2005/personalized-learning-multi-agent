"""从 email_config.yaml 加载邮件相关配置。"""

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "email_config.yaml"


class SmtpConfig(BaseModel):
    host: str
    port: int = 465
    use_ssl: bool = True
    username: str
    password: str


class FromConfig(BaseModel):
    address: str
    name: str = "个性化学习系统"


class VerificationConfig(BaseModel):
    code_length: int = Field(default=6, ge=4, le=8)
    expire_minutes: int = Field(default=10, ge=1, le=60)
    resend_interval_seconds: int = Field(default=60, ge=30, le=300)


class EmailConfig(BaseModel):
    smtp: SmtpConfig
    from_: FromConfig = Field(alias="from")
    verification: VerificationConfig = Field(default_factory=VerificationConfig)

    model_config = {"populate_by_name": True}


@lru_cache
def get_email_config() -> EmailConfig:
    if not CONFIG_PATH.is_file():
        raise FileNotFoundError(
            f"未找到邮件配置文件：{CONFIG_PATH}\n"
            f"请复制 email_config.example.yaml 为 email_config.yaml 并填写 SMTP 信息。"
        )
    with CONFIG_PATH.open(encoding="utf-8") as f:
        raw: dict[str, Any] = yaml.safe_load(f) or {}
    return EmailConfig.model_validate(raw)


def reload_email_config() -> EmailConfig:
    get_email_config.cache_clear()
    return get_email_config()
