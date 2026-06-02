# 个人信息接口 · 前端联调一页纸

> **服务**：`backend/user-service` · **端口**：`8001`  
> **实现文件**：`api/user_info.py` · **详细文档**：[user-info-api.md](./user-info-api.md)

---

## 1. 与登录接口的区别

| 接口 | 用途 | 数据来源 |
|------|------|----------|
| `GET /api/user/getUserInfo` | 账号基础信息 | `users` 表（email、registerTime） |
| `GET /api/user/getProfile` | **个人资料页** | `user_info` 表（昵称、头像、专业等） |

登录成功后先存 `token`，再调个人信息相关接口。

---

## 2. 鉴权

| 项目 | 约定 |
|------|------|
| Header | `Authorization: Bearer <access_token>` |
| 需登录 | 本节全部 3 个接口 |
| Token 来源 | `POST /api/user/login` 等登录接口返回的 `data.token` |
| Token 失效 | 响应 `code: 401`，前端清 token 并跳转登录 |

---

## 3. 响应壳

```json
{ "code": 200, "msg": "说明", "data": { } }
```

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 业务错误（如「个人信息不存在」「手机号格式错误」） |
| 401 | 未登录 / token 失效 |
| 422 | 参数校验失败（如 updateProfile 字段超长） |

> HTTP 状态码常为 200，**必须以 `code` 判断成败**。

---

## 4. 接口一览

| 功能 | 方法 | 路径 | Body |
|------|------|------|------|
| 获取个人资料 | GET | `/api/user/getProfile` | 无 |
| 修改个人资料 | POST | `/api/user/updateProfile` | JSON，字段可选 |
| 上传头像 | POST | `/api/user/uploadAvatar` | **form-data**，字段名 `file` |

---

## 5. 字段约定

- 请求/响应均 **camelCase**
- **不可修改**：`userId`、`username`、`lastLoginTime`（最后登录时间在**登录成功**时由后端自动写入）
- **头像**：仅通过 `uploadAvatar` 上传，**不要**在 `updateProfile` 里传 `avatarUrl`
- `lastLoginTime`：北京时间 ISO 8601，如 `2026-06-01T20:30:00+08:00`
- `birthday`：日期字符串 `YYYY-MM-DD`
- `gender`：`0` 未知 / `1` 男 / `2` 女（与库中 `int2` 一致，可按产品文案映射）
- `avatarUrl`：相对路径，如 `/static/avatar/1.jpg`；展示时拼服务地址：`http://127.0.0.1:8001` + `avatarUrl`

---

## 6. 前置条件

1. PostgreSQL `project_db` 中已有 **`user_info`** 表及该用户记录  
   - **获取**：无记录时仍返回 200，`data` 中除 `userId`、`username` 外均为 `null`  
   - **修改 / 上传头像**：无记录时返回 `400`，`msg`: `个人信息不存在`
2. 头像文件保存在服务端 `static/avatar/`，通过 `/static/avatar/*` 访问

---

## 7. 推荐流程

```
登录 → GET getProfile（展示资料页）
     → POST updateProfile（改昵称、手机等，只传变更字段）
     → POST uploadAvatar（选图上传，成功后用返回的 avatarUrl 刷新 UI）
```

---

## 8. Postman 上传头像要点

- Body 选 **form-data**
- Key 填 **`file`**（不能为空），类型选 **File**
- Header 加 `Authorization: Bearer <token>`

---

## 9. 联调自检

- [ ] 服务在 **8001**
- [ ] 已登录且 Header 带 Bearer token
- [ ] `user_info` 表有测试用户记录（改资料 / 上传前）
- [ ] 上传后浏览器可打开 `http://127.0.0.1:8001/static/avatar/{userId}.jpg`
- [ ] Swagger：http://127.0.0.1:8001/docs

---

## 10. 文档索引

| 文档 | 内容 |
|------|------|
| [user-info-api.md](./user-info-api.md) | 全量请求/响应、TypeScript 类型、示例代码 |
| [../README.md](../README.md) | 服务启动与配置 |
