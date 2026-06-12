/**
 * 统一驾驶舱页面壳：顶栏 Banner + 主内容（可选右侧栏由页面自行传入）
 */
import type { ReactNode } from "react";

export type ScholarDashboardLayoutProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  aside?: ReactNode;
  /** 页面专属右侧栏；不传则主内容全宽 */
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardHealthAside({ score, label = "画像健康度" }: { score: number; label?: string }) {
  return (
    <div className="home-cockpit__health">
      <span className="home-cockpit__health-label">{label}</span>
      <span className="home-cockpit__health-value">{score}%</span>
    </div>
  );
}

export default function ScholarDashboardLayout({
  badge,
  title,
  subtitle,
  eyebrow,
  aside,
  sidebar,
  children,
  className = "",
}: ScholarDashboardLayoutProps) {
  return (
    <div className={`home-cockpit page-container scholar-page max-w-none ${className}`.trim()}>
      <header className="home-cockpit__banner section-card">
        <div className="home-cockpit__banner-main">
          {eyebrow}
          {badge && !eyebrow && <p className="home-cockpit__badge">{badge}</p>}
          <h1 className="home-cockpit__headline">{title}</h1>
          {subtitle && <p className="home-cockpit__lede">{subtitle}</p>}
        </div>
        {aside && <div className="home-cockpit__banner-aside">{aside}</div>}
      </header>

      {sidebar ? (
        <div className="home-feed-layout">
          <div className="home-feed-layout__main">{children}</div>
          <aside className="home-feed-layout__widgets">
            <div className="dash-sidebar-stack">{sidebar}</div>
          </aside>
        </div>
      ) : (
        <div className="home-cockpit__full">{children}</div>
      )}
    </div>
  );
}
