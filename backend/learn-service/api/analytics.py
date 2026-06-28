from fastapi import APIRouter, Header, Query
from pydantic import BaseModel

from services.analytics_service import (
    get_overview,
    get_weak_points,
    get_suggestions,
    record_activity,
    get_activity,
)

router = APIRouter(tags=["学习分析"])


@router.get("/api/analytics/overview")
def handle_get_overview(
    range: str = Query("7", description="统计范围: 7/30/custom"),
    authorization: str | None = Header(default=None),
):
    range_days = 7
    if range == "30":
        range_days = 30
    elif range.isdigit():
        range_days = int(range)
    return get_overview(authorization or "", range_days)


@router.get("/api/analytics/weak-points")
def handle_get_weak_points(authorization: str | None = Header(default=None)):
    return get_weak_points(authorization or "")


@router.get("/api/analytics/suggestions")
def handle_get_suggestions(authorization: str | None = Header(default=None)):
    return get_suggestions(authorization or "")


class RecordActivityBody(BaseModel):
    activity: str
    minutes: int | None = None
    exerciseScore: int | None = None
    resourceStatus: str | None = None


@router.post("/api/analytics/record")
def handle_record_activity(
    body: RecordActivityBody,
    authorization: str | None = Header(default=None),
):
    return record_activity(
        authorization or "",
        body.activity,
        minutes=body.minutes or 0,
        exercise_score=body.exerciseScore,
        resource_status=body.resourceStatus,
    )


@router.get("/api/analytics/activity")
def handle_get_activity(
    weeks: int = Query(12, ge=1, le=52),
    authorization: str | None = Header(default=None),
):
    return get_activity(authorization or "", weeks)
