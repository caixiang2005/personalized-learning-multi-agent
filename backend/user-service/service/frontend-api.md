# user-service 前端接口文档

> 依据 `backend/user-service` 当前实现整理。  
> **端口**：`8001` · **联调速览**：[frontend-handoff.md](./frontend-handoff.md)

---

## 1. 通用约定

### 1.1 基础地址

| 环境 | 说明 |
|------|------|
| 直连 | `http://127.0.0.1:8001/api/user/...` |
| 经前端代理 | 浏览器 `/api/user/...` 代理到本服务 `8001`（由前端工程配置） |

### 1.2 请求头

| Header | 值 | 说明 |
|--------|-----|------|
| `Content-Type` | `application/json` | 所有 POST |
| `Authorization` | `Bearer <token>` | 需登录接口；也支持直接传 token 字符串 |

### 1.3 统一响应格式

```ts
interface ApiResponse<T = unknown> {
  code: number;   // 200 成功；400 业务错误；401 未登录；503 服务不可用
  msg: string;
  data: T;
}
```

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 业务错误 |
| 401 | token 失效 |
| 422 | 参数校验失败 |
| 500 | 服务端异常 |
| 503 | Redis 不可用（验证码） |

### 1.4 Token

- 登录返回 `data.token`、`data.refreshToken`
- Token 存服务端内存，**重启服务后失效**
- 刷新返回 `data.newToken`，旧 access token 作废
- 邮箱、用户名入库/查询前转**小写**
- `registerTime`：北京时间 `Asia/Shanghai`，格式如 `2026-05-28T21:30:00+08:00`

---

## 2. 数据类型（TypeScript）

```ts
export interface UserInfo {
  userId: number;
  email: string;
  username: string;
  registerTime: string | null; // 北京时间 ISO 8601，如 2026-05-28T21:30:00+08:00
}

export interface LoginData extends UserInfo {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  newToken: string;
}
```

---

## 3. 接口列表

### 3.1 发送注册验证码

| | |
|--|--|
| **POST** | `/api/user/sendRegEmailCode` |
| **鉴权** | 否 |

```json
{ "email": "user@example.com" }
```

成功 `data`: `{}`  
常见 `msg`：注册验证码发送成功 / 验证码已发送，请稍后再试 / 邮箱格式错误 / Redis 未连接…

---

### 3.2 用户注册

| | |
|--|--|
| **POST** | `/api/user/register` |
| **鉴权** | 否 |

```json
{
  "email": "user@example.com",
  "username": "alice",
  "password": "123456",
  "code": "123456"
}
```

| 字段 | 约束 |
|------|------|
| username | 1–32 |
| password | 6–64 |
| code | 4–12，须先发注册验证码 |

成功 `data`：`userId`, `email`, `username`, `registerTime`（**无 token**）

---

### 3.3 发送登录验证码

| | |
|--|--|
| **POST** | `/api/user/sendLoginEmailCode` |

请求体同 3.1。

---

### 3.4 邮箱 + 密码登录

| | |
|--|--|
| **POST** | `/api/user/login` |

```json
{ "email": "user@example.com", "password": "123456" }
```

成功 `data`：用户信息 + `token` + `refreshToken`

---

### 3.5 用户名 + 密码登录

| | |
|--|--|
| **POST** | `/api/user/loginByUsername` |

```json
{ "username": "alice", "password": "123456" }
```

---

### 3.6 邮箱 + 验证码登录

| | |
|--|--|
| **POST** | `/api/user/loginByEmailCode` |

```json
{ "email": "user@example.com", "code": "123456" }
```

---

### 3.7 刷新 Access Token

| | |
|--|--|
| **POST** | `/api/user/refreshToken` |
| **鉴权** | Header `Authorization: Bearer <当前 token>` |
| **Body** | 无 |

成功 `data`：`{ "newToken": "..." }`

---

### 3.8 获取当前用户信息

| | |
|--|--|
| **GET** | `/api/user/getUserInfo` |
| **鉴权** | Header Bearer |

成功 `data`：`UserInfo`

---

### 3.9 发送重置密码验证码

| | |
|--|--|
| **POST** | `/api/user/sendResetEmailCode` |
| **鉴权** | 否 |

```json
{ "email": "user@example.com" }
```

成功 `msg`：重置密码验证码发送成功  

常见错误：`用户不存在`（该邮箱未注册）、邮箱格式错误、Redis/SMTP 不可用（同注册发码）

---

### 3.10 重置密码

| | |
|--|--|
| **POST** | `/api/user/resetPwd` |

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpass123"
}
```

---

## 4. 推荐调用流程

### 注册

`sendRegEmailCode` → `register` → `login`

### 登录（密码）

`login` 或 `loginByUsername` → 存 token → 可选 `getUserInfo`

### 登录（验证码）

`sendLoginEmailCode` → `loginByEmailCode` → 存 token

### 重置密码

`sendResetEmailCode` → `resetPwd`

---

## 5. 请求封装示例

```ts
const API_BASE = "/api"; // 或环境变量

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (options.auth) {
    const token = localStorage.getItem("access_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.msg);
  return json.data as T;
}
```

---

## 6. 联调检查清单

- [ ] `uvicorn` 端口 **8001**
- [ ] `DATABASE_URL` → `project_db`，表 **`users`**
- [ ] `settings.yaml` 已配 Redis、SMTP
- [ ] Swagger：http://127.0.0.1:8001/docs
- [ ] 前端代理到 8001（若走 Vite）
- [ ] 以 `code === 200` 判断业务成功

---

## 7. OpenAPI

- http://127.0.0.1:8001/openapi.json  
- http://127.0.0.1:8001/docs  
