"""
学习路径业务逻辑：路径 CRUD + 资源状态更新。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from utils.database import LearningPath, get_db
from utils.redis import resolve_user_id_from_token


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def _path_to_dict(path: LearningPath) -> dict[str, Any]:
    return {
        "id": str(path.id),
        "title": path.title or "",
        "course": path.course or "",
        "description": path.description or "",
        "stages": path.stages or [],
        "status": path.status,
        "overallProgress": path.overall_progress or 0,
        "source": path.source or "路径智能体规划",
        "generatedAt": path.generated_at.isoformat() if path.generated_at else "",
    }


def get_learning_path(token: str) -> dict:
    """GET /api/learning-path — 获取当前用户学习路径。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    with get_db() as db:
        path = db.query(LearningPath).filter(
            LearningPath.user_id == user_id,
            LearningPath.status == "active",
        ).order_by(LearningPath.created_at.desc()).first()

        if path is None:
            return {
                "code": 200,
                "msg": "获取学习路径成功",
                "data": None,
            }

        return {
            "code": 200,
            "msg": "获取学习路径成功",
            "data": _path_to_dict(path),
        }


def update_resource_status(token: str, topic_id: str, resource_id: str, status: str) -> dict:
    """PUT /api/learning-path/resource-status — 更新资源学习状态。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    valid_statuses = {"todo", "learning", "done", "mastered", "favorite"}
    if status not in valid_statuses:
        return {"code": 400, "msg": f"无效状态，可选值: {', '.join(valid_statuses)}", "data": {}}

    with get_db() as db:
        path = db.query(LearningPath).filter(
            LearningPath.user_id == user_id,
            LearningPath.status == "active",
        ).order_by(LearningPath.created_at.desc()).first()

        if path is None or not path.stages:
            return {"code": 400, "msg": "暂无学习路径", "data": {}}

        updated = False
        for stage in (path.stages or []):
            if not isinstance(stage, dict):
                continue
            topics = stage.get("topics", [])
            if not isinstance(topics, list):
                continue
            for topic in topics:
                if not isinstance(topic, dict):
                    continue
                if topic.get("id") == topic_id:
                    resources = topic.get("resources", [])
                    if not isinstance(resources, list):
                        continue
                    for res in resources:
                        if not isinstance(res, dict):
                            continue
                        if res.get("id") == resource_id:
                            res["status"] = status
                            updated = True
                            break

        if not updated:
            return {"code": 404, "msg": "未找到指定资源", "data": {}}

        # 重新计算整体进度
        total = 0
        done = 0
        for stage in (path.stages or []):
            if not isinstance(stage, dict):
                continue
            for topic in (stage.get("topics") or []):
                if not isinstance(topic, dict):
                    continue
                for res in (topic.get("resources") or []):
                    if not isinstance(res, dict):
                        continue
                    total += 1
                    if res.get("status") in ("done", "mastered"):
                        done += 1
        path.overall_progress = int(done / total * 100) if total > 0 else 0
        path.updated_at = datetime.now()

        return {
            "code": 200,
            "msg": "资源状态更新成功",
            "data": _path_to_dict(path),
        }


def generate_learning_path(token: str, course: str, goal: str) -> dict:
    """POST /api/learning-path/generate — 创建/重新生成学习路径。

    注意：此处仅创建空路径骨架，具体路径内容由 path-plan Agent 填充。
    """
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    now = datetime.now()

    with get_db() as db:
        # 归档旧路径
        db.query(LearningPath).filter(
            LearningPath.user_id == user_id,
            LearningPath.status == "active",
        ).update({"status": "archived", "updated_at": now})

        new_path = LearningPath(
            user_id=user_id,
            title=f"{course} 学习路径",
            course=course,
            description=f"目标: {goal}",
            stages=[],
            status="active",
            overall_progress=0,
            source="路径智能体规划",
            generated_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(new_path)
        db.flush()

        return {
            "code": 200,
            "msg": "学习路径已创建",
            "data": _path_to_dict(new_path),
        }
