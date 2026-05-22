import random
import smtplib
import ssl
import time
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from functools import lru_cache
from typing import Any

import yaml
from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.config import SERVICE_ROOT

CONFIG_PATH = SERVICE_ROOT / "email_config.yaml"

PURPOSE_SUBJECT = {
    "register": "【个性化学习】注册验证码",
    "login": "【个性化学习】登录验证码",
    "reset_password": "【个性化学习】重置密码验证码",
}

PURPOSE_ACTION = {
    "register": "注册账号",
    "login": "登录账号",
    "reset_password": "重置密码",
}

_store: dict[str, dict[str, float | str]] = {}


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
            f"请配置 email_config.yaml 并填写 SMTP 信息。"
        )
    with CONFIG_PATH.open(encoding="utf-8") as f:
        raw: dict[str, Any] = yaml.safe_load(f) or {}
    return EmailConfig.model_validate(raw)


def _key(purpose: str, email: str) -> str:
    return f"{purpose}:{email}"


def _generate_code(length: int) -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def send_verification_email(to_email: str, code: str, purpose: str) -> None:
    cfg = get_email_config()
    action = PURPOSE_ACTION.get(purpose, "验证身份")
    subject = PURPOSE_SUBJECT.get(purpose, "【个性化学习】验证码")
    expire = cfg.verification.expire_minutes

    text = (
        f"您好，\n\n"
        f"您正在{action}，验证码为：{code}\n"
        f"有效期 {expire} 分钟，请勿泄露给他人。\n\n"
        f"如非本人操作，请忽略此邮件。\n"
    )
    html = f"""
    <div style="font-family:Segoe UI,PingFang SC,sans-serif;line-height:1.6;color:#1f2937;">
      <p>您好，</p>
      <p>您正在<strong>{action}</strong>，验证码为：</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#3b5bdb;">{code}</p>
      <p style="color:#6b7280;">有效期 {expire} 分钟，请勿泄露给他人。</p>
      <p style="color:#9ca3af;font-size:13px;">如非本人操作，请忽略此邮件。</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((cfg.from_.name, cfg.from_.address))
    msg["To"] = to_email
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    smtp = cfg.smtp
    if smtp.use_ssl:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp.host, smtp.port, context=context, timeout=30) as server:
            server.login(smtp.username, smtp.password)
            server.sendmail(cfg.from_.address, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(smtp.host, smtp.port, timeout=30) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.login(smtp.username, smtp.password)
            server.sendmail(cfg.from_.address, [to_email], msg.as_string())


def send_code(email: str, purpose: str) -> dict:
    cfg = get_email_config()
    vcfg = cfg.verification
    key = _key(purpose, email)
    now = time.time()

    record = _store.get(key)
    if record and now - record["sent_at"] < vcfg.resend_interval_seconds:
        wait = int(vcfg.resend_interval_seconds - (now - record["sent_at"]))
        raise HTTPException(
            status_code=429,
            detail=f"发送过于频繁，请 {max(wait, 1)} 秒后再试",
        )

    code = _generate_code(vcfg.code_length)
    try:
        send_verification_email(email, code, purpose)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except smtplib.SMTPException as e:
        raise HTTPException(status_code=502, detail=f"邮件发送失败：{e}") from e
    except OSError as e:
        raise HTTPException(status_code=502, detail=f"无法连接邮件服务器：{e}") from e

    _store[key] = {
        "code": code,
        "expires_at": now + vcfg.expire_minutes * 60,
        "sent_at": now,
    }
    return {"message": "验证码已发送，请查收邮箱"}


def verify_code(email: str, purpose: str, code: str) -> None:
    key = _key(purpose, email)
    record = _store.get(key)
    if not record:
        raise HTTPException(status_code=400, detail="请先获取验证码")
    if time.time() > record["expires_at"]:
        _store.pop(key, None)
        raise HTTPException(status_code=400, detail="验证码已过期，请重新获取")
    if record["code"] != code.strip():
        raise HTTPException(status_code=400, detail="验证码错误")
    _store.pop(key, None)
