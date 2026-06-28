from __future__ import annotations

from contextlib import contextmanager
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    BigInteger, Boolean, Column, Date, DateTime, Float,
    Integer, JSON, SmallInteger, String, Text, create_engine,
    event, ForeignKey, text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from config import get_settings

settings = get_settings()
DATABASE_URL = settings.database_url

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True, pool_size=5, max_overflow=10)


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


# ── 画像（Learner Profile） ──

class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    major: Mapped[str | None] = mapped_column(String(100), nullable=True)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[str | None] = mapped_column(Text, nullable=True)
    health_score: Mapped[int] = mapped_column(Integer, default=0)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    cognitive_style: Mapped[list | None] = mapped_column(JSON, nullable=True)
    weak_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    learner_dimensions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    rhythm: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    goal_progress: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


# ── 学习路径 ──

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    course: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    stages: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    overall_progress: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str] = mapped_column(String(50), default="路径智能体规划")
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


# ── 学习资源 ──

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    path_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    topic_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stage_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # document/mindmap/exercise/video/practice
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_meta: Mapped[dict | None] = mapped_column("meta_data", JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="todo")  # todo/learning/done/mastered/favorite
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


# ── 练习（习题银行） ──
# 标准化格式：每道题统一用 { id, type, title, options?, correctAnswer, explanation }
# 用户答案统一用 { questionId, answer }

class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    resource_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    topic_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="练习题集标题")
    difficulty: Mapped[str | None] = mapped_column(String(20), default="medium", comment="easy/medium/hard")
    question_count: Mapped[int] = mapped_column(Integer, default=0, comment="题目数量")
    questions: Mapped[list | None] = mapped_column(JSON, nullable=True, comment="题目列表（标准化格式）")
    answers: Mapped[list | None] = mapped_column(JSON, nullable=True, comment="用户答案列表")
    score: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="得分 0-100")
    ai_review: Mapped[list | None] = mapped_column(JSON, nullable=True, comment="AI 批改结果")
    status: Mapped[str] = mapped_column(String(20), default="pending", comment="pending/done")
    source: Mapped[str] = mapped_column(String(30), default="ai_generated", comment="ai_generated/path_resource")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


# ── 学习分析 ──

class LearningAnalytics(Base):
    __tablename__ = "learning_analytics"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    weak_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    suggestions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


# ── 会话管理 ──

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    course: Mapped[str | None] = mapped_column(String(100), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user/assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


class ChatMessageFeedback(Base):
    __tablename__ = "chat_message_feedbacks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    message_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    feedback_type: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)


# ── 每日计划 ──


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    plan_date: Mapped[date] = mapped_column(Date, nullable=False)
    greeting: Mapped[str | None] = mapped_column(String(200), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    overall_progress: Mapped[int] = mapped_column(Integer, default=0)
    tasks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    knowledge_push: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


# ── 数据库工具 ──

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


# ── 数据库迁移 ──

_MIGRATIONS: dict[str, list[str]] = {
    "exercises": [
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS title VARCHAR(200) DEFAULT ''",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS ai_review JSON DEFAULT NULL",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'ai_generated'",
    ],
    "daily_plans": [
    ],
}


def run_migrations() -> None:
    """执行增量迁移：为已有表添加新增的列。"""
    with engine.connect() as conn:
        for table, statements in _MIGRATIONS.items():
            for stmt in statements:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception:
                    conn.rollback()
                    # 列可能已存在或表不存在，静默跳过


def init_db() -> None:
    """启动时自动建表 + 运行增量迁移。"""
    Base.metadata.create_all(bind=engine)
    run_migrations()
