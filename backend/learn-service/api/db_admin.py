from fastapi import APIRouter, Header, Query
from pydantic import BaseModel

from services.db_admin_service import (
    list_tables,
    get_table_data,
    execute_query,
)

router = APIRouter(tags=["数据库管理"])


class QueryBody(BaseModel):
    sql: str


@router.get("/api/admin/db/tables")
def handle_list_tables(authorization: str | None = Header(default=None)):
    return list_tables(authorization or "")


@router.get("/api/admin/db/table/{table_name}")
def handle_get_table_data(
    table_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    authorization: str | None = Header(default=None),
):
    return get_table_data(authorization or "", table_name, page, page_size)


@router.post("/api/admin/db/query")
def handle_execute_query(
    body: QueryBody,
    authorization: str | None = Header(default=None),
):
    return execute_query(authorization or "", body.sql)
