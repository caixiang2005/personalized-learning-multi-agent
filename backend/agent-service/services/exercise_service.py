"""
AI 练习生成与智能批改服务
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from openai import AsyncOpenAI
import httpx

from utils.redis import resolve_user_id_from_token

load_dotenv()

# ── LLM 客户端（与 chat_service 一致） ──
_raw_url = (os.getenv("DEEPSEEK_API_URL") or "").rstrip("/")
if _raw_url.endswith("/chat/completions"):
    _raw_url = _raw_url[: -len("/chat/completions")]

_client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url=_raw_url or None,
    timeout=httpx.Timeout(timeout=120.0, connect=30.0),
    max_retries=2,
)
_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# ── Prompt 模板 ──

EXERCISE_GENERATION_PROMPT = """你是一个教育 AI 练习出题专家。根据用户的专业、薄弱点和学习水平，生成针对性练习题。

要求:
1. 题型包括选择题、填空题
2. 题目难度递进
3. 每道题附正确答案和详细解析
4. 用 ```json 包裹输出

输出 JSON 格式:
{
  "questions": [
    {
      "id": "q1",
      "type": "choice",
      "title": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": "正确选项",
      "explanation": "详细解析"
    },
    {
      "id": "q2",
      "type": "fill",
      "title": "填空题目",
      "correctAnswer": "正确答案",
      "explanation": "详细解析"
    }
  ]
}
"""

AI_REVIEW_PROMPT = """你是一个 AI 批改老师。根据题目、正确答案和用户的回答，给出详细的批改反馈。

对每道题：
1. 判断对错
2. 如果错了，解释为什么错
3. 给出正确答案
4. 提供相关知识点讲解

用 ```json 包裹输出:
{
  "results": [
    {
      "questionId": "q1",
      "isCorrect": true/false,
      "userAnswer": "用户的答案",
      "correctAnswer": "正确答案",
      "explanation": "题目讲解",
      "mistakeReason": "如果错了，分析错因",
      "knowledgePoint": "相关知识点"
    }
  ],
  "summary": {
    "totalCount": 5,
    "correctCount": 3,
    "score": 60,
    "overallAssessment": "整体评价与建议"
  }
}
"""


def _extract_token(authorization: str | None) -> str:
    """从 Authorization header 提取 bearer token。"""
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def _extract_json_from_reply(reply: str) -> dict[str, Any] | None:
    """从 LLM 回复中提取 JSON 块。

    优先查找 ```json ... ``` 代码块，失败后尝试直接解析整个回复。
    """
    match = re.search(r"```json\s*([\s\S]*?)\s*```", reply)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    try:
        return json.loads(reply)
    except json.JSONDecodeError:
        return None


async def _call_llm(prompt: str, system_prompt: str = "") -> str:
    """调用 DeepSeek LLM 并返回原始回复文本。"""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = await _client.chat.completions.create(
        model=_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""


async def generate_exercises(token: str, body) -> dict:
    """POST /api/agent/exercise/generate — 生成练习题。"""
    user_id = resolve_user_id_from_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效", "data": {}}

    weak_str = "、".join(body.weak_points) if body.weak_points else "未指定"
    prompt = (
        f"用户专业/课程描述：{body.user_input or '未提供'}\n"
        f"薄弱知识点：{weak_str}\n"
        f"题目数量：{body.count}\n"
        f"难度等级：{body.difficulty}\n\n"
        f"请生成 {body.count} 道针对性的练习题。"
    )

    try:
        reply = await _call_llm(prompt, EXERCISE_GENERATION_PROMPT)
        parsed = _extract_json_from_reply(reply)
        if parsed and "questions" in parsed:
            return {
                "code": 200,
                "msg": "生成成功",
                "data": parsed,
            }
        return {
            "code": 200,
            "msg": "生成成功（未结构化）",
            "data": {"questions": [], "raw": reply},
        }
    except Exception as e:
        return {"code": 500, "msg": f"生成失败: {str(e)}", "data": {}}


async def ai_review_answers(token: str, body) -> dict:
    """POST /api/agent/exercise/review — AI 智能批改。"""
    user_id = resolve_user_id_from_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效", "data": {}}

    prompt = (
        f"请批改以下练习题：\n\n"
        f"题目与答案：\n"
        f"{json.dumps(body.questions, ensure_ascii=False, indent=2)}\n\n"
        f"用户的回答：\n"
        f"{json.dumps(body.user_answers, ensure_ascii=False, indent=2)}"
    )

    try:
        reply = await _call_llm(prompt, AI_REVIEW_PROMPT)
        parsed = _extract_json_from_reply(reply)
        if parsed and "results" in parsed:
            return {
                "code": 200,
                "msg": "批改成功",
                "data": parsed,
            }
        return {
            "code": 200,
            "msg": "批改完成",
            "data": {"results": [], "raw": reply},
        }
    except Exception as e:
        return {"code": 500, "msg": f"批改失败: {str(e)}", "data": {}}
