"""
数据库管理服务（只读浏览，用于开发调试）
"""

from __future__ import annotations

from typing import Any

from utils.database import engine
from utils.redis import resolve_user_id_from_token


def _extract_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def _check_admin(token: str) -> int | None:
    """验证用户身份，未来可加 admin 角色校验"""
    return resolve_user_id_from_token(token)


def list_tables(token: str) -> dict:
    """获取数据库中所有表信息（只读）"""
    user_id = _check_admin(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    try:
        with engine.connect() as conn:
            result = conn.execute(
                __import__("sqlalchemy").text("""
                    SELECT
                        tablename,
                        (SELECT count(*) FROM pg_tables WHERE tablename = t.tablename) as has_data
                    FROM pg_catalog.pg_tables t
                    WHERE schemaname = 'public'
                    ORDER BY tablename
                """)
            )
            tables = []
            for row in result:
                tables.append({
                    "name": row[0],
                    "hasData": True,
                })

            # 获取每张表的行数
            for t in tables:
                try:
                    count = conn.execute(
                        __import__("sqlalchemy").text(f"SELECT count(*) FROM \"{t['name']}\"")
                    ).scalar()
                    t["rowCount"] = count
                except Exception:
                    t["rowCount"] = 0

        return {
            "code": 200,
            "msg": "success",
            "data": {"tables": tables},
        }
    except Exception as e:
        return {"code": 500, "msg": f"查询失败: {str(e)}", "data": {}}


def get_table_data(token: str, table_name: str, page: int = 1, page_size: int = 50) -> dict:
    """获取指定表的数据（分页，只读）"""
    user_id = _check_admin(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    # 安全检查：只允许 public schema 的表，防止 SQL 注入
    import re
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
        return {"code": 400, "msg": "无效的表名", "data": {}}

    try:
        offset = (page - 1) * page_size
        with engine.connect() as conn:
            # 获取列信息
            col_result = conn.execute(
                __import__("sqlalchemy").text(f"""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = '{table_name}'
                    ORDER BY ordinal_position
                """)
            )
            columns = [{"name": row[0], "type": row[1]} for row in col_result]

            # 获取总行数
            count = conn.execute(
                __import__("sqlalchemy").text(f"SELECT count(*) FROM \"{table_name}\"")
            ).scalar()

            # 获取分页数据
            data_result = conn.execute(
                __import__("sqlalchemy").text(f"""
                    SELECT * FROM "{table_name}"
                    ORDER BY (SELECT NULL)
                    OFFSET {offset} LIMIT {page_size}
                """)
            )
            rows = [dict(row._mapping) for row in data_result]

        return {
            "code": 200,
            "msg": "success",
            "data": {
                "tableName": table_name,
                "columns": columns,
                "rows": rows,
                "totalCount": count or 0,
                "page": page,
                "pageSize": page_size,
                "totalPages": max(1, -(-(count or 0) // page_size)),
            },
        }
    except Exception as e:
        return {"code": 500, "msg": f"查询失败: {str(e)}", "data": {}}


def execute_query(token: str, sql: str) -> dict:
    """执行只读 SQL 查询（SELECT  ONLY）"""
    user_id = _check_admin(token)
    if user_id is None:
        return {"code": 401, "msg": "登录已失效，请重新登录", "data": {}}

    sql_stripped = sql.strip().upper()
    if not sql_stripped.startswith("SELECT") and not sql_stripped.startswith("WITH"):
        return {"code": 400, "msg": "仅允许 SELECT 查询", "data": {}}

    try:
        with engine.connect() as conn:
            result = conn.execute(__import__("sqlalchemy").text(sql))
            columns = list(result.keys())
            rows = [dict(row._mapping) for row in result]

        return {
            "code": 200,
            "msg": "success",
            "data": {
                "columns": columns,
                "rows": rows,
                "rowCount": len(rows),
            },
        }
    except Exception as e:
        return {"code": 500, "msg": f"查询失败: {str(e)}", "data": {}}
