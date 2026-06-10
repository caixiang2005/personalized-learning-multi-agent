/**
 * @file useAnimeStaggerChildren.ts
 * @description 容器子元素交错入场
 */
import { useLayoutEffect, type RefObject } from "react";
import {
  animateStaggerChildren,
  pauseAnim,
  prefersReducedMotion,
} from "../lib/anime/motion";

type Options = {
  selector?: string;
  staggerMs?: number;
  y?: number;
  delay?: number;
  duration?: number;
  enabled?: boolean;
  /** 依赖变化时重新播放（如列表 key） */
  replayKey?: string | number;
};

export function useAnimeStaggerChildren(
  ref: RefObject<HTMLElement | null>,
  {
    selector = ":scope > *",
    staggerMs,
    y,
    delay,
    duration,
    enabled = true,
    replayKey,
  }: Options = {}
): void {
  useLayoutEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const anim = animateStaggerChildren(el, selector, { staggerMs, y, delay, duration });
    return () => pauseAnim(anim);
  }, [enabled, selector, staggerMs, y, delay, duration, replayKey]);
}
