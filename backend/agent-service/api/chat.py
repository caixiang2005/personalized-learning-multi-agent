from fastapi import APIRouter
from pydantic import BaseModel
from services.chat_service import get_knowledge_reply

router = APIRouter()


class ChatRequest(BaseModel):
    user_input: str
    session_id: str


class ChatResponse(BaseModel):
    code: int
    msg: str
    data: dict


@router.post("/api/agent/chat", response_model=ChatResponse)
async def knowledge_chat(request: ChatRequest):
    """登录用户的知识库增强对话接口"""
    reply = await get_knowledge_reply(
        user_input=request.user_input,
        session_id=request.session_id,
    )
    return ChatResponse(
        code=200,
        msg="success",
        data={"ai_reply": reply}
    )
