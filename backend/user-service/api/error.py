from fastapi import APIRouter, Query

from api.schemas import MarkSentBody
from error.logger import SERVICE_NAME, get_unsent_errors, mark_errors_sent

router = APIRouter(tags=["错误日志"])


@router.get("/api/error/unsent")
def list_unsent_errors(
    limit: int = Query(default=50, ge=1, le=200),
    service: str = Query(default=SERVICE_NAME, max_length=50),
):
    items = get_unsent_errors(limit=limit, service=service)
    return {"code": 200, "msg": "查询成功", "data": {"items": items, "count": len(items)}}


@router.post("/api/error/markSent")
def mark_sent(body: MarkSentBody):
    count = mark_errors_sent(body.ids, service=body.service)
    return {"code": 200, "msg": "已标记为已推送", "data": {"count": count}}
