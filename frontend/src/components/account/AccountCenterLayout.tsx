/**
 * 个人中心布局：顶栏 + 左侧导航 + 主内容（参考个人主页侧栏结构）
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import UserMenuDropdown from "../layout/UserMenuDropdown";
import AccountNavSidebar from "../../pages/account/AccountNavSidebar";

type Props = {
  children: ReactNode;
};

export default function AccountCenterLayout({ children }: Props) {
  return (
    <div className="account-center app-page-scrim min-h-screen flex flex-col">
      <header className="account-center__header landing-glass landing-header--bar">
        <div className="account-center__header-inner">
          <Link to="/home" className="account-center__back">
            <ArrowLeft size={18} strokeWidth={1.75} />
            返回首页
          </Link>
          <Link to="/" className="account-center__brand">
            <GraduationCap size={18} strokeWidth={1.75} />
            <span>智慧学习中心</span>
          </Link>
          <div className="account-center__actions">
            <ThemeToggle />
            <UserMenuDropdown />
          </div>
        </div>
      </header>

      <div className="account-center__body">
        <AccountNavSidebar />
        <main className="account-center__main">{children}</main>
      </div>
    </div>
  );
}
