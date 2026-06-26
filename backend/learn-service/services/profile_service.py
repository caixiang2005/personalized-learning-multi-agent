"""
画像业务逻辑：CRUD + 维度计算 + 更新。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from utils.database import LearnerProfile, get_db
from utils.redis import resolve_user_id_from_token

# 六维画像标签映射
DIMENSION_LABELS: dict[str, str] = {
    "knowledge": "知识掌握",
    "exercises": "习题完成",
    "focus": "专注度",
    "weakpoints": "薄弱点改善",
    "efficiency": "学习效率",
    "trend": "提升趋势",
}


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def _profile_to_dict(profile: LearnerProfile) -> dict[str, Any]:
    """将 ORM 模型转为前端期望的 JSON 结构。"""
    learner_dimensions = profile.learner_dimensions or []
    # 补齐六维标签
    for dim in learner_dimensions:
        if isinstance(dim, dict) and dim.get("key") in DIMENSION_LABELS:
            dim["label"] = DIMENSION_LABELS[dim["key"]]

    return {
        "name": profile.name or "",
        "major": profile.major or "",
        "goal": profile.goal or "",
        "level": profile.level or "",
        "updatedAt": profile.updated_at.isoformat() if profile.updated_at else "",
        "healthScore": profile.health_score or 0,
        "dimensions": learner_dimensions,
        "learnerDimensions": learner_dimensions,
        "cognitiveStyle": profile.cognitive_style or [],
        "weakPoints": profile.weak_points or [],
        "progress": profile.progress or 0,
        "rhythm": profile.rhythm or {"period": "", "duration": ""},
        "goalProgress": profile.goal_progress or {"label": "", "percent": 0},
    }


def _default_profile_dict(user_id: int, name: str = "") -> dict[str, Any]:
    """空画像默认结构。"""
    now = datetime.now().isoformat()
    return {
        "name": name,
        "major": "",
        "goal": "",
        "level": "",
        "updatedAt": now,
        "healthScore": 0,
        "dimensions": [],
        "learnerDimensions": [],
        "cognitiveStyle": [],
        "weakPoints": [],
        "progress": 0,
        "rhythm": {"period": "", "duration": ""},
        "goalProgress": {"label": "", "percent": 0},
    }


def get_profile(token: str) -> dict:
    """GET /api/profile — 获取当前用户画像。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        if profile is None:
            return {
                "code": 200,
                "msg": "获取画像成功",
                "data": _default_profile_dict(user_id),
            }

        return {
            "code": 200,
            "msg": "获取画像成功",
            "data": _profile_to_dict(profile),
        }


def update_profile(token: str, updates: dict[str, Any]) -> dict:
    """PUT /api/profile — 更新画像字段（部分更新）。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    if not updates:
        return {"code": 400, "msg": "未提供更新字段", "data": {}}

    field_map = {
        "name": "name",
        "major": "major",
        "goal": "goal",
        "level": "level",
        "healthScore": "health_score",
        "progress": "progress",
        "cognitiveStyle": "cognitive_style",
        "weakPoints": "weak_points",
        "learnerDimensions": "learner_dimensions",
        "dimensions": "learner_dimensions",  # 兼容前端两种字段名
        "rhythm": "rhythm",
        "goalProgress": "goal_progress",
    }

    with get_db() as db:
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        now = datetime.now()

        if profile is None:
            # 首次创建
            profile = LearnerProfile(
                user_id=user_id,
                created_at=now,
                updated_at=now,
            )
            db.add(profile)
            db.flush()

        for front_key, db_key in field_map.items():
            if front_key in updates:
                setattr(profile, db_key, updates[front_key])

        profile.updated_at = now
        db.flush()

        return {
            "code": 200,
            "msg": "画像更新成功",
            "data": _profile_to_dict(profile),
        }


def patch_profile(token: str, note: str) -> dict:
    """POST /api/profile/patch — 用户补充学习状态，触发画像重算。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    if not note or not note.strip():
        return {"code": 400, "msg": "请描述你的学习状态", "data": {}}

    with get_db() as db:
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        now = datetime.now()

        if profile is None:
            profile = LearnerProfile(
                user_id=user_id,
                level=note.strip(),
                created_at=now,
                updated_at=now,
            )
            db.add(profile)
        else:
            # 追加学习记录
            existing = profile.level or ""
            profile.level = (
                f"{existing}\n[{now.strftime('%Y-%m-%d %H:%M')}] {note.strip()}"
                if existing
                else f"[{now.strftime('%Y-%m-%d %H:%M')}] {note.strip()}"
            )
            profile.updated_at = now

        db.flush()

        return {
            "code": 200,
            "msg": "学习状态已记录",
            "data": _profile_to_dict(profile),
        }


def get_dimensions(token: str) -> dict:
    """GET /api/profile/dimensions — 获取画像维度详情与健康度。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        if profile is None or not profile.learner_dimensions:
            return {
                "code": 200,
                "msg": "获取维度详情成功",
                "data": {
                    "healthScore": 0,
                    "dimensions": [],
                    "updatedAt": None,
                },
            }

        return {
            "code": 200,
            "msg": "获取维度详情成功",
            "data": {
                "healthScore": profile.health_score or 0,
                "dimensions": profile.learner_dimensions or [],
                "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
            },
        }
