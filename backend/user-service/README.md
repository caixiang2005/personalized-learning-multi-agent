# user-service

用户微服务（FastAPI + PostgreSQL）。

## 目录结构

```
user-service/
├── main.py                  # 应用入口，所有路由在此 include_router
├── Dockerfile               # 容器入口：uvicorn main:app
├── requirements.txt
├── api/                     # HTTP 路由（由 main.py 统一注册）
│   ├── user_login.py        # 注册、登录
│   ├── user_info.py         # 个人资料、头像
│   ├── error.py             # 错误日志（n8n）
│   └── schemas.py           # 请求体模型
├── config/                  # 统一配置
│   ├── settings.py          # 配置加载
│   ├── settings.example.yaml
│   ├── env.example          # 复制为 config/.env
│   ├── .env                 # 数据库等敏感项（勿提交）
│   └── settings.yaml        # 邮件/Redis/验证码（勿提交）
├── service/                 # 交给前端的联调文档（勿写在 frontend 仓库）
│   ├── user-info-handoff.md # 个人信息一页纸
│   ├── user-info-api.md     # 个人信息完整接口
│   ├── frontend-handoff.md  # 登录注册一页纸（若有）
│   └── frontend-api.md      # 登录注册完整接口（若有）
├── utils/
│   ├── user_login.py        # 注册、登录业务逻辑
│   ├── user_info.py         # 个人资料
│   ├── database.py
│   ├── redis.py
│   └── email.py
├── error/                   # 错误日志业务逻辑（error_logs 表，供 n8n 拉取）
│   ├── logger.py
│   └── README.md
├── test/                    # pytest 测试
└── static/avatar/
```

## 配置

1. 复制 `config/env.example` → `config/.env`，`DATABASE_URL` 指向 **project_db**（使用已有 **users** 表，服务不会自动建表）
2. 复制 `config/settings.example.yaml` → `config/settings.yaml`，填写 SMTP 与 Redis


## 启动

```bash
cd backend/user-service
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

## Docker

```bash
cd backend/user-service
docker build -t user-service .
docker run -p 8001:8001 --env-file config/.env user-service
```

> 挂载 `config/.env`、`config/settings.yaml` 按部署环境调整。所有接口由 `main.py` 统一注册，容器只需 `uvicorn main:app`。

## 测试

```bash
cd backend/user-service
pytest test/ -v
```

- Swagger：http://127.0.0.1:8001/docs  
- 前端联调：[service/user-info-handoff.md](./service/user-info-handoff.md) · [service/user-info-api.md](./service/user-info-api.md)
