/**
 * @file useAnimeEntrance.ts
 * @description 挂载时 Anime.js 入场 · 无障碍降级为静态展示
 */
import { useLayoutEffect, type RefObject } from "react";
import {
  animateEntrance,
  pauseAnim,
  prefersReducedMotion,
  type EntranceOptions,
} from "../lib/anime/motion";

export function useAnimeEntrance(
  ref: RefObject<HTMLElement | null>,
  options: EntranceOptions & { enabled?: boolean } = {}
): void {
  const { enabled = true, ...entranceOpts } = options;

  useLayoutEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const anim = animateEntrance(el, entranceOpts);
    return () => pauseAnim(anim);
  }, [enabled, entranceOpts.delay, entranceOpts.duration, entranceOpts.opacity, entranceOpts.x, entranceOpts.y]);
}
