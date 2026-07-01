"""
学习行为写入：按用户 + 日期 upsert learning_analytics，供效果评估页与热力图使用。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm.attributes import flag_modified

from utils.database import LearningAnalytics

DEFAULT_MINUTES: dict[str, int] = {
    "exercise": 30,
    "chat": 5,
    "path_resource": 15,
    "profile_patch": 10,
}


def _empty_metrics() -> dict[str, Any]:
    return {
        "minutes": 0,
        "hours": 0.0,
        "exercises": 0,
        "exerciseScoreSum": 0,
        "avgScore": 0.0,
        "chatMessages": 0,
        "pathUpdates": 0,
        "resourcesDone": 0,
        "profilePatches": 0,
    }


def _recalc_hours(metrics: dict[str, Any]) -> None:
    metrics["hours"] = round(int(metrics.get("minutes") or 0) / 60, 2)


def _merge_metrics(
    metrics: dict[str, Any],
    activity: str,
    *,
    minutes: int,
    exercise_score: int | None = None,
    resource_status: str | None = None,
) -> None:
    metrics["minutes"] = int(metrics.get("minutes") or 0) + minutes
    _recalc_hours(metrics)

    if activity == "exercise":
        metrics["exercises"] = int(metrics.get("exercises") or 0) + 1
        if exercise_score is not None:
            score_sum = int(metrics.get("exerciseScoreSum") or 0) + exercise_score
            metrics["exerciseScoreSum"] = score_sum
            count = int(metrics["exercises"])
            metrics["avgScore"] = round(score_sum / count, 1) if count else 0.0
    elif activity == "chat":
        metrics["chatMessages"] = int(metrics.get("chatMessages") or 0) + 1
    elif activity == "path_resource":
        metrics["pathUpdates"] = int(metrics.get("pathUpdates") or 0) + 1
        if resource_status in ("done", "mastered"):
            metrics["resourcesDone"] = int(metrics.get("resourcesDone") or 0) + 1
    elif activity == "profile_patch":
        metrics["profilePatches"] = int(metrics.get("profilePatches") or 0) + 1


def record_learning_activity(
    db,
    user_id: int,
    activity: str,
    *,
    minutes: int | None = None,
    exercise_score: int | None = None,
    resource_status: str | None = None,
    weak_points: list | None = None,
) -> None:
    """写入或累加到当日 learning_analytics 记录；失败时静默跳过。"""
    if not user_id or not activity:
        return

    today = datetime.now().date()
    now = datetime.now()
    delta_minutes = minutes if minutes is not None else DEFAULT_MINUTES.get(activity, 5)

    row = (
        db.query(LearningAnalytics)
        .filter(
            LearningAnalytics.user_id == user_id,
            LearningAnalytics.date == today,
        )
        .first()
    )

    if row is None:
        metrics = _empty_metrics()
        row = LearningAnalytics(
            user_id=user_id,
            date=today,
            metrics=metrics,
            weak_points=weak_points or [],
            suggestions=None,
            created_at=now,
        )
        db.add(row)
    else:
        metrics = dict(row.metrics or _empty_metrics())

    _merge_metrics(
        metrics,
        activity,
        minutes=delta_minutes,
        exercise_score=exercise_score,
        resource_status=resource_status,
    )
    row.metrics = metrics

    if weak_points is not None:
        row.weak_points = weak_points

    flag_modified(row, "metrics")
    if weak_points is not None:
        flag_modified(row, "weak_points")
