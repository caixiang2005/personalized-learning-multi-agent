/**
 * @file motion.ts
 * @description Anime.js 共享预设 · 尊重 prefers-reduced-motion
 */
import { animate, stagger, type JSAnimation } from "animejs";

export const EASE_OUT = "outQuart";
export const EASE_LOOP = "inOutSine";
export const ENTRANCE_DURATION = 520;
export const STAGGER_STEP_MS = 72;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function pauseAnim(anim: JSAnimation | null | undefined): void {
  anim?.pause();
}

export type EntranceOptions = {
  y?: number;
  x?: number;
  delay?: number;
  duration?: number;
  opacity?: boolean;
};

/** 单元素入场 */
export function animateEntrance(
  el: HTMLElement,
  { y = 14, x = 0, delay = 0, duration = ENTRANCE_DURATION, opacity = true }: EntranceOptions = {}
): JSAnimation {
  const params: Record<string, unknown> = {
    translateY: [y, 0],
    translateX: [x, 0],
    duration,
    delay,
    ease: EASE_OUT,
  };
  if (opacity) params.opacity = [0, 1];
  return animate(el, params);
}

/** 容器内子元素交错入场 */
export function animateStaggerChildren(
  container: HTMLElement,
  selector = ":scope > *",
  {
    staggerMs = STAGGER_STEP_MS,
    y = 16,
    delay = 0,
    duration = ENTRANCE_DURATION,
  }: {
    staggerMs?: number;
    y?: number;
    delay?: number;
    duration?: number;
  } = {}
): JSAnimation {
  const items = container.querySelectorAll<HTMLElement>(selector);
  if (!items.length) {
    return animate(container, { duration: 0 });
  }

  return animate(items, {
    opacity: [0, 1],
    translateY: [y, 0],
    delay: stagger(staggerMs, { start: delay }),
    duration,
    ease: EASE_OUT,
  });
}

/** 头像悬浮循环 */
export function animateFloatLoop(el: HTMLElement): JSAnimation {
  return animate(el, {
    translateY: [-5, 5],
    rotate: [-3, 3],
    duration: 3200,
    loop: true,
    alternate: true,
    ease: EASE_LOOP,
  });
}

/** 进度条宽度填充 */
export function animateProgressBar(el: HTMLElement, percent: number, delay = 0): JSAnimation {
  el.style.width = "0%";
  return animate(el, {
    width: `${Math.min(100, Math.max(0, percent))}%`,
    duration: 900,
    delay,
    ease: EASE_OUT,
  });
}

/** 数字滚动（整数） */
export function animateCountUp(
  el: HTMLElement,
  target: number,
  { delay = 0, duration = 800 }: { delay?: number; duration?: number } = {}
): JSAnimation {
  const obj = { val: 0 };
  return animate(obj, {
    val: target,
    duration,
    delay,
    ease: EASE_OUT,
    onUpdate: () => {
      el.textContent = String(Math.round(obj.val));
    },
  });
}
