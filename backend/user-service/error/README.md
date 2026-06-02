# 错误日志 · n8n 联调说明

`error_logs` 表已建在 `project_db`，user-service 写入 `service='user-service'` 且 `is_sent=false` 的记录，供 n8n 定时拉取并推送告警。

## 会自动记录的错误

### 1. 全部 API 业务错误（中间件）

凡响应 JSON 且 `code != 200`（HTTP 状态非 500）均写入，例如：

| error_type | 典型 msg |
|------------|----------|
| ApiError400 | 邮箱或密码错误、验证码错误、个人信息不存在、手机号格式错误… |
| ApiError401 | 登录已失效，请重新登录 |
| ApiError422 | 参数校验失败 |
| ApiError500 | 验证码发送失败、头像保存失败（业务层返回） |
| ApiError503 | 验证码保存失败，请检查 Redis 连接 |

### 2. 未捕获服务端异常（全局处理器）

| error_type | 说明 |
|------------|------|
| 异常类名 | 如 OperationalError、AttributeError |
| detail | 完整 Python 堆栈 |

### 3. 基础设施详细错误（业务模块内）

| error_type | 触发场景 |
|------------|----------|
| RedisConnectionError | 服务启动时 Redis 连接失败 |
| RedisUnavailable | 发验证码时 Redis 未连接 |
| RedisError | 验证码写入/校验时 Redis 不可用或操作异常 |
| SMTPConfigError | SMTP 配置不完整 |
| SMTPException / OSError | 发邮件失败（含堆栈） |
| OSError 等 | 头像文件保存失败（含堆栈） |

> 同一事件可能产生多条记录（如 SMTP 异常既有 `SMTPException` 堆栈，又有中间件 `ApiError500`），n8n 可按 `error_type` 过滤。

## 写入方式

- 上述场景**自动写入**
- 业务代码也可手动记录：

```python
from error import capture_exception, log_error, log_api_response

log_error("RedisError", "验证码写入失败", session_id="xxx", detail="...")
capture_exception(exc, session_id="xxx", context="send_verification_code")
log_api_response(503, "服务不可用", "POST /api/user/xxx", session_id="xxx")
```

## n8n 推荐流程

```
定时触发
  → GET http://127.0.0.1:8001/api/error/unsent?limit=50&service=user-service
  → 若有 data.items：组装消息推送到飞书/邮件等
  → POST http://127.0.0.1:8001/api/error/markSent
       Body: { "ids": [1, 2, 3], "service": "user-service" }
```

也可在 n8n 中直接用 PostgreSQL 节点：

```sql
SELECT * FROM error_logs
WHERE service = 'user-service' AND is_sent = false
ORDER BY created_at DESC
LIMIT 50;
```

推送成功后：

```sql
UPDATE error_logs
SET is_sent = true, sent_time = (now() AT TIME ZONE 'Asia/Shanghai')
WHERE id = ANY($1::bigint[]);
```

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/error/unsent` | 查询未推送错误，`limit` 默认 50 |
| POST | `/api/error/markSent` | 标记已推送，写入 `sent_time` |

### markSent 请求体

```json
{
  "ids": [1, 2, 3],
  "service": "user-service"
}
```

### unsent 响应 data.items 字段

| 字段 | 说明 |
|------|------|
| id | 主键 |
| service | 服务名 |
| sessionId | 会话 ID / 邮箱 / token 前缀 |
| errorType | 错误类型 |
| message | 简要描述 |
| detail | 堆栈或补充信息 |
| createdAt | 北京时间 |
| isSent | 是否已推送 |
| sentTime | 推送时间 |
