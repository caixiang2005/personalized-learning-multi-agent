import re
from datetime import date
from pathlib import Path
from typing import Any

from error.logger import capture_exception
from utils.database import User, UserProfile, get_db
from utils.user_login import _format_register_time, resolve_user_id_from_token

_PHONE_RE = re.compile(r"^1\d{10}$")
_SERVICE_ROOT = Path(__file__).resolve().parent.parent
AVATAR_DIR = _SERVICE_ROOT / "static" / "avatar"
_MAX_AVATAR_BYTES = 2 * 1024 * 1024
_CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _profile_payload(profile: UserProfile) -> dict[str, Any]:
    return {
        "userId": profile.user_id,
        "username": profile.username,
        "phoneNumber": profile.phone_number,
        "avatarUrl": profile.avatar_url,
        "gender": profile.gender,
        "birthday": profile.birthday.isoformat() if profile.birthday else None,
        "lastLoginTime": _format_register_time(profile.last_login_time),
        "signature": profile.signature,
        "major": profile.major,
        "nickname": profile.nickname,
    }


def _empty_profile(user: User) -> dict[str, Any]:
    return {
        "userId": user.user_id,
        "username": user.username,
        "phoneNumber": None,
        "avatarUrl": None,
        "gender": None,
        "birthday": None,
        "lastLoginTime": None,
        "signature": None,
        "major": None,
        "nickname": None,
    }


def _get_profile(db, user_id: int) -> UserProfile | None:
    return db.get(UserProfile, user_id)


def _validate_phone(phone: str | None) -> str | None:
    if phone is None or phone == "":
        return None
    if not _PHONE_RE.fullmatch(phone):
        raise ValueError("手机号格式错误")
    return phone


def _avatar_file_from_url(avatar_url: str | None) -> Path | None:
    if not avatar_url or not avatar_url.startswith("/static/avatar/"):
        return None
    name = avatar_url.removeprefix("/static/avatar/").strip()
    if not name or "/" in name or "\\" in name:
        return None
    return AVATAR_DIR / name


def _remove_avatar_file(avatar_url: str | None) -> None:
    path = _avatar_file_from_url(avatar_url)
    if path and path.is_file():
        path.unlink()


def _resolve_avatar_ext(content_type: str) -> str | None:
    return _CONTENT_TYPE_EXT.get((content_type or "").split(";", 1)[0].strip().lower())


def upload_user_avatar(token: str, content_type: str, data: bytes) -> dict:
    user_id = resolve_user_id_from_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    ext = _resolve_avatar_ext(content_type)
    if ext is None:
        return {"code": 400, "msg": "仅支持 JPG、PNG、WEBP、GIF 图片", "data": {}}
    if not data:
        return {"code": 400, "msg": "头像文件为空", "data": {}}
    if len(data) > _MAX_AVATAR_BYTES:
        return {"code": 400, "msg": "头像大小不能超过 2MB", "data": {}}

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{user_id}{ext}"
    avatar_url = f"/static/avatar/{filename}"
    target = AVATAR_DIR / filename
    old_url: str | None = None

    try:
        with get_db() as db:
            user = db.get(User, user_id)
            if user is None:
                return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

            profile = _get_profile(db, user_id)
            if profile is None:
                return {"code": 400, "msg": "个人信息不存在", "data": {}}

            old_url = profile.avatar_url
            target.write_bytes(data)
            profile.avatar_url = avatar_url
            db.flush()
    except OSError as exc:
        capture_exception(exc, session_id=str(user_id), context="upload_user_avatar")
        return {"code": 500, "msg": "头像保存失败", "data": {}}

    if old_url and old_url != avatar_url:
        _remove_avatar_file(old_url)

    return {"code": 200, "msg": "头像上传成功", "data": {"avatarUrl": avatar_url}}


def get_user_profile(token: str) -> dict:
    user_id = resolve_user_id_from_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        user = db.get(User, user_id)
        if user is None:
            return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

        profile = db.get(UserProfile, user_id)
        if profile is None:
            return {"code": 200, "msg": "获取个人信息成功", "data": _empty_profile(user)}
        return {"code": 200, "msg": "获取个人信息成功", "data": _profile_payload(profile)}


def update_user_profile(token: str, updates: dict[str, Any]) -> dict:
    user_id = resolve_user_id_from_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    if not updates:
        return {"code": 400, "msg": "未提供可修改字段", "data": {}}

    with get_db() as db:
        user = db.get(User, user_id)
        if user is None:
            return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

        profile = _get_profile(db, user_id)
        if profile is None:
            return {"code": 400, "msg": "个人信息不存在", "data": {}}

        try:
            if "phoneNumber" in updates:
                profile.phone_number = _validate_phone(updates["phoneNumber"])
            if "gender" in updates:
                profile.gender = updates["gender"]
            if "birthday" in updates:
                birthday = updates["birthday"]
                profile.birthday = birthday if isinstance(birthday, date) else None
            if "signature" in updates:
                profile.signature = updates["signature"] or None
            if "major" in updates:
                profile.major = updates["major"] or None
            if "nickname" in updates:
                profile.nickname = updates["nickname"] or None
        except ValueError as exc:
            return {"code": 400, "msg": str(exc), "data": {}}

        db.flush()
        return {"code": 200, "msg": "个人信息更新成功", "data": _profile_payload(profile)}
