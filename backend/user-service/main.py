import json
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from api.error import router as error_router
from api.user_info import router as user_info_router
from api.user_login import router as user_login_router
from error.logger import capture_exception, log_api_response
from utils.database import init_db

_SERVICE_ROOT = Path(__file__).resolve().parent

# 会话过期 401 属于正常用户行为，不写入 error_logs（避免飞书刷屏）
_SKIP_401_LOG_PATHS = frozenset({
    "/api/user/getUserInfo",
    "/api/user/getProfile",
    "/api/user/refreshToken",
    "/api/user/updateProfile",
    "/api/user/uploadAvatar",
})

app = FastAPI(title="用户微服务")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 所有 HTTP 接口在此统一注册（Docker / 生产环境入口：uvicorn main:app）
# 新增路由：在 api/ 下编写 router，再在此处 app.include_router(...)
# ---------------------------------------------------------------------------
app.include_router(user_login_router)
app.include_router(user_info_router)
app.include_router(error_router)

app.mount("/static", StaticFiles(directory=str(_SERVICE_ROOT / "static")), name="static")


def _session_id_from_request(request: Request) -> str | None:
    session_id = request.headers.get("x-session-id")
    if session_id:
        return session_id
    auth = request.headers.get("authorization", "")
    return auth[:255] if auth else None


@app.middleware("http")
async def log_api_errors_middleware(request: Request, call_next):
    """记录所有 code != 200 的 JSON 业务响应（HTTP 500 由全局异常处理器记录堆栈）。"""
    response = await call_next(request)
    context = f"{request.method} {request.url.path}"
    session_id = _session_id_from_request(request)

    content_type = response.headers.get("content-type", "")
    if "application/json" not in content_type:
        return response

    body = b""
    async for chunk in response.body_iterator:
        body += chunk

    try:
        payload = json.loads(body)
        if isinstance(payload, dict):
            code = payload.get("code")
            msg = payload.get("msg", "")
            if isinstance(code, int) and code != 200 and response.status_code != 500:
                if not (code == 401 and request.url.path in _SKIP_401_LOG_PATHS):
                    log_api_response(code, str(msg), context, session_id=session_id)
    except (json.JSONDecodeError, TypeError, AttributeError):
        pass

    headers = {k: v for k, v in response.headers.items() if k.lower() != "content-length"}
    return Response(content=body, status_code=response.status_code, headers=headers, media_type=response.media_type)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    session_id = _session_id_from_request(request)
    context = f"{request.method} {request.url.path}"
    log_api_response(
        422,
        "参数校验失败",
        context,
        session_id=session_id,
        detail=json.dumps(exc.errors(), ensure_ascii=False),
    )
    return JSONResponse(status_code=422, content={"code": 422, "msg": "参数校验失败", "data": {}})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    session_id = _session_id_from_request(request)
    context = f"{request.method} {request.url.path}"

    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.status_code, "msg": str(exc.detail), "data": {}},
        )

    capture_exception(exc, session_id=session_id, context=context)
    return JSONResponse(
        status_code=500,
        content={"code": 500, "msg": "服务器内部错误，请稍后再试", "data": {}},
    )


@app.on_event("startup")
def on_startup():
    import utils.redis as redis_module

    init_db()
    redis_module.init_redis()
    redis_module.redis_client = redis_module.get_redis_client()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
