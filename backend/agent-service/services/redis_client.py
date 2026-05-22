import json
import os
from typing import Optional

import redis.asyncio as redis

REDIS_HOST = os.getenv("REDIS_HOST", "8.153.204.117")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

_pool: Optional[redis.Redis] = None
_KEY_PREFIX = "unlogin:chat:"  # 所有未登录会话以统一前缀存储


def _key(session_id: str) -> str:
    return f"{_KEY_PREFIX}{session_id}"


async def _get_conn() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.Redis(
            host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True
        )
    return _pool


async def load_history(session_id: str) -> list:
    r = await _get_conn()
    data = await r.get(_key(session_id))
    return json.loads(data) if data else []


async def save_history(session_id: str, messages: list, ttl: int = 3600):
    r = await _get_conn()
    await r.setex(_key(session_id), ttl, json.dumps(messages))
