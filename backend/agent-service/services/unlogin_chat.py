import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

from core.prompts import UNLOGIN_GUIDE_AGENT_PROMPT
from services.logger import capture_exception, log_error
from services.redis_client import load_history, save_history

load_dotenv()

_raw_url = (os.getenv("DEEPSEEK_API_URL") or "").rstrip("/")
if _raw_url.endswith("/chat/completions"):
    _raw_url = _raw_url[: -len("/chat/completions")]

client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url=_raw_url or None,
)

MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

MAX_HISTORY_ROUNDS = 10
MAX_FREE_ROUNDS = 3


async def get_unlogin_reply(user_input: str, session_id: str) -> str:
    """为未登录用户的问题回答"""
    if not client.api_key:
        await log_error("CONFIG_ERROR", "DEEPSEEK_API_KEY 未配置", session_id)
        return "服务配置错误，请联系管理员。"

    try:
        history = await load_history(session_id)
    except Exception as e:
        await capture_exception(e, session_id, "Redis load_history 失败")
        history = []

    user_rounds = sum(1 for m in history if m["role"] == "user")
    if user_rounds >= MAX_FREE_ROUNDS:
        return (
            "✅ 你已经完成了 3 轮免费体验！\n\n"
            "登录后可以享受完整功能：\n"
            "1. 构建完整的 6 维度动态学习画像\n"
            "2. 生成包含文档、思维导图、题库等完整资源\n"
            "3. 永久保存学习进度和数据\n\n"
            "请登录后继续使用吧！"
        )

    history.append({"role": "user", "content": user_input})

    messages = [
        {"role": "system", "content": UNLOGIN_GUIDE_AGENT_PROMPT},
        *history,
    ]

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        reply = resp.choices[0].message.content or ""

    except Exception as e:
        await capture_exception(e, session_id, "Deepseek API 调用失败")
        return "抱歉，系统繁忙，请稍后再试。"

    history.append({"role": "assistant", "content": reply})

    try:
        await save_history(session_id, history)
    except Exception as e:
        await capture_exception(e, session_id, "Redis save_history 失败")

    return reply
