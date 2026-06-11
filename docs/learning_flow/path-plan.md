# 路径规划智能体 · path-plan

> **状态**：后端待实现 · 前端 Mock（`VITE_PATH_PLAN_API=1` 可切远程）  
> **路由**：`/path/plan` · **接口**：`POST /api/agent/path-plan`

## 职责

- 读取用户六维画像，多轮确认课程、薄弱点、资源偏好  
- 协同 **learning-path 服务** 生成三阶段路径  
- 每个知识点推送五类资源：文档 / 导图 / 题库 / 视频 / 实操  

## 请求 / 响应（待 agent-service 实现）

```json
POST /api/agent/path-plan
{ "user_input": "...", "session_id": "uuid" }

→ { "code": 200, "data": { "ai_reply": "Markdown" } }
```

生成路径持久化：

```json
POST /api/learning-path/generate
{ "session_id": "...", "profile_snapshot": { ... } }

→ { "meta": { ... }, "stages": [ ... ] }
```

## 前端

- 规划页：`frontend/src/pages/PathPlan.tsx`  
- 详情页：`frontend/src/pages/PathDetail.tsx`（`/path/view`）  
- 逻辑：`pathPlanChat.ts` · `generateLearningPath.ts`

## 前置条件

须先完成画像构建（见 [profile-build.md](./profile-build.md)）。

## 相关文档

- [../design/overview.md](../design/overview.md) — 模块总览  
- [../../frontend/待与后端同步清单.md](../../frontend/待与后端同步清单.md)
