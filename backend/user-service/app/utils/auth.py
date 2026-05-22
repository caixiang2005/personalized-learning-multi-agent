import re

from fastapi import HTTPException
from passlib.context import CryptContext
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app import models

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,32}$")


def normalize_username(username: str) -> str:
    return username.strip().lower()


def validate_username(username: str) -> str:
    name = username.strip()
    if not _USERNAME_RE.fullmatch(name):
        raise HTTPException(
            status_code=400,
            detail="用户名须为 3–32 位字母、数字或下划线",
        )
    return name


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def resolve_email(db: Session, email: EmailStr | None, username: str | None) -> str:
    if email:
        return str(email)
    assert username is not None
    user = models.get_by_username_insensitive(db, normalize_username(username))
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return user.email


def issue_tokens(email: str) -> dict:
    return {
        "access_token": f"demo-access-{email}",
        "refresh_token": f"demo-refresh-{email}",
        "token_type": "bearer",
    }


def require_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization.removeprefix("Bearer ").strip()
    if not token.startswith("demo-access-"):
        raise HTTPException(status_code=401, detail="Token 无效")
    return token.removeprefix("demo-access-")
