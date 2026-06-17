"""
聊天会话业务逻辑：会话 CRUD、消息收发与 agent-service 交互。
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

import httpx

from utils.database import ChatSession, ChatMessage, get_db
from utils.redis import resolve_user_id_from_token

AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://127.0.0.1:8003")


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def _session_to_dict(s: ChatSession) -> dict[str, Any]:
    return {
        "id": s.id,
        "title": s.title or "",
        "course": s.course or "",
        "messageCount": s.message_count,
        "createdAt": s.created_at.isoformat(),
        "updatedAt": s.updated_at.isoformat(),
    }


def _message_to_dict(m: ChatMessage) -> dict[str, Any]:
    return {
        "id": str(m.id),
        "sessionId": m.session_id,
        "role": m.role,
        "content": m.content,
        "createdAt": m.created_at.isoformat(),
    }


def _strip_bearer(token: str) -> str:
    """兼容处理：去掉 Bearer 前缀（防止 API handler 忘记提取）。"""
    if token and token.startswith("Bearer "):
        return token[7:].strip()
    return token


def get_sessions(token: str) -> dict:
    """GET /api/chat/sessions — 查询该用户所有会话，按 updated_at 倒序。"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

        return {
            "code": 200,
            "msg": "获取会话列表成功",
            "data": [_session_to_dict(s) for s in sessions],
        }


def get_messages(token: str, session_id: str) -> dict:
    """GET /api/chat/sessions/{session_id}/messages — 查询某会话所有消息，按 created_at 正序。"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        ).first()

        if session is None:
            return {"code": 404, "msg": "会话不存在", "data": {}}

        messages = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.session_id == session_id,
                ChatMessage.user_id == user_id,
            )
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

        return {
            "code": 200,
            "msg": "获取消息列表成功",
            "data": {
                "session": _session_to_dict(session),
                "messages": [_message_to_dict(m) for m in messages],
            },
        }


def create_session(token: str, title: str, course: str) -> dict:
    """POST /api/chat/sessions/create — 创建新会话。"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    now = datetime.now()
    session_id = uuid.uuid4().hex[:16]

    with get_db() as db:
        session = ChatSession(
            id=session_id,
            user_id=user_id,
            title=title,
            course=course or "",
            message_count=0,
            created_at=now,
            updated_at=now,
        )
        db.add(session)
        db.flush()

        return {
            "code": 200,
            "msg": "会话创建成功",
            "data": _session_to_dict(session),
        }


def delete_session(token: str, session_id: str) -> dict:
    """DELETE /api/chat/sessions/{session_id} — 删除会话及其所有消息。"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        ).first()

        if session is None:
            return {"code": 404, "msg": "会话不存在", "data": {}}

        # 删除该会话所有消息
        db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id,
        ).delete()

        # 删除会话
        db.delete(session)
        db.flush()

        return {
            "code": 200,
            "msg": "会话已删除",
            "data": {},
        }


def send_message(token: str, session_id: str, content: str) -> dict:
    """POST /api/chat/send — 保存用户消息，调用 agent-service 获取回复，保存并返回。"""
    user_id = resolve_user_id_from_token(_strip_bearer(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    now = datetime.now()

    with get_db() as db:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        ).first()

        if session is None:
            return {"code": 404, "msg": "会话不存在", "data": {}}

        # 1. 保存用户消息
        user_msg = ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=content,
            created_at=now,
        )
        db.add(user_msg)
        db.flush()

        # 2. 调用 agent-service 获取 AI 回复
        ai_reply = _call_agent_service(user_id, session_id, content)

        # 3. 保存 AI 回复
        ai_msg = ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=ai_reply,
            created_at=datetime.now(),
        )
        db.add(ai_msg)

        # 4. 更新会话信息
        session.message_count += 2
        session.updated_at = datetime.now()

        db.flush()

        return {
            "code": 200,
            "msg": "发送成功",
            "data": {
                "aiReply": ai_reply,
                "resources": [],
            },
        }


def _call_agent_service(user_id: int, session_id: str, content: str) -> str:
    """调用 agent-service /api/agent/chat 获取 AI 回复，失败时返回 fallback。"""
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{AGENT_SERVICE_URL}/api/agent/chat",
                json={
                    "user_id": user_id,
                    "session_id": session_id,
                    "user_input": content,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("data", {}).get("ai_reply", data.get("reply", ""))
    except Exception as e:
        print(f"[WARN] agent-service 调用失败: {e}")

    # fallback
    return "抱歉，我暂时无法回答你的问题，请稍后再试。"
