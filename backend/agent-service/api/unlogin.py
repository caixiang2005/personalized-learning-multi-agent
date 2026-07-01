import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.unlogin_chat import get_unlogin_reply, stream_unlogin_reply

router = APIRouter()


class ChatRequest(BaseModel):
    user_input: str
    session_id: str


class ChatResponse(BaseModel):
    code: int
    msg: str
    data: dict


@router.post("/api/agent/unlogin/chat", response_model=ChatResponse)
async def unlogin_chat(request: ChatRequest):
    reply = await get_unlogin_reply(request.user_input, request.session_id)
    return ChatResponse(
        code=200,
        msg="success",
        data={"ai_reply": reply}
    )


@router.post("/api/agent/unlogin/chat/stream")
async def unlogin_chat_stream(request: ChatRequest):
    """访客引导智能体 SSE 流式回复。"""

    async def event_generator():
        async for event in stream_unlogin_reply(
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
