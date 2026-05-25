import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# user-api 目录名含连字符，加入 sys.path 后按模块导入
_USER_API_DIR = Path(__file__).resolve().parent / "user-api"
if str(_USER_API_DIR) not in sys.path:
    sys.path.insert(0, str(_USER_API_DIR))

from routes import router as user_router  # noqa: E402

app = FastAPI(title="用户微服务")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router)


@app.on_event("startup")
def on_startup():
    import utils.redis as redis_module

    redis_module.init_redis()
    redis_module.redis_client = redis_module.get_redis_client()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
