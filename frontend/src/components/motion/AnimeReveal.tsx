/**
 * @file AnimeReveal.tsx
 * @description 单块内容 Anime.js 入场包装
 */
import { useRef, type ReactNode, type ElementType, type HTMLAttributes } from "react";
import { useAnimeEntrance } from "../../hooks/useAnimeEntrance";
import type { EntranceOptions } from "../../lib/anime/motion";

type Props = EntranceOptions &
  HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    className?: string;
    as?: ElementType;
    enabled?: boolean;
  };

export default function AnimeReveal({
  children,
  className,
  as: Tag = "div",
  enabled = true,
  y,
  x,
  delay,
  duration,
  opacity,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useAnimeEntrance(ref, { y, x, delay, duration, opacity, enabled });

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ willChange: enabled ? "transform, opacity" : undefined }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
