import logging

import redis
from redis.exceptions import ConnectionError, TimeoutError

from config import get_settings
from error.logger import log_error

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None
_initialized = False


def _create_redis_client() -> redis.Redis:
    settings = get_settings()
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        db=settings.redis_db,
        decode_responses=True,
        socket_connect_timeout=3,
    )


def init_redis() -> bool:
    """连接 Redis；成功返回 True，失败返回 False（服务仍可启动）。"""
    global _redis_client, _initialized
    try:
        client = _create_redis_client()
        client.ping()
        _redis_client = client
        _initialized = True
        msg = "Redis 连接成功"
        logger.info(msg)
        print(msg)
        return True
    except (ConnectionError, TimeoutError, OSError) as exc:
        _redis_client = None
        _initialized = True
        msg = "警告：Redis 连接失败，验证码功能将不可用"
        logger.warning("%s (%s)", msg, exc)
        print(msg)
        log_error(
            error_type="RedisConnectionError",
            message=msg,
            detail=str(exc),
        )
        return False


def get_redis_client() -> redis.Redis | None:
    """返回 Redis 客户端；未连接时返回 None。"""
    return _redis_client


def is_redis_available() -> bool:
    return _redis_client is not None


def ping_redis() -> bool:
    if _redis_client is None:
        return False
    try:
        return bool(_redis_client.ping())
    except (ConnectionError, TimeoutError, OSError):
        return False


def reset_redis() -> bool:
    """重新尝试连接（可用于测试或重连）。"""
    return init_redis()


redis_client: redis.Redis | None = None
