import json

from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.chat_service import get_knowledge_reply, stream_knowledge_reply
from utils.auth import resolve_user_from_auth

router = APIRouter()


class ChatRequest(BaseModel):
    user_input: str
    session_id: str
    user_id: int | None = None  # learn-service 传入，须与 Token 一致


class ChatResponse(BaseModel):
    code: int
    msg: str
    data: dict


def _auth_error() -> ChatResponse:
    return ChatResponse(code=401, msg="登录已失效，请重新登录", data={})


def _validate_chat_request(request: ChatRequest, authorization: str | None) -> int | None:
    token_user = resolve_user_from_auth(authorization)
    if token_user is None:
        return None
    if request.user_id is not None and request.user_id != token_user:
        return None
    return token_user


@router.post("/api/agent/chat", response_model=ChatResponse)
async def knowledge_chat(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
):
    """登录用户的知识库增强对话接口（非流式，兼容旧调用）"""
    if _validate_chat_request(request, authorization) is None:
        return _auth_error()
    reply = await get_knowledge_reply(
        user_input=request.user_input,
        session_id=request.session_id,
    )
    return ChatResponse(
        code=200,
        msg="success",
        data={"ai_reply": reply}
    )


@router.post("/api/agent/chat/stream")
async def knowledge_chat_stream(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
):
    """流式 SSE 端点：实时推送多智能体管道进度 + token 流 + 最终结果"""
    if _validate_chat_request(request, authorization) is None:
        async def auth_error_stream():
            yield f"data: {json.dumps({'type': 'done', 'reply': '登录已失效，请重新登录。'}, ensure_ascii=False)}\n\n"
        return StreamingResponse(auth_error_stream(), media_type="text/event-stream")

    async def event_generator():
        async for event in stream_knowledge_reply(
            user_input=request.user_input,
            session_id=request.session_id,
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
