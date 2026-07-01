"""Bearer Token 解析与登录校验（与 user-service / learn-service 共用 Redis）。"""

from __future__ import annotations

from utils.redis import resolve_user_id_from_token


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def resolve_user_from_auth(authorization: str | None) -> int | None:
    return resolve_user_id_from_token(extract_bearer_token(authorization))
