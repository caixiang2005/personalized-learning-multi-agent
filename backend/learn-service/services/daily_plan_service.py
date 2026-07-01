"""
每日计划业务逻辑：生成、获取、任务切换。
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from utils.database import DailyPlan, LearnerProfile, get_db
from utils.redis import resolve_user_id_from_token
from services.analytics_activity_service import record_learning_activity


def _extract_token(token: str | None) -> str:
    if not token:
        return ""
    parts = token.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return token.strip()


def get_daily_plan(token: str) -> dict:
    """GET /api/plan/daily — 获取当日学习计划。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    today = date.today()

    with get_db() as db:
        # 1. 检查是否已有今日计划
        existing = db.query(DailyPlan).filter(
            DailyPlan.user_id == user_id,
            DailyPlan.plan_date == today,
        ).first()

        if existing is not None:
            return {
                "code": 200,
                "msg": "获取每日计划成功",
                "data": _plan_to_dict(existing),
            }

        # 2. 获取用户画像
        profile = db.query(LearnerProfile).filter(
            LearnerProfile.user_id == user_id
        ).first()

        # 3. 生成新计划
        weak_points = (profile.weak_points or []) if profile else []
        learner_dimensions = (profile.learner_dimensions or []) if profile else []
        overall_progress = profile.progress if profile else 0

        # 生成问候语
        greeting = _generate_greeting(profile.name if profile else "")

        # 从薄弱点生成 knowledge push
        knowledge_push = _generate_knowledge_push(weak_points)

        # 从画像维度 / 薄弱点生成任务
        tasks = _generate_tasks(weak_points, learner_dimensions)

        # 生成总结
        summary = _generate_summary(weak_points, len(tasks))

        now = datetime.now()
        plan = DailyPlan(
            user_id=user_id,
            plan_date=today,
            greeting=greeting,
            summary=summary,
            overall_progress=overall_progress,
            tasks=tasks,
            knowledge_push=knowledge_push,
            created_at=now,
            updated_at=now,
        )
        db.add(plan)
        db.flush()

        return {
            "code": 200,
            "msg": "每日计划已生成",
            "data": _plan_to_dict(plan),
        }


def toggle_task(token: str, task_id: str, done: bool) -> dict:
    """POST /api/plan/tasks/{task_id}/toggle — 切换任务完成状态。"""
    user_id = resolve_user_id_from_token(_extract_token(token))
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    today = date.today()

    with get_db() as db:
        plan = db.query(DailyPlan).filter(
            DailyPlan.user_id == user_id,
            DailyPlan.plan_date == today,
        ).first()

        if plan is None:
            return {"code": 404, "msg": "今日计划不存在", "data": {}}

        tasks = plan.tasks or []
        found = False
        for task in tasks:
            if isinstance(task, dict) and task.get("id") == task_id:
                task["done"] = done
                task["progress"] = 100 if done else 0
                found = True
                break

        if not found:
            return {"code": 404, "msg": "任务不存在", "data": {}}

        if done:
            task_type = next(
                (str(t.get("type") or "") for t in tasks if isinstance(t, dict) and t.get("id") == task_id),
                "",
            )
            activity_map = {"chat": "chat", "exercise": "exercise", "learn": "profile_patch"}
            record_learning_activity(db, user_id, activity_map.get(task_type, "profile_patch"))

        # 重新计算 overall_progress
        done_count = sum(1 for t in tasks if isinstance(t, dict) and t.get("done"))
        total = len(tasks)
        plan.overall_progress = int((done_count / total) * 100) if total > 0 else 0
        plan.tasks = tasks
        plan.updated_at = datetime.now()

        db.flush()

        return {
            "code": 200,
            "msg": "任务状态已更新",
            "data": _plan_to_dict(plan),
        }


# ── 内部辅助 ──


def _plan_to_dict(plan: DailyPlan) -> dict[str, Any]:
    """将 ORM 模型转为前端 JSON。"""
    return {
        "id": plan.id,
        "date": plan.plan_date.isoformat(),
        "greeting": plan.greeting or "",
        "summary": plan.summary or "",
        "overallProgress": plan.overall_progress or 0,
        "knowledgePush": plan.knowledge_push or [],
        "tasks": plan.tasks or [],
    }


def _generate_greeting(name: str) -> str:
    """根据时段生成问候语。"""
    hour = datetime.now().hour
    if hour < 6:
        period = "夜深了"
    elif hour < 12:
        period = "早上好"
    elif hour < 14:
        period = "中午好"
    elif hour < 18:
        period = "下午好"
    else:
        period = "晚上好"

    if name:
        return f"{period}，{name}！今天也要加油哦"
    return f"{period}！今天也要加油哦"


def _generate_knowledge_push(weak_points: list) -> list[dict]:
    """从薄弱点生成当日知识点推送。"""
    if not weak_points:
        return [
            {
                "id": "kp-default",
                "title": "今日推荐",
                "content": "继续保持当前学习节奏，巩固已有知识。",
                "category": "general",
            }
        ]

    pushes = []
    for i, wp in enumerate(weak_points):
        if isinstance(wp, str):
            title = wp
            content = f"今日重点攻克：{wp}"
            category = "weak_point"
        elif isinstance(wp, dict):
            title = wp.get("name") or wp.get("key") or wp.get("topic", "")
            content = wp.get("description") or f"今日重点攻克：{title}"
            category = wp.get("category", "weak_point")
        else:
            continue

        pushes.append({
            "id": f"kp-{i}",
            "title": title,
            "content": content,
            "desc": content,
            "category": category,
            "tag": category,
        })

    return pushes


def _generate_tasks(weak_points: list, learner_dimensions: list) -> list[dict]:
    """从画像维度 / 薄弱点生成学习任务（learn / chat / exercise 三种类型）。"""
    tasks = []

    # 维度标签中文映射
    dim_labels = {
        "knowledge": "知识掌握",
        "exercises": "习题完成",
        "focus": "专注度",
        "weakpoints": "薄弱点改善",
        "efficiency": "学习效率",
        "trend": "提升趋势",
    }

    # 1. 从薄弱点生成 learn 类型任务（最多 3 个）
    if weak_points:
        for i, wp in enumerate(weak_points[:3]):
            if isinstance(wp, str):
                title = f"学习：{wp}"
                desc = f"集中精力学习知识点「{wp}」，掌握核心概念"
            elif isinstance(wp, dict):
                name = wp.get("name") or wp.get("key") or wp.get("topic", "")
                title = f"学习：{name}"
                desc = wp.get("description") or f"集中精力学习知识点「{name}」"
            else:
                continue

            priority = _calc_priority_from_dimensions(learner_dimensions, "knowledge")
            tasks.append({
                "id": f"task-learn-{i}",
                "type": "learn",
                "title": title,
                "description": desc,
                "topic": title.replace("学习：", ""),
                "durationMin": 25,
                "priority": priority,
                "done": False,
                "progress": 0,
            })

    # 2. 从 learner_dimensions 生成 exercise / chat 类型任务
    dim_score_map: dict[str, float] = {}
    for dim in learner_dimensions:
        if isinstance(dim, dict):
            key = dim.get("key", "")
            score = dim.get("value", dim.get("score", 50))
            dim_score_map[key] = float(score)

    # knowledge 维度分数低 → exercise 任务
    knowledge_score = dim_score_map.get("knowledge", 50)
    if knowledge_score < 60:
        tasks.append({
            "id": "task-exercise-knowledge",
            "type": "exercise",
            "title": "练习：知识巩固",
            "description": "完成相关练习题，巩固所学知识",
            "topic": "知识巩固",
            "durationMin": 30,
            "priority": _calc_score_priority(knowledge_score),
            "done": False,
            "progress": 0,
        })

    # weakpoints 维度分数低 → chat 任务（薄弱点答疑）
    wp_score = dim_score_map.get("weakpoints", 50)
    if wp_score < 60:
        tasks.append({
            "id": "task-chat-weakpoints",
            "type": "chat",
            "title": "对话：薄弱点答疑",
            "description": "与 AI 助教对话，解答薄弱点相关疑问",
            "topic": "薄弱点答疑",
            "durationMin": 15,
            "priority": _calc_score_priority(wp_score),
            "done": False,
            "progress": 0,
        })

    # focus 维度分数低 → chat 任务（学习状态）
    focus_score = dim_score_map.get("focus", 50)
    if focus_score < 50:
        tasks.append({
            "id": "task-chat-focus",
            "type": "chat",
            "title": "对话：学习状态调整",
            "description": "与 AI 助教交流，获取专注力提升建议",
            "topic": "学习状态",
            "durationMin": 15,
            "priority": _calc_score_priority(focus_score),
            "done": False,
            "progress": 0,
        })

    # 如果没有生成任何任务，添加一组默认任务兜底
    if not tasks:
        tasks = [
            {
                "id": "task-learn-default",
                "type": "learn",
                "title": "学习：今日课程内容",
                "description": "回顾并学习今天的课程内容",
                "topic": "今日课程",
                "durationMin": 25,
                "priority": "high",
                "done": False,
                "progress": 0,
            },
            {
                "id": "task-exercise-default",
                "type": "exercise",
                "title": "练习：完成课后练习",
                "description": "完成相关练习题，检验学习效果",
                "topic": "课后练习",
                "durationMin": 30,
                "priority": "medium",
                "done": False,
                "progress": 0,
            },
            {
                "id": "task-chat-default",
                "type": "chat",
                "title": "对话：与 AI 助教交流",
                "description": "与 AI 助教讨论学习中遇到的问题",
                "topic": "学习答疑",
                "durationMin": 15,
                "priority": "medium",
                "done": False,
                "progress": 0,
            },
        ]

    return tasks


def _calc_priority_from_dimensions(learner_dimensions: list, target_key: str) -> str:
    """根据画像维度计算优先级。"""
    for dim in learner_dimensions:
        if isinstance(dim, dict) and dim.get("key") == target_key:
            score = float(dim.get("value", dim.get("score", 50)))
            return _calc_score_priority(score)
    return "medium"


def _calc_score_priority(score: float) -> str:
    """根据分数映射优先级：分数越低优先级越高。"""
    if score < 40:
        return "high"
    elif score < 70:
        return "medium"
    return "low"


def _generate_summary(weak_points: list, task_count: int) -> str:
    """生成每日总结说明。"""
    if not weak_points:
        return f"今日共 {task_count} 项任务，继续保持良好的学习节奏！"

    if isinstance(weak_points[0], str):
        focus = weak_points[0]
    elif isinstance(weak_points[0], dict):
        focus = (
            weak_points[0].get("name")
            or weak_points[0].get("key")
            or weak_points[0].get("topic", "")
        )
    else:
        focus = "薄弱点"

    return f"今日共 {task_count} 项任务，重点攻克「{focus}」。合理安排时间，循序渐进！"
