# 智慧学习中心 · 前端

> **当前：** 用户认证已对接 `user-service:8001`（`/api/user`，见下文）；访客 Agent 对接 `agent-service:8003`。其余业务模块仍为 Mock。  
> 联调认证时 **不要** 设置 `VITE_USE_MOCK=true`；本地无后端时可开 Mock，密码/验证码为 `123456`。

## 文档（必读）

| 文档 | 用途 |
|------|------|
| **[DESIGN.md](./DESIGN.md)** | 前端视觉规范（颜色、毛玻璃、门户、Do/Don't） |
| **[AGENTS.md](./AGENTS.md)** | 前端开发说明、Cursor 必读顺序 |
| **[待与后端同步清单.md](./待与后端同步清单.md)** | Mock / 真实接口对照（推荐先看） |
| **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** | 全站 API 路径与联调步骤 |

## 代码里怎么找

- `【当前 Mock】` — 假数据 / 假逻辑
- `【待同步后端】` — 其它模块尚未接真实接口
- **`src/lib/api/user.ts`** — 用户认证（已接文档 V1.0）
- `src/lib/api/client.ts` — 画像/对话等（暂未 import）

## 运行

```bash
npm install
npm run dev
```

复制 `frontend/.env.example` 为 `.env.development`：

```env
VITE_API_BASE=/api
# 后端未就绪时：VITE_USE_MOCK=true
```

### 开发代理端口（`vite.config.ts`）

| 路径前缀 | 转发到 | 服务 |
|----------|--------|------|
| `/api/agent` | `http://127.0.0.1:8003` | agent-service |
| `/api`（含 `/api/user`） | `http://127.0.0.1:8001` | **user-service** |

浏览器请求形如 `http://localhost:5173/api/user/...`，由 Vite 代理到 **8001**。

### 用户认证联调（user-service · 文档 V1.0）

1. 启动后端（端口 **8001**）：
   ```bash
   cd backend/user-service
   uvicorn main:app --reload --host 127.0.0.1 --port 8001
   ```
2. Swagger：`http://127.0.0.1:8001/docs`
3. 前端页面：`/login` · `/register` · `/reset-password`
4. 响应约定：`{ "code": 200, "msg": "...", "data": ... }`；失败时 `code` 为 400/401/500/503，前端展示 `msg`
5. 登录成功：`data.token` / `data.refreshToken` 写入 `localStorage`；后续请求带 `Authorization: Bearer <token>`
6. `GET /api/user/info`：前端使用 **GET + Bearer**（请后端按此实现）

封装与路径见 `src/lib/api/endpoints.ts` → `API.user`、`src/lib/api/user.ts`。

### 未登录 Agent 联调（agent-service）

1. 启动后端（端口 **8003**）：
   ```bash
   cd backend/agent-service
   python main.py
   ```
2. 门户 `/` → **AI 助手**；请求 `POST /api/agent/unlogin/chat`
3. 可设 `VITE_GUEST_CHAT_MOCK=1` 强制 Mock

## 路由

`/`（门户）· `/login` · `/register` · `/reset-password` · `/home` · `/chat` · `/profile` · `/path` · `/resource/:id` · `/exercise/:id` · `/analytics` · `/settings`

## 开源标注

- **Flowing Menu** 参考 [React Bits - Flowing Menu](https://www.reactbits.dev/components/flowing-menu)，见 `FlowingMenu.tsx` / `FlowingDock.tsx`。
