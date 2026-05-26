from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from api.unlogin import router as unlogin_router
from services.logger import capture_exception


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)

# 未登录用户对话接口
app.include_router(unlogin_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局未捕获异常处理器。"""
    session_id = request.headers.get("x-session-id", None)
    await capture_exception(
        exc,
        session_id=session_id,
        context=f"{request.method} {request.url.path}",
    )
    return JSONResponse(
        status_code=500,
        content={"code": 500, "msg": "服务器内部错误，请稍后再试", "data": None},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8003)