# 前端与后端对接说明

> **当前状态（2026-06）**  
> - **已对接**：user-service 认证（`:8001`）、Account 资料接口封装、agent-service 登录/访客对话（`:8003`，非 Mock 时）  
> - **仍为 Mock**：画像构建、路径规划、画像/路径服务端持久化、SSE 主路径、练习/资源详情、评估/日计划/搜题等  
>
> **快速对照**：[待与后端同步清单.md](./待与后端同步清单.md)（推荐先看）  
> **代码标记**：搜索 **`【待同步后端】`** · **`【当前 Mock】`**

---

## 0. 现在 vs 联调后

| 项目 | 现在 | 联调后 |
|------|------|--------|
| 用户认证 | `lib/api/user.ts` → user-service | 同上 |
| 个人信息 `/account` | `lib/api/account.ts`（getProfile 等；stats 失败 fallback） | 全量走 user-service |
| 登录用户辅导 `/chat` | `POST /api/agent/chat` + 前端打字模拟 | 同上；可选升级 SSE |
| 访客助手 Landing | `POST /api/agent/unlogin/chat` | 同上 |
| 画像智能体 `/profile-build` | `profileBuildChat.ts` 本地多轮 | `POST /api/agent/profile-build` |
| 路径智能体 `/path/plan` | `pathPlanChat.ts` + `generateLearningPath.ts` | path-plan + learning-path/generate |
| 六维画像 `/profile` | Zustand + localStorage | `GET/PUT /api/profile` |
| 学习路径 `/path/view` | store.pathStages | `GET /api/learning-path` |
| 评估 / 计划 / 搜题 | `mockData` · 页内 mock | 各模块 REST |

---

## 1. 技术约定

| 项目 | 说明 |
|------|------|
| API 根路径 | `/api`，环境变量 `VITE_API_BASE`（默认 `/api`） |
| 认证 | JWT · `Authorization: Bearer <access_token>` · `localStorage` 存 token / refresh_token |
| Agent 响应壳 | `{ code, msg, data: { ai_reply } }`，`code===200` |
| User 响应壳 | 同上 |
| 辅导对话 | 当前主路径：**非 SSE** · `POST /api/agent/chat` · 前端 `simulateStream` 打字 |
| 规划中的 SSE | `POST /api/chat/stream` · 格式见 §3.4 |

### 1.1 Vite 开发代理（`vite.config.ts` 现状）

| 前缀 | 目标 | 用途 |
|------|------|------|
| `/api/agent` | `http://127.0.0.1:8003` | agent-service（优先匹配） |
| `/static` | `http://127.0.0.1:8001` | user-service 头像静态文件 |
| `/api` | `http://127.0.0.1:8001` | user-service 及其它 REST |
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
| 访客 | `POST /api/agent/unlogin/chat` | `guestChat.ts` · `GuestChatDrawer` | `VITE_GUEST_CHAT_MOCK=1` 强制 Mock |
| 登录辅导 | `POST /api/agent/chat` | `agentChat.ts` · `/chat` | `VITE_AGENT_CHAT_MOCK=1` 强制 Mock |
| 画像构建 | `POST /api/agent/profile-build` | `profileBuildChat.ts` · `/profile-build` | `VITE_PROFILE_BUILD_API=1` |
| 路径规划 | `POST /api/agent/path-plan` | `pathPlanChat.ts` · `/path/plan` | `VITE_PATH_PLAN_API=1` |

**session 策略**

- 访客：Landing 抽屉内固定 UUID，刷新页面重置  
- 辅导：`agentChat.ts` 页级 session；点「新对话」`resetAgentSessionId()`  
- 画像 / 路径：消息存 Zustand，**未**走 agent chat Redis（各自独立通道）

**RAG 待办**：`video_resources` 表未接入检索，视频类问题可能仍回复「知识库无收录」——见清单 §〇·二。

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
| `/home` | `Home.tsx` | 工作台 / 画像入口 | `GET /api/profile`（建议） |
| `/profile-build` | `Chat.tsx` | **画像智能体** | `POST /api/agent/profile-build` · `PUT /api/profile` |
| `/chat` | `Chat.tsx` | **知识库辅导** | `POST /api/agent/chat` · 未完成画像会重定向 profile-build |
| `/path` | `LearningPath.tsx` | 路径中心 | `GET /api/learning-path` |
| `/path/plan` | `PathPlan.tsx` | **路径智能体** | `POST /api/agent/path-plan` · `POST /api/learning-path/generate` |
| `/path/view` | `PathDetail.tsx` | 阶段+资源推送 | `GET /api/learning-path` · `PUT resource-status` |
| `/profile` | `Profile.tsx` | 六维雷达图 | `GET/POST /api/profile` · `/api/profile/patch` |
| `/resource/:id` | `ResourceDetail.tsx` | 多模态详情 | `GET /api/resources/:id` |
| `/exercise/:id` | `ExercisePage.tsx` | 题库 | `GET/POST /api/exercises/:id` |
| `/analytics` | `Analytics.tsx` | 效果评估 | `GET /api/analytics/*` |
| `/plan` | `DailyPlan.tsx` | 日计划 | `GET /api/plan/daily`（**endpoints 待登记**） |
| `/scan` | `Scan.tsx` | 拍照搜题 | `POST /api/scan/ocr`（**endpoints 待登记**） |
| `/account` | `Account.tsx` | 个人信息 | `GET/POST /api/user/getProfile` 等 **已封装** |
| `/account/security` | `AccountSecurity.tsx` | 安全设置 | user-service |
| `/settings` | `Settings.tsx` | 设置/退出 | 本地清 token |

### 2.3 用户门禁（前端逻辑，联调时数据需一致）

```
未完成画像（isProfileReady === false）
  ├─ 访问 /chat        → 重定向 /profile-build（fromTutorGate 提醒）
  └─ 访问 /path/plan   → 重定向 /profile-build（fromPathGate 提醒）

画像完成判定：learnerDimensions 中 source === "对话画像构建"
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
| POST | `/api/user/refreshToken` | 刷新 token（字段名与后端待确认） |
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
| GET | `/api/user/stats` | 四指标汇总 | 已封装；失败 fallback mock |

登录后 `AuthBootstrap` → `hydrateAccountProfile()` 同步昵称/头像到 store。

### 3.3 学习画像 `API.profile`

| 方法 | 路径 | 说明 | 前端 |
|------|------|------|------|
| GET | `/api/profile` | 完整 `LearningProfile` | store 初始化（**未接**） |
| PUT | `/api/profile` | 更新字段 | 按需 |
| POST | `/api/profile/patch` | `{ note }` 触发重算 | `Profile.tsx`（**Mock setTimeout**） |
| GET | `/api/profile/dimensions` | 维度详情（可选） | `Profile.tsx` |

**画像构建完成**（`/profile-build`）：前端 `finalizeProfileBuild()` 写 store；联调后应同步 `PUT /api/profile`。

> **注意**：路径生成已 **不再** 从 `/home` 的 `handleSubmit` 触发，改为 `/path/plan` 路径智能体流程。

### 3.4 对话 `API.chat`（规划中 · 非辅导主路径）

辅导当前走 **`API.agent.chat`**。以下接口供后续多模态流式 / 会话管理：

| 方法 | 路径 | 说明 | 前端 |
|------|------|------|------|
| GET | `/api/chat/sessions` | 历史会话 | `Chat.tsx` 侧边栏（**Mock sessions**） |
| GET | `/api/chat/sessions/:id/messages` | 消息列表 | 切换会话（**未接**） |
| POST | `/api/chat/stream` | SSE 流式 | 未接 · 类型 `StreamChunk` |
| POST | `/api/chat/feedback` | 有用/没用/收藏 | `MessageBubble`（**disabled**） |
| POST | `/api/chat/upload` | 附件 | `Chat.tsx`（**disabled**） |

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
| GET | `/api/learning-path` | `{ meta, stages }` | `/path/view` 进入时（**未接**） |
| POST | `/api/learning-path/generate` | 生成/保存路径 | `PathPlan` 完成规划（**未接**，本地 `generateLearningPath`） |
| PUT | `/api/learning-path/resource-status` | 资源学习状态 | `PathDetail` 标记（**未接**，仅 store） |
| GET | `/api/resources/:id` | 资源详情 | `ResourceDetail`（**未接**） |

**资源类型**：`document | mindmap | exercise | video | practice`

**跳转**：`exercise` → `/exercise/:id` · 其它 → `/resource/:id`

**路径 JSON 结构**：见 [待与后端同步清单.md §〇·三](./待与后端同步清单.md)

### 3.6 练习 `API.exercise`

| 方法 | 路径 | 前端 |
|------|------|------|
| GET | `/api/exercises/:id` | `ExercisePage`（页内 mockQuestions） |
| POST | `/api/exercises/:id/submit` | 提交批改 · 应回写画像（**未接**） |

### 3.7 效果评估 `API.analytics`

| 方法 | 路径 | 前端 |
|------|------|------|
| GET | `/api/analytics/overview` | `Analytics.tsx` · `mockData.analyticsData` |
| GET | `/api/analytics/weak-points` | 同上 |
| GET | `/api/analytics/suggestions` | 同上 |

### 3.8 内容安全 `API.safety`

| 方法 | 路径 | 前端 |
|------|------|------|
| POST | `/api/safety/check` | 可选；当前 `stream.ts` 本地关键词 |

### 3.9 辅助功能（前端已用 Mock · endpoints 待登记）

| 能力 | 建议路径 | Mock 文件 |
|------|----------|-----------|
| 日计划 | `GET /api/plan/daily` · `POST /api/plan/tasks/:id/complete` | `mockDailyPlan.ts` |
| 拍照搜题 | `POST /api/scan/ocr` · `POST /api/scan/analyze` | `mockScan.ts` |

---

## 4. 各页面对接检查表

### Login / Register / ResetPassword

- [x] user-service 认证路径（`lib/api/user.ts`）
- [ ] `refreshToken` 响应字段与 `RefreshTokenData` 对齐

### AuthBootstrap

- [x] `GET /api/user/getUserInfo`
- [x] `hydrateAccountProfile()` → getProfile
- [ ] 登录后 `GET /api/profile` 拉六维画像

### Account `/account`

- [x] `GET /api/user/getProfile`
- [x] `POST /api/user/updateProfile`
- [x] `POST /api/user/uploadAvatar`
- [ ] `GET /api/user/stats`（稳定返回，去掉 fallback）

### Home `/home`

- [ ] `GET /api/profile`（驾驶舱数据）
- [x] 未完成画像 → 跳转 `/profile-build`（纯前端）

### Profile Build `/profile-build`

- [ ] `POST /api/agent/profile-build`
- [ ] 完成时 `PUT /api/profile` 持久化六维画像

### Chat `/chat`（智能辅导）

- [x] `POST /api/agent/chat`（非 Mock 时）
- [ ] `GET /api/chat/sessions` · messages
- [ ] `POST /api/chat/stream`（若改 SSE）
- [ ] feedback · upload

### Path Hub `/path`

- [ ] `GET /api/learning-path`（有路径时展示 meta）

### Path Plan `/path/plan`

- [ ] `POST /api/agent/path-plan`
- [ ] `POST /api/learning-path/generate`

### Path View `/path/view`

- [ ] `GET /api/learning-path`
- [ ] `PUT /api/learning-path/resource-status`

### Profile `/profile`

- [ ] `GET /api/profile`
- [ ] `POST /api/profile/patch`

### Resource / Exercise

- [ ] `GET /api/resources/:id`
- [ ] `GET/POST /api/exercises/:id`

### Analytics / Plan / Scan

- [ ] `GET /api/analytics/*`
- [ ] plan · scan 接口（待定义）

### Landing `/`

- [x] `POST /api/agent/unlogin/chat`（非 Mock 时）

---

## 5. Mock 切换与环境变量

| 变量 | 作用 |
|------|------|
| `VITE_API_BASE` | API 根，默认 `/api` |
| `VITE_USE_MOCK=true` | 认证 + Account 不请求后端 |
| `VITE_AGENT_CHAT_MOCK=1` | 辅导强制 Mock |
| `VITE_GUEST_CHAT_MOCK=1` | 访客强制 Mock |
| `VITE_PROFILE_BUILD_API=1` | 画像 agent 走远程 |
| `VITE_PATH_PLAN_API=1` | 路径 agent 走远程 |
| `VITE_STATIC_ORIGIN` | 头像 URL 前缀，默认 `http://127.0.0.1:8001` |

| 文件 | 作用 |
|------|------|
| `lib/mockData.ts` | 演示静态数据 · `blankProfile` · `analyticsData` 等 |
| `lib/generateLearningPath.ts` | 本地路径生成（待 replace generate API） |
| `lib/stream.ts` | 打字模拟 · 本地敏感词 |
| `store/useAppStore.ts` | Zustand persist（profile/path 等写 localStorage） |

**推荐联调顺序**

1. user-service：认证 → getProfile / updateProfile / stats  
2. agent：unlogin/chat → agent/chat（含 video RAG）  
3. profile-build agent + `GET/PUT /api/profile`  
4. path-plan + learning-path CRUD + resources  
5. exercises submit → 画像回写  
6. analytics · plan · scan · chat/sessions · SSE  

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
