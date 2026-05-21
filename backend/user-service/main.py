import re

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, model_validator

from verification import send_code, verify_code

app = FastAPI(title="用户微服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,32}$")

# --- 内存用户存储（接入数据库后替换） ---
_users_by_email: dict[str, dict] = {}
_users_by_username: dict[str, str] = {}  # username.lower() -> email


class EmailBody(BaseModel):
    email: EmailStr


class RegisterBody(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=32)
    code: str = Field(min_length=4, max_length=8)
    password: str = Field(min_length=8)


class LoginPasswordBody(BaseModel):
    password: str
    email: EmailStr | None = None
    username: str | None = None

    @model_validator(mode="after")
    def require_identifier(self):
        if not self.email and not self.username:
            raise ValueError("请提供邮箱或用户名")
        if self.email and self.username:
            raise ValueError("邮箱与用户名只能填写其一")
        return self


class LoginCodeBody(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)
    password: str = Field(min_length=8)


def _normalize_username(username: str) -> str:
    return username.strip().lower()


def _validate_username(username: str) -> str:
    name = username.strip()
    if not _USERNAME_RE.fullmatch(name):
        raise HTTPException(
            status_code=400,
            detail="用户名须为 3–32 位字母、数字或下划线",
        )
    return name


def _hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def _resolve_email(email: EmailStr | None, username: str | None) -> str:
    if email:
        return str(email)
    assert username is not None
    key = _normalize_username(username)
    resolved = _users_by_username.get(key)
    if not resolved:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return resolved


def _issue_tokens(email: str) -> dict:
    return {
        "access_token": f"demo-access-{email}",
        "refresh_token": f"demo-refresh-{email}",
        "token_type": "bearer",
    }


def _require_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization.removeprefix("Bearer ").strip()
    if not token.startswith("demo-access-"):
        raise HTTPException(status_code=401, detail="Token 无效")
    return token.removeprefix("demo-access-")


@app.get("/")
def root():
    return {"service": "user-service", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "正常", "service": "user-service"}


@app.get("/api/user/register/check-username")
def check_username(username: str = Query(min_length=1, max_length=32)):
    name = _validate_username(username)
    taken = _normalize_username(name) in _users_by_username
    return {"username": name, "available": not taken}


@app.post("/api/user/sendLoginEmailCode")
def register_send_code(body: EmailBody):
    if body.email in _users_by_email:
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    return send_code(body.email, "register")


@app.post("/api/user/register")
def register(body: RegisterBody):
    verify_code(body.email, "register", body.code)
    if body.email in _users_by_email:
        raise HTTPException(status_code=400, detail="该邮箱已注册")

    username = _validate_username(body.username)
    username_key = _normalize_username(username)
    if username_key in _users_by_username:
        raise HTTPException(status_code=400, detail="用户名已被占用")

    _users_by_email[body.email] = {
        "email": body.email,
        "username": username,
        "password": _hash_password(body.password),
    }
    _users_by_username[username_key] = body.email
    return {"message": "注册成功"}


@app.post("/api/user/sendLoginEmailCode")
def login_send_code(body: EmailBody):
    if body.email not in _users_by_email:
        raise HTTPException(status_code=404, detail="用户不存在，请先注册")
    return send_code(body.email, "login")


@app.post("/api/user/login/password")
def login_password(body: LoginPasswordBody):
    email = _resolve_email(body.email, body.username)
    user = _users_by_email.get(email)
    if not user or not _verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="账号或密码错误")
    return _issue_tokens(email)


@app.post("/api/user/login/code")
def login_code(body: LoginCodeBody):
    if body.email not in _users_by_email:
        raise HTTPException(status_code=404, detail="用户不存在")
    verify_code(body.email, "login", body.code)
    return _issue_tokens(body.email)


@app.post("/api/user/sendResetPasswordEmailCode")
def forgot_password_send_code(body: EmailBody):
    if body.email not in _users_by_email:
        raise HTTPException(status_code=404, detail="该邮箱未注册")
    return send_code(body.email, "reset_password")


@app.post("/api/user/password/reset")
def reset_password(body: ResetPasswordBody):
    verify_code(body.email, "reset_password", body.code)
    user = _users_by_email.get(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user["password"] = _hash_password(body.password)
    return {"message": "密码已重置"}


@app.post("/api/user/token/refresh")
def refresh_token(x_refresh_token: str | None = Header(default=None)):
    if not x_refresh_token or not x_refresh_token.startswith("demo-refresh-"):
        raise HTTPException(status_code=401, detail="Refresh Token 无效")
    email = x_refresh_token.removeprefix("demo-refresh-")
    if email not in _users_by_email:
        raise HTTPException(status_code=401, detail="Refresh Token 无效")
    return _issue_tokens(email)


@app.get("/api/user/me")
def get_me(authorization: str | None = Header(default=None)):
    email = _require_token(authorization)
    user = _users_by_email.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"email": user["email"], "username": user["username"]}
