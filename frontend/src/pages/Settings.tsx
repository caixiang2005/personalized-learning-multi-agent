/**
 * @file Settings.tsx
 * @description 设置：显示偏好、关于、退出登录。
 */
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Moon, Sun, Info } from "lucide-react";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import { logoutLocal } from "../lib/api/user";
import { useAppStore } from "../store/useAppStore";

const OPEN_SOURCE_STACK = [
  { name: "React", license: "MIT" },
  { name: "Vite", license: "MIT" },
  { name: "Tailwind CSS", license: "MIT" },
  { name: "Framer Motion", license: "MIT" },
  { name: "Lucide React", license: "ISC" },
  { name: "Zustand", license: "MIT" },
  { name: "React Markdown", license: "MIT" },
  { name: "Recharts", license: "MIT" },
] as const;

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
    <ScholarDashboardLayout badge="系统" title="设置" subtitle="显示偏好、版本与技术栈">
      <Link to="/account" className="account-settings-link section-card mb-4 scholar-card--interactive">
        <div>
          <p className="account-settings-link__title">个人信息</p>
          <p className="account-settings-link__desc">编辑昵称、专业方向与学习背景</p>
        </div>
        <ArrowRight size={18} strokeWidth={1.75} />
      </Link>

      <section className="section-card mb-4">
        <h3 className="font-semibold mb-4">显示</h3>
        <button type="button" onClick={toggleDarkMode} className="account-theme-toggle">
          <span className="flex items-center gap-2 text-sm">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            {darkMode ? "深色模式" : "浅色模式"}
          </span>
          <span className="text-xs text-gray-400">点击切换</span>
        </button>
      </section>

      <section className="section-card about-panel mb-4">
        <div className="about-panel__head">
          <p className="about-panel__title flex items-center gap-2">
            <Info size={16} strokeWidth={1.75} aria-hidden />
            关于
          </p>
          <p className="about-panel__sub">智慧学习中心 · 第十五届中国软件杯 A 组 · 版本 0.1.0</p>
        </div>
        <div className="about-panel__grid">
          {OPEN_SOURCE_STACK.map((item) => (
            <div key={item.name} className="about-panel__row">
              <span className="about-panel__name">{item.name}</span>
              <span className="about-panel__license">{item.license}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
      >
        <LogOut size={18} /> 退出登录
      </button>
    </ScholarDashboardLayout>
  );
}
