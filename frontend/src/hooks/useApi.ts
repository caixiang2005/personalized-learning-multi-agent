/**
 * @file useApi.ts
 * @description 通用 API 数据加载 hook — 管理 loading / error / data 三态。
 */
import { useCallback, useEffect, useRef, useState } from "react";

type AsyncFn<T> = () => Promise<{ code: number; msg: string; data: T }>;

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * 自动执行一次异步 API 调用，并提供 refresh 能力。
 * @param fetcher 返回 { code, msg, data } 的 async 函数
 * @param immediate 是否在挂载时立即执行（默认 true）
 */
export function useApi<T = unknown>(
  fetcher: AsyncFn<T>,
  immediate = true
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const execute = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (res.code === 200) {
        setData(res.data);
      } else {
        setError(res.msg || "请求失败");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "网络异常");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refresh: execute };
}

/**
 * 手动触发的 API hook（不自动执行）
 */
export function useApiLazy<T = unknown>(
  fetcher: AsyncFn<T>
): UseApiState<T> & { execute: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const execute = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (res.code === 200) {
        setData(res.data);
      } else {
        setError(res.msg || "请求失败");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "网络异常");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetcher]);

  return { data, loading, error, refresh: execute, execute };
}
