# n8n / Dify 集成

本目录已纳入本仓库，用于**答辩演示**与**运维告警**。  
产品前端主链路仍走本仓库三个微服务，**不依赖** Dify 才能登录学习。

| 位置 | 内容 |
|------|------|
| [n8n/](./n8n/) | 错误告警工作流 JSON + 说明 |
| [dify/](./dify/) | 5 个智能体提示词、SQL 种子脚本 |
| Docker 中的 n8n/Dify | 已按脚本导入/写入（本机 `localhost:5678` / `:8080`） |

## 架构关系

```
前端 :5173
  → user-service :8001（认证）
  → learn-service :8002（画像/路径/练习/分析）
  → agent-service :8003（画像/路径/辅导 Agent）

n8n :5678     → 轮询 user-service 错误日志 → 飞书
Dify :8080    → 控制台演示 5 个智能体（与 agent-service 提示词对齐）
```

## n8n（http://localhost:5678）

已导入：**智慧学习中心 · 错误告警推送飞书**

1. 改「推送飞书机器人」Webhook  
2. 本机 **user-service :8001** 需在跑  
3. 打开 **Active**

重导入：`n8n import:workflow --input=integrations/n8n/error-alert-feishu.json`

## Dify（http://localhost:8080）

库中已有（模型通义 `qwen3.6-plus`）：

- 画像构建智能体 / 路径规划智能体 / 智能辅导智能体  
- 资源生成智能体 / 内容安全智能体  

重写入：`psql -f integrations/dify/seed_agents.sql`（对 Dify 的 postgres）

## 本地跑通本项目

```powershell
# 三个后端 + 前端（在各自目录）
# user-service :8001 · learn-service :8002 · agent-service :8003
# frontend: npm run dev → http://127.0.0.1:5173
```

冒烟：`python backend/smoke_test.py`
