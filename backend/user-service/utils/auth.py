import hashlib
import secrets
from typing import Any

from sqlalchemy import select

from utils.database import User, get_db
from utils.email import CodePurpose, send_verification_code, verify_verification_code


_ACCESS_TOKENS: dict[str, int] = {}
_REFRESH_TOKENS: dict[str, int] = {}


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


def _user_payload(user: User) -> dict[str, Any]:
    return {
        "userId": user.user_id,
        "email": user.email,
        "username": user.username,
        "registerTime": user.register_time.isoformat() if user.register_time else None,
    }


def _make_auth_payload(user: User) -> dict[str, Any]:
    token = _new_token()
    refresh_token = _new_token()
    _ACCESS_TOKENS[token] = user.user_id
    _REFRESH_TOKENS[refresh_token] = user.user_id
    payload = _user_payload(user)
    payload["token"] = token
    payload["refreshToken"] = refresh_token
    return payload


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
        user = User(email=email, username=username, user_password=_hash_password(password))
        db.add(user)
        db.flush()
        return {"code": 200, "msg": "注册成功", "data": _user_payload(user)}


def login_user(email: str, password: str) -> dict:
    email = _normalize_email(email)
    user = _get_user_by_email(email)
    if user is None or not _verify_password(password, user.user_password):
        return {"code": 400, "msg": "邮箱或密码错误", "data": {}}
    return {"code": 200, "msg": "登录成功", "data": _make_auth_payload(user)}


def login_user_by_username(username: str, password: str) -> dict:
    username = _normalize_username(username)
    user = _get_user_by_username(username)
    if user is None or not _verify_password(password, user.user_password):
        return {"code": 400, "msg": "用户名或密码错误", "data": {}}
    return {"code": 200, "msg": "登录成功", "data": _make_auth_payload(user)}


def login_user_by_code(email: str, code: str) -> dict:
    email = _normalize_email(email)
    user = _get_user_by_email(email)
    if user is None:
        return {"code": 400, "msg": "用户不存在", "data": {}}
    if not verify_verification_code(email, code, CodePurpose.LOGIN):
        return {"code": 400, "msg": "验证码错误", "data": {}}
    return {"code": 200, "msg": "登录成功", "data": _make_auth_payload(user)}


def refresh_token(old_token: str) -> dict:
    user_id = _ACCESS_TOKENS.get(old_token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}
    with get_db() as db:
        user = db.get(User, user_id)
    if user is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}
    payload = _make_auth_payload(user)
    return {"code": 200, "msg": "令牌刷新成功", "data": {"newToken": payload["token"]}}


def get_user_info(token: str) -> dict:
    user_id = _ACCESS_TOKENS.get(token)
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
