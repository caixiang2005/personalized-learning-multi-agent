# user-service 前端联调一页纸

> **服务**：`backend/user-service` · **端口**：`8001`  
> **详细接口**：[frontend-api.md](./frontend-api.md) · **目录说明**：[README.md](./README.md)

---

## 1. 环境地址

| 项目 | 值 |
|------|-----|
| 本地直连 | `http://127.0.0.1:8001` |
| 接口前缀 | `/api/user/*` |
| 经前端 Vite 代理 | 浏览器请求 `/api/user/*` → 转发到 `127.0.0.1:8001`（端口以团队 `vite.config.ts` 为准） |
| Swagger | http://127.0.0.1:8001/docs |
| OpenAPI | http://127.0.0.1:8001/openapi.json |

**启动本服务**

```bash
cd backend/user-service
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

---

## 2. 鉴权与响应约定

### 响应壳（所有接口）

```json
{ "code": 200, "msg": "说明", "data": { } }
```

| code | 含义 | 前端处理建议 |
|------|------|----------------|
| 200 | 成功 | 读 `data` |
| 400 | 业务错误 | 提示 `msg` |
| 401 | 未登录 / token 失效 | 清 token，跳转登录 |
| 422 | 参数校验失败 | 展示校验信息 |
| 503 | Redis 不可用（验证码） | 提示稍后重试 |

> HTTP 状态码常为 200，**必须以 `code` 判断成败**。

### 鉴权

| 项目 | 约定 |
|------|------|
| Header | `Authorization: Bearer <access_token>` |
| 需登录接口 | `GET /api/user/getUserInfo`、`POST /api/user/refreshToken` |
| Token 存储 | 建议 `localStorage`：`access_token`、`refresh_token` |
| Token 生命周期 | **仅服务端内存**；重启 user-service 后全部失效 |
| 刷新 | `POST /api/user/refreshToken` 仅用 Header 带旧 access token；成功返回 `data.newToken` |

### 字段与密码

- 请求/响应 **camelCase**：`userId`、`registerTime`、`newPassword`
- 邮箱、用户名服务端会 **转小写**
- 密码规则 6–64 位；库存 **SHA256 十六进制**（非 bcrypt）

---

## 3. 业务流程

### 注册

```
POST sendRegEmailCode → POST register → POST login（注册不返回 token）
```

### 登录（三选一）

| 方式 | 接口 |
|------|------|
| 邮箱+密码 | `POST /api/user/login` |
| 用户名+密码 | `POST /api/user/loginByUsername` |
| 邮箱+验证码 | `sendLoginEmailCode` → `loginByEmailCode` |

登录成功后保存 `data.token`、`data.refreshToken`，可选 `GET getUserInfo`。

### 重置密码 / 登出

- 重置：`sendResetEmailCode` → `resetPwd`
- 登出：**无**后端接口，前端清除本地 token 即可

---

## 4. 接口路径一览（请按此对接）

| 功能 | 方法 | 路径 |
|------|------|------|
| 发注册验证码 | POST | `/api/user/sendRegEmailCode` |
| 发登录验证码 | POST | `/api/user/sendLoginEmailCode` |
| 注册 | POST | `/api/user/register` |
| 邮箱登录 | POST | `/api/user/login` |
| 用户名登录 | POST | `/api/user/loginByUsername` |
| 验证码登录 | POST | `/api/user/loginByEmailCode` |
| 用户信息 | GET | `/api/user/getUserInfo` |
| 刷新 token | POST | `/api/user/refreshToken`（Header，无 body） |
| 发重置验证码 | POST | `/api/user/sendResetEmailCode` |
| 重置密码 | POST | `/api/user/resetPwd` |

---

## 5. 测试与 Mock

### 真实联调

- 向后端索取测试账号（`project_db.users` 表已有用户）
- 验证码需 **Redis + SMTP**；约 60s 有效、60s 发送间隔
- 可自行走注册流程（邮件服务须可用）

### 前端若开启 Mock

与本文档无关，以团队前端 `VITE_USE_MOCK` 约定为准（常见假密码/验证码 `123456`）。

---

## 6. 依赖服务（后端）

| 依赖 | 说明 |
|------|------|
| PostgreSQL `project_db` | 表名 **`users`**，不自动建表 |
| Redis | 验证码 |
| SMTP | 发邮件 |

字段：`user_id`, `email`, `username`, `user_password`, `register_time`。

---

## 7. 已知缺口

| 能力 | 状态 |
|------|------|
| 服务端登出 | 未实现 |
| Token 持久化（Redis/DB） | 未实现 |

---

## 8. 联调自检

**后端**

- [ ] 服务在 **8001**，Redis 连接成功
- [ ] Swagger 可调通 `POST /api/user/login`

**前端**

- [ ] 请求路径与 §4 一致
- [ ] 鉴权接口带 `Authorization: Bearer …`
- [ ] 以响应 `code === 200` 判断成功

---

## 9. 文档索引

| 文档 | 内容 |
|------|------|
| [frontend-api.md](./frontend-api.md) | 全量接口与示例 |
| [../README.md](../README.md) | 本服务配置与启动 |

---

*端口 8001 · 库 `project_db` · 表 `users`*
