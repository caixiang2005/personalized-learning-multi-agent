"""
拍照搜题服务 — cnocr OCR 识别 + DeepSeek AI 分析
"""
import asyncio
import json
import os
import re
from io import BytesIO
from typing import Any

from dotenv import load_dotenv
from openai import AsyncOpenAI
import httpx
from PIL import Image

load_dotenv()

_raw_url = (os.getenv("DEEPSEEK_API_URL") or "").rstrip("/")
if _raw_url.endswith("/chat/completions"):
    _raw_url = _raw_url[: -len("/chat/completions")]

_client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url=_raw_url or None,
    timeout=httpx.Timeout(timeout=120.0, connect=30.0),
    max_retries=2,
)
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# cnocr 惰性初始化
_ocr = None


def _get_ocr():
    global _ocr
    if _ocr is None:
        from cnocr import CnOcr
        _ocr = CnOcr()
    return _ocr


ANALYSIS_PROMPT = """你是一个学习辅导助手。以下是一道题目的文字：

[[QUESTION_TEXT]]

请输出 JSON（不要其它文字），格式如下：
{
  "knowledge_points": ["知识点1", "知识点2"],
  "analysis": "Markdown 格式的详细解析（含答案与思路）",
  "steps": [
    {"order": 1, "title": "审题", "content": "步骤说明"},
    {"order": 2, "title": "解题", "content": "步骤说明"}
  ],
  "similar_questions": [
    {"id": "sq-1", "question": "同类题题干", "difficulty": "基础", "knowledgePoint": "对应知识点"}
  ]
}

要求：knowledge_points 2-4 个；steps 2-4 步；similar_questions 2-3 道；用中文。"""


def _extract_json_from_reply(reply: str) -> dict[str, Any] | None:
    match = re.search(r"```json\s*([\s\S]*?)\s*```", reply)
    candidates = [match.group(1)] if match else []
    candidates.append(reply.strip())
    for text in candidates:
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            continue
    return None


def _normalize_scan_payload(raw: dict[str, Any] | None, fallback_analysis: str) -> dict[str, Any]:
    if not raw:
        return {
            "knowledge_points": [],
            "analysis": fallback_analysis,
            "steps": [],
            "similar_questions": [],
        }
    return {
        "knowledge_points": raw.get("knowledge_points") or raw.get("knowledgePoints") or [],
        "analysis": str(raw.get("analysis") or fallback_analysis),
        "steps": raw.get("steps") or [],
        "similar_questions": raw.get("similar_questions") or raw.get("similarQuestions") or [],
    }


async def analyze_question(image_bytes: bytes, user_text: str = "") -> dict:
    """OCR 识别图片文字 + DeepSeek AI 分析"""
    loop = asyncio.get_event_loop()

    # 1. 图片预处理
    try:
        img = Image.open(BytesIO(image_bytes))
        img = img.convert("RGB")
    except Exception:
        return {"code": 400, "msg": "无法解析图片，请上传 JPG/PNG 格式", "data": {}}

    # 2. cnocr 识别
    ocr_text = ""
    ocr_status = "ok"
    try:
        ocr = await loop.run_in_executor(None, _get_ocr)
        # cnocr.ocr() 返回 list[dict], 每个 dict 含 'text' 和 'score'
        results = await loop.run_in_executor(
            None, lambda: ocr.ocr(img)
        )
        lines = []
        for r in results:
            t = (r.get("text") or "").strip()
            if t:
                lines.append(t)
        ocr_text = "\n".join(lines)
    except Exception as e:
        ocr_status = f"error: {e}"

    # 3. 确定分析文本（OCR 优先，用户输入兜底）
    question_text = (ocr_text or user_text or "").strip()
    if not question_text:
        return {
            "code": 200,
            "msg": "未识别到文字",
            "data": {
                "ocr_text": "",
                "ai_analysis": "图片中未检测到文字，请在文本框中手动输入题目内容。",
                "ocr_status": ocr_status,
                "knowledge_points": [],
                "steps": [],
                "similar_questions": [],
            },
        }

    # 4. AI 分析
    ai_analysis = ""
    structured: dict[str, Any] = {}
    try:
        prompt = ANALYSIS_PROMPT.replace("[[QUESTION_TEXT]]", question_text)
        resp = await _client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1200,
        )
        ai_analysis = resp.choices[0].message.content or ""
        structured = _normalize_scan_payload(_extract_json_from_reply(ai_analysis), ai_analysis)
    except Exception:
        ai_analysis = f"AI 分析暂时不可用。以下为识别到的题目文字：\n\n{question_text}"
        structured = _normalize_scan_payload(None, ai_analysis)

    return {
        "code": 200,
        "msg": "分析完成",
        "data": {
            "ocr_text": ocr_text,
            "ai_analysis": structured.get("analysis") or ai_analysis,
            "ocr_status": ocr_status,
            "knowledge_points": structured.get("knowledge_points") or [],
            "steps": structured.get("steps") or [],
            "similar_questions": structured.get("similar_questions") or [],
        },
    }
