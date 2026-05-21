from fastapi import APIRouter
from services.unlogin_chat import get_unlogin_reply

router = APIRouter()

# 未登录时的主页面路由
@router.post("/api/agent/unlogin/chat")
async def unlogin_chat():
    
    reply = await get_unlogin_reply("用户输入的文本内容")
    return {"code": 200,"msg": "提示信息","data": {
        "ai_reply": reply,
    }}