/**
 * Axios 统一客户端：鉴权、loading、错误与 401 跳转。
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getToken } from "../auth/token";
import type { ApiEnvelope } from "../../types/account";

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

declare module "axios" {
  export interface AxiosRequestConfig {
    /** 为 true 时不触发全局 loading */
    skipLoading?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: "",  // baseURL 为空，API 全路径在 endpoints.ts 中已包含 /api 前缀
  timeout: 120000,  // 120s — learn-service 会代理到 agent-service 调用 DeepSeek，响应较慢
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
  (response) => {
    if (!response.config.skipLoading) setLoading(-1);

    const body = response.data as ApiEnvelope<unknown> | undefined;
    if (body && typeof body.code === "number" && body.code !== 200) {
      if (body.code === 401) {
        clearTokens();
        window.location.assign("/login");
      }
      return Promise.reject(new ApiClientError(body.msg || "请求失败", body.code));
    }
    return response;
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (!error.config?.skipLoading) setLoading(-1);

    const code = error.response?.data?.code;
    const msg = error.response?.data?.msg ?? error.message ?? "网络异常";

    if (code === 401) {
      clearTokens();
      window.location.assign("/login");
    }

    return Promise.reject(new ApiClientError(msg, code ?? error.response?.status ?? 500));
  }
);

/** 解包 { code, msg, data } */
export function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}
