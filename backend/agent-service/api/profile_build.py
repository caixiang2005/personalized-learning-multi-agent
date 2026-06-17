from fastapi import APIRouter, Header
from pydantic import BaseModel

from services.profile_build_service import (
    get_profile_build_reply,
    finalize_profile,
)

router = APIRouter()


class ProfileBuildRequest(BaseModel):
    user_input: str
    session_id: str


class FinalizeRequest(BaseModel):
    session_id: str


class ProfileBuildResponse(BaseModel):
    code: int
    msg: str
    data: dict | None = None


@router.post("/api/agent/profile-build", response_model=ProfileBuildResponse)
async def profile_build(request: ProfileBuildRequest):
    """画像构建智能体 — 多轮对话抽取学习特征"""
    reply = await get_profile_build_reply(
        user_input=request.user_input,
        session_id=request.session_id,
    )
    return ProfileBuildResponse(code=200, msg="success", data={"ai_reply": reply})


@router.post("/api/agent/profile-build/finalize", response_model=ProfileBuildResponse)
async def profile_build_finalize(
    request: FinalizeRequest,
    authorization: str | None = Header(default=None),
):
    """完成画像构建 — 生成六维画像并持久化到 learn-service"""
    token = ""
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()

    result = await finalize_profile(
        session_id=request.session_id,
        token=token or authorization or "",
    )
    return ProfileBuildResponse(
        code=result.get("code", 200),
        msg=result.get("msg", "success"),
        data=result.get("data"),
    )
