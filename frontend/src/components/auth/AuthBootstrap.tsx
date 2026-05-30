/**
 * 应用启动时：若本地有 token，尝试拉取用户信息恢复登录态。
 */
import { useEffect, useState, type ReactNode } from "react";
import { getToken } from "../../lib/auth/token";
import { fetchUserInfo, logoutLocal, UserApiError } from "../../lib/api/user";
import { useAppStore } from "../../store/useAppStore";

export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const info = await fetchUserInfo();
        if (cancelled) return;
        setUser(info);
        setLoggedIn(true);
      } catch (e) {
        if (e instanceof UserApiError && e.code === 401) {
          logoutLocal();
        }
        if (!cancelled) {
          setUser(null);
          setLoggedIn(false);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setLoggedIn, setUser]);

  if (!ready) {
    return (
      <div className="app-page-scrim flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">加载中…</p>
      </div>
    );
  }

  return children;
}
