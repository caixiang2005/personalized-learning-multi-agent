/**
 * @file ThemeToggle.tsx
 * @description 浅色/深色主题切换按钮，状态保存在 useAppStore 并持久化。
 * @backend 无；若需同步服务端用户偏好可调用 PUT /api/user/preferences
 */
import { Moon, Sun } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { applyTheme } from "../../lib/theme";

export default function ThemeToggle() {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  const handleToggle = () => {
    const next = !darkMode;
    applyTheme(next);
    toggleDarkMode();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
