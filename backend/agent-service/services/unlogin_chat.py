import os

import httpx
from dotenv import load_dotenv

from core.prompts import UNLOGIN_GUIDE_AGENT_PROMPT
from services.logger import capture_exception, log_error
from services.redis_client import load_history, save_history

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_URL")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL")

MAX_HISTORY_ROUNDS = 10
MAX_FREE_ROUNDS = 3


async def get_unlogin_reply(user_input: str, session_id: str) -> str:
    """为未登录用户的问题回答"""
    if not DEEPSEEK_API_KEY:
        await log_error("CONFIG_ERROR", "DEEPSEEK_API_KEY 未配置", session_id)
        return "服务配置错误，请联系管理员。"

    try:
        history = await load_history(session_id)
    except Exception as e:
        await capture_exception(e, session_id, "Redis load_history 失败")
        # Redis 不可用时降级为无上下文对话
        history = []

    # 未登录用户最多免费对话 MAX_FREE_ROUNDS 轮
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
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                DEEPSEEK_API_URL,
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": DEEPSEEK_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                    "stream": False,
                },
            )

            if resp.status_code != 200:
                await log_error(
                    "DEEPSEEK_API_ERR",
                    f"Deepseek 返回 {resp.status_code}: {resp.text[:200]}",
                    session_id,
                )
                return "抱歉，系统繁忙，请稍后再试。"

            body = resp.json()
            reply = body["choices"][0]["message"]["content"]

    except httpx.TimeoutException as e:
        await capture_exception(e, session_id, "Deepseek API 超时")
        return "抱歉，请求超时，请稍后再试。"
    except httpx.RequestError as e:
        await capture_exception(e, session_id, "Deepseek API 网络异常")
        return "抱歉，网络异常，请稍后再试。"

    history.append({"role": "assistant", "content": reply})

    try:
        await save_history(session_id, history)
    except Exception as e:
        await capture_exception(e, session_id, "Redis save_history 失败")
        # 保存失败不影响已生成的回复

    return reply
