/**
 * Axios 统一客户端：鉴权、loading、401 自动 refresh、失败跳转登录。
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getRefreshToken, getToken } from "../auth/token";
import type { ApiEnvelope } from "../../types/account";
import { refreshToken } from "./user";

export class ApiClientError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

type LoadingListener = (loading: boolean) => void;

let pendingRequests = 0;
const loadingListeners = new Set<LoadingListener>();

/** 订阅全局 API loading（用于顶栏进度条） */
export function subscribeApiLoading(listener: LoadingListener) {
  loadingListeners.add(listener);
  listener(pendingRequests > 0);
  return () => {
    loadingListeners.delete(listener);
  };
}

function setLoading(delta: number) {
  pendingRequests = Math.max(0, pendingRequests + delta);
  loadingListeners.forEach((fn) => fn(pendingRequests > 0));
}

function redirectToLogin() {
  if (window.location.pathname.startsWith("/login")) return;
  window.location.assign("/login");
}

function canRetryAuth(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config || config._authRetried || config.skipAuthRetry) return false;
  const url = config.url ?? "";
  return !url.includes("/user/refreshToken");
}

async function refreshAccessToken(): Promise<string | null> {
  if (!getToken() && !getRefreshToken()) return null;
  try {
    return await refreshToken();
  } catch {
    return null;
  }
}

async function retryWithFreshToken(config: InternalAxiosRequestConfig): Promise<unknown> {
  const newToken = await refreshAccessToken();
  if (!newToken) {
    clearTokens();
    redirectToLogin();
    return Promise.reject(new ApiClientError("登录已失效，请重新登录", 401));
  }
  config._authRetried = true;
  config.headers.Authorization = `Bearer ${newToken}`;
  return apiClient.request(config);
}

declare module "axios" {
  export interface AxiosRequestConfig {
    /** 为 true 时不触发全局 loading */
    skipLoading?: boolean;
    /** 为 true 时 401 不尝试 refresh */
    skipAuthRetry?: boolean;
    _authRetried?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipLoading) setLoading(1);

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  async (response) => {
    if (!response.config.skipLoading) setLoading(-1);

    const body = response.data as ApiEnvelope<unknown> | undefined;
    if (body && typeof body.code === "number" && body.code !== 200) {
      if (body.code === 401 && canRetryAuth(response.config)) {
        return retryWithFreshToken(response.config);
      }
      if (body.code === 401) {
        clearTokens();
        redirectToLogin();
      }
      return Promise.reject(new ApiClientError(body.msg || "请求失败", body.code));
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (!error.config?.skipLoading) setLoading(-1);

    const code = error.response?.data?.code;
    const msg = error.response?.data?.msg ?? error.message ?? "网络异常";

    if (code === 401 && error.config && canRetryAuth(error.config)) {
      return retryWithFreshToken(error.config);
    }
    if (code === 401) {
      clearTokens();
      redirectToLogin();
    }

    return Promise.reject(new ApiClientError(msg, code ?? error.response?.status ?? 500));
  }
);

/** 解包 { code, msg, data } */
export function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}
