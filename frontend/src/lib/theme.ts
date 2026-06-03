/** 与 useAppStore persist 键名一致，供 index.html 首屏脚本与运行时共用 */
export const THEME_STORAGE_KEY = "learn-platform-store";

export function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
}

/** 首屏防闪烁：在 React 挂载前读取 localStorage */
export function readPersistedDarkMode(): boolean {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { darkMode?: boolean } };
    return Boolean(parsed.state?.darkMode);
  } catch {
    return false;
  }
}
