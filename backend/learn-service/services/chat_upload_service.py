"""聊天附件上传与读取。"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import httpx

from utils.redis import resolve_user_id_from_token

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads" / "chat"
MAX_BYTES = 10 * 1024 * 1024
AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://127.0.0.1:8003")

_CONTENT_TYPE_EXT: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
}


def _strip_bearer(token: str) -> str:
    parts = token.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return token.strip()


def _resolve_ext(content_type: str) -> str | None:
    base = (content_type or "").split(";", 1)[0].strip().lower()
    return _CONTENT_TYPE_EXT.get(base)


def _user_dir(user_id: int) -> Path:
    return UPLOAD_ROOT / str(user_id)


def _find_attachment_path(user_id: int, attachment_id: str) -> Path | None:
    folder = _user_dir(user_id)
    if not folder.is_dir():
        return None
    for path in folder.glob(f"{attachment_id}.*"):
        if path.is_file():
            return path
    return None


def _ocr_image(token: str, data: bytes, filename: str, content_type: str) -> str:
    """调用 agent-service scan 提取 OCR 文字；失败时返回空字符串。"""
    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{AGENT_SERVICE_URL}/api/agent/scan",
                files={"file": (filename, data, content_type)},
                data={"text": ""},
                headers={"Authorization": f"Bearer {_strip_bearer(token)}"},
            )
            if resp.status_code != 200:
                return ""
            body = resp.json()
            if body.get("code") != 200:
                return ""
            return (body.get("data") or {}).get("ocr_text") or ""
    except Exception:
        return ""


def upload_chat_attachment(
    token: str,
    filename: str,
    content_type: str,
    data: bytes,
    *,
    session_id: str | None = None,
    extract_text: bool = False,
) -> dict:
    """POST /api/chat/upload"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    ext = _resolve_ext(content_type)
    if ext is None:
        return {"code": 400, "msg": "仅支持 JPG、PNG、WEBP、GIF、PDF", "data": {}}
    if not data:
        return {"code": 400, "msg": "文件为空", "data": {}}
    if len(data) > MAX_BYTES:
        return {"code": 400, "msg": "文件大小不能超过 10MB", "data": {}}

    attachment_id = str(uuid.uuid4())
    safe_name = (filename or f"attachment{ext}").replace("\\", "/").split("/")[-1][:120]
    user_dir = _user_dir(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    target = user_dir / f"{attachment_id}{ext}"

    try:
        target.write_bytes(data)
    except OSError:
        return {"code": 500, "msg": "保存附件失败", "data": {}}

    ocr_text = ""
    if extract_text and content_type.startswith("image/"):
        ocr_text = _ocr_image(token, data, safe_name, content_type)

    return {
        "code": 200,
        "msg": "上传成功",
        "data": {
            "id": attachment_id,
            "url": f"/api/chat/attachments/{attachment_id}",
            "fileName": safe_name,
            "mimeType": content_type.split(";", 1)[0].strip().lower(),
            "size": len(data),
            "sessionId": session_id,
            "ocrText": ocr_text,
        },
    }


def get_chat_attachment(token: str, attachment_id: str) -> tuple[dict, Path | None]:
    """GET /api/chat/attachments/:id — 返回 (响应 dict, 文件路径)。"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}, None

    if not attachment_id or len(attachment_id) > 64:
        return {"code": 400, "msg": "无效的附件 ID", "data": {}}, None

    path = _find_attachment_path(user_id, attachment_id)
    if path is None:
        return {"code": 404, "msg": "附件不存在", "data": {}}, None

    return {"code": 200, "msg": "ok", "data": {}}, path
