from fastapi import APIRouter, Header, Query

from services.analytics_service import (
    get_overview,
    get_weak_points,
    get_suggestions,
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
