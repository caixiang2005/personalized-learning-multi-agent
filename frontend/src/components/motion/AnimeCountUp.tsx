/**
 * @file AnimeCountUp.tsx
 * @description 数字滚动展示
 */
import { useRef, type HTMLAttributes } from "react";
import { useAnimeCountUp } from "../../hooks/useAnimeCountUp";

type Props = HTMLAttributes<HTMLParagraphElement> & {
  value: number;
  delay?: number;
  enabled?: boolean;
};

export default function AnimeCountUp({
  value,
  delay = 0,
  enabled = true,
  className,
  ...rest
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  useAnimeCountUp(ref, value, { delay, enabled });

  return (
    <p ref={ref} className={className} {...rest}>
      {value}
    </p>
  );
}
