# 知识库 RAG 聊天机器人

## 接口

```
POST /api/agent/chat
Content-Type: application/json

请求：
{"user_input": "Python 列表推导式怎么用？", "session_id": "550e8400-e29b-41d4-a716-446655440000"}

成功：
{"code": 200, "msg": "success", "data": {"ai_reply": "回答内容（Markdown 格式）"}}

服务端错误：
{"code": 500, "msg": "服务器内部错误，请稍后再试", "data": null}
```

前端收到 `ai_reply` 为 Markdown 格式，含代码块、列表等。

## 核心逻辑

### 完整流程

```
用户问题
    ↓
BGE 模型（BAAI/bge-small-zh-v1.5）将问题转为 512 维向量
    ↓
PGVector 检索：knowledge_chunks 表，cosine 相似度召回 top-5
    ↓
构建 System Prompt（含召回的 5 条知识上下文 + 系统提示词）
    ↓
拼接历史消息（最近 20 轮）→ 调 DeepSeek API → 生成回答
    ↓
回答写入 Redis 历史（key 格式 chat:{model}:{session_id}，TTL 7200 秒）
```

### 知识库检索

- **表名**：`knowledge_chunks`
- **知识源标识**：`collection = 'runoob'`
- **检索方式**：`embedding <=> %s::vector`（cosine 距离）
- **返回条数**：top-5
- **返回字段**：content（原文）、title（文档标题）、source（来源 URL）、category（分类）、section（章节名）、level（难度）
- **向量模型**：BAAI/bge-small-zh-v1.5（512 维，中文优化，离线部署）

### System Prompt

`core/prompts.py` 中 `KNOWLEDGE_CHAT_PROMPT` 定义，核心约束：

1. **基于知识库回答**：优先使用检索到的知识上下文，理解后用自己的话重述
2. **展示代码示例**：如果知识切片包含代码，在回答中展示并解释
3. **诚实处理未知**：未检索到相关内容时如实告知，用自己的知识尽力回答
4. **注明来源**：在回答末尾附上参考来源
5. **多轮对话**：支持最近 20 轮对话历史

### 已登录验证

目前不校验用户登录态，仅通过 `session_id` 隔离对话历史。登录校验由前端控制，后续可加入 token 验证。

## 依赖

| 依赖 | 用途 |
|------|------|
| `sentence-transformers` | BGE 中文 embedding 模型 |
| `psycopg2-binary` | PGVector 向量检索 |
| `pgvector` | PostgreSQL 向量类型支持 |
| `openai` | DeepSeek API 调用（OpenAI 兼容接口） |

## 配置（.env）

复用 `unlogin_chat` 的数据库配置：

```
PG_HOST=8.153.204.117
PG_PORT=5432
PG_USER=team_user
PG_PASSWORD=***
PG_DATABASE=project_db
DEEPSEEK_API_KEY=***
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

## 错误日志

存 PostgreSQL，表 `error_logs`，与 unlogin_chat 共用同一套日志逻辑。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 自增主键 |
| service | VARCHAR(50) | 所属服务，默认 `agent-service` |
| session_id | VARCHAR(255) | 触发错误的用户会话 |
| error_type | VARCHAR(100) | 错误类型：`CONFIG_ERROR` / `RedisError` / `DeepseekAPIError` / `KnowledgeSearchError` |
| message | TEXT | 错误描述 |
| detail | TEXT | 完整堆栈 |
| created_at | TIMESTAMP | 北京时间，n8n 按此轮询 |
