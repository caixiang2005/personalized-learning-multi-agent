/**
 * 顶栏用户下拉：B 站风格主菜单；账号安全跳转独立页面。
 */
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ClipboardList,
  LogOut,
  Moon,
  Shield,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import UserAvatar from "../account/UserAvatar";
import { logoutLocal } from "../../lib/api/user";
import { useAppStore } from "../../store/useAppStore";

const mainLinks = [
  { to: "/account", label: "个人中心", icon: UserRound },
  { to: "/profile", label: "学习画像", icon: Sparkles },
  { to: "/path", label: "学习路径", icon: ClipboardList },
  { to: "/account/security", label: "账号安全", icon: Shield },
  { to: "/settings", label: "系统设置", icon: Sun },
];

export default function UserMenuDropdown() {
  const navigate = useNavigate();
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const sessions = useAppStore((s) => s.sessions);
  const pathStages = useAppStore((s) => s.pathStages);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);
  const userAvatarUrl = useAppStore((s) => s.userAvatarUrl);
  const avatarCacheVersion = useAppStore((s) => s.avatarCacheVersion);

  const userId = user?.userId ?? 1;
  const username = user?.username ?? "用户";
  const displayName = profile.name || username;

  const doneTopics = pathStages.reduce(
    (n, stage) => n + stage.topics.filter((t) => t.progress >= 100).length,
    0
  );
  const totalTopics = pathStages.reduce((n, stage) => n + stage.topics.length, 0);
  const progressPct = totalTopics
    ? Math.min(100, Math.round((doneTopics / totalTopics) * 100))
    : 0;

  const close = () => setOpen(false);

  const openMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
  }, []);

  const rowBtn =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors cursor-pointer";
  const rowLink = `${rowBtn} no-underline`;

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`app-navbar__icon-btn h-9 w-9 overflow-hidden rounded-lg p-0 cursor-pointer transition-shadow ${
          open ? "ring-2 ring-primary/35" : ""
        }`}
        aria-label="个人菜单"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar
          userId={userId}
          displayName={displayName}
          username={username}
          avatarUrl={userAvatarUrl}
          avatarVersion={avatarCacheVersion}
          size="md"
          className="h-full! w-full! rounded-lg! text-sm! shadow-none!"
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-80 w-78 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-xl animate-[fade-in_0.2s_ease-out] dark:border-gray-700/60 dark:bg-gray-900/95"
          role="menu"
        >
          <div className="relative px-4 pb-3 pt-20 text-center">
            <div className="absolute left-1/2 top-3 -translate-x-1/2">
              <UserAvatar
                userId={userId}
                displayName={displayName}
                username={username}
                avatarUrl={userAvatarUrl}
                avatarVersion={avatarCacheVersion}
                size="lg"
                className="h-14! w-14! rounded-full! text-lg! ring-4 ring-white dark:ring-gray-900 shadow-md"
              />
            </div>

            <p className="truncate text-base font-semibold text-gray-900 dark:text-white">{displayName}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">@{username}</p>

            <div className="mt-3 px-1">
              <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                <span>学习进度</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100 border-y border-gray-100 py-3 dark:divide-gray-800 dark:border-gray-800">
              {[
                { label: "对话", value: sessions.length },
                { label: "画像维", value: "6" },
                { label: "路径段", value: pathStages.length },
              ].map((s) => (
                <div key={s.label} className="px-1">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            <nav className="mt-3 space-y-0.5 text-left">
              {mainLinks.map((item) => (
                <Link key={item.to} to={item.to} className={rowLink} onClick={close} role="menuitem">
                  <item.icon size={17} strokeWidth={1.75} className="text-gray-500 dark:text-gray-400" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight size={15} className="text-gray-300 dark:text-gray-600" />
                </Link>
              ))}
            </nav>

            <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2 dark:border-gray-800">
              <button type="button" className={rowBtn} onClick={toggleDarkMode}>
                {darkMode ? (
                  <Sun size={17} strokeWidth={1.75} className="text-gray-500" />
                ) : (
                  <Moon size={17} strokeWidth={1.75} className="text-gray-500" />
                )}
                <span className="flex-1 text-left">主题：{darkMode ? "深色" : "浅色"}</span>
              </button>
              <button
                type="button"
                className={`${rowBtn} text-gray-500 hover:text-red-500 dark:hover:text-red-400`}
                onClick={() => {
                  logoutLocal();
                  setUser(null);
                  setLoggedIn(false);
                  close();
                  navigate("/login");
                }}
              >
                <LogOut size={17} strokeWidth={1.75} />
                <span className="flex-1 text-left">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
