from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.path_plan_service import (
    get_path_plan_reply,
    finalize_path_plan,
)
from utils.auth import resolve_user_from_auth

router = APIRouter()


class PathPlanRequest(BaseModel):
    user_input: str
    session_id: str


class FinalizeRequest(BaseModel):
    session_id: str


class PathPlanResponse(BaseModel):
    code: int
    msg: str
    data: dict | None = None


@router.post("/api/agent/path-plan", response_model=PathPlanResponse)
async def path_plan(
    request: PathPlanRequest,
    authorization: str | None = Header(default=None),
):
    """路径规划智能体 — 多轮对话收集偏好并生成学习路径"""
    if resolve_user_from_auth(authorization) is None:
        return PathPlanResponse(code=401, msg="登录已失效，请重新登录", data=None)
    reply = await get_path_plan_reply(
        user_input=request.user_input,
        session_id=request.session_id,
    )
    return PathPlanResponse(code=200, msg="success", data={"ai_reply": reply})


@router.post("/api/agent/path-plan/finalize", response_model=PathPlanResponse)
async def path_plan_finalize(
    request: FinalizeRequest,
    authorization: str | None = Header(default=None),
):
    """完成路径规划 — 生成结构化学习路径并持久化到 learn-service"""
    token = ""
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()

    result = await finalize_path_plan(
        session_id=request.session_id,
        token=token or authorization or "",
    )
    return PathPlanResponse(
        code=result.get("code", 200),
        msg=result.get("msg", "success"),
        data=result.get("data"),
    )
