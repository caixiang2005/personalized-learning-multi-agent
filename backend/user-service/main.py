from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

from verification import send_code, verify_code

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="用户微服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- 内存用户存储（接入数据库后替换） ---
_users: dict[str, dict] = {}


class EmailBody(BaseModel):
    email: EmailStr


class RegisterBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)
    password: str = Field(min_length=8)


class LoginPasswordBody(BaseModel):
    email: EmailStr
    password: str


class LoginCodeBody(BaseModel):
    email: EmailStr
    code: str


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
def index():
    return FileResponse(STATIC_DIR / "login.html")


@app.get("/login")
def login_page():
    return FileResponse(STATIC_DIR / "login.html")


@app.get("/register")
def register_page():
    return FileResponse(STATIC_DIR / "register.html")


@app.get("/health")
def health():
    return {"status": "正常", "service": "user-service"}


@app.post("/api/auth/register/send-code")
def register_send_code(body: EmailBody):
    return send_code(body.email, "register")


@app.post("/api/auth/register")
def register(body: RegisterBody):
    verify_code(body.email, "register", body.code)
    if body.email in _users:
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    _users[body.email] = {"email": body.email, "password": body.password}
    return {"message": "注册成功"}


@app.post("/api/auth/login/send-code")
def login_send_code(body: EmailBody):
    if body.email not in _users:
        raise HTTPException(status_code=404, detail="用户不存在，请先注册")
    return send_code(body.email, "login")


@app.post("/api/auth/login/password")
def login_password(body: LoginPasswordBody):
    user = _users.get(body.email)
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    return _issue_tokens(body.email)


@app.post("/api/auth/login/code")
def login_code(body: LoginCodeBody):
    if body.email not in _users:
        raise HTTPException(status_code=404, detail="用户不存在")
    verify_code(body.email, "login", body.code)
    return _issue_tokens(body.email)


@app.post("/api/auth/token/refresh")
def refresh_token(x_refresh_token: str | None = Header(default=None)):
    if not x_refresh_token or not x_refresh_token.startswith("demo-refresh-"):
        raise HTTPException(status_code=401, detail="Refresh Token 无效")
    email = x_refresh_token.removeprefix("demo-refresh-")
    return _issue_tokens(email)


@app.get("/api/auth/me")
def get_me(authorization: str | None = Header(default=None)):
    email = _require_token(authorization)
    user = _users.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"email": user["email"], "nickname": user["email"].split("@")[0]}
