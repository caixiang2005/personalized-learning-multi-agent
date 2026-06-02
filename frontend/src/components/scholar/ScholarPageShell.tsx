import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  maxWidth?: "4xl" | "5xl" | "6xl" | "full";
};

const maxW = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  full: "max-w-none",
};

/** 统一页面容器：Scholar 间距 + 入场动效 */
export default function ScholarPageShell({
  children,
  className = "",
  stagger = true,
  maxWidth = "6xl",
}: Props) {
  return (
    <div
      className={`page-container scholar-page ${maxW[maxWidth]} ${stagger ? "scholar-stagger" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
