import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# user-api 目录名含连字符，加入 sys.path 后按模块导入
_SERVICE_ROOT = Path(__file__).resolve().parent
_USER_API_DIR = _SERVICE_ROOT / "user-api"
if str(_USER_API_DIR) not in sys.path:
    sys.path.insert(0, str(_USER_API_DIR))

from user_login_api import router as user_router  # noqa: E402
from user_info_api import router as profile_router  # noqa: E402
from utils.database import init_db  # noqa: E402

app = FastAPI(title="用户微服务")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router)
app.include_router(profile_router)
app.mount("/static", StaticFiles(directory=str(_SERVICE_ROOT / "static")), name="static")


@app.on_event("startup")
def on_startup():
    import utils.redis as redis_module

    init_db()
    redis_module.init_redis()
    redis_module.redis_client = redis_module.get_redis_client()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
