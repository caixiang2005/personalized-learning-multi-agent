# 文档导航（INDEX）

> 本文件 **不叫 README**，避免和仓库根目录的 [README.md](../README.md) 混淆。

## 目录结构

```
docs/
├── INDEX.md                 ← 你在这里（导航）
├── agent_docs/              ← 对话 / RAG 类 Agent（已实现或对接中）
│   ├── chat.md
│   └── unlogin_chat.md
├── learning_flow/           ← 学习流程智能体（画像 → 路径，待后端）
│   ├── profile-build.md
│   └── path-plan.md
├── design/
│   └── overview.md          ← 系统设计、模块规划
└── guides/
    └── git.md               ← Git 协作
```

> **`agent_docs`**：偏「问答 / 检索」接口文档。  
> **`learning_flow`**：偏「业务流程」— 先建画像、再规划路径，与 `/chat` 辅导分离。

---

## 先看这张表

| 你想… | 只看这一个 |
|--------|------------|
| 了解项目 | [../README.md](../README.md) |
| 模块规划 | [design/overview.md](./design/overview.md) |
| 联调接口 | [../frontend/待与后端同步清单.md](../frontend/待与后端同步清单.md) |
| RAG / 访客对话 | [agent_docs/](./agent_docs/) |
| 画像 / 路径智能体 | [learning_flow/](./learning_flow/) |
| Git | [guides/git.md](./guides/git.md) |

---

## 文档一览

| 目录 | 文件 | 接口 | 状态 |
|------|------|------|------|
| agent_docs | [chat.md](./agent_docs/chat.md) | `POST /api/agent/chat` | 已对接 |
| agent_docs | [unlogin_chat.md](./agent_docs/unlogin_chat.md) | `POST /api/agent/unlogin/chat` | 已对接 |
| learning_flow | [profile-build.md](./learning_flow/profile-build.md) | `POST /api/agent/profile-build` | 待实现 |
| learning_flow | [path-plan.md](./learning_flow/path-plan.md) | `POST /api/agent/path-plan` | 待实现 |

---

## 维护约定

- 问答类 Agent → `agent_docs/`  
- 流程类 Agent（画像、路径、资源生成等）→ `learning_flow/`（或后续再分子目录）  
- 架构变更 → `design/overview.md`
