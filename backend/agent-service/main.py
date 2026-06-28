import asyncio
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from utils.hf_env import configure_hf_mirror

configure_hf_mirror()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from api.unlogin import router as unlogin_router
from api.chat import router as chat_router
from api.profile_build import router as profile_build_router
from api.path_plan import router as path_plan_router
from api.exercise import router as exercise_router
from api.scan import router as scan_router
from services.logger import capture_exception


def _preload_enabled(name: str) -> bool:
    return os.getenv(name, "0").strip().lower() in {"1", "true", "yes"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    import importlib.util

    if _preload_enabled("PRELOAD_EMBEDDING"):
        try:
            from services.chat_service import _get_embedder

            loop = asyncio.get_running_loop()
            await asyncio.wait_for(loop.run_in_executor(None, _get_embedder), timeout=120)
            print("[INFO] embedding 模型预加载完成")
        except Exception as e:
            print(f"[WARN] 预加载 embedding 失败（首次 RAG 聊天时会重试）: {e}")
    else:
        print("[INFO] 跳过 embedding 预加载（设 PRELOAD_EMBEDDING=1 可开启）")

    if importlib.util.find_spec("cnocr") is None:
        print("[INFO] 拍照搜题需安装 cnocr: pip install cnocr")
    elif _preload_enabled("PRELOAD_CNOCR"):
        try:
            from services.ocr_service import _get_ocr

            loop = asyncio.get_running_loop()
            await asyncio.wait_for(loop.run_in_executor(None, _get_ocr), timeout=60)
            print("[INFO] cnocr 模型预加载完成")
        except Exception as e:
            print(f"[WARN] 预加载 cnocr 失败: {e}")

    yield


app = FastAPI(lifespan=lifespan)

# 未登录用户对话接口
app.include_router(unlogin_router)

# 登录用户知识库聊天接口
app.include_router(chat_router)

# 画像构建智能体
app.include_router(profile_build_router)

# 路径规划智能体
app.include_router(path_plan_router)

# AI 练习生成与智能批改
app.include_router(exercise_router)

# 拍照搜题 OCR + AI 分析
app.include_router(scan_router)


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
