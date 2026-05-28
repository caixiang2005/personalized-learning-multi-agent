/**
 * @file Navbar.tsx
 * @description 顶部导航：品牌、页面链接、学习中心、主题、设置、退出。
 * @backend POST /api/auth/logout（退出时，见 Settings.tsx）
 */

import { NavLink, Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Settings, Sparkles } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { logoutLocal } from "../../lib/api/user";
import { useAppStore } from "../../store/useAppStore";

const navItems = [
  { to: "/home", label: "首页" },
  { to: "/chat", label: "学习对话" },
  { to: "/profile", label: "学习画像" },
  { to: "/path", label: "学习路径" },
  { to: "/analytics", label: "效果评估" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { setLoggedIn, setUser } = useAppStore();

  const logout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-[56px] flex items-center gap-4">
        <Link to="/home" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] text-gray-900 dark:text-white hidden lg:inline">
            智慧学习中心
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 ml-auto shrink-0">
          <Link
            to="/path"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl text-primary font-medium hover:bg-primary/8 transition-colors"
          >
            <BookOpen size={17} />
            学习中心
          </Link>
          <ThemeToggle />
          <Link
            to="/settings"
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="设置"
          >
            <Settings size={18} />
          </Link>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
            aria-label="退出"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
