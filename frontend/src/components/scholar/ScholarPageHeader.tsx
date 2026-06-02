import type { ReactNode } from "react";

type Props = {
  badge?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function ScholarPageHeader({ badge, title, subtitle, action }: Props) {
  return (
    <header className="scholar-page-header flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {badge && <p className="scholar-page-header__badge">{badge}</p>}
        <h1 className="scholar-page-header__title">{title}</h1>
        {subtitle && <p className="scholar-page-header__sub">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
