from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import SERVICE_ROOT
from app.database import ping_users_table
from app.routes import router


def create_app() -> FastAPI:
    application = FastAPI(title="用户微服务")
    try:
        ping_users_table()
    except Exception:
        pass  # 启动时连不上不阻塞，/health 可查看原因
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    avatar_dir = SERVICE_ROOT / "static" / "avatar"
    avatar_dir.mkdir(parents=True, exist_ok=True)
    application.mount("/static", StaticFiles(directory=SERVICE_ROOT / "static"), name="static")
    application.include_router(router)
    return application
