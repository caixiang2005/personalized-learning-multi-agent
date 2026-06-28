"""
用户学习统计：聚合 learner_profiles / learning_paths / chat_sessions。
"""

from __future__ import annotations

from sqlalchemy import text

from utils.database import get_db
from utils.user_login import resolve_user_id_from_token


def get_user_stats(token: str) -> dict:
    """GET /api/user/stats — 四指标汇总。"""
    user_id = resolve_user_id_from_token(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        profile_row = db.execute(
            text(
                "SELECT health_score, goal_progress FROM learner_profiles "
                "WHERE user_id = :uid LIMIT 1"
            ),
            {"uid": user_id},
        ).mappings().first()

        path_row = db.execute(
            text(
                "SELECT overall_progress FROM learning_paths "
                "WHERE user_id = :uid AND status = 'active' "
                "ORDER BY created_at DESC LIMIT 1"
            ),
            {"uid": user_id},
        ).mappings().first()

        session_count = db.execute(
            text("SELECT COUNT(*) FROM chat_sessions WHERE user_id = :uid"),
            {"uid": user_id},
        ).scalar() or 0

        health_score = int(profile_row["health_score"] or 0) if profile_row else 0
        goal_progress = 0
        if profile_row and profile_row.get("goal_progress"):
            gp = profile_row["goal_progress"]
            if isinstance(gp, dict):
                goal_progress = int(gp.get("percent") or 0)

        path_progress = int(path_row["overall_progress"] or 0) if path_row else 0

        return {
            "code": 200,
            "msg": "获取统计成功",
            "data": {
                "healthScore": health_score,
                "goalProgress": goal_progress,
                "pathProgress": path_progress,
                "sessionCount": int(session_count),
            },
        }
