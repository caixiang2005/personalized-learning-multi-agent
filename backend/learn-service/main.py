"""
learn-service :8002 — 学习业务微服务
- 画像管理 (Learner Profile)
- 学习路径管理 (Learning Path)
- 资源 & 练习管理 (Resource / Exercise)
- 学习分析 (Analytics)
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.profile import router as profile_router
from api.path import router as path_router
from api.resource import router as resource_router
from api.analytics import router as analytics_router
from api.chat import router as chat_router
from api.db_admin import router as db_admin_router
from api.plan import router as plan_router
from api.safety import router as safety_router
from utils.database import init_db
from utils.redis import init_redis

app = FastAPI(title="学习微服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 注册路由 ──
app.include_router(profile_router)
app.include_router(path_router)
app.include_router(resource_router)
app.include_router(analytics_router)
app.include_router(chat_router)
app.include_router(plan_router)
app.include_router(safety_router)

# 数据库管理（开发调试）
app.include_router(db_admin_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"code": 422, "msg": "参数校验失败", "data": {}},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.status_code, "msg": str(exc.detail), "data": {}},
        )

    return JSONResponse(
        status_code=500,
        content={"code": 500, "msg": "服务器内部错误，请稍后再试", "data": {}},
    )


@app.on_event("startup")
def on_startup():
    init_db()
    init_redis()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=False)
