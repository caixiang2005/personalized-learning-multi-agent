"""
Redis 工具 — Token 解析与同步连接管理
"""

from __future__ import annotations

import os

from redis import Redis

_redis_client: Redis | None = None
_ACCESS_PREFIX = "user-service:access:"


def _get_sync_client() -> Redis | None:
    """获取同步 Redis 客户端（惰性初始化）。"""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = Redis(
                host=os.getenv("REDIS_HOST", "8.153.204.117"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                db=int(os.getenv("REDIS_DB", "0")),
                decode_responses=True,
                socket_connect_timeout=3,
            )
            _redis_client.ping()
        except Exception as e:
            print(f"[WARN] Redis 连接失败（降级运行）: {e}")
            _redis_client = None
    return _redis_client


def resolve_user_id_from_token(token: str) -> int | None:
    """从 Redis 查找 access_token 对应的 user_id。

    与 user-service / learn-service 共用同一 Redis 和 key 前缀。
    """
    if not token:
        return None
    client = _get_sync_client()
    if client is None:
        return None
    try:
        val = client.get(f"{_ACCESS_PREFIX}{token}")
        if val is not None:
            return int(val)
    except (TypeError, ValueError, Exception):
        pass
    return None
