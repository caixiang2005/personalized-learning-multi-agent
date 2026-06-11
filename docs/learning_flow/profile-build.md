# 画像智能体 · profile-build

> **状态**：后端待实现 · 前端 Mock（`VITE_PROFILE_BUILD_API=1` 可切远程）  
> **路由**：`/profile-build` · **接口**：`POST /api/agent/profile-build`

## 职责

- 多轮自然语言对话，抽取专业、学习目标、薄弱点、资源偏好  
- 完成后生成 **≥6 维** `LearningProfile`（`source: "对话画像构建"`）  
- **不**调用知识库 RAG Chat，与智能辅导会话隔离  

## 请求 / 响应（与 chat 一致，待 agent-service 实现）

```json
POST /api/agent/profile-build
{ "user_input": "...", "session_id": "uuid" }

→ { "code": 200, "data": { "ai_reply": "Markdown" } }
```

## 前端

- 页面：`frontend/src/pages/Chat.tsx`（`pathname === /profile-build`）  
- 逻辑：`frontend/src/lib/profileBuildChat.ts`  
- 完成：`finalizeProfileBuild()` → `PUT /api/profile`（待接）

## 相关文档

- [path-plan.md](./path-plan.md) — 路径智能体（下一步）  
- [../agent_docs/chat.md](../agent_docs/chat.md) — 辅导 RAG（画像完成后）  
- [../agent_docs/unlogin_chat.md](../agent_docs/unlogin_chat.md) — 访客 Agent  
- [../../frontend/待与后端同步清单.md](../../frontend/待与后端同步清单.md)
