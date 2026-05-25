/**
 * @file ThemeToggle.tsx
 * @description 浅色/深色主题切换按钮，状态保存在 useAppStore 并持久化。
 * @backend 无；若需同步服务端用户偏好可调用 PUT /api/user/preferences
 */
import { Moon, Sun } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="切换主题"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
