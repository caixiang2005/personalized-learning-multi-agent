# 个人信息接口文档（user_info_api）

> 依据 `api/user_info.py` 与 `utils/user_info.py` 当前实现整理。  
> **端口**：`8001` · **联调速览**：[user-info-handoff.md](./user-info-handoff.md)

---

## 1. 通用约定

### 1.1 基础地址

| 环境 | 说明 |
|------|------|
| 直连 | `http://127.0.0.1:8001/api/user/...` |
| 经前端代理 | 浏览器 `/api/user/...` 代理到本服务 `8001` |

静态头像：

| 类型 | URL |
|------|-----|
| 相对路径（接口返回） | `/static/avatar/{userId}.jpg` |
| 完整 URL | `http://127.0.0.1:8001/static/avatar/{userId}.jpg` |

### 1.2 请求头

| Header | 值 | 说明 |
|--------|-----|------|
| `Authorization` | `Bearer <token>` | 三个接口均必填 |
| `Content-Type` | `application/json` | 仅 `updateProfile` |
| `Content-Type` | `multipart/form-data` | 仅 `uploadAvatar`（由客户端自动生成，勿手动设为 JSON） |

### 1.3 统一响应

```ts
interface ApiResponse<T = unknown> {
  code: number; // 200 成功；400 业务错误；401 未登录
  msg: string;
  data: T;
}
```

---

## 2. 数据类型（TypeScript）

```ts
/** GET getProfile / POST updateProfile 成功时的 data */
export interface UserProfileData {
  userId: number;
  username: string;           // 只读，来自 user_info
  phoneNumber: string | null;
  avatarUrl: string | null; // 如 /static/avatar/1.jpg
  gender: number | null;      // 0 | 1 | 2
  birthday: string | null;    // YYYY-MM-DD
  lastLoginTime: string | null; // 北京时间 +08:00，只读
  signature: string | null;
  major: string | null;
  nickname: string | null;
}

/** POST updateProfile 请求体（字段均可选，只传需要修改的） */
export interface UpdateProfileBody {
  phoneNumber?: string | null;
  gender?: number | null;
  birthday?: string | null;   // YYYY-MM-DD
  signature?: string | null;
  major?: string | null;
  nickname?: string | null;
}

/** POST uploadAvatar 成功时的 data */
export interface UploadAvatarData {
  avatarUrl: string;
}
```

### 2.1 字段约束

| 字段 | 约束 | 可 PATCH |
|------|------|----------|
| userId | 整数 | 否 |
| username | 最多 32 字符 | 否 |
| phoneNumber | 11 位大陆手机号 `1xxxxxxxxx`，空/null 清空 | 是 |
| avatarUrl | 最多 255 字符 | 仅 uploadAvatar |
| gender | 0–2 | 是 |
| birthday | `YYYY-MM-DD` | 是 |
| lastLoginTime | 北京时间 ISO | 否（登录时自动更新） |
| signature | 最多 100 字符 | 是 |
| major | 最多 32 字符 | 是 |
| nickname | 最多 32 字符 | 是 |

---

## 3. 接口详情

### 3.1 获取个人资料

| | |
|--|--|
| **GET** | `/api/user/getProfile` |
| **鉴权** | Header Bearer |

**成功 `data`**：`UserProfileData`

- 若 `user_info` 无记录：`userId`、`username` 有值，其余字段为 `null`
- `username` 来自 `user_info`；若无记录则来自 `users` 表

**示例响应**

```json
{
  "code": 200,
  "msg": "获取个人信息成功",
  "data": {
    "userId": 1,
    "username": "alice",
    "phoneNumber": "13800138000",
    "avatarUrl": "/static/avatar/1.jpg",
    "gender": 1,
    "birthday": "2000-01-01",
    "lastLoginTime": "2026-06-01T20:30:00+08:00",
    "signature": "好好学习",
    "major": "计算机科学",
    "nickname": "小明"
  }
}
```

---

### 3.2 修改个人资料

| | |
|--|--|
| **POST** | `/api/user/updateProfile` |
| **鉴权** | Header Bearer |
| **Body** | JSON，**部分更新**（只传要改的字段） |

**请求示例**

```json
{
  "nickname": "小明",
  "major": "计算机科学",
  "phoneNumber": "13800138000",
  "gender": 1,
  "birthday": "2000-01-01",
  "signature": "天天向上"
}
```

**清空字段**：传 `null` 或 `""`（phoneNumber、signature、major、nickname 等）

**成功 `data`**：更新后的完整 `UserProfileData`

**常见错误**

| msg | 原因 |
|-----|------|
| 登录已失效，请重新登录 | token 无效或服务重启 |
| 个人信息不存在 | `user_info` 无该用户记录 |
| 未提供可修改字段 | body 为空或未传任何字段 |
| 手机号格式错误 | phoneNumber 不符合 `1` + 10 位数字 |

---

### 3.3 上传头像

| | |
|--|--|
| **POST** | `/api/user/uploadAvatar` |
| **鉴权** | Header Bearer |
| **Body** | `multipart/form-data` |

**form-data 字段**

| Key | 类型 | 说明 |
|-----|------|------|
| `file` | File | **必填**，字段名必须为 `file` |

**限制**

- 格式：JPG、PNG、WEBP、GIF
- 大小：≤ 2MB
- 存储：`static/avatar/{userId}.jpg`（扩展名随图片类型变化）
- 覆盖：同用户再次上传会覆盖旧文件并更新 `avatar_url`

**成功响应**

```json
{
  "code": 200,
  "msg": "头像上传成功",
  "data": {
    "avatarUrl": "/static/avatar/1.jpg"
  }
}
```

**常见错误**

| msg / 状态 | 原因 |
|------------|------|
| 422 `Field required` | form-data 的 Key 未填 `file` |
| 仅支持 JPG、PNG、WEBP、GIF 图片 | Content-Type 不支持 |
| 头像大小不能超过 2MB | 文件过大 |
| 个人信息不存在 | `user_info` 无记录 |

---

## 4. 前端调用示例

### 4.1 获取资料

```ts
const API_BASE = "/api"; // 或 import.meta.env.VITE_API_BASE

async function getProfile(token: string): Promise<UserProfileData> {
  const res = await fetch(`${API_BASE}/user/getProfile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.msg);
  return json.data;
}
```

### 4.2 更新资料

```ts
async function updateProfile(
  token: string,
  body: UpdateProfileBody
): Promise<UserProfileData> {
  const res = await fetch(`${API_BASE}/user/updateProfile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.msg);
  return json.data;
}
```

### 4.3 上传头像

```ts
async function uploadAvatar(token: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/user/uploadAvatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.msg);
  return json.data.avatarUrl;
}

/** 展示头像时使用完整 URL */
function avatarFullUrl(avatarUrl: string | null, origin = "http://127.0.0.1:8001") {
  if (!avatarUrl) return null;
  return avatarUrl.startsWith("http") ? avatarUrl : `${origin}${avatarUrl}`;
}
```

---

## 5. 与前端现有类型的差异说明

前端 `frontend/src/types/account.ts` 中若仍使用 `GET /api/user/profile`、`PUT /api/user/update` 及 `displayName` / `goal` / `level` 等字段，**与当前 user-service 实现不一致**。

对接时请改为：

| 旧（前端草案） | 当前后端 |
|----------------|----------|
| `GET /api/user/profile` | `GET /api/user/getProfile` |
| `PUT /api/user/update` | `POST /api/user/updateProfile` |
| `displayName` | `nickname` |
| `goal` / `level` | 暂未实现，需产品确认是否入 `user_info` 表 |

---

## 6. 数据库

表名：**`user_info`**（`project_db`，服务端不自动建表）

| 列名 | 说明 |
|------|------|
| user_id | 主键，不可改 |
| username | 不可改 |
| phone_number | |
| avatar_url | |
| gender | |
| birthday | |
| last_login_time | 登录成功时后端自动更新 |
| signature | |
| major | |
| nickname | |

---

## 7. OpenAPI

- http://127.0.0.1:8001/docs  
- http://127.0.0.1:8001/openapi.json  
