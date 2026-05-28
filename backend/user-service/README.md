# user-service

用户微服务（FastAPI + PostgreSQL）。

## 目录结构

```
user-service/
├── main.py
├── requirements.txt
├── config/                  # 统一配置
│   ├── settings.py          # 配置加载
│   ├── settings.example.yaml
│   ├── env.example          # 复制为 config/.env
│   ├── .env                 # 数据库等敏感项（勿提交）
│   └── settings.yaml        # 邮件/Redis/验证码（勿提交）
├── user-api/                # 用户接口
│   ├── routes.py            # 发送验证码等
│   └── schemas.py
├── service/                 # 交给前端的联调文档（勿写在 frontend 仓库）
│   ├── frontend-handoff.md  # 一页纸
│   └── frontend-api.md      # 完整接口
├── utils/
│   ├── redis.py
│   └── email.py
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

## 测试

```bash
cd backend/user-service
pytest test/ -v
```

- Swagger：http://127.0.0.1:8001/docs  
- 前端联调：[service/frontend-handoff.md](./service/frontend-handoff.md) · [service/frontend-api.md](./service/frontend-api.md)
