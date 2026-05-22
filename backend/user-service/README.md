# user-service

用户微服务（FastAPI + PostgreSQL）。

## 目录结构

```
user-service/
├── main.py              # 启动入口
├── requirements.txt
├── email_config.yaml    # 邮件 SMTP
├── .env                 # 数据库连接（勿提交）
├── static/avatar/       # 用户头像
├── test/                # 测试
└── app/
    ├── config.py        # 配置（数据库地址等）
    ├── database.py      # 数据库连接
    ├── models.py        # User 表与数据访问
    ├── schemas.py       # 请求体验证
    ├── routes/user.py   # 用户接口（登录、注册等）
    └── utils/
        ├── email.py     # 邮件验证码
        ├── auth.py      # 密码、Token
        └── file.py      # 头像上传校验
```

## 数据库（Navicat / PostgreSQL）

| 项 | 值 |
|----|-----|
| 主机 | 127.0.0.1 |
| 端口 | 5432 |
| 数据库 | project_db |
| 用户 | team_user |
| 表 | users |

`.env` 中 `DATABASE_URL` 需与上一致。

## 启动

```bash
cd backend/user-service
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

文档：http://127.0.0.1:8000/docs
