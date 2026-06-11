from fastapi import APIRouter, Header

from api.schemas import EmailBody, LoginBody, LoginCodeBody, LoginUsernameBody, RefreshTokenBody, RegisterBody, ResetPwdBody
from utils.user_login import (
    get_user_info,
    login_user,
    login_user_by_code,
    login_user_by_username,
    refresh_token,
    register_user,
    reset_password,
    send_login_email_code,
    send_register_email_code,
    send_reset_email_code,
)

router = APIRouter(tags=["用户认证"])


@router.post("/api/user/sendRegEmailCode")
def send_reg_email_code(body: EmailBody):
    return send_register_email_code(str(body.email))


@router.post("/api/user/register")
def register(body: RegisterBody):
    return register_user(str(body.email), body.username, body.password, body.code)


@router.post("/api/user/sendLoginEmailCode")
def send_login_email_code_api(body: EmailBody):
    return send_login_email_code(str(body.email))


@router.post("/api/user/sendResetEmailCode")
def send_reset_email_code_api(body: EmailBody):
    return send_reset_email_code(str(body.email))


@router.post("/api/user/login")
def login(body: LoginBody):
    return login_user(str(body.email), body.password)


@router.post("/api/user/loginByUsername")
def login_by_username(body: LoginUsernameBody):
    return login_user_by_username(body.username, body.password)


@router.post("/api/user/loginByEmailCode")
def login_by_email_code(body: LoginCodeBody):
    return login_user_by_code(str(body.email), body.code)


@router.post("/api/user/refreshToken")
def refresh_user_token(
    body: RefreshTokenBody | None = None,
    authorization: str | None = Header(default=None),
    x_refresh_token: str | None = Header(default=None, alias="X-Refresh-Token"),
):
    token = ""
    if authorization:
        parts = authorization.split(" ", 1)
        token = parts[1].strip() if len(parts) == 2 and parts[0].lower() == "bearer" else authorization.strip()
    refresh_value = (body.refreshToken if body else None) or x_refresh_token
    return refresh_token(token, refresh_value)


@router.get("/api/user/getUserInfo")
def user_info(authorization: str | None = Header(default=None)):
    token = ""
    if authorization:
        parts = authorization.split(" ", 1)
        token = parts[1].strip() if len(parts) == 2 and parts[0].lower() == "bearer" else authorization.strip()
    return get_user_info(token)


@router.post("/api/user/resetPwd")
def reset_pwd(body: ResetPwdBody):
    return reset_password(str(body.email), body.code, body.newPassword)
