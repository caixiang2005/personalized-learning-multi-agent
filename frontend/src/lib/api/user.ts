/**
 * @file user.ts
 * @description 用户认证 API（/api/user），响应格式 { code, msg, data }。
 */
import { API } from "./endpoints";
import type { ApiResponse, LoginData, RegisterData, UserInfo } from "./endpoints";
import { authHeaders, clearTokens, getRefreshToken, getToken, setTokens } from "../auth/token";

export class UserApiError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "UserApiError";
    this.code = code;
  }
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    throw new UserApiError("网络异常，请稍后重试", 500);
  }
}

async function post<T>(url: string, body: unknown, withAuth = false): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: withAuth ? authHeaders() : { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson<T>(res);
  if (json.code !== 200) {
    throw new UserApiError(json.msg || "请求失败", json.code);
  }
  return json.data;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET", headers: authHeaders() });
  const json = await parseJson<T>(res);
  if (json.code !== 200) {
    throw new UserApiError(json.msg || "请求失败", json.code);
  }
  return json.data;
}

const mockDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const mockLoginData = (email: string, username: string): LoginData => ({
  userId: 1,
  email,
  username,
  registerTime: new Date().toISOString(),
  token: "mock-token",
  refreshToken: "mock-refresh",
});

// ─── Mock（VITE_USE_MOCK=true）────────────────────────────────────────

async function mockPost<T>(handler: () => T | Promise<T>): Promise<T> {
  await mockDelay();
  return handler();
}

// ─── 邮件验证码 ───────────────────────────────────────────────────────

export async function sendRegEmailCode(email: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    return;
  }
  await post(API.user.sendRegEmailCode, { email });
}

export async function sendLoginEmailCode(email: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    return;
  }
  await post(API.user.sendLoginEmailCode, { email });
}

export async function sendResetEmailCode(email: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    return;
  }
  await post(API.user.sendResetEmailCode, { email });
}

// ─── 注册登录 ─────────────────────────────────────────────────────────

export async function register(body: {
  email: string;
  username: string;
  password: string;
  code: string;
}): Promise<RegisterData> {
  if (USE_MOCK) {
    return mockPost(() => ({
      userId: 1,
      email: body.email,
      username: body.username,
      registerTime: new Date().toISOString(),
    }));
  }
  return post(API.user.register, body);
}

export async function loginByEmail(email: string, password: string): Promise<LoginData> {
  if (USE_MOCK) {
    if (password !== "123456") throw new UserApiError("邮箱或密码错误", 400);
    return mockPost(() => mockLoginData(email, email.split("@")[0] || "用户"));
  }
  return post(API.user.loginEmail, { email, password });
}

export async function loginByUsername(username: string, password: string): Promise<LoginData> {
  if (USE_MOCK) {
    if (password !== "123456") throw new UserApiError("邮箱或密码错误", 400);
    return mockPost(() => mockLoginData("demo@example.com", username));
  }
  return post(API.user.loginUsername, { username, password });
}

export async function loginByCode(email: string, code: string): Promise<LoginData> {
  if (USE_MOCK) {
    if (code !== "123456") throw new UserApiError("验证码错误或已过期", 400);
    return mockPost(() => mockLoginData(email, email.split("@")[0] || "用户"));
  }
  return post(API.user.loginCode, { email, code });
}

// ─── 令牌与用户信息 ───────────────────────────────────────────────────

export async function refreshToken(oldToken?: string): Promise<string> {
  const token = oldToken ?? getToken();
  if (!token) throw new UserApiError("登录已失效，请重新登录", 401);
  if (USE_MOCK) {
    await mockDelay();
    return "mock-token-refreshed";
  }
  const data = await post<{ newToken: string }>(API.user.refreshToken, { oldToken: token });
  setTokens(data.newToken, getRefreshToken() ?? undefined);
  return data.newToken;
}

export async function fetchUserInfo(): Promise<UserInfo> {
  if (USE_MOCK) {
    return mockPost(() => ({
      userId: 1,
      email: "demo@example.com",
      username: "演示用户",
      registerTime: new Date().toISOString(),
    }));
  }
  return get(API.user.info);
}

/** 登录成功后写入 token 并返回用户信息 */
export function persistLogin(data: LoginData): UserInfo {
  setTokens(data.token, data.refreshToken);
  return {
    userId: data.userId,
    email: data.email,
    username: data.username,
    registerTime: data.registerTime,
  };
}

export async function resetPassword(body: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  if (USE_MOCK) {
    if (body.code !== "123456") throw new UserApiError("验证码错误或已过期", 400);
    await mockDelay();
    return;
  }
  await post(API.user.resetPassword, body);
}

export function logoutLocal(): void {
  clearTokens();
}
