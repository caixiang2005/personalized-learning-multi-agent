/**
 * @file Settings.tsx
 * @description 设置：账号信息展示、主题切换、退出。
 * @route /settings
 *
 * 【当前 Mock】账号信息读 store.profile；退出只清 isLoggedIn 与 token（若存在）。
 * 【待同步后端】GET /api/profile 或 /api/user/me；POST /api/auth/logout
 */

import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, User } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { useAppStore } from "../store/useAppStore";

export default function Settings() {
  const navigate = useNavigate();
  const { profile, darkMode, toggleDarkMode, setLoggedIn } = useAppStore();

  const handleLogout = async () => {
    // 【待同步后端】await 调用 POST /api/auth/logout（client 可补 export logout）
    localStorage.removeItem("access_token");
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="page-container max-w-2xl">
      <PageHeader title="设置" subtitle="账号与显示偏好" />

      <section className="section-card mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <User size={18} className="text-primary" /> 账号信息
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">昵称</dt>
            <dd>{profile.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">专业方向</dt>
            <dd className="text-right max-w-[60%]">{profile.major}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">学习目标</dt>
            <dd>{profile.goal}</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-400 mt-4">【对接后端】从 GET /api/user/me 或 /api/profile 拉取</p>
      </section>

      <section className="section-card mb-4">
        <h3 className="font-semibold mb-4">显示</h3>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/30"
        >
          <span className="flex items-center gap-2 text-sm">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            {darkMode ? "深色模式" : "浅色模式"}
          </span>
          <span className="text-xs text-gray-400">点击切换</span>
        </button>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
      >
        <LogOut size={18} /> 退出登录
      </button>
    </div>
  );
}
