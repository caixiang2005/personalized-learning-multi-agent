import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.chat_service import get_knowledge_reply, stream_knowledge_reply

router = APIRouter()


class ChatRequest(BaseModel):
    user_input: str
    session_id: str
    user_id: int | None = None  # learn-service 传入，兼容


class ChatResponse(BaseModel):
    code: int
    msg: str
    data: dict


@router.post("/api/agent/chat", response_model=ChatResponse)
async def knowledge_chat(request: ChatRequest):
    """登录用户的知识库增强对话接口（非流式，兼容旧调用）"""
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
async def knowledge_chat_stream(request: ChatRequest):
    """流式 SSE 端点：实时推送多智能体管道进度 + token 流 + 最终结果"""

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
