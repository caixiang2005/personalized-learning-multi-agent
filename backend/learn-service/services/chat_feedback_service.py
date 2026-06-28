"""
聊天消息反馈：写入 chat_message_feedbacks 表。
"""

from __future__ import annotations

from datetime import datetime

from utils.database import ChatMessage, ChatMessageFeedback, ChatSession, get_db
from utils.redis import resolve_user_id_from_token


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


_VALID_TYPES = frozenset({"useful", "useless", "favorite"})


def submit_feedback(
    token: str,
    message_id: str,
    feedback_type: str,
    session_id: str | None = None,
) -> dict:
    """POST /api/chat/feedback"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    if feedback_type not in _VALID_TYPES:
        return {
            "code": 400,
            "msg": f"无效反馈类型，可选: {', '.join(sorted(_VALID_TYPES))}",
            "data": {},
        }

    try:
        msg_id = int(message_id)
    except (TypeError, ValueError):
        return {"code": 400, "msg": "无效的消息 ID", "data": {}}

    now = datetime.now()

    with get_db() as db:
        message = db.query(ChatMessage).filter(
            ChatMessage.id == msg_id,
            ChatMessage.user_id == user_id,
        ).first()
        if message is None:
            return {"code": 404, "msg": "消息不存在", "data": {}}

        sid = session_id or message.session_id
        session = db.query(ChatSession).filter(
            ChatSession.id == sid,
            ChatSession.user_id == user_id,
        ).first()
        if session is None:
            return {"code": 404, "msg": "会话不存在", "data": {}}

        existing = db.query(ChatMessageFeedback).filter(
            ChatMessageFeedback.user_id == user_id,
            ChatMessageFeedback.message_id == msg_id,
        ).first()

        if existing:
            existing.feedback_type = feedback_type
            existing.session_id = sid
            existing.updated_at = now
        else:
            db.add(ChatMessageFeedback(
                user_id=user_id,
                message_id=msg_id,
                session_id=sid,
                feedback_type=feedback_type,
                created_at=now,
                updated_at=now,
            ))

        return {
            "code": 200,
            "msg": "反馈已提交",
            "data": {"type": feedback_type, "messageId": str(msg_id)},
        }
