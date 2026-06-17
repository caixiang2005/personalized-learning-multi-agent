from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.path_service import (
    get_learning_path,
    update_resource_status,
    generate_learning_path,
)

router = APIRouter(tags=["学习路径"])


class ResourceStatusBody(BaseModel):
    topicId: str
    resourceId: str
    status: str  # todo / learning / done / mastered / favorite


class GeneratePathBody(BaseModel):
    course: str
    goal: str


@router.get("/api/learning-path")
def handle_get_learning_path(authorization: str | None = Header(default=None)):
    return get_learning_path(authorization or "")


@router.put("/api/learning-path/resource-status")
def handle_update_resource_status(
    body: ResourceStatusBody,
    authorization: str | None = Header(default=None),
):
    return update_resource_status(
        authorization or "",
        body.topicId,
        body.resourceId,
        body.status,
    )


@router.post("/api/learning-path/generate")
def handle_generate_learning_path(
    body: GeneratePathBody,
    authorization: str | None = Header(default=None),
):
    return generate_learning_path(authorization or "", body.course, body.goal)
