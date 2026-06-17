"""
Redis 连接管理，与 agent-service / user-service 共用同一 Redis。
"""

from __future__ import annotations

import redis.asyncio as aioredis
from redis import Redis

from config import get_settings

settings = get_settings()

_redis_client: Redis | None = None
_async_redis: aioredis.Redis | None = None

# user-service 的 token 前缀（用于 token 解析）
_ACCESS_PREFIX = "user-service:access:"


def init_redis() -> None:
    """同步初始化（FastAPI startup 时调用）。"""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=True,
                socket_connect_timeout=3,
            )
            _redis_client.ping()
        except Exception as e:
            print(f"[WARN] Redis 连接失败（降级运行）: {e}")
            _redis_client = None


def get_redis_client() -> Redis | None:
    return _redis_client


def is_redis_available() -> bool:
    return _redis_client is not None


# ── Token 解析（复用 user-service 的存储） ──

def resolve_user_id_from_token(token: str) -> int | None:
    """从 Redis 查找 access_token 对应的 user_id。"""
    if not token or not _redis_client:
        return None
    try:
        val = _redis_client.get(f"{_ACCESS_PREFIX}{token}")
        if val is not None:
            return int(val)
    except (TypeError, ValueError, Exception):
        pass
    return None


async def get_async_redis() -> aioredis.Redis:
    """异步 Redis 客户端（供需要 async 的场景）。"""
    global _async_redis
    if _async_redis is None:
        _async_redis = aioredis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True,
        )
    return _async_redis
