/**
 * @file ShinyText.tsx
 * @description 品牌渐变标题字（静态色带，无扫光动画）。
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
