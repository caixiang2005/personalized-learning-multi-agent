import random
import smtplib
import time

from fastapi import HTTPException

from email_sender import send_verification_email
from email_settings import get_email_config

# key: "{purpose}:{email}" -> {code, expires_at, sent_at}
_store: dict[str, dict[str, float | str]] = {}


def _key(purpose: str, email: str) -> str:
    return f"{purpose}:{email}"


def _generate_code(length: int) -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(length))


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
