import json
import os
from typing import Optional

import redis.asyncio as redis

_pool: Optional[redis.Redis] = None
_KEY_PREFIX = "unlogin:chat:"


def _key(session_id: str) -> str:
    return f"{_KEY_PREFIX}{session_id}"


async def _get_conn() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.Redis(
            host=os.getenv("REDIS_HOST", "8.153.204.117"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=int(os.getenv("REDIS_DB", "0")),
            decode_responses=True,
        )
    return _pool


async def load_history(session_id: str) -> list:
    try:
        r = await _get_conn()
        data = await r.get(_key(session_id))
        return json.loads(data) if data else []
    except Exception:
        return []


async def save_history(session_id: str, messages: list, ttl: int = 3600):
    try:
        r = await _get_conn()
        await r.setex(_key(session_id), ttl, json.dumps(messages))
    except Exception:
        pass
