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

const TINTS: Record<
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

function spawnBook(): SeaBook {
  const tints: BookTint[] = ["blue", "blue", "green", "violet"];
  const depth = 0.15 + Math.random() * 0.75;
  return {
    x: Math.random(),
    y: Math.random(),
    depth,
    rot: (Math.random() - 0.5) * 0.55,
    driftX: (Math.random() - 0.5) * 0.00014,
    driftY: (Math.random() - 0.5) * 0.0001,
    bobPhase: Math.random() * Math.PI * 2,
    bobAmp: 4 + Math.random() * 10,
    tint: tints[Math.floor(Math.random() * tints.length)]!,
    baseW: 20 + depth * 16,
    baseH: 28 + depth * 20,
  };
}

function wrapCoord(v: number): number {
  if (v < -0.12) return v + 1.24;
  if (v > 1.12) return v - 1.24;
  return v;
}

function drawSeaBook(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  tint: BookTint,
  alpha: number
) {
  const c = TINTS[tint];
  const spineW = Math.max(3, w * 0.14);
  const r = Math.min(3, w * 0.08);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = c.page;
  ctx.fillRect(w * 0.08, -h / 2 + r * 0.5, w * 0.88, h - r);

  ctx.fillStyle = c.cover;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fill();
  } else {
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  ctx.fillStyle = c.spine;
  ctx.fillRect(-w / 2, -h / 2 + r * 0.35, spineW, h - r * 0.7);

  ctx.fillStyle = `rgba(255, 255, 255, ${0.18 * alpha})`;
  ctx.fillRect(-w / 2 + spineW + 2, -h / 2 + h * 0.18, w * 0.55, h * 0.08);

  ctx.strokeStyle = c.edge;
  ctx.lineWidth = 0.85;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, Math.max(0, r - 0.5));
    ctx.stroke();
  } else {
    ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
  }

  ctx.restore();
}

function drawSeaAmbience(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
const HOVER_FACTOR = 1.35;
const MOUSE_LERP = 0.1;
const PARALLAX_BASE = 0.06;

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

      ctx.clearRect(0, 0, w, h);
      drawSeaAmbience(ctx, w, h);

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
        const tilt = reducedMotionLocal ? 0 : mouseRef.current.x * 0.035 * depthMul;
        const alpha = 0.22 + book.depth * 0.34;

        drawSeaBook(ctx, cx, cy, bw, bh, book.rot + tilt, book.tint, alpha);
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
