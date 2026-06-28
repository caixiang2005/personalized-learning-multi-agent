from fastapi import APIRouter, File, Header, UploadFile

from api.schemas import UpdateProfileBody
from utils.user_info import get_user_profile, update_user_profile, upload_user_avatar
from utils.user_stats import get_user_stats

router = APIRouter(tags=["个人信息"])


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


@router.get("/api/user/getProfile")
def get_profile(authorization: str | None = Header(default=None)):
    return get_user_profile(_extract_token(authorization))


@router.get("/api/user/stats")
def get_stats(authorization: str | None = Header(default=None)):
    return get_user_stats(_extract_token(authorization))


@router.post("/api/user/updateProfile")
def update_profile(body: UpdateProfileBody, authorization: str | None = Header(default=None)):
    updates = body.model_dump(exclude_unset=True, by_alias=True)
    return update_user_profile(_extract_token(authorization), updates)


@router.post("/api/user/uploadAvatar")
async def upload_avatar(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    data = await file.read()
    return upload_user_avatar(_extract_token(authorization), file.content_type or "", data)
