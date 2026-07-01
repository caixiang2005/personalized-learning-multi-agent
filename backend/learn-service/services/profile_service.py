"""
画像业务逻辑：CRUD + 维度计算 + 更新。
"""

from __future__ import annotations

import copy
import re
from datetime import datetime
from typing import Any

from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import text

from utils.database import LearnerProfile, get_db
from utils.redis import resolve_user_id_from_token
from services.analytics_activity_service import record_learning_activity

# 六维画像标签映射
DIMENSION_LABELS: dict[str, str] = {
    "knowledge": "知识掌握",
    "exercises": "习题完成",
    "focus": "专注度",
    "weakpoints": "薄弱点改善",
    "efficiency": "学习效率",
    "trend": "提升趋势",
}

DIMENSION_KEYS: tuple[str, ...] = tuple(DIMENSION_LABELS.keys())


def _value_to_level(value: int) -> str:
    if value < 55:
        return "weak"
    if value <= 74:
        return "medium"
    return "strong"


def _default_dimensions(base: int = 50) -> list[dict[str, Any]]:
    offsets = {
        "knowledge": 0,
        "exercises": -4,
        "focus": 2,
        "weakpoints": -8,
        "efficiency": -2,
        "trend": 5,
    }
    dims: list[dict[str, Any]] = []
    for key in DIMENSION_KEYS:
        value = min(92, max(30, base + offsets.get(key, 0)))
        dims.append(
            {
                "key": key,
                "label": DIMENSION_LABELS[key],
                "value": value,
                "level": _value_to_level(value),
                "source": "对话画像构建",
                "trendDelta": 2 if key == "trend" else 0,
            }
        )
    return dims


def _coerce_dim_value(dim: dict[str, Any], key: str) -> int:
    raw = dim.get("value")
    if raw is not None:
        try:
            return int(raw)
        except (TypeError, ValueError):
            pass
    for default in _default_dimensions():
        if default["key"] == key:
            return int(default["value"])
    return 50


def _normalize_dimensions(raw: list | None) -> list[dict[str, Any]]:
    if not raw:
        return _default_dimensions()
    by_key: dict[str, dict[str, Any]] = {}
    for item in raw:
        if isinstance(item, dict) and item.get("key") in DIMENSION_LABELS:
            key = item["key"]
            value = _coerce_dim_value(item, key)
            by_key[key] = {
                **copy.deepcopy(item),
                "key": key,
                "label": DIMENSION_LABELS[key],
                "value": value,
                "level": _value_to_level(value),
            }
    for default in _default_dimensions():
        by_key.setdefault(default["key"], default)
    return [by_key[key] for key in DIMENSION_KEYS]


def _parse_note_deltas(note: str) -> dict[str, int]:
    text = note.strip()
    deltas = {key: 0 for key in DIMENSION_KEYS}

    rate: int | None = None
    rate_match = re.search(r"正确率\s*(\d+)\s*%?", text)
    if rate_match:
        rate = int(rate_match.group(1))
    else:
        score_match = re.search(r"(\d+)\s*分", text)
        if score_match:
            rate = int(score_match.group(1))
        else:
            pct_match = re.search(r"(\d+)\s*%", text)
            if pct_match:
                rate = int(pct_match.group(1))

    if rate is not None:
        if rate >= 85:
            deltas["exercises"] += 5
            deltas["knowledge"] += 4
            deltas["trend"] += 3
            deltas["efficiency"] += 2
        elif rate >= 70:
            deltas["exercises"] += 3
            deltas["knowledge"] += 3
            deltas["trend"] += 2
        elif rate >= 50:
            deltas["exercises"] += 1
            deltas["knowledge"] += 1
            deltas["weakpoints"] += 2
        else:
            deltas["weakpoints"] += 3
            deltas["focus"] += 1

    if re.search(r"练习|习题|做题|刷题|题目|答卷", text):
        deltas["exercises"] += 3
    if re.search(r"完成|做完|提交", text):
        deltas["exercises"] += 2
        deltas["efficiency"] += 1
    if re.search(r"专注|沉浸|小时|分钟|学了", text):
        deltas["focus"] += 3
    if re.search(r"复习|掌握|理解|学会|搞懂", text):
        deltas["knowledge"] += 3
    if re.search(r"视频|文档|教程|资料", text):
        deltas["knowledge"] += 2
        deltas["efficiency"] += 1
    if re.search(r"薄弱|不会|困难|搞不定|错题", text):
        deltas["weakpoints"] += 2
        deltas["knowledge"] += 1

    if sum(deltas.values()) == 0:
        deltas["knowledge"] += 2
        deltas["trend"] += 2
        deltas["efficiency"] += 1

    return deltas


def _recalculate_dimensions_from_note(
    dimensions: list | None, note: str
) -> list[dict[str, Any]]:
    deltas = _parse_note_deltas(note)
    updated: list[dict[str, Any]] = []
    for dim in _normalize_dimensions(dimensions):
        key = dim["key"]
        delta = deltas.get(key, 0)
        new_value = min(100, max(0, int(dim.get("value", 50)) + delta))
        prev_trend = int(dim.get("trendDelta", 0) or 0)
        trend_bump = max(1, delta // 2) if delta > 0 else 0
        updated.append(
            {
                **dim,
                "key": key,
                "label": DIMENSION_LABELS[key],
                "value": new_value,
                "level": _value_to_level(new_value),
                "source": "用户手动更新 + 对话",
                "trendDelta": prev_trend + trend_bump,
            }
        )
    return updated


def _calc_health_score(dimensions: list[dict[str, Any]]) -> int:
    if not dimensions:
        return 0
    return round(sum(int(d.get("value", 0)) for d in dimensions) / len(dimensions))


def _extract_weak_point_names(
    questions: list[dict],
    answers: list[dict],
    ai_review: list[dict] | None = None,
    topic_id: str = "",
) -> list[str]:
    names: list[str] = []

    if ai_review:
        for item in ai_review:
            if not isinstance(item, dict) or item.get("isCorrect", True):
                continue
            name = (
                item.get("knowledgePoint")
                or item.get("mistakeReason")
                or item.get("title")
                or ""
            )
            clean = str(name).strip()
            if clean and clean not in names:
                names.append(clean[:80])
        if names:
            return names

    answer_by_qid: dict[str, dict] = {}
    for ans in answers:
        if isinstance(ans, dict):
            qid = str(ans.get("questionId") or ans.get("id") or "")
            if qid:
                answer_by_qid[qid] = ans

    for q in questions:
        if not isinstance(q, dict):
            continue
        qid = str(q.get("id") or "")
        ans = answer_by_qid.get(qid, {})
        correct = str(q.get("correctAnswer") or q.get("answer") or "").strip().lower()
        user = str(ans.get("answer") or ans.get("userAnswer") or "").strip().lower()
        if correct and user and correct == user:
            continue
        title = str(q.get("title") or q.get("knowledgePoint") or "").strip()
        if title and title not in names:
            names.append(title[:80])

    if not names and topic_id:
        names.append(str(topic_id).strip()[:80])
    return names


def _merge_weak_points(existing: list | None, new_names: list[str]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for item in existing or []:
        if isinstance(item, dict) and item.get("name"):
            counts[str(item["name"])] = int(item.get("count") or 0)
    for name in new_names:
        clean = name.strip()
        if not clean or clean == "待练习巩固":
            continue
        counts[clean] = counts.get(clean, 0) + 1
    return [
        {"name": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    ][:20]


def _recalculate_dimensions_from_exercise(
    dimensions: list | None,
    score: int,
    wrong_count: int,
) -> list[dict[str, Any]]:
    note = f"完成练习，正确率 {score}%"
    if wrong_count > 0:
        note += f"，错题 {wrong_count} 道"
    updated = _recalculate_dimensions_from_note(dimensions, note)
    for dim in updated:
        src = str(dim.get("source") or "")
        if "练习提交" not in src:
            dim["source"] = f"{src} · 练习提交".strip(" ·")
    return updated


def apply_exercise_to_profile(
    db,
    user_id: int,
    *,
    score: int,
    questions: list[dict],
    answers: list[dict],
    ai_review: list[dict] | None = None,
    topic_id: str = "",
) -> dict[str, Any] | None:
    """练习提交后回写薄弱点并重算六维画像。"""
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()
    if profile is None:
        return None

    weak_names = _extract_weak_point_names(questions, answers, ai_review, topic_id)
    profile.weak_points = _merge_weak_points(profile.weak_points, weak_names)

    wrong_count = len(weak_names)
    if wrong_count == 0 and questions:
        expected_wrong = max(0, len(questions) - round(len(questions) * score / 100))
        wrong_count = expected_wrong

    normalized = _normalize_dimensions(profile.learner_dimensions)
    profile.learner_dimensions = _recalculate_dimensions_from_exercise(
        normalized, score, wrong_count
    )
    profile.health_score = _calc_health_score(profile.learner_dimensions)
    profile.progress = min(100, (profile.progress or 0) + max(1, score // 25))
    profile.updated_at = datetime.now()

    flag_modified(profile, "learner_dimensions")
    flag_modified(profile, "weak_points")

    full = _profile_to_dict(profile)
    return {
        "weakPoints": full["weakPoints"],
        "healthScore": full["healthScore"],
        "learnerDimensions": full["learnerDimensions"],
        "dimensions": full["dimensions"],
        "progress": full["progress"],
        "updatedAt": full["updatedAt"],
    }


def _sync_user_info_fields(
    db,
    user_id: int,
    *,
    name: str | None = None,
    major: str | None = None,
) -> None:
    """将 learner_profiles 的姓名/专业同步到 user_info（同库）。"""
    if name is None and major is None:
        return
    db.execute(
        text(
            "UPDATE user_info SET "
            "nickname = COALESCE(:nickname, nickname), "
            "major = COALESCE(:major, major) "
            "WHERE user_id = :uid"
        ),
        {
            "uid": user_id,
            "nickname": name,
            "major": major,
        },
    )


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

        if "name" in updates or "major" in updates:
            _sync_user_info_fields(
                db,
                user_id,
                name=updates.get("name"),
                major=updates.get("major"),
            )

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
                level=f"[{now.strftime('%Y-%m-%d %H:%M')}] {note.strip()}",
                learner_dimensions=_default_dimensions(),
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

        note_text = note.strip()
        profile.learner_dimensions = _recalculate_dimensions_from_note(
            profile.learner_dimensions, note_text
        )
        profile.health_score = _calc_health_score(profile.learner_dimensions)
        profile.progress = min(100, (profile.progress or 0) + 3)
        flag_modified(profile, "learner_dimensions")

        record_learning_activity(db, user_id, "profile_patch")

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
