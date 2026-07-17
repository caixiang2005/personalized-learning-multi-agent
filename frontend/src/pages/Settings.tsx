/**
 * @file Settings.tsx
 * @description 设置中心：账号、偏好、系统信息导航。
 */
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Moon, Sun, Info, Shield, User, Palette } from "lucide-react";
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

const SETTING_SECTIONS = [
  {
    title: "账号与安全",
    items: [
      { to: "/account", icon: User, label: "个人资料", desc: "编辑昵称、手机号、头像" },
      { to: "/account/security", icon: Shield, label: "账号安全", desc: "修改密码、查看登录信息" },
    ],
  },
  {
    title: "偏好设置",
    items: [
      { to: "/profile", icon: Palette, label: "学习画像", desc: "查看六维画像与薄弱知识点" },
    ],
  },
];

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
    <ScholarDashboardLayout badge="系统" title="设置" subtitle="账号管理、显示偏好与系统信息">
      {SETTING_SECTIONS.map((section) => (
        <section key={section.title} className="section-card mb-4">
          <h3 className="font-semibold mb-3 text-sm text-[var(--scholar-text-secondary)]">{section.title}</h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--scholar-bg)] transition-colors no-underline"
              >
                <span className="w-9 h-9 rounded-lg bg-[var(--scholar-bg)] flex items-center justify-center text-[var(--scholar-text-secondary)] shrink-0">
                  <item.icon size={17} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--scholar-text)]">{item.label}</p>
                  <p className="text-xs text-[var(--scholar-text-muted)]">{item.desc}</p>
                </div>
                <ArrowRight size={15} className="text-[var(--scholar-text-muted)] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="section-card mb-4">
        <h3 className="font-semibold mb-4 text-sm text-[var(--scholar-text-secondary)]">显示</h3>
        <button type="button" onClick={toggleDarkMode} className="account-theme-toggle w-full">
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
          <p className="about-panel__sub">智慧学习中心 · 版本 0.1.0</p>
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
