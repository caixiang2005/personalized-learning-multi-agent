"""
学习分析业务逻辑：概览、薄弱点、优化建议。
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from utils.database import LearningAnalytics, Exercise, LearnerProfile, ChatMessage, get_db
from utils.redis import resolve_user_id_from_token
from services.analytics_activity_service import DEFAULT_MINUTES


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


def _minutes_from_metrics(metrics: dict | None) -> int:
    if not metrics or not isinstance(metrics, dict):
        return 0
    # analytics_activity_service 写入格式
    if isinstance(metrics.get("minutes"), (int, float)):
        return int(metrics["minutes"])
    total = metrics.get("totalMinutes")
    if isinstance(total, (int, float)):
        return int(total)
    events = metrics.get("events") or []
    if isinstance(events, list) and events:
        return sum(int(e.get("minutes") or 0) for e in events if isinstance(e, dict))
    hours = metrics.get("hours")
    if isinstance(hours, (int, float)):
        return int(hours * 60)
    return 0


def _backfill_minutes_by_date(
    db,
    user_id: int,
    start_date,
    end_date,
) -> dict[str, int]:
    """从练习提交与辅导对话补全无 analytics 记录的历史日期。"""
    by_date: dict[str, int] = {}

    exercises = db.query(Exercise).filter(
        Exercise.user_id == user_id,
        Exercise.status == "done",
        Exercise.submitted_at >= datetime.combine(start_date, datetime.min.time()),
        Exercise.submitted_at <= datetime.combine(end_date, datetime.max.time()),
    ).all()
    for ex in exercises:
        if not ex.submitted_at:
            continue
        key = ex.submitted_at.date().isoformat()
        by_date[key] = by_date.get(key, 0) + DEFAULT_MINUTES.get("exercise", 30)

    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id,
        ChatMessage.role == "user",
        ChatMessage.created_at >= datetime.combine(start_date, datetime.min.time()),
        ChatMessage.created_at <= datetime.combine(end_date, datetime.max.time()),
    ).all()
    for msg in messages:
        key = msg.created_at.date().isoformat()
        by_date[key] = by_date.get(key, 0) + DEFAULT_MINUTES.get("chat", 5)

    return by_date


def _level_from_minutes(minutes: int) -> int:
    if minutes <= 0:
        return 0
    if minutes < 15:
        return 1
    if minutes < 30:
        return 2
    if minutes < 60:
        return 3
    return 4


def record_activity(
    token: str,
    activity: str,
    minutes: int = 0,
    exercise_score: int | None = None,
    resource_status: str | None = None,
) -> dict:
    """POST /api/analytics/record — 记录学习行为。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    valid_activities = {"exercise", "chat", "path_resource", "profile_patch"}
    if activity not in valid_activities:
        return {"code": 400, "msg": f"无效 activity，可选: {', '.join(sorted(valid_activities))}", "data": {}}

    now = datetime.now()
    today = now.date()
    event: dict[str, Any] = {
        "activity": activity,
        "minutes": max(0, int(minutes or 0)),
        "ts": now.isoformat(),
    }
    if exercise_score is not None:
        event["exerciseScore"] = exercise_score
    if resource_status:
        event["resourceStatus"] = resource_status

    with get_db() as db:
        record = db.query(LearningAnalytics).filter(
            LearningAnalytics.user_id == user_id,
            LearningAnalytics.date == today,
        ).first()

        if record is None:
            record = LearningAnalytics(
                user_id=user_id,
                date=today,
                metrics={"events": [event], "totalMinutes": event["minutes"]},
                created_at=now,
            )
            db.add(record)
        else:
            metrics = dict(record.metrics or {})
            events = list(metrics.get("events") or [])
            events.append(event)
            metrics["events"] = events
            metrics["totalMinutes"] = _minutes_from_metrics(metrics)
            record.metrics = metrics

        return {
            "code": 200,
            "msg": "学习行为已记录",
            "data": {"date": today.isoformat(), "activity": activity},
        }


def _month_start(d: date) -> date:
    return date(d.year, d.month, 1)


def _add_months(d: date, delta: int) -> date:
    """月份加减，返回目标月 1 号。"""
    zero_based = d.month - 1 + delta
    year = d.year + zero_based // 12
    month = zero_based % 12 + 1
    return date(year, month, 1)


def get_activity(
    token: str,
    weeks: int = 12,
    end_date: date | None = None,
    months: int | None = None,
) -> dict:
    """GET /api/analytics/activity — 学习活跃热力图数据。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    today = datetime.now().date()
    end_date = end_date or today
    if end_date > today:
        end_date = today

    if months is not None:
        months = max(1, min(int(months), 36))
        start_date = _add_months(_month_start(end_date), -(months - 1))
    else:
        weeks = max(1, min(int(weeks or 12), 52))
        total_days = weeks * 7
        start_date = end_date - timedelta(days=total_days - 1)

    total_days = (end_date - start_date).days + 1

    with get_db() as db:
        records = db.query(LearningAnalytics).filter(
            LearningAnalytics.user_id == user_id,
            LearningAnalytics.date >= start_date,
            LearningAnalytics.date <= end_date,
        ).all()

        by_date = {r.date.isoformat(): r for r in records}
        backfill = _backfill_minutes_by_date(db, user_id, start_date, end_date)
        grid: list[dict[str, Any]] = []
        for offset in range(total_days):
            day = start_date + timedelta(days=offset)
            date_str = day.isoformat()
            rec = by_date.get(date_str)
            minutes = _minutes_from_metrics(rec.metrics if rec else None)
            if minutes <= 0:
                minutes = backfill.get(date_str, 0)
            grid.append({
                "date": date_str,
                "level": _level_from_minutes(minutes),
                "minutes": minutes,
            })

        return {
            "code": 200,
            "msg": "获取活跃数据成功",
            "data": {
                "activityGrid": grid,
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
            },
        }
