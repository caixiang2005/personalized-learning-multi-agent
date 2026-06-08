import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select

from utils.database import User, UserProfile, get_db
from utils.email import CodePurpose, send_verification_code, verify_verification_code
from utils.token_store import (
    resolve_access_token,
    resolve_refresh_token,
    revoke_access_token,
    revoke_refresh_token,
    store_access_token,
    store_refresh_token,
)

BEIJING_TZ = timezone(timedelta(hours=8))


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _normalize_username(username: str) -> str:
    return (username or "").strip().lower()


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _verify_password(password: str, password_hash: str) -> bool:
    return _hash_password(password) == password_hash


def _new_token() -> str:
    return secrets.token_urlsafe(24)


def _beijing_now() -> datetime:
    """返回无时区的北京时间（与库中 timestamp without time zone 一致）。"""
    return datetime.now(BEIJING_TZ).replace(tzinfo=None)


def _format_register_time(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        aware = dt.replace(tzinfo=BEIJING_TZ)
    else:
        aware = dt.astimezone(BEIJING_TZ)
    return aware.isoformat(timespec="seconds")


def _user_payload(user: User) -> dict[str, Any]:
    return {
        "userId": user.user_id,
        "email": user.email,
        "username": user.username,
        "registerTime": _format_register_time(user.register_time),
    }


def _make_auth_payload(user: User) -> dict[str, Any]:
    token = _new_token()
    refresh_token = _new_token()
    store_access_token(token, user.user_id)
    store_refresh_token(refresh_token, user.user_id)
    payload = _user_payload(user)
    payload["token"] = token
    payload["refreshToken"] = refresh_token
    return payload


def _record_last_login(user_id: int) -> None:
    """登录成功时更新 user_info.last_login_time（北京时间）。"""
    with get_db() as db:
        profile = db.get(UserProfile, user_id)
        if profile is not None:
            profile.last_login_time = _beijing_now()


def _login_success(user: User) -> dict:
    _record_last_login(user.user_id)
    return {"code": 200, "msg": "登录成功", "data": _make_auth_payload(user)}


def _get_user_by_email(email: str):
    with get_db() as db:
        stmt = select(User).where(User.email == email)
        return db.execute(stmt).scalar_one_or_none()


def _get_user_by_username(username: str):
    with get_db() as db:
        stmt = select(User).where(User.username == username)
        return db.execute(stmt).scalar_one_or_none()


def send_register_email_code(email: str) -> dict:
    return send_verification_code(email, CodePurpose.REGISTER)


def send_login_email_code(email: str) -> dict:
    return send_verification_code(email, CodePurpose.LOGIN)


def send_reset_email_code(email: str) -> dict:
    email = _normalize_email(email)
    if _get_user_by_email(email) is None:
        return {"code": 400, "msg": "用户不存在", "data": {}}
    return send_verification_code(email, CodePurpose.RESET_PASSWORD)


def register_user(email: str, username: str, password: str, code: str) -> dict:
    email = _normalize_email(email)
    username = _normalize_username(username)
    if _get_user_by_email(email) is not None:
        return {"code": 400, "msg": "邮箱已注册", "data": {}}
    if _get_user_by_username(username) is not None:
        return {"code": 400, "msg": "用户名已存在", "data": {}}
    if not verify_verification_code(email, code, CodePurpose.REGISTER):
        return {"code": 400, "msg": "验证码错误或已过期", "data": {}}

    with get_db() as db:
        user = User(
            email=email,
            username=username,
            user_password=_hash_password(password),
            register_time=_beijing_now(),
        )
        db.add(user)
        db.flush()
        return {"code": 200, "msg": "注册成功", "data": _user_payload(user)}


def login_user(email: str, password: str) -> dict:
    email = _normalize_email(email)
    user = _get_user_by_email(email)
    if user is None or not _verify_password(password, user.user_password):
        return {"code": 400, "msg": "邮箱或密码错误", "data": {}}
    return _login_success(user)


def login_user_by_username(username: str, password: str) -> dict:
    username = _normalize_username(username)
    user = _get_user_by_username(username)
    if user is None or not _verify_password(password, user.user_password):
        return {"code": 400, "msg": "用户名或密码错误", "data": {}}
    return _login_success(user)


def login_user_by_code(email: str, code: str) -> dict:
    email = _normalize_email(email)
    user = _get_user_by_email(email)
    if user is None:
        return {"code": 400, "msg": "用户不存在", "data": {}}
    if not verify_verification_code(email, code, CodePurpose.LOGIN):
        return {"code": 400, "msg": "验证码错误", "data": {}}
    return _login_success(user)


def refresh_token(old_token: str, refresh_token_value: str | None = None) -> dict:
    user_id = resolve_access_token(old_token)
    used_refresh = False
    if user_id is None and refresh_token_value:
        user_id = resolve_refresh_token(refresh_token_value)
        used_refresh = user_id is not None
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}
    with get_db() as db:
        user = db.get(User, user_id)
    if user is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    revoke_access_token(old_token)
    if used_refresh:
        revoke_refresh_token(refresh_token_value)

    payload = _make_auth_payload(user)
    return {
        "code": 200,
        "msg": "令牌刷新成功",
        "data": {"newToken": payload["token"], "newRefreshToken": payload["refreshToken"]},
    }


def resolve_user_id_from_token(token: str) -> int | None:
    return resolve_access_token(token)


def get_user_info(token: str) -> dict:
    user_id = resolve_access_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}
    with get_db() as db:
        user = db.get(User, user_id)
    if user is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}
    return {"code": 200, "msg": "获取用户信息成功", "data": _user_payload(user)}


def reset_password(email: str, code: str, new_password: str) -> dict:
    email = _normalize_email(email)
    user = _get_user_by_email(email)
    if user is None:
        return {"code": 400, "msg": "用户不存在", "data": {}}
    if not verify_verification_code(email, code, CodePurpose.RESET_PASSWORD):
        return {"code": 400, "msg": "验证码错误或已过期", "data": {}}
    with get_db() as db:
        db_user = db.get(User, user.user_id)
        if db_user is None:
            return {"code": 400, "msg": "用户不存在", "data": {}}
        db_user.user_password = _hash_password(new_password)
    return {"code": 200, "msg": "密码重置成功", "data": {}}
