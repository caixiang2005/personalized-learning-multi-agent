import os

from dotenv import load_dotenv
from openai import AsyncOpenAI
import httpx

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
    timeout=httpx.Timeout(timeout=120.0, connect=30.0),
    max_retries=2,
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


async def stream_unlogin_reply(user_input: str, session_id: str):
    """访客引导智能体 SSE 流式回复。"""
    if not client.api_key:
        await log_error("CONFIG_ERROR", "DEEPSEEK_API_KEY 未配置", session_id)
        reply = "服务配置错误，请联系管理员。"
        yield {"type": "token", "content": reply}
        yield {"type": "done", "reply": reply}
        return

    try:
        history = await load_history(session_id)
    except Exception as e:
        await capture_exception(e, session_id, "Redis load_history 失败")
        history = []

    user_rounds = sum(1 for m in history if m["role"] == "user")
    if user_rounds >= MAX_FREE_ROUNDS:
        reply = (
            "✅ 你已经完成了 3 轮免费体验！\n\n"
            "登录后可以享受完整功能：\n"
            "1. 构建完整的 6 维度动态学习画像\n"
            "2. 生成包含文档、思维导图、题库等完整资源\n"
            "3. 永久保存学习进度和数据\n\n"
            "请登录后继续使用吧！"
        )
        yield {"type": "token", "content": reply}
        yield {"type": "done", "reply": reply}
        return

    yield {"type": "stage", "stage": "generate", "status": "processing", "detail": "引导智能体思考中…"}

    history.append({"role": "user", "content": user_input})
    messages = [
        {"role": "system", "content": UNLOGIN_GUIDE_AGENT_PROMPT},
        *history,
    ]

    full_reply = ""
    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True,
        )
        async for chunk in stream:
            delta = (
                chunk.choices[0].delta.content or ""
                if chunk.choices and chunk.choices[0].delta
                else ""
            )
            if delta:
                full_reply += delta
                yield {"type": "token", "content": delta}
    except Exception as e:
        await capture_exception(e, session_id, "Deepseek API 调用失败")
        full_reply = "抱歉，系统繁忙，请稍后再试。"
        yield {"type": "token", "content": full_reply}

    yield {
        "type": "stage",
        "stage": "generate",
        "status": "done",
        "detail": f"生成 {len(full_reply)} 字符",
    }

    history.append({"role": "assistant", "content": full_reply})
    try:
        await save_history(session_id, history)
    except Exception as e:
        await capture_exception(e, session_id, "Redis save_history 失败")

    yield {"type": "done", "reply": full_reply}
