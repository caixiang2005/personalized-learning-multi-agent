from __future__ import annotations

from contextlib import contextmanager
from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Integer, SmallInteger, String, Text, create_engine, event
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


class UserProfile(Base):
    __tablename__ = "user_info"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(32), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(11), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gender: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_login_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    signature: Mapped[str | None] = mapped_column(String(100), nullable=True)
    major: Mapped[str | None] = mapped_column(String(32), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(32), nullable=True)


class ErrorLog(Base):
    __tablename__ = "error_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    service: Mapped[str] = mapped_column(String(50), nullable=False, default="user-service")
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    is_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sent_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


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
    """使用 project_db 已有 users、user_info、error_logs 表，不在启动时建表。"""
    pass
