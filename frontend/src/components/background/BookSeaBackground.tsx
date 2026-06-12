/**
 * @file BookSeaBackground.tsx
 * @description 全站「遨游书海」固定背景：书本缓慢漂浮 + 鼠标视差（DESIGN.md §6）。
 */

import { useEffect, useRef, useState } from "react";

type BookTint = "blue" | "green" | "violet";

type SeaBook = {
  x: number;
  y: number;
  depth: number;
  rot: number;
  driftX: number;
  driftY: number;
  bobPhase: number;
  bobAmp: number;
  tint: BookTint;
  baseW: number;
  baseH: number;
};

const TINTS_LIGHT: Record<
  BookTint,
  { cover: string; spine: string; edge: string; page: string }
> = {
  blue: {
    cover: "rgba(22, 93, 255, 0.4)",
    spine: "rgba(14, 66, 210, 0.68)",
    edge: "rgba(255, 255, 255, 0.55)",
    page: "rgba(255, 255, 255, 0.42)",
  },
  green: {
    cover: "rgba(54, 211, 153, 0.34)",
    spine: "rgba(13, 148, 136, 0.62)",
    edge: "rgba(255, 255, 255, 0.5)",
    page: "rgba(255, 255, 255, 0.38)",
  },
  violet: {
    cover: "rgba(99, 102, 241, 0.34)",
    spine: "rgba(67, 56, 202, 0.58)",
    edge: "rgba(255, 255, 255, 0.5)",
    page: "rgba(255, 255, 255, 0.38)",
  },
};

/** 暗色：更亮、偏靛紫/青绿荧光，避免发灰发脏 */
const TINTS_DARK: Record<
  BookTint,
  { cover: string; spine: string; edge: string; page: string; glow: string }
> = {
  blue: {
    cover: "rgba(129, 140, 248, 0.62)",
    spine: "rgba(99, 102, 241, 0.92)",
    edge: "rgba(224, 231, 255, 0.52)",
    page: "rgba(199, 210, 254, 0.32)",
    glow: "rgba(129, 140, 248, 0.45)",
  },
  green: {
    cover: "rgba(52, 211, 153, 0.55)",
    spine: "rgba(34, 197, 94, 0.88)",
    edge: "rgba(209, 250, 229, 0.48)",
    page: "rgba(167, 243, 208, 0.26)",
    glow: "rgba(52, 211, 153, 0.4)",
  },
  violet: {
    cover: "rgba(167, 139, 250, 0.58)",
    spine: "rgba(139, 92, 246, 0.85)",
    edge: "rgba(233, 213, 255, 0.45)",
    page: "rgba(221, 214, 254, 0.28)",
    glow: "rgba(167, 139, 250, 0.38)",
  },
};

function spawnBook(): SeaBook {
  const tints: BookTint[] = ["blue", "blue", "green", "violet"];
  const depth = 0.15 + Math.random() * 0.75;
  return {
    x: Math.random(),
    y: Math.random(),
    depth,
    rot: (Math.random() - 0.5) * 0.28,
    driftX: (Math.random() - 0.5) * 0.00014,
    driftY: (Math.random() - 0.5) * 0.0001,
    bobPhase: Math.random() * Math.PI * 2,
    bobAmp: 4 + Math.random() * 10,
    tint: tints[Math.floor(Math.random() * tints.length)]!,
    baseW: 26 + depth * 18,
    baseH: 34 + depth * 22,
  };
}

function wrapCoord(v: number): number {
  if (v < -0.12) return v + 1.24;
  if (v > 1.12) return v - 1.24;
  return v;
}

/** 将颜色 alpha 与书本整体透明度合并，避免 globalAlpha × rgba 叠出竖条鬼影 */
function withBookAlpha(color: string, bookAlpha: number): string {
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!match) return color;
  const baseAlpha = match[4] !== undefined ? Number(match[4]) : 1;
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${baseAlpha * bookAlpha})`;
}

function fillSeaBookShape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fill();
    return;
  }
  ctx.fillRect(-w / 2, -h / 2, w, h);
}

function strokeSeaBookShape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, Math.max(0, r - 0.5));
    ctx.stroke();
    return;
  }
  ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
}

function drawSeaBook(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  tint: BookTint,
  alpha: number,
  isDark: boolean
) {
  const c = isDark ? TINTS_DARK[tint] : TINTS_LIGHT[tint];
  const r = Math.min(2.5, w * 0.07);
  const spineStop = 0.12;
  const pageStop = 0.96;

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.rotate(rot);
  ctx.globalAlpha = 1;

  const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, withBookAlpha(c.spine, alpha));
  grad.addColorStop(spineStop, withBookAlpha(c.spine, alpha));
  grad.addColorStop(spineStop + 0.06, withBookAlpha(c.cover, alpha));
  grad.addColorStop(pageStop, withBookAlpha(c.cover, alpha));
  grad.addColorStop(1, withBookAlpha(c.page, alpha * 0.9));

  ctx.fillStyle = grad;
  fillSeaBookShape(ctx, w, h, r);

  const titleY = -h / 2 + h * 0.2;
  const titleH = Math.max(1.5, h * 0.06);
  const titleX = -w / 2 + w * spineStop + 1.5;
  const titleW = w * (pageStop - spineStop) * 0.55;
  ctx.fillStyle = withBookAlpha(
    `rgba(255, 255, 255, ${isDark ? 0.16 : 0.12})`,
    alpha
  );
  ctx.fillRect(titleX, titleY, titleW, titleH);

  ctx.strokeStyle = withBookAlpha(c.edge, alpha * 0.85);
  ctx.lineWidth = isDark ? 1 : 0.85;
  strokeSeaBookShape(ctx, w, h, r);

  ctx.restore();
}

function drawSeaAmbience(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  if (isDark) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(79, 70, 229, 0.1)");
    g.addColorStop(0.45, "rgba(34, 197, 94, 0.05)");
    g.addColorStop(1, "rgba(30, 27, 75, 0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const mist = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, Math.min(w, h) * 0.55);
    mist.addColorStop(0, "rgba(129, 140, 248, 0.08)");
    mist.addColorStop(0.5, "rgba(30, 27, 75, 0.04)");
    mist.addColorStop(1, "transparent");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(22, 93, 255, 0.07)");
  g.addColorStop(0.45, "rgba(54, 211, 153, 0.04)");
  g.addColorStop(1, "rgba(22, 93, 255, 0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const mist = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, Math.min(w, h) * 0.55);
  mist.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  mist.addColorStop(0.5, "rgba(245, 248, 255, 0.03)");
  mist.addColorStop(1, "transparent");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, w, h);
}

/** 鼠标视差参数 */
const HOVER_FACTOR = 1.30;
const MOUSE_LERP = 0.1;
const PARALLAX_BASE = 0.05;

export default function BookSeaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const booksRef = useRef<SeaBook[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetMouseRef.current = {
        x: (e.clientX / w) * 2 - 1,
        y: -((e.clientY / h) * 2 - 1),
      };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionLocal = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bookCount = () => (window.innerWidth < 768 ? 20 : 34);

    const initBooks = () => {
      booksRef.current = Array.from({ length: bookCount() }, () => spawnBook());
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onResize = () => {
      resize();
      initBooks();
    };

    resize();
    initBooks();
    window.addEventListener("resize", onResize);

    const drawFrame = (time: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = time * 0.001;
      const isDark = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, w, h);
      drawSeaAmbience(ctx, w, h, isDark);

      if (!reducedMotionLocal) {
        mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * MOUSE_LERP;
        mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * MOUSE_LERP;
      }

      const parallaxScale = Math.min(w, h) * PARALLAX_BASE * HOVER_FACTOR;
      const panX = -mouseRef.current.x * parallaxScale;
      const panY = -mouseRef.current.y * parallaxScale;

      const sorted = [...booksRef.current].sort((a, b) => a.depth - b.depth);

      for (const book of sorted) {
        if (!reducedMotionLocal) {
          book.x = wrapCoord(book.x + book.driftX);
          book.y = wrapCoord(book.y + book.driftY);
        }

        const bob = reducedMotionLocal ? 0 : Math.sin(t * 0.9 + book.bobPhase) * book.bobAmp;
        const scale = 0.58 + book.depth * 0.72;
        const bw = book.baseW * scale;
        const bh = book.baseH * scale;
        const depthMul = 0.65 + book.depth * 0.35;
        const cx = book.x * w + panX * depthMul;
        const cy = book.y * h + bob + panY * depthMul;
        const tilt = reducedMotionLocal ? 0 : mouseRef.current.x * 0.02 * depthMul;
        const alpha = 0.22 + book.depth * 0.34;

        drawSeaBook(ctx, cx, cy, bw, bh, book.rot + tilt, book.tint, alpha, isDark);
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    if (reducedMotionLocal) {
      drawFrame(0);
    } else {
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="book-sea" aria-hidden>
      <canvas ref={canvasRef} className="book-sea__canvas" />
      <div className="book-sea__veil" />
    </div>
  );
}
