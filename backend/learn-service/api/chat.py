from fastapi import APIRouter, File, Form, Header, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from services.chat_session_service import (
    get_sessions,
    get_messages,
    create_session,
    delete_session,
    send_message,
    send_message_stream,
    regenerate_last_reply,
    regenerate_last_reply_stream,
)
from services.chat_feedback_service import submit_feedback
from services.chat_upload_service import upload_chat_attachment, get_chat_attachment

router = APIRouter(tags=["聊天会话"])


class CreateSessionBody(BaseModel):
    title: str
    course: str = ""


class SendMessageBody(BaseModel):
    session_id: str
    content: str


class ChatFeedbackBody(BaseModel):
    messageId: str
    type: str
    sessionId: str | None = None


class RegenerateBody(BaseModel):
    session_id: str


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


@router.post("/api/chat/feedback")
def handle_chat_feedback(
    body: ChatFeedbackBody,
    authorization: str | None = Header(default=None),
):
    return submit_feedback(
        _extract(authorization),
        body.messageId,
        body.type,
        session_id=body.sessionId,
    )


@router.post("/api/chat/upload")
async def handle_chat_upload(
    file: UploadFile = File(...),
    session_id: str | None = Form(default=None),
    extract_text: bool = Form(default=True),
    authorization: str | None = Header(default=None),
):
    """上传聊天附件（图片 / PDF），可选 OCR 提取文字。"""
    try:
        data = await file.read()
    except Exception:
        return {"code": 400, "msg": "读取文件失败", "data": {}}

    return upload_chat_attachment(
        _extract(authorization),
        file.filename or "attachment",
        file.content_type or "",
        data,
        session_id=session_id,
        extract_text=extract_text,
    )


@router.get("/api/chat/attachments/{attachment_id}")
def handle_chat_attachment(
    attachment_id: str,
    authorization: str | None = Header(default=None),
):
    result, path = get_chat_attachment(_extract(authorization), attachment_id)
    if path is None:
        return result
    suffix = path.suffix.lower()
    media_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
    }.get(suffix, "application/octet-stream")
    return FileResponse(path, media_type=media_type, filename=path.name)


@router.post("/api/chat/regenerate")
def handle_regenerate(
    body: RegenerateBody,
    authorization: str | None = Header(default=None),
):
    return regenerate_last_reply(_extract(authorization), body.session_id)


@router.post("/api/chat/regenerate/stream")
async def handle_regenerate_stream(
    body: RegenerateBody,
    authorization: str | None = Header(default=None),
):
    async def sse_generator():
        async for event_type, data in regenerate_last_reply_stream(
            token=_extract(authorization),
            session_id=body.session_id,
        ):
            if event_type == "error":
                yield f"event: error\ndata: {data}\n\n"
            else:
                yield f"data: {data}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/api/chat/send/stream")
async def handle_send_message_stream(
    body: SendMessageBody,
    authorization: str | None = Header(default=None),
):
    """SSE 流式发送消息 — 实时推送多智能体管道进度 + token 流"""

    async def sse_generator():
        async for event_type, data in send_message_stream(
            token=_extract(authorization),
            session_id=body.session_id,
            content=body.content,
        ):
            if event_type == "error":
                yield f"event: error\ndata: {data}\n\n"
            else:
                yield f"data: {data}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
