from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.daily_plan_service import get_daily_plan, toggle_task

router = APIRouter(tags=["每日计划"])


class ToggleTaskBody(BaseModel):
    done: bool


@router.get("/api/plan/daily")
def handle_get_daily_plan(authorization: str | None = Header(default=None)):
    return get_daily_plan(authorization or "")


@router.post("/api/plan/tasks/{task_id}/toggle")
def handle_toggle_task(
    task_id: str,
    body: ToggleTaskBody,
    authorization: str | None = Header(default=None),
):
    return toggle_task(authorization or "", task_id, body.done)
