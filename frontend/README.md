# 智慧学习中心 · 前端

> **当前：** 用户认证已对接 **user-service:8001**；学习业务（画像/路径/资源/练习/analytics）已对接 **learn-service:8002**；多智能体对话已对接 **agent-service:8003**（含 video RAG）。登录后由 `dataBootstrap` 拉取服务端数据；日计划/搜题已接 API，失败时有本地 fallback。  
> 联调认证时 **不要** 设置 `VITE_USE_MOCK=true`；本地无后端时可开 Mock，密码/验证码为 `123456`。

## 文档（必读）

| 文档 | 用途 |
|------|------|
| **[DESIGN.md](./DESIGN.md)** | 前端视觉规范 |
| **[AGENTS.md](./AGENTS.md)** | 前端开发说明 |
| **[待与后端同步清单.md](./待与后端同步清单.md)** | Mock / 真实接口对照 |
| **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** | 全站 API（画像/对话等） |
| **后端 `backend/user-service/frontend-handoff.md`** | 认证一页纸（权威路径） |

## 代码里怎么找

- `【当前 Mock】` — 仍走本地的逻辑（如 `simulateStream`、敏感词过滤、API 失败 fallback）
- `【待同步后端】` — 尚未接 API 或仅作规划占位（搜索可定位剩余项）
- **`src/lib/api/user.ts`** — 用户认证（user-service）
- `src/lib/api/endpoints.ts` — `API.user` 路径常量

## 运行

```bash
npm install
npm run dev
```

**环境变量**：仓库只提交 `.env.example`（模板），不提交 `.env.development`（每人本地配置）。克隆后执行：

```bash
copy .env.example .env.development   # Windows
# cp .env.example .env.development   # macOS/Linux
```

默认内容：`VITE_API_BASE=/api`。后端未就绪时可设 `VITE_USE_MOCK=true`（见 `.env.example` 注释）。

### 开发代理端口（`vite.config.ts`）

| 路径前缀 | 转发到 | 服务 |
|----------|--------|------|
| `/api/agent` | `http://127.0.0.1:8003` | agent-service |
| `/api/profile` · `/api/learning-path` · `/api/plan` · `/api/chat` · `/api/analytics` · `/api/resources` · `/api/exercises` 等 | `http://127.0.0.1:8002` | **learn-service** |
| `/api`（兜底，含 `/api/user`） | `http://127.0.0.1:8001` | **user-service** |

### 用户认证联调（user-service）

1. 启动后端（端口 **8001**）：
   ```bash
   cd backend/user-service
   uvicorn main:app --reload --host 127.0.0.1 --port 8001
   ```
2. Swagger：http://127.0.0.1:8001/docs
3. 页面：`/login` · `/register` · `/reset-password`
4. 以响应 **`code === 200`** 判断成功；失败展示 `msg`
5. 登录成功：保存 `data.token`、`data.refreshToken`；鉴权接口带 `Authorization: Bearer <token>`
6. 用户信息：**`GET /api/user/getUserInfo`** + Bearer
7. 刷新 token：**`POST /api/user/refreshToken`** + Bearer（无 body）

### 认证接口路径一览

| 功能 | 方法 | 路径 |
|------|------|------|
| 发注册验证码 | POST | `/api/user/sendRegEmailCode` |
| 注册 | POST | `/api/user/register` |
| 发登录验证码 | POST | `/api/user/sendLoginEmailCode` |
| 邮箱登录 | POST | `/api/user/login` |
| 用户名登录 | POST | `/api/user/loginByUsername` |
| 验证码登录 | POST | `/api/user/loginByEmailCode` |
| 用户信息 | GET | `/api/user/getUserInfo` |
| 刷新 token | POST | `/api/user/refreshToken` |
| 发重置验证码 | POST | `/api/user/sendResetEmailCode` |
| 重置密码 | POST | `/api/user/resetPwd` |

封装：`src/lib/api/user.ts` · 路径：`src/lib/api/endpoints.ts` → `API.user`

### 未登录 Agent 联调（agent-service）

1. `cd backend/agent-service && python main.py`（**8003**）
2. 门户 `/` → **AI 助手**；`POST /api/agent/unlogin/chat`
3. 可设 `VITE_GUEST_CHAT_MOCK=1` 强制 Mock

## 路由

`/` · `/login` · `/register` · `/reset-password` · `/home` · `/chat` · `/profile` · `/path` · `/resource/:id` · `/exercise/:id` · `/analytics` · `/settings`

## 开源标注

- **Flowing Menu** 参考 [React Bits - Flowing Menu](https://www.reactbits.dev/components/flowing-menu)，见 `FlowingMenu.tsx` / `FlowingDock.tsx`。
