from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.database import Base


class User(Base):
    """PostgreSQL 表 users（库 project_db）。"""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(32), nullable=False)
    user_password: Mapped[str] = mapped_column(String(255), nullable=False)
    # 由数据库表默认值填充，插入时不传此字段
    register_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_username_insensitive(db: Session, username_normalized: str) -> User | None:
    return (
        db.query(User)
        .filter(func.lower(User.username) == username_normalized)
        .first()
    )


def email_exists(db: Session, email: str) -> bool:
    return get_by_email(db, email) is not None


def username_exists(db: Session, username_normalized: str) -> bool:
    return get_by_username_insensitive(db, username_normalized) is not None


def create_user(
    db: Session,
    *,
    email: str,
    username: str,
    user_password: str,
) -> User:
    user = User(email=email, username=username, user_password=user_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user: User, user_password: str) -> User:
    user.user_password = user_password
    db.commit()
    db.refresh(user)
    return user
