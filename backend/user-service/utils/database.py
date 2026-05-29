from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from config import get_settings

settings = get_settings()
DATABASE_URL = settings.database_url

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)


@event.listens_for(engine, "connect")
def _set_pg_timezone(dbapi_connection, _connection_record) -> None:
    if DATABASE_URL.startswith("postgresql"):
        with dbapi_connection.cursor() as cursor:
            cursor.execute("SET TIME ZONE 'Asia/Shanghai'")


SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, future=True, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    user_password: Mapped[str] = mapped_column(String(255), nullable=False)
    register_time: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """使用 project_db 已有 users 表，不在启动时建表。"""
    pass
