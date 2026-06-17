from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.profile_service import (
    get_profile,
    update_profile,
    patch_profile,
    get_dimensions,
)

router = APIRouter(tags=["画像管理"])


class UpdateProfileBody(BaseModel):
    name: str | None = None
    major: str | None = None
    goal: str | None = None
    level: str | None = None
    healthScore: int | None = None
    progress: int | None = None
    cognitiveStyle: list[str] | None = None
    weakPoints: list[dict] | None = None
    learnerDimensions: list[dict] | None = None
    dimensions: list[dict] | None = None
    rhythm: dict | None = None
    goalProgress: dict | None = None


class PatchProfileBody(BaseModel):
    note: str


@router.get("/api/profile")
def handle_get_profile(authorization: str | None = Header(default=None)):
    return get_profile(authorization or "")


@router.put("/api/profile")
def handle_update_profile(
    body: UpdateProfileBody,
    authorization: str | None = Header(default=None),
):
    updates = body.model_dump(exclude_unset=True)
    return update_profile(authorization or "", updates)


@router.post("/api/profile/patch")
def handle_patch_profile(
    body: PatchProfileBody,
    authorization: str | None = Header(default=None),
):
    return patch_profile(authorization or "", body.note)


@router.get("/api/profile/dimensions")
def handle_get_dimensions(authorization: str | None = Header(default=None)):
    return get_dimensions(authorization or "")
