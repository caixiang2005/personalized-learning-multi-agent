/**
 * @file useAnimeCountUp.ts
 * @description 数字滚动计数
 */
import { useLayoutEffect, type RefObject } from "react";
import { animateCountUp, pauseAnim, prefersReducedMotion } from "../lib/anime/motion";

export function useAnimeCountUp(
  ref: RefObject<HTMLElement | null>,
  target: number,
  { delay = 0, enabled = true }: { delay?: number; enabled?: boolean } = {}
): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = String(target);
      return;
    }

    const anim = animateCountUp(el, target, { delay });
    return () => pauseAnim(anim);
  }, [target, delay, enabled]);
}
