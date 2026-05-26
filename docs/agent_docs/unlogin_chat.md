# 未登录桌面端机器人

## 接口

```
POST /api/agent/unlogin/chat
Content-Type: application/json

请求：
{"user_input": "你好", "session_id": "550e8400-e29b-41d4-a716-446655440000"}

成功：
{"code": 200, "msg": "success", "data": {"ai_reply": "你好！👋 欢迎使用..."}}

3轮用完（第4轮起）：
{"code": 200, "msg": "success", "data": {"ai_reply": "✅ 你已经完成了 3 轮免费体验！\n\n登录后可以享受完整功能：..."}}

服务端错误：
{"code": 500, "msg": "服务器内部错误，请稍后再试", "data": null}
```

前端收到 `ai_reply` 为 Markdown 格式，含 emoji。

## 核心逻辑

- **限制**：未登录用户最多免费 3 轮对话，第 4 轮起直接返回登录引导文案（硬编码在 `unlogin_chat.py`，不调 AI）
- **System Prompt**：`core/prompts.py` 中定义，约束 AI 行为（引导注册、不闲聊、不生成完整资源）
- **会话**：按 `session_id` 存 Redis，key 格式 `unlogin:chat:{session_id}`，value 为 JSON 数组 `[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]`，TTL 3600 秒
- **AI 调用**：拼接 system prompt + 历史消息 → 调 Deepseek API → 回复存 Redis

## 错误日志

存 PostgreSQL，表 `error_logs`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 自增主键 |
| service | VARCHAR(50) | 所属服务，默认 `agent-service` |
| session_id | VARCHAR(255) | 触发错误的用户会话 |
| error_type | VARCHAR(100) | 错误类型：`CONFIG_ERROR` / `RedisError` / `DEEPSEEK_API_ERR` / `TimeoutException` / `RequestError` |
| message | TEXT | 错误描述 |
| detail | TEXT | 完整堆栈 |
| created_at | TIMESTAMP | 北京时间，n8n 按此轮询 |


