/**
 * Axios 统一客户端：鉴权、loading、错误处理、401 自动 refresh 重试。
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getToken } from "../auth/token";
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
    /** 内部：已做过一次 refresh 重试 */
    _retry?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: "", // baseURL 为空，API 全路径在 endpoints.ts 中已包含 /api 前缀
  timeout: 120000, // 120s — learn-service 会代理到 agent-service 调用 DeepSeek
  headers: { "Content-Type": "application/json" },
});

function isRefreshUrl(url?: string) {
  return Boolean(url && url.includes("/user/refreshToken"));
}

async function tryRefreshAndRetry(config: InternalAxiosRequestConfig) {
  if (config._retry || isRefreshUrl(config.url)) {
    return null;
  }
  config._retry = true;
  try {
    const { refreshToken } = await import("./user");
    await refreshToken();
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return apiClient.request(config);
  } catch {
    return null;
  }
}

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
      if (body.code === 401) {
        const retried = await tryRefreshAndRetry(response.config);
        if (retried) return retried;
      }
      return Promise.reject(new ApiClientError(body.msg || "请求失败", body.code));
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (!error.config?.skipLoading) setLoading(-1);

    const httpStatus = error.response?.status;
    const code = error.response?.data?.code ?? httpStatus ?? 500;
    const msg = error.response?.data?.msg ?? error.message ?? "网络异常";

    if ((code === 401 || httpStatus === 401) && error.config) {
      const retried = await tryRefreshAndRetry(error.config);
      if (retried) return retried;
    }

    return Promise.reject(new ApiClientError(msg, typeof code === "number" ? code : 500));
  }
);

/** 解包 { code, msg, data } */
export function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}
