"""
学习资源 & 练习业务逻辑。
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any

import httpx
from utils.database import LearningResource, Exercise, get_db
from utils.redis import resolve_user_id_from_token
from services.profile_service import apply_exercise_to_profile
from services.analytics_activity_service import record_learning_activity


AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://127.0.0.1:8003")


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def _resource_to_dict(r: LearningResource) -> dict[str, Any]:
    meta = r.extra_meta or {}
    content = r.content or ""
    url = meta.get("url") or ""
    if r.type == "video" and url and not content:
        content = f"[{r.title or '视频讲解'}]({url})"
    return {
        "id": str(r.id),
        "type": r.type,
        "title": r.title or "",
        "description": meta.get("description", ""),
        "content": content,
        "url": url,
        "status": r.status,
        "progress": meta.get("progress", 0),
        "mermaid": meta.get("mermaid", ""),
    }


def _parse_resource_id(resource_id: str | int) -> int | None:
    try:
        return int(str(resource_id).strip())
    except (TypeError, ValueError):
        return None


def get_resource(token: str, resource_id: str | int) -> dict:
    """GET /api/resources/{id} — 获取资源详情。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    rid = _parse_resource_id(resource_id)
    if rid is None:
        return {"code": 400, "msg": "无效的资源 ID", "data": {}}

    with get_db() as db:
        resource = db.query(LearningResource).filter(
            LearningResource.id == rid,
            LearningResource.user_id == user_id,
        ).first()

        if resource is None:
            return {"code": 404, "msg": "资源不存在", "data": {}}

        return {
            "code": 200,
            "msg": "获取资源成功",
            "data": _resource_to_dict(resource),
        }


def _find_exercise(db, user_id: int, exercise_id: int) -> Exercise | None:
    """按练习主键或路径 learning_resources 主键查找练习。"""
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.user_id == user_id,
    ).first()
    if exercise is not None:
        return exercise

    return db.query(Exercise).filter(
        Exercise.resource_id == exercise_id,
        Exercise.user_id == user_id,
    ).first()


def get_exercise(token: str, exercise_id: str | int) -> dict:
    """GET /api/exercises/{id} — 获取练习题目列表。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    eid = _parse_resource_id(exercise_id)
    if eid is None:
        return {"code": 400, "msg": "无效的练习 ID", "data": {}}

    with get_db() as db:
        exercise = _find_exercise(db, user_id, eid)

        if exercise is None:
            return {"code": 404, "msg": "练习不存在", "data": {}}

        return {
            "code": 200,
            "msg": "获取练习成功",
            "data": {
                "id": str(exercise.id),
                "topicId": exercise.topic_id or "",
                "questions": exercise.questions or [],
                "status": exercise.status,
            },
        }


def submit_exercise(
    token: str,
    exercise_id: str | int,
    answers: list[dict],
    ai_review: list[dict] | None = None,
) -> dict:
    """POST /api/exercises/{id}/submit — 提交练习、批改、回写画像与 analytics。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    eid = _parse_resource_id(exercise_id)
    if eid is None:
        return {"code": 400, "msg": "无效的练习 ID", "data": {}}

    with get_db() as db:
        exercise = _find_exercise(db, user_id, eid)

        if exercise is None:
            return {"code": 404, "msg": "练习不存在", "data": {}}

        if exercise.status == "done":
            return {"code": 400, "msg": "该练习已提交过", "data": {}}

        exercise.answers = answers
        exercise.status = "done"
        exercise.submitted_at = datetime.now()
        if ai_review:
            exercise.ai_review = ai_review

        questions = exercise.questions or []
        correct = 0
        total = min(len(questions), len(answers))
        for i in range(total):
            q = questions[i]
            a = answers[i]
            if isinstance(q, dict) and isinstance(a, dict):
                correct_key = q.get("correctAnswer", q.get("answer", ""))
                user_key = a.get("answer", a.get("userAnswer", ""))
                if correct_key and user_key and str(correct_key).strip() == str(user_key).strip():
                    correct += 1

        score = int(correct / total * 100) if total > 0 else 0
        exercise.score = score

        profile_snapshot = apply_exercise_to_profile(
            db,
            user_id,
            score=score,
            questions=questions,
            answers=answers,
            ai_review=ai_review or exercise.ai_review,
            topic_id=exercise.topic_id or "",
        )
        record_learning_activity(
            db,
            user_id,
            "exercise",
            exercise_score=score,
            weak_points=profile_snapshot.get("weakPoints") if profile_snapshot else None,
        )

        db.flush()

        data: dict[str, Any] = {
            "id": str(exercise.id),
            "score": score,
            "correctCount": correct,
            "totalCount": total,
            "status": "done",
        }
        if profile_snapshot:
            data["profile"] = profile_snapshot

        return {
            "code": 200,
            "msg": "提交成功",
            "data": data,
        }


def _forward_authorization(headers: dict, token: str) -> dict:
    """构建转发到 agent-service 的请求头。"""
    h = {k: v for k, v in headers.items() if k.lower() in ("content-type",)}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def save_exercise_result(
    token: str,
    questions: list[dict],
    answers: list[dict],
    score: int,
    topic_id: str = "",
    difficulty: str = "medium",
    ai_review: list[dict] | None = None,
    source: str = "ai_generated",
    title: str = "",
) -> dict:
    """POST /api/exercises/save — 保存 AI 生成练习的结果到数据库。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        exercise = Exercise(
            user_id=user_id,
            topic_id=topic_id,
            title=title or (f"练习 #{datetime.now().strftime('%m%d%H%M')}"),
            questions=questions,
            answers=answers,
            score=score,
            difficulty=difficulty,
            question_count=len(questions) if questions else 0,
            ai_review=ai_review,
            source=source,
            status="done",
            created_at=datetime.now(),
            submitted_at=datetime.now(),
        )
        db.add(exercise)
        db.flush()

        profile_snapshot = apply_exercise_to_profile(
            db,
            user_id,
            score=score,
            questions=questions,
            answers=answers,
            ai_review=ai_review,
            topic_id=topic_id,
        )
        record_learning_activity(
            db,
            user_id,
            "exercise",
            exercise_score=score,
            weak_points=profile_snapshot.get("weakPoints") if profile_snapshot else None,
        )

        data: dict[str, Any] = {
            "id": str(exercise.id),
            "score": score,
            "question_count": len(questions) if questions else 0,
            "difficulty": difficulty,
            "status": "done",
        }
        if profile_snapshot:
            data["profile"] = profile_snapshot

        return {
            "code": 200,
            "msg": "保存成功",
            "data": data,
        }


def generate_exercises(token: str, body) -> dict:
    """POST /api/exercises/generate — 通过 agent-service 生成练习题。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{AGENT_SERVICE_URL}/api/agent/exercise/generate",
                json={
                    "user_input": body.user_input,
                    "weak_points": body.weak_points,
                    "count": body.count,
                    "difficulty": body.difficulty,
                },
                headers=_forward_authorization({}, token),
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as e:
        return {"code": 502, "msg": f"调用 AI 服务失败: {str(e)}", "data": {}}


def ai_review_exercise(
    token: str,
    exercise_id: str,
    questions: list[dict],
    user_answers: list[dict],
) -> dict:
    """POST /api/exercises/{id}/ai-review — 通过 agent-service 智能批改。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{AGENT_SERVICE_URL}/api/agent/exercise/review",
                json={
                    "questions": questions,
                    "user_answers": user_answers,
                },
                headers=_forward_authorization({}, token),
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as e:
        return {
            "code": 502, "msg": f"调用 AI 批改服务失败: {str(e)}", "data": {}}


def sync_exercise_profile(
    token: str,
    score: int,
    questions: list[dict],
    answers: list[dict],
    ai_review: list[dict] | None = None,
    topic_id: str = "",
) -> dict:
    """POST /api/exercises/sync-profile — 练习完成后回写薄弱点与六维画像。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        profile_snapshot = apply_exercise_to_profile(
            db,
            user_id,
            score=score,
            questions=questions,
            answers=answers,
            ai_review=ai_review,
            topic_id=topic_id,
        )
        if profile_snapshot is None:
            return {"code": 404, "msg": "请先完成学习画像构建", "data": {}}

        record_learning_activity(
            db,
            user_id,
            "exercise",
            exercise_score=score,
            weak_points=profile_snapshot.get("weakPoints"),
        )

        return {
            "code": 200,
            "msg": "画像已同步",
            "data": {"profile": profile_snapshot},
        }


def get_my_exercises(token: str) -> dict:
    """GET /api/exercises — 获取当前用户的所有练习记录。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        records = (
            db.query(Exercise)
            .filter(Exercise.user_id == user_id)
            .order_by(Exercise.created_at.desc())
            .limit(50)
            .all()
        )

        return {
            "code": 200,
            "msg": "获取成功",
            "data": [
                {
                    "id": str(r.id),
                    "topicId": r.topic_id or "",
                    "title": r.title or "",
                    "questions": r.questions or [],
                    "answers": r.answers or [],
                    "score": r.score,
                    "difficulty": r.difficulty or "medium",
                    "questionCount": r.question_count or 0,
                    "aiReview": r.ai_review or [],
                    "source": r.source or "ai_generated",
                    "status": r.status,
                    "createdAt": r.created_at.isoformat() if r.created_at else "",
                }
                for r in records
            ],
        }
