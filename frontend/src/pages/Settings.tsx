/**
 * @file Settings.tsx
 * @description 设置：显示偏好、退出登录。
 * @route /settings
 *
 * 账号资料编辑见 /account
 */

import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Moon, Sun } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import LandingReveal from "../components/landing/LandingReveal";
import { logoutLocal } from "../lib/api/user";
import { useAppStore } from "../store/useAppStore";

export default function Settings() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, setLoggedIn, setUser } = useAppStore();

  const handleLogout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="page-container max-w-2xl">
      <LandingReveal>
        <PageHeader title="设置" subtitle="显示偏好与账号安全" />
      </LandingReveal>

      <LandingReveal delay={60}>
        <Link to="/account" className="account-settings-link section-card mb-4">
          <div>
            <p className="account-settings-link__title">个人信息</p>
            <p className="account-settings-link__desc">编辑昵称、专业方向与学习背景</p>
          </div>
          <ArrowRight size={18} strokeWidth={1.75} />
        </Link>
      </LandingReveal>

      <LandingReveal delay={90}>
        <section className="section-card mb-4">
          <h3 className="font-semibold mb-4">显示</h3>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="account-theme-toggle"
          >
            <span className="flex items-center gap-2 text-sm">
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
              {darkMode ? "深色模式" : "浅色模式"}
            </span>
            <span className="text-xs text-gray-400">点击切换</span>
          </button>
        </section>
      </LandingReveal>

      <LandingReveal delay={120}>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <LogOut size={18} /> 退出登录
        </button>
      </LandingReveal>
    </div>
  );
}
