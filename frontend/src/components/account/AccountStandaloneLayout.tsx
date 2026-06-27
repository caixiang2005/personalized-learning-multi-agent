/**
 * 个人信息页独立布局：无主导航，仅顶栏返回与账号操作。
 */
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, LogOut } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import MobileNav from "../layout/MobileNav";
import { logoutLocal } from "../../lib/api/user";
import { useAppStore } from "../../store/useAppStore";

type Props = {
  children: ReactNode;
};

export default function AccountStandaloneLayout({ children }: Props) {
  const navigate = useNavigate();
  const { setLoggedIn, setUser } = useAppStore();

  const logout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="account-standalone app-page-scrim min-h-screen flex flex-col">
      <header className="account-standalone__header landing-glass landing-header--bar">
        <div className="account-standalone__header-inner">
          <Link to="/home" className="account-standalone__back">
            <ArrowLeft size={18} strokeWidth={1.75} />
            返回首页
          </Link>

          <div className="account-standalone__brand">
            <GraduationCap size={18} strokeWidth={1.75} />
            <span>个人信息</span>
          </div>

          <div className="account-standalone__actions">
            <ThemeToggle />
            <button
              type="button"
              className="account-standalone__logout"
              onClick={logout}
              aria-label="退出登录"
            >
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="account-standalone__main flex-1 has-mobile-nav-pad">{children}</main>
      <MobileNav />
    </div>
  );
}
