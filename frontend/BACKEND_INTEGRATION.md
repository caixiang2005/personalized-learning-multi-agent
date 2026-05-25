# 前端与后端对接说明

> **当前：未连接后端，全站 Mock 运行。**  
> 快速对照表请看 **[待与后端同步清单.md](./待与后端同步清单.md)**（推荐先看这份）。  
> 代码中搜索 **`【待同步后端】`**（要接接口的位置）和 **`【当前 Mock】`**（现在的假数据）。

---

## 0. 现在 vs 联调后

| 项目 | 现在 | 联调后 |
|------|------|--------|
| 网络请求 | 无（除你手动测 client） | 页面 import `lib/api/client.ts` |
| 数据从哪来 | `lib/mockData.ts` + 页面内写死 | 各 GET/POST 接口 |
| 登录 | mockApi，密码 123456 | `loginApi` + token |
| 对话流式 | `lib/stream.ts` simulateStream | `streamChat` SSE |

`lib/api/client.ts` **已写好但未引用**，避免后端未就绪时 fetch 报错。

---

## 1. 技术约定

| 项目 | 建议 |
|------|------|
| 基础路径 | `/api`，通过环境变量 `VITE_API_BASE` 配置 |
| 认证 | JWT，`Authorization: Bearer <token>`，登录后存 `localStorage.access_token` |
| 流式对话 | SSE（`text/event-stream`），或 WebSocket，见 `lib/api/client.ts` → `streamChat` |
| 跨域 | 开发环境 Vite 代理：`vite.config.ts` 中 `/api` → user-service；`/api/agent` → agent-service:8003 |

### 1.1 未登录 Agent（已对接）

| 项目 | 说明 |
|------|------|
| 服务 | `agent-service` @ `127.0.0.1:8003` |
| 路径 | `POST /api/agent/unlogin/chat` |
| 请求 | `{ "user_input": string, "session_id": string }`（UUID v4） |
| 响应 | `{ "code": 200, "msg": "success", "data": { "ai_reply": string } }` |
| session 生命周期 | 页面加载时 `crypto.randomUUID()`；刷新页面重新生成；同页多轮不变 |
| 免费轮次 | 3 轮，第 4 轮 `ai_reply` 提示登录 |
| 前端实现 | `lib/guestChat.ts` · `components/guest/GuestChatDrawer.tsx` |

```ts
// vite.config.ts 示例（需后端同学确认端口）
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
  },
},
```

---

## 2. 页面路由与后端关系总览

| 路由 | 页面文件 | 主要后端依赖 |
|------|----------|--------------|
| `/login` | `pages/Login.tsx` | 登录、验证码 |
| `/home` | `pages/Home.tsx` | 画像初建、路径生成 |
| `/chat` | `pages/Chat.tsx` | 会话列表、流式消息、附件、反馈 |
| `/profile` | `pages/Profile.tsx` | 画像查询、手动更新 |
| `/path` | `pages/LearningPath.tsx` | 学习路径、资源状态 |
| `/resource/:id` | `pages/ResourceDetail.tsx` | 资源详情 |
| `/exercise/:id` | `pages/ExercisePage.tsx` | 题目、提交批改 |
| `/analytics` | `pages/Analytics.tsx` | 统计、建议 |
| `/settings` | `pages/Settings.tsx` | 用户信息、退出 |

---

## 3. 接口清单（按模块）

### 3.1 认证 `API.auth`

| 方法 | 路径 | 请求体 | 响应 | 前端调用位置 |
|------|------|--------|------|--------------|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` | `Login.tsx` → 替换 mockApi |
| POST | `/api/auth/login/code` | `{ email, code }` | 同上 | `Login.tsx` |
| POST | `/api/auth/send-code` | `{ email }` | `{ ok }` | `Login.tsx` 获取验证码 |
| POST | `/api/auth/logout` | - | - | `Settings.tsx` / Navbar 退出 |

**联调要点**：登录成功写入 `localStorage.access_token`，`client.ts` 的 `authHeaders()` 自动携带。

---

### 3.2 学习画像 `API.profile`

| 方法 | 路径 | 说明 | 前端调用位置 |
|------|------|------|--------------|
| GET | `/api/profile` | 完整画像（≥6 维度） | 进入 `/profile`、Chat 侧边栏 |
| PUT | `/api/profile` | 更新基础字段 | 按需 |
| POST | `/api/profile/patch` | `{ note }` 用户补充状态后重算 | `Profile.tsx` 手动更新区 |
| GET | `/api/profile/dimensions` | 雷达图数据（可选拆分） | `Profile.tsx` |

**首页引导**：用户在 `/home` 提交学习背景后，应调用：

| 方法 | 路径 | 请求体 | 前端位置 |
|------|------|--------|----------|
| POST | `/api/learning-path/generate` | `{ major, goal, level, rawText }` | `Home.tsx` → `handleSubmit` |

返回画像摘要 + 是否生成路径成功（当前为前端 Mock 流式文案）。

---

### 3.3 对话 `API.chat`

| 方法 | 路径 | 说明 | 前端调用位置 |
|------|------|------|--------------|
| GET | `/api/chat/sessions?course=&keyword=` | 历史会话 | `Chat.tsx` 侧边栏 |
| GET | `/api/chat/sessions/:id/messages` | 消息列表 | 切换会话时 |
| POST | `/api/chat/stream` | **SSE 流式**回复 | `Chat.tsx` → `sendMessage` |
| POST | `/api/chat/feedback` | `{ messageId, type }` | `MessageBubble.tsx` 有用/没用/收藏 |
| POST | `/api/chat/upload` | `multipart/form-data` | `Chat.tsx` 附件按钮 |

**SSE 数据格式建议**（与 `StreamChunk` 对齐）：

```json
data: {"type":"text","content":"部分文字"}
data: {"type":"resource","resource":{...},"progress":30}
data: {"type":"done"}
```

前端实现：`lib/api/client.ts` → `streamChat()`。联调后删除 `lib/stream.ts` 的 `simulateStream` 模拟。

---

### 3.4 学习路径与资源 `API.path`

| 方法 | 路径 | 说明 | 前端调用位置 |
|------|------|------|--------------|
| GET | `/api/learning-path` | 阶段 / 知识点 / 资源树 | `LearningPath.tsx`、store 初始化 |
| PUT | `/api/learning-path/resource-status` | `{ topicId, resourceId, status }` | 资源卡片「标记状态」 |
| GET | `/api/resources/:id` | 资源详情（正文、导图、视频 URL） | `ResourceDetail.tsx` |

**资源类型**：`document | mindmap | exercise | video | practice`（见 `types/index.ts`）。

**跳转关系**：

- 练习题 → `/exercise/:id`
- 其他资源 → `/resource/:id`

---

### 3.5 练习 `API.exercise`

| 方法 | 路径 | 说明 | 前端调用位置 |
|------|------|------|--------------|
| GET | `/api/exercises/:id` | 题目列表 | `ExercisePage.tsx` |
| POST | `/api/exercises/:id/submit` | `{ answers }` → 得分、解析、更新画像 | `ExercisePage.tsx` 提交 |

---

### 3.6 效果评估 `API.analytics`

| 方法 | 路径 | 说明 | 前端调用位置 |
|------|------|------|--------------|
| GET | `/api/analytics/overview?range=7\|30` | 时长、正确率、掌握度对比 | `Analytics.tsx` |
| GET | `/api/analytics/weak-points` | 薄弱点列表 | `Analytics.tsx` |
| GET | `/api/analytics/suggestions` | 优化建议文案 | `Analytics.tsx` |

---

### 3.7 内容安全 `API.safety`

| 方法 | 路径 | 说明 | 前端调用位置 |
|------|------|------|--------------|
| POST | `/api/safety/check` | `{ text }` | `Chat.tsx` 发送前（可选，前端亦有本地关键词兜底） |

---

## 4. 各页面「对接后端」检查表

### Login `/login`

- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/login/code`
- [ ] `POST /api/auth/send-code`

### Home `/home`

- [ ] `POST /api/learning-path/generate`（提交学习背景）
- [ ] 可选：`POST /api/profile/patch` 同步画像

### Chat `/chat`

- [ ] `GET /api/chat/sessions`
- [ ] `GET /api/chat/sessions/:id/messages`
- [ ] `POST /api/chat/stream`（SSE）
- [ ] `POST /api/chat/upload`
- [ ] `POST /api/chat/feedback`

### Profile `/profile`

- [ ] `GET /api/profile`
- [ ] `POST /api/profile/patch`

### Learning Path `/path`

- [ ] `GET /api/learning-path`
- [ ] `PUT /api/learning-path/resource-status`

### Resource Detail `/resource/:id`

- [ ] `GET /api/resources/:id`

### Exercise `/exercise/:id`

- [ ] `GET /api/exercises/:id`
- [ ] `POST /api/exercises/:id/submit`

### Analytics `/analytics`

- [ ] `GET /api/analytics/overview`
- [ ] `GET /api/analytics/weak-points`
- [ ] `GET /api/analytics/suggestions`

### Settings `/settings`

- [ ] `GET /api/profile` 或 `/api/user/me`
- [ ] `POST /api/auth/logout`

---

## 5. 本地 Mock 与切换联调

| 文件 | 作用 |
|------|------|
| `lib/mockData.ts` | 演示用静态数据，联调后逐步移除 |
| `lib/stream.ts` | 模拟流式输出，联调后改用 `streamChat()` |
| `pages/Login.tsx` | 内置 `mockApi`，联调后改为 `loginApi` / `sendCodeApi` |

**推荐步骤**：

1. 先打通登录 + `GET /api/profile`
2. 再打通 `GET /api/learning-path` 与资源详情
3. 最后接 SSE 对话与练习提交

---

## 6. 环境变量

```env
# frontend/.env.development
VITE_API_BASE=/api
```

---

## 7. 类型与契约

- 共享类型：`src/types/index.ts`
- 接口路径：`src/lib/api/endpoints.ts`
- 请求函数：`src/lib/api/client.ts`

后端若提供 OpenAPI，可将类型生成到 `src/types/api.generated.ts` 并与上述文件对齐。

---

## 8. 非前端范围（供沟通）

以下由后端/运维负责，前端仅调用：

- 模型推理、RAG、事实校验逻辑
- 文件存储（OSS）与视频转码
- 敏感词库维护
- WebSocket 网关（若不用 SSE）

---

*文档版本：与当前 frontend 源码同步，如有路由增删请同步更新本节。*
