import logging
import traceback
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select

from utils.database import ErrorLog, get_db

SERVICE_NAME = "user-service"
BEIJING_TZ = timezone(timedelta(hours=8))

logger = logging.getLogger(SERVICE_NAME)


def _beijing_now() -> datetime:
    return datetime.now(BEIJING_TZ).replace(tzinfo=None)


def _error_payload(row: ErrorLog) -> dict[str, Any]:
    return {
        "id": row.id,
        "service": row.service,
        "sessionId": row.session_id,
        "errorType": row.error_type,
        "message": row.message,
        "detail": row.detail,
        "createdAt": row.created_at.isoformat(sep=" ", timespec="seconds") if row.created_at else None,
        "isSent": row.is_sent,
        "sentTime": row.sent_time.isoformat(sep=" ", timespec="seconds") if row.sent_time else None,
    }


def log_api_response(
    code: int,
    msg: str,
    context: str,
    session_id: str | None = None,
    detail: str | None = None,
) -> int | None:
    """记录 API 业务错误（code != 200）。"""
    if code == 200:
        return None
    return log_error(
        error_type=f"ApiError{code}",
        message=f"[{context}] {msg}",
        session_id=session_id,
        detail=detail,
    )


def log_error(
    error_type: str,
    message: str,
    session_id: str | None = None,
    detail: str | None = None,
    service: str = SERVICE_NAME,
) -> int | None:
    """写入 error_logs（is_sent=false，供 n8n 拉取推送）。"""
    logger.error("[%s] %s | session=%s", error_type, message, session_id or "-")

    try:
        with get_db() as db:
            row = ErrorLog(
                service=service,
                session_id=session_id,
                error_type=error_type,
                message=message,
                detail=detail,
                created_at=_beijing_now(),
                is_sent=False,
            )
            db.add(row)
            db.flush()
            return row.id
    except Exception as exc:
        logger.error("写入 error_logs 失败: %s", exc)
        return None


def capture_exception(
    exc: Exception,
    session_id: str | None = None,
    context: str | None = None,
) -> int | None:
    """捕获异常并记录完整堆栈。"""
    detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    message = f"[{context}] {exc}" if context else str(exc)
    return log_error(
        error_type=type(exc).__name__,
        message=message,
        session_id=session_id,
        detail=detail,
    )


def get_unsent_errors(limit: int = 50, service: str = SERVICE_NAME) -> list[dict[str, Any]]:
    """查询未推送的错误日志，供 n8n 轮询。"""
    limit = max(1, min(limit, 200))
    with get_db() as db:
        stmt = (
            select(ErrorLog)
            .where(ErrorLog.service == service, ErrorLog.is_sent.is_(False))
            .order_by(ErrorLog.created_at.desc())
            .limit(limit)
        )
        rows = db.execute(stmt).scalars().all()
        return [_error_payload(row) for row in rows]


def mark_errors_sent(ids: list[int], service: str = SERVICE_NAME) -> int:
    """标记错误已推送，并写入 sent_time（北京时间）。"""
    if not ids:
        return 0

    now = _beijing_now()
    updated = 0
    with get_db() as db:
        for error_id in ids:
            row = db.get(ErrorLog, error_id)
            if row is None or row.service != service or row.is_sent:
                continue
            row.is_sent = True
            row.sent_time = now
            updated += 1
        db.flush()
    return updated
