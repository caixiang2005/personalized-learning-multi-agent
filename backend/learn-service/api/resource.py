from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.resource_service import (
    get_resource,
    get_exercise,
    submit_exercise,
    generate_exercises,
    ai_review_exercise,
    save_exercise_result,
    get_my_exercises,
)

router = APIRouter(tags=["资源与练习"])


class SubmitExerciseBody(BaseModel):
    answers: list[dict]


class ExerciseGenerateBody(BaseModel):
    user_input: str = ""
    weak_points: list[str] = []
    count: int = 5
    difficulty: str = "medium"


class AiReviewBody(BaseModel):
    questions: list[dict]
    user_answers: list[dict]


class SaveExerciseBody(BaseModel):
    questions: list[dict]
    answers: list[dict]
    score: int
    topic_id: str = ""
    difficulty: str = "medium"
    ai_review: list[dict] | None = None
    source: str = "ai_generated"
    title: str = ""


@router.get("/api/resources/{resource_id}")
def handle_get_resource(resource_id: int, authorization: str | None = Header(default=None)):
    return get_resource(authorization or "", resource_id)


@router.get("/api/exercises/{exercise_id}")
def handle_get_exercise(exercise_id: int, authorization: str | None = Header(default=None)):
    return get_exercise(authorization or "", exercise_id)


@router.post("/api/exercises/{exercise_id}/submit")
def handle_submit_exercise(
    exercise_id: int,
    body: SubmitExerciseBody,
    authorization: str | None = Header(default=None),
):
    return submit_exercise(authorization or "", exercise_id, body.answers)


@router.post("/api/exercises/generate")
def handle_generate_exercises(
    body: ExerciseGenerateBody,
    authorization: str | None = Header(default=None),
):
    """AI 生成练习题（通过 agent-service）"""
    return generate_exercises(authorization or "", body)


@router.post("/api/exercises/save")
def handle_save_exercise(
    body: SaveExerciseBody,
    authorization: str | None = Header(default=None),
):
    """保存 AI 生成的练习结果到数据库"""
    return save_exercise_result(
        authorization or "",
        body.questions,
        body.answers,
        body.score,
        topic_id=body.topic_id,
        difficulty=body.difficulty,
        ai_review=body.ai_review,
        source=body.source,
        title=body.title,
    )


@router.get("/api/exercises")
def handle_get_exercises(
    authorization: str | None = Header(default=None),
):
    """获取当前用户的所有练习记录"""
    return get_my_exercises(authorization or "")


@router.post("/api/exercises/{exercise_id}/ai-review")
def handle_ai_review(
    exercise_id: str,
    body: AiReviewBody,
    authorization: str | None = Header(default=None),
):
    """AI 智能批改（通过 agent-service）"""
    return ai_review_exercise(authorization or "", exercise_id, body.questions, body.user_answers)
