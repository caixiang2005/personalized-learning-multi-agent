/**
 * @file PageHeader.tsx
 * @description 各业务页统一的标题区（标题、副标题、徽章、右侧操作）。
 * @backend 无
 */
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, badge, action }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        {badge && (
          <span className="inline-block px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {badge}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-[#312E81] dark:text-indigo-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[#6366A0] dark:text-indigo-300/80 text-sm md:text-base">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
