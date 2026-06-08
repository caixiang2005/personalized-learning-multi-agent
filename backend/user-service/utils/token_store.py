from utils.redis import get_redis_client, is_redis_available

_ACCESS_PREFIX = "user-service:access:"
_REFRESH_PREFIX = "user-service:refresh:"
_ACCESS_TTL = 7 * 24 * 3600  # 7 天
_REFRESH_TTL = 30 * 24 * 3600  # 30 天

# Redis 不可用时降级到进程内存
_ACCESS_TOKENS: dict[str, int] = {}
_REFRESH_TOKENS: dict[str, int] = {}


def _redis_get(key: str) -> int | None:
    client = get_redis_client()
    if client is None:
        return None
    try:
        value = client.get(key)
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _redis_set(key: str, user_id: int, ttl: int) -> None:
    client = get_redis_client()
    if client is None:
        return
    client.setex(key, ttl, str(user_id))


def _redis_delete(key: str) -> None:
    client = get_redis_client()
    if client is None:
        return
    client.delete(key)


def store_access_token(token: str, user_id: int) -> None:
    if is_redis_available():
        _redis_set(f"{_ACCESS_PREFIX}{token}", user_id, _ACCESS_TTL)
    else:
        _ACCESS_TOKENS[token] = user_id


def store_refresh_token(token: str, user_id: int) -> None:
    if is_redis_available():
        _redis_set(f"{_REFRESH_PREFIX}{token}", user_id, _REFRESH_TTL)
    else:
        _REFRESH_TOKENS[token] = user_id


def resolve_access_token(token: str) -> int | None:
    if not token:
        return None
    if is_redis_available():
        user_id = _redis_get(f"{_ACCESS_PREFIX}{token}")
        if user_id is not None:
            return user_id
    return _ACCESS_TOKENS.get(token)


def resolve_refresh_token(token: str) -> int | None:
    if not token:
        return None
    if is_redis_available():
        user_id = _redis_get(f"{_REFRESH_PREFIX}{token}")
        if user_id is not None:
            return user_id
    return _REFRESH_TOKENS.get(token)


def revoke_access_token(token: str | None) -> None:
    if not token:
        return
    if is_redis_available():
        _redis_delete(f"{_ACCESS_PREFIX}{token}")
    _ACCESS_TOKENS.pop(token, None)


def revoke_refresh_token(token: str | None) -> None:
    if not token:
        return
    if is_redis_available():
        _redis_delete(f"{_REFRESH_PREFIX}{token}")
    _REFRESH_TOKENS.pop(token, None)


def token_storage_mode() -> str:
    return "redis" if is_redis_available() else "memory"
