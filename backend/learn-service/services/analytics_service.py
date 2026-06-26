"""
学习分析业务逻辑：概览、薄弱点、优化建议。
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from utils.database import LearningAnalytics, Exercise, LearnerProfile, get_db
from utils.redis import resolve_user_id_from_token


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def get_overview(token: str, range_days: int = 7) -> dict:
    """GET /api/analytics/overview — 学习效果概览。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=range_days)

    with get_db() as db:
        # 查询分析记录
        records = db.query(LearningAnalytics).filter(
            LearningAnalytics.user_id == user_id,
            LearningAnalytics.date >= start_date,
            LearningAnalytics.date <= end_date,
        ).order_by(LearningAnalytics.date.asc()).all()

        # 查询画像
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        # 查询练习统计
        exercises = db.query(Exercise).filter(
            Exercise.user_id == user_id,
            Exercise.status == "done",
            Exercise.submitted_at >= datetime.combine(start_date, datetime.min.time()),
        ).all()

        total_exercises = len(exercises)
        avg_score = (
            sum(e.score or 0 for e in exercises) / total_exercises
            if total_exercises > 0 else 0
        )

        return {
            "code": 200,
            "msg": "获取分析概览成功",
            "data": {
                "range": f"{range_days}d",
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "metrics": {
                    "studyDays": len(records),
                    "totalExercises": total_exercises,
                    "avgScore": round(avg_score, 1),
                    "healthScore": profile.health_score if profile else 0,
                    "progress": profile.progress if profile else 0,
                },
                "dailyRecords": [
                    {
                        "date": r.date.isoformat(),
                        "metrics": r.metrics or {},
                    }
                    for r in records
                ],
                "learnerDimensions": profile.learner_dimensions if profile else [],
            },
        }


def get_weak_points(token: str) -> dict:
    """GET /api/analytics/weak-points — 薄弱点与推荐资源。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        weak_points = profile.weak_points if profile and profile.weak_points else []

        # 从画像的 level 字段提取更多薄弱信息
        weak_keywords = []
        if profile and profile.level:
            import re
            keywords = re.findall(r'[一-龥A-Za-z0-9·]{2,12}', profile.level)
            weak_keywords = list(set(
                w for w in keywords
                if any(k in w for k in ["薄弱", "不熟", "不会", "困难", "不懂", "忘了", "难"])
            ))

        return {
            "code": 200,
            "msg": "获取薄弱点成功",
            "data": {
                "weakPoints": weak_points or [
                    {"name": kw, "count": 5} for kw in weak_keywords[:5]
                ],
                "learnerDimensions": [
                    d for d in (profile.learner_dimensions or [])
                    if isinstance(d, dict) and d.get("level") in ("weak",)
                ],
            },
        }


def get_suggestions(token: str) -> dict:
    """GET /api/analytics/suggestions — 学习优化建议。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        suggestions = []

        if profile:
            health = profile.health_score or 0
            if health < 40:
                suggestions.append("你的画像健康度较低，建议先从薄弱知识点开始系统学习。")
            elif health < 70:
                suggestions.append("学习进度良好，建议重点突破薄弱维度以提升综合评分。")

            if profile.progress == 0:
                suggestions.append("还没有开始学习路径，建议先生成个性化学习路径。")

            dimensions = profile.learner_dimensions or []
            weak_dims = [d for d in dimensions if isinstance(d, dict) and d.get("level") == "weak"]
            if weak_dims:
                dim_names = [d.get("label", d.get("key", "")) for d in weak_dims]
                suggestions.append(f"以下维度需要加强: {', '.join(dim_names)}。可以针对性地多做练习。")

        if not suggestions:
            suggestions.append("继续保持当前学习节奏，定期复盘薄弱知识点。")

        return {
            "code": 200,
            "msg": "获取建议成功",
            "data": {
                "suggestions": suggestions,
            },
        }
