# n8n · 错误告警工作流

对接本项目 `user-service` 的 `error_logs`（见 `backend/user-service/error/README.md`）。

## 访问

- 控制台：http://localhost:5678
- 容器名：`n8n-n8n-1`

## 导入工作流

1. 打开 http://localhost:5678 并登录
2. **Workflows → Add workflow → ⋯ → Import from File**
3. 选择本目录 [`error-alert-feishu.json`](./error-alert-feishu.json)
4. 打开节点 **推送飞书机器人**，把 URL 换成你的飞书自定义机器人 Webhook  
   （或在 n8n 环境变量中设置 `FEISHU_WEBHOOK_URL`）
5. 确认 **拉取未推送错误** / **标记已推送** 的地址为：
   - `http://host.docker.internal:8001/api/error/unsent`
   - `http://host.docker.internal:8001/api/error/markSent`  
   （n8n 在 Docker 内访问本机 Windows 上的 user-service）
6. 右上角 **Active** 打开开关

## 前置条件

- 本机已启动 **user-service :8001**
- Docker Desktop / 引擎正常
- 已创建飞书群「自定义机器人」并拿到 Webhook

## 手动试跑

1. 在 n8n 工作流点 **Test workflow**
2. 或在本机故意触发错误（如错误密码登录）
3. 飞书应收到消息；数据库 `error_logs.is_sent` 变为 `true`

## 过滤策略

Code 节点会跳过 `ApiError401`（登录过期），减少刷屏。可按需修改过滤逻辑。
