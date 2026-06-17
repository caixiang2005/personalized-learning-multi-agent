"""
AI 练习生成与智能批改路由
POST /api/agent/exercise/generate  -- 根据用户画像/薄弱点生成练习题
POST /api/agent/exercise/review    -- AI 智能批改+详细讲解
"""

from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.exercise_service import generate_exercises, ai_review_answers

router = APIRouter(tags=["AI 练习"])


class GenerateBody(BaseModel):
    user_input: str = ""
    weak_points: list[str] = []
    count: int = 5
    difficulty: str = "medium"  # easy / medium / hard


class ReviewBody(BaseModel):
    questions: list[dict]
    user_answers: list[dict]


@router.post("/api/agent/exercise/generate")
async def handle_generate_exercises(
    body: GenerateBody,
    authorization: str | None = Header(default=None),
):
    return await generate_exercises(authorization or "", body)


@router.post("/api/agent/exercise/review")
async def handle_review_answers(
    body: ReviewBody,
    authorization: str | None = Header(default=None),
):
    return await ai_review_answers(authorization or "", body)
