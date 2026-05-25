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
├── utils/
│   ├── redis.py
│   └── email.py
├── test/                    # pytest 测试
└── static/avatar/
```

## 配置

1. 复制 `config/env.example` → `config/.env`，填写 `DATABASE_URL`
2. 复制 `config/settings.example.yaml` → `config/settings.yaml`，填写 SMTP 与 Redis

### 云 Redis + SSH 隧道（与 Navicat 一致）

Redis 在**云服务器内网**监听（例如云上 `127.0.0.1:6379`），外网不能直接连。Navicat 的做法是：

```
你的电脑 ──SSH──► 云服务器 8.153.204.117:22 ──► 云上 Redis 127.0.0.1:6379
              │
              └── 在本机映射出 127.0.0.1:6379（隧道）
```

因此 `config/settings.yaml` 里应写**本机**地址（不是云公网 IP）：

```yaml
redis:
  host: 127.0.0.1
  port: 6379
  db: 0
```

**重要：** Navicat 里的 SSH 隧道**只在 Navicat 连接开着时**对本机生效；`uvicorn` 不会自动走 Navicat 的隧道。要让 Python 也能连，任选其一：

1. **保持 Navicat 已连接「云 Redis」**（隧道一直开着），再启动 `uvicorn`
2. **单独开 SSH 端口转发**（PowerShell，密码向队友索取，勿提交到 Git）：
   ```bash
   ssh -L 6379:127.0.0.1:6379 root@8.153.204.117 -p 22
   ```
   保持该窗口不关闭，另开终端启动 `uvicorn`

自检：`Test-NetConnection 127.0.0.1 -Port 6379` 为 `True` 后再启动服务，终端应出现 `Redis 连接成功`。

**启动时若看到「Redis 连接失败」：** 本机 6379 没有隧道/Redis。服务仍会启动，验证码接口返回 `code: 503`。

## 启动

```bash
cd backend/user-service
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 测试

```bash
cd backend/user-service
pytest test/ -v
```

文档：http://127.0.0.1:8000/docs
