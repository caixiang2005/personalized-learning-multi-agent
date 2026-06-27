# 前端与后端对接说明

> **当前状态（2026-06-27）**  
> - **已对接（P0/P1/P2）**：user-service（`:8001`）、learn-service 画像/路径/资源/练习/analytics/chat 反馈（`:8002`）、agent-service 对话·画像·路径·video RAG（`:8003`）、登录后 `bootstrapAppData`、Account stats、练习 `sync-profile`  
> - **已对接**：主链路 + safety + 访客 SSE  
>
> **快速对照**：[待与后端同步清单.md](./待与后端同步清单.md)（推荐先看）  
> **代码标记**：搜索 **`【待同步后端】`** · **`【当前 Mock】`**

---

## 0. 现在 vs 联调后

| 项目 | 现在（已实现） | 待完善 |
|------|----------------|--------|
| 用户认证 | ✅ `lib/api/user.ts` → user-service（含 refreshToken） | — |
| 个人信息 `/account` | ✅ getProfile / updateProfile / stats | — |
| 登录用户辅导 `/chat` | ✅ SSE + upload + regenerate + feedback | — |
| 访客助手 Landing | ✅ `POST /api/agent/unlogin/chat/stream` | — |
| 画像智能体 `/profile-build` | ✅ agent + finalize | — |
| 路径智能体 `/path/plan` | ✅ path-plan + generate | — |
| 六维画像 `/profile` | ✅ GET/PATCH + bootstrap + 练习回写薄弱点 | — |
| 学习路径 `/path/view` | ✅ GET + resource-status | — |
| 资源 / 练习 | ✅ resources/:id · exercises/generate · sync-profile | — |
| 评估 / 计划 / 搜题 | ✅ analytics · plan · scan 全接 API | — |

---

## 1. 技术约定

| 项目 | 说明 |
|------|------|
| API 根路径 | `/api`，环境变量 `VITE_API_BASE`（默认 `/api`） |
| 认证 | JWT · `Authorization: Bearer <access_token>` · `localStorage` 存 token / refresh_token |
| Agent 响应壳 | `{ code, msg, data: { ai_reply } }`，`code===200` |
| User 响应壳 | 同上 |
| 辅导对话 | 主路径 SSE · `POST /api/chat/send/stream` 或 `POST /api/agent/chat/stream` |
| 非流式回退 | `POST /api/agent/chat` + `simulateStream` |

### 1.1 Vite 开发代理（`vite.config.ts` 现状）

| 前缀 | 目标 | 用途 |
|------|------|------|
| `/api/agent` | `http://127.0.0.1:8003` | agent-service（优先匹配） |
| `/api/profile` · `/api/learning-path` · `/api/plan` · `/api/chat` · `/api/analytics` · `/api/resources` · `/api/exercises` · `/api/admin` | `http://127.0.0.1:8002` | learn-service |
| `/static` | `http://127.0.0.1:8001` | user-service 头像静态文件 |
| `/api`（兜底） | `http://127.0.0.1:8001` | user-service 认证等 |
| `/bili-api` | `https://api.bilibili.com` | B 站封面（视频卡片，非业务后端） |

### 1.2 Agent 对话（agent-service :8003）

**统一请求体**

```json
{ "user_input": "用户消息", "session_id": "uuid-v4" }
```

**统一成功响应**

```json
{ "code": 200, "msg": "success", "data": { "ai_reply": "Markdown 字符串" } }
```

| 接口 | 路径 | 前端 | 环境变量 |
|------|------|------|----------|
| 访客 | `POST /api/agent/unlogin/chat` · `/stream` | `guestChat.ts` · `GuestChatDrawer` | `VITE_GUEST_CHAT_MOCK=1` 强制 Mock |
| 登录辅导 | `POST /api/agent/chat` | `agentChat.ts` · `/chat` | `VITE_AGENT_CHAT_MOCK=1` 强制 Mock |
| 画像构建 | `POST /api/agent/profile-build` · finalize | `profileBuildChat.ts` · `/profile-build` | `VITE_PROFILE_BUILD_API=0` 切本地 |
| 路径规划 | `POST /api/agent/path-plan` | `pathPlanChat.ts` · `/path/plan` | `VITE_PATH_PLAN_API=0` 切本地 |

**session 策略**

- 访客：Landing 抽屉内固定 UUID，刷新页面重置  
- 辅导：`agentChat.ts` 页级 session；点「新对话」`resetAgentSessionId()`  
- 画像 / 路径：消息存 Zustand，**未**走 agent chat Redis（各自独立通道）

**RAG**：`knowledge_chunks` + `video_resources` 双表检索已接入（`chat_service.retrieve_rag_context`）。

---

## 2. 页面路由与后端关系

### 2.1 公开页

| 路由 | 页面 | 后端依赖 |
|------|------|----------|
| `/` | `Landing.tsx` | `POST /api/agent/unlogin/chat` |
| `/login` | `Login.tsx` | user-service 登录 **已接** |
| `/register` | `Register.tsx` | 注册 **已接** |
| `/reset-password` | `ResetPassword.tsx` | 重置密码 **已接** |

### 2.2 登录后主流程（赛题 IA）

| 路由 | 页面 | 智能体/模块 | 后端依赖 |
|------|------|-------------|----------|
| `/home` | `Home.tsx` | 工作台 / 画像入口 | ✅ bootstrap → `GET /api/profile` |
| `/profile-build` | `Chat.tsx` | **画像智能体** | `POST /api/agent/profile-build` · `PUT /api/profile` |
| `/chat` | `Chat.tsx` | **知识库辅导** | `POST /api/agent/chat` · 未完成画像会重定向 profile-build |
| `/path` | `LearningPath.tsx` | 路径中心 | `GET /api/learning-path` |
| `/path/plan` | `PathPlan.tsx` | **路径智能体** | `POST /api/agent/path-plan` · `POST /api/learning-path/generate` |
| `/path/view` | `PathDetail.tsx` | 阶段+资源推送 | `GET /api/learning-path` · `PUT resource-status` |
| `/profile` | `Profile.tsx` | 六维雷达图 | `GET/POST /api/profile` · `/api/profile/patch` |
| `/resource/:id` | `ResourceDetail.tsx` | 多模态详情 | `GET /api/resources/:id` |
| `/exercise/:id` | `ExercisePage.tsx` | 题库 | `GET/POST /api/exercises/:id` |
| `/analytics` | `Analytics.tsx` | 效果评估 | `GET /api/analytics/*` |
| `/plan` | `DailyPlan.tsx` | 日计划 | ✅ `GET /api/plan/daily` · `POST …/tasks/:id/toggle` |
| `/scan` | `Scan.tsx` | 拍照搜题 | ✅ `POST /api/agent/scan` |
| `/account` | `Account.tsx` | 个人信息 | `GET/POST /api/user/getProfile` 等 **已封装** |
| `/account/security` | `AccountSecurity.tsx` | 安全设置 | user-service |
| `/settings` | `Settings.tsx` | 设置/退出 | 本地清 token |

### 2.3 用户门禁（前端逻辑，联调时数据需一致）

```
未完成画像（isProfileReady === false）
  ├─ 访问 /chat        → 重定向 /profile-build（fromTutorGate 提醒）
  └─ 访问 /path/plan   → 重定向 /profile-build（fromPathGate 提醒）

画像完成判定：`learnerDimensions` 中 `source` 含「对话画像构建」或「用户手动更新」，或六维 `value` 均 &gt; 0（`profileReady.ts`）
```

---

## 3. 接口清单（按模块）

路径常量：**`src/lib/api/endpoints.ts`** · 类型：**`src/types/index.ts`** · **`src/types/account.ts`**

### 3.1 用户认证 `API.user`（**:8001** · **已对接**）

文档：`backend/user-service/frontend-handoff.md` · 实现：`lib/api/user.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/sendRegEmailCode` | 注册发码 |
| POST | `/api/user/register` | 注册 |
| POST | `/api/user/sendLoginEmailCode` | 登录发码 |
| POST | `/api/user/login` | 邮箱+密码 |
| POST | `/api/user/loginByUsername` | 用户名+密码 |
| POST | `/api/user/loginByEmailCode` | 验证码登录 |
| GET | `/api/user/getUserInfo` | Bearer |
| POST | `/api/user/refreshToken` | 刷新 token · 响应 `{ newToken, newRefreshToken }` |
| POST | `/api/user/sendResetEmailCode` | 重置发码 |
| POST | `/api/user/resetPwd` | 重置密码 |

登出：前端 `logoutLocal()` 清 token，无后端接口。

### 3.2 个人信息 `API.user` 扩展（Account 页）

实现：`lib/api/account.ts`（axios）

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/user/getProfile` | `UserProfileData` | 已封装 |
| POST | `/api/user/updateProfile` | 部分更新 | 已封装 |
| POST | `/api/user/uploadAvatar` | multipart `file` | 已封装 |
| GET | `/api/user/stats` | 四指标汇总 | ✅ 已接 |

登录后 `AuthBootstrap` → `hydrateAccountProfile()` 同步昵称/头像到 store。

### 3.3 学习画像 `API.profile`

| 方法 | 路径 | 说明 | 前端 |
|------|------|------|------|
| GET | `/api/profile` | 完整 `LearningProfile` | ✅ `dataBootstrap` · `fetchProfile` |
| PUT | `/api/profile` | 更新字段 | ✅ finalize 等 |
| POST | `/api/profile/patch` | `{ note }` 触发重算 | ✅ `Profile.tsx` |
| GET | `/api/profile/dimensions` | 维度详情（可选） | `Profile.tsx` |

**画像构建完成**（`/profile-build`）：前端 `finalizeProfileBuild()` 写 store；联调后应同步 `PUT /api/profile`。

> **注意**：路径生成已 **不再** 从 `/home` 的 `handleSubmit` 触发，改为 `/path/plan` 路径智能体流程。

### 3.4 对话 `API.chat`（规划中 · 非辅导主路径）

辅导当前走 **`API.agent.chat`**。以下接口供后续多模态流式 / 会话管理：

| 方法 | 路径 | 说明 | 前端 |
|------|------|------|------|
| GET | `/api/chat/sessions` | 历史会话 | ✅ `Chat.tsx` 侧边栏 |
| GET | `/api/chat/sessions/:id/messages` | 消息列表 | ✅ 切换会话 |
| POST | `/api/chat/send/stream` | SSE 流式 | ✅ 辅导主路径（有 session 时） |
| POST | `/api/chat/feedback` | 消息反馈 | ✅ `MessageBubble` |
| POST | `/api/chat/upload` | multipart 附件 · 可选 OCR | ✅ `Chat.tsx` |
| POST | `/api/chat/regenerate` · `/regenerate/stream` | 重生成最后一条 AI 回复 | ✅ `MessageBubble` |

**SSE 建议格式**

```text
data: {"type":"text","content":"部分文字"}
data: {"type":"resource","resource":{...},"progress":30}
data: {"type":"done"}
data: {"type":"error","content":"错误说明"}
```

### 3.5 学习路径 `API.path`

| 方法 | 路径 | 说明 | 前端 |
|------|------|------|------|
| GET | `/api/learning-path` | `{ meta, stages }` | ✅ bootstrap · `/path/view` |
| POST | `/api/learning-path/generate` | 生成/保存路径 | ✅ `PathPlan` |
| PUT | `/api/learning-path/resource-status` | 资源学习状态 | ✅ `PathDetail` 乐观更新 |
| GET | `/api/resources/:id` | 资源详情 | ✅ `ResourceDetail` |

**资源类型**：`document | mindmap | exercise | video | practice`

**跳转**：`exercise` → `/exercise/:id` · 其它 → `/resource/:id`

**路径 JSON 结构**：见 [待与后端同步清单.md §〇·三](./待与后端同步清单.md)

### 3.6 练习 `API.exercise`

| 方法 | 路径 | 前端 |
|------|------|------|
| GET | `/api/exercises/:id` | ✅ `ExercisePage` |
| POST | `/api/exercises/:id/submit` | ✅ 提交批改 |
| POST | `/api/exercises/generate` | ✅ AI 出题 |

### 3.7 效果评估 `API.analytics`

| 方法 | 路径 | 前端 |
|------|------|------|
| GET | `/api/analytics/overview` | ✅ `Analytics.tsx` |
| GET | `/api/analytics/activity` | ✅ 热力图 |
| GET | `/api/analytics/weak-points` | 同上 |
| GET | `/api/analytics/suggestions` | 同上 |

### 3.8 内容安全 `API.safety`

| 方法 | 路径 | 前端 |
|------|------|------|
| POST | `/api/safety/check` | 敏感词检测 | ✅ `stream.ts`（API 优先，本地 fallback） |

### 3.9 辅助功能

| 能力 | 路径 | 前端 | Fallback |
|------|------|------|----------|
| 日计划 | `GET /api/plan/daily` · `POST /api/plan/tasks/:id/toggle` | `DailyPlan.tsx` · `lib/api/learn.ts` | — |
| 拍照搜题 | `POST /api/agent/scan` | `Scan.tsx` | — |

---

## 4. 各页面对接检查表

### Login / Register / ResetPassword

- [x] user-service 认证路径（`lib/api/user.ts`）
- [x] `refreshToken` 响应字段 `{ newToken, newRefreshToken }` 已对齐

### AuthBootstrap

- [x] `GET /api/user/getUserInfo`
- [x] `hydrateAccountProfile()` → getProfile
- [x] 登录后 `bootstrapAppData()` → profile / learning-path / sessions

### Account `/account`

- [x] `GET /api/user/getProfile`
- [x] `POST /api/user/updateProfile`
- [x] `POST /api/user/uploadAvatar`
- [x] `GET /api/user/stats`

### Home `/home`

- [x] 数据来自 bootstrap 后的 store
- [x] 未完成画像 → 跳转 `/profile-build`

### Profile Build `/profile-build`

- [x] `POST /api/agent/profile-build`
- [x] finalize → learn-service 持久化六维画像

### Chat `/chat`（智能辅导）

- [x] `POST /api/agent/chat`（非 Mock 时）
- [x] `POST /api/chat/feedback`
- [x] `POST /api/chat/send/stream` · `POST /api/agent/chat/stream`（SSE 主路径）
- [x] `POST /api/chat/upload` · regenerate

### Path Hub `/path`

- [x] `GET /api/learning-path`

### Path Plan `/path/plan`

- [x] `POST /api/agent/path-plan`
- [x] `POST /api/learning-path/generate`

### Path View `/path/view`

- [x] `GET /api/learning-path`
- [x] `PUT /api/learning-path/resource-status`

### Profile `/profile`

- [x] 数据来自 bootstrap / patch 回写
- [x] `POST /api/profile/patch`

### Resource / Exercise

- [x] `GET /api/resources/:id`
- [x] `GET/POST /api/exercises/:id` · `POST …/generate`

### Analytics / Plan / Scan

- [x] `GET /api/analytics/*`（含 activity 热力）
- [ ] plan · scan 接口

### Landing `/`

- [x] `POST /api/agent/unlogin/chat` · `/stream`（非 Mock 时）

---

## 5. Mock 切换与环境变量

| 变量 | 作用 |
|------|------|
| `VITE_API_BASE` | API 根，默认 `/api` |
| `VITE_USE_MOCK=true` | 认证 + Account 不请求后端 |
| `VITE_AGENT_CHAT_MOCK=1` | 辅导强制 Mock |
| `VITE_GUEST_CHAT_MOCK=1` | 访客强制 Mock |
| `VITE_PROFILE_BUILD_API=0` | 画像 agent 切回本地引导 |
| `VITE_PATH_PLAN_API=0` | 路径 agent 切回本地引导 |
| `VITE_STATIC_ORIGIN` | 头像 URL 前缀，默认 `http://127.0.0.1:8001` |

| 文件 | 作用 |
|------|------|
| `lib/mockData.ts` | 空画像模板与演示样例（bootstrap 后以 API 为准） |
| `lib/generateLearningPath.ts` | 路径 generate API 失败或 `VITE_PATH_PLAN_API=0` 时的 fallback |
| `lib/mockDailyPlan.ts` | 进度计算 + PlanChatPanel 演示文案 |
| `lib/stream.ts` | SSE 解析 · 非流式打字回退 · 本地敏感词 |
| `store/useAppStore.ts` | Zustand persist（服务端为权威源，localStorage 作缓存） |

**推荐联调顺序（当前进度）**

1. ✅ user-service：认证 → getProfile / stats  
2. ✅ agent：unlogin/chat → agent/chat（含 video RAG）  
3. ✅ profile-build + profile CRUD  
4. ✅ path-plan + learning-path + resources + exercises  
5. ✅ exercises submit → 画像薄弱点回写（sync-profile）  
6. ⏳ plan · scan · SSE 主路径升级  

---

## 6. 类型与契约

| 文件 | 内容 |
|------|------|
| `src/types/index.ts` | `LearningProfile` · `PathStage` · `LearningPathMeta` · 资源类型 |
| `src/types/account.ts` | Account 页 DTO |
| `src/lib/api/endpoints.ts` | 全部 REST 路径 |
| `src/lib/api/agent.ts` | Agent 请求/响应封装 |

后端 OpenAPI 可生成 `src/types/api.generated.ts` 并与上述对齐。

---

## 7. Store 与持久化（联调注意）

`useAppStore` persist 字段：`profile` · `profileInitialized` · `pathStages` · `learningPathMeta` · `pathPlanMessages` · 登录态等。

**未 persist**：`profileBuildMessages` · `tutorMessages` · `sessions`（刷新丢失）。

联调后应以服务端为权威数据源。

---

## 8. 非前端范围

- 模型推理、RAG、多智能体编排、事实校验  
- OSS / 视频转码、敏感词库维护  
- WebSocket（若不用 SSE）  

---

*与 [待与后端同步清单.md](./待与后端同步清单.md) 配套维护；路由或 agent 通道变更时请同步更新两文档。*
