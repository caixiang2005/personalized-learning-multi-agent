from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.database import get_db, ping_users_table
from app.schemas import (
    EmailBody,
    LoginCodeBody,
    LoginPasswordBody,
    RegisterBody,
    ResetPasswordBody,
)
from app.utils import auth as auth_util
from app.utils.email import send_code, verify_code

router = APIRouter()


@router.get("/")
def root():
    return {"service": "user-service", "docs": "/docs"}


@router.get("/health")
def health():
    try:
        ping_users_table()
        return {
            "status": "正常",
            "service": "user-service",
            "database": "project_db",
            "table": "users",
        }
    except Exception as exc:
        return {
            "status": "异常",
            "service": "user-service",
            "database": "project_db",
            "table": "users",
            "error": str(exc),
        }


@router.get("/api/user/register/check-username")
def check_username(
    username: str = Query(min_length=1, max_length=32),
    db: Session = Depends(get_db),
):
    name = auth_util.validate_username(username)
    taken = models.username_exists(db, auth_util.normalize_username(name))
    return {"username": name, "available": not taken}


@router.post("/api/user/sendLoginEmailCode")
def register_send_code(body: EmailBody, db: Session = Depends(get_db)):
    if models.email_exists(db, str(body.email)):
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    return send_code(body.email, "register")


@router.post("/api/user/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    verify_code(body.email, "register", body.code)
    if models.email_exists(db, str(body.email)):
        raise HTTPException(status_code=400, detail="该邮箱已注册")

    username = auth_util.validate_username(body.username)
    if models.username_exists(db, auth_util.normalize_username(username)):
        raise HTTPException(status_code=400, detail="用户名已被占用")

    models.create_user(
        db,
        email=str(body.email),
        username=username,
        user_password=auth_util.hash_password(body.password),
    )
    return {"message": "注册成功"}


@router.post("/api/user/sendLoginCode")
def login_send_code(body: EmailBody, db: Session = Depends(get_db)):
    if not models.email_exists(db, str(body.email)):
        raise HTTPException(status_code=404, detail="用户不存在，请先注册")
    return send_code(body.email, "login")


@router.post("/api/user/login/password")
def login_password(body: LoginPasswordBody, db: Session = Depends(get_db)):
    email = auth_util.resolve_email(db, body.email, body.username)
    user = models.get_by_email(db, email)
    if not user or not auth_util.verify_password(body.password, user.user_password):
        raise HTTPException(status_code=401, detail="账号或密码错误")
    return auth_util.issue_tokens(email)


@router.post("/api/user/login/code")
def login_code(body: LoginCodeBody, db: Session = Depends(get_db)):
    if not models.email_exists(db, str(body.email)):
        raise HTTPException(status_code=404, detail="用户不存在")
    verify_code(body.email, "login", body.code)
    return auth_util.issue_tokens(str(body.email))


@router.post("/api/user/sendResetPasswordEmailCode")
def forgot_password_send_code(body: EmailBody, db: Session = Depends(get_db)):
    if not models.email_exists(db, str(body.email)):
        raise HTTPException(status_code=404, detail="该邮箱未注册")
    return send_code(body.email, "reset_password")


@router.post("/api/user/password/reset")
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    verify_code(body.email, "reset_password", body.code)
    user = models.get_by_email(db, str(body.email))
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    models.update_password(db, user, auth_util.hash_password(body.password))
    return {"message": "密码已重置"}


@router.post("/api/user/token/refresh")
def refresh_token(
    x_refresh_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not x_refresh_token or not x_refresh_token.startswith("demo-refresh-"):
        raise HTTPException(status_code=401, detail="Refresh Token 无效")
    email = x_refresh_token.removeprefix("demo-refresh-")
    if not models.email_exists(db, email):
        raise HTTPException(status_code=401, detail="Refresh Token 无效")
    return auth_util.issue_tokens(email)


@router.get("/api/user/me")
def get_me(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    email = auth_util.require_token(authorization)
    user = models.get_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"email": user.email, "username": user.username}
