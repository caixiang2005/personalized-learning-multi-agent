/**
 * @file AnimeStagger.tsx
 * @description 子元素交错入场容器
 */
import { useRef, type ReactNode, type ElementType, type HTMLAttributes } from "react";
import { useAnimeStaggerChildren } from "../../hooks/useAnimeStaggerChildren";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  selector?: string;
  staggerMs?: number;
  y?: number;
  delay?: number;
  enabled?: boolean;
  replayKey?: string | number;
};

export default function AnimeStagger({
  children,
  className,
  as: Tag = "div",
  selector,
  staggerMs,
  y,
  delay,
  enabled = true,
  replayKey,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useAnimeStaggerChildren(ref, { selector, staggerMs, y, delay, enabled, replayKey });

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
