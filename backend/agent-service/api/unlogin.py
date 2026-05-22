from fastapi import APIRouter
from pydantic import BaseModel
from services.unlogin_chat import get_unlogin_reply

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
