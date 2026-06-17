from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.chat_session_service import (
    get_sessions,
    get_messages,
    create_session,
    delete_session,
    send_message,
)

router = APIRouter(tags=["聊天会话"])


class CreateSessionBody(BaseModel):
    title: str
    course: str = ""


class SendMessageBody(BaseModel):
    session_id: str
    content: str


def _extract(authorization: str | None) -> str:
    """从 Authorization header 中提取 Bearer token。"""
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


@router.get("/api/chat/sessions")
def handle_get_sessions(authorization: str | None = Header(default=None)):
    token = _extract(authorization)
    result = get_sessions(token)
    return result


@router.get("/api/chat/sessions/{session_id}/messages")
def handle_get_messages(
    session_id: str,
    authorization: str | None = Header(default=None),
):
    return get_messages(_extract(authorization), session_id)


@router.post("/api/chat/sessions/create")
def handle_create_session(
    body: CreateSessionBody,
    authorization: str | None = Header(default=None),
):
    return create_session(_extract(authorization), body.title, body.course)


@router.delete("/api/chat/sessions/{session_id}")
def handle_delete_session(
    session_id: str,
    authorization: str | None = Header(default=None),
):
    return delete_session(_extract(authorization), session_id)


@router.post("/api/chat/send")
def handle_send_message(
    body: SendMessageBody,
    authorization: str | None = Header(default=None),
):
    return send_message(_extract(authorization), body.session_id, body.content)
