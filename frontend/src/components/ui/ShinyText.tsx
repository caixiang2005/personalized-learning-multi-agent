/**
 * @file ShinyText.tsx
 * @description 光泽扫过文字动效（参考 React Bits shiny-text，项目配色定制）。
 */

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
}

export default function ShinyText({ children, className = "", as: Tag = "span" }: Props) {
  return <Tag className={`shiny-text ${className}`.trim()}>{children}</Tag>;
}
