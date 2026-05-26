import logging
import traceback

from services.pg_client import get_pool

# 标准 Python 日志（输出到容器 stdout/stderr）
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agent-service")


async def log_error(
    error_type: str,
    message: str,
    session_id: str | None = None,
    detail: str | None = None,
):
    """记录错误到 PostgreSQL（供 n8n 拉取处理）和标准日志。"""
    # 1. 写标准日志（容器可采集）
    logger.error("[%s] %s | session=%s", error_type, message, session_id or "-")

    # 2. 写 PostgreSQL（供 n8n 轮询）
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO error_logs (service, session_id, error_type, message, detail)
                VALUES ($1, $2, $3, $4, $5)
                """,
                "agent-service",
                session_id,
                error_type,
                message,
                detail,
            )
    except Exception as e:
        # PostgreSQL 写失败时至少保留日志输出
        logger.error("写入错误日志到 PostgreSQL 失败: %s", e)


async def capture_exception(
    exc: Exception,
    session_id: str | None = None,
    context: str | None = None,
):
    """捕获异常并记录完整堆栈。"""
    detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    await log_error(
        error_type=type(exc).__name__,
        message=f"[{context}] {exc}" if context else str(exc),
        session_id=session_id,
        detail=detail,
    )
