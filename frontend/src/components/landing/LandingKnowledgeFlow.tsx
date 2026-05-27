/**
 * @file LandingKnowledgeFlow.tsx
 * @description 门户页「知识遨游」背景：透视隧道 + 书本与流光（项目定制，非照搬 Hyperspeed）。
 */

import { useEffect, useRef } from "react";

type Particle = {
  angle: number;
  progress: number;
  speed: number;
  kind: "book" | "streak";
  width: number;
  height: number;
  tint: "blue" | "green" | "violet";
};

const BOOK_WIDTH = 20;
const BOOK_HEIGHT = 28;

const TINTS: Record<Particle["tint"], { fill: string; spine: string; streak: string }> = {
  blue: { fill: "rgba(22, 93, 255, 0.34)", spine: "rgba(22, 93, 255, 0.62)", streak: "rgba(22, 93, 255, 0.22)" },
  green: { fill: "rgba(54, 211, 153, 0.3)", spine: "rgba(16, 185, 129, 0.58)", streak: "rgba(54, 211, 153, 0.2)" },
  violet: { fill: "rgba(99, 102, 241, 0.28)", spine: "rgba(79, 70, 229, 0.55)", streak: "rgba(99, 102, 241, 0.18)" },
};

function spawnParticle(kind?: Particle["kind"]): Particle {
  const tints: Particle["tint"][] = ["blue", "green", "violet"];
  const isStreak = kind === "streak" || (kind === undefined && Math.random() < 0.22);
  return {
    angle: Math.random() * Math.PI * 2,
    progress: Math.random() * 0.3,
    speed: isStreak ? 0.0016 + Math.random() * 0.0012 : 0.001 + Math.random() * 0.0012,
    kind: isStreak ? "streak" : "book",
    width: isStreak ? 1.5 + Math.random() * 1.5 : BOOK_WIDTH,
    height: isStreak ? 28 + Math.random() * 36 : BOOK_HEIGHT,
    tint: tints[Math.floor(Math.random() * tints.length)]!,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.rect(x, y, w, h);
}

function drawBook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tint: Particle["tint"],
  alpha: number
) {
  const colors = TINTS[tint];
  const r = Math.min(4, w * 0.1);

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = colors.fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();

  ctx.fillStyle = colors.spine;
  ctx.fillRect(x, y + r * 0.4, Math.max(3, w * 0.16), h - r);

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * alpha})`;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.max(0, r - 0.5));
  ctx.stroke();

  ctx.restore();
}

function drawStreak(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tint: Particle["tint"],
  alpha: number,
  width: number
) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.35, TINTS[tint].streak);
  grad.addColorStop(1, TINTS[tint].streak);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export default function LandingKnowledgeFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = window.innerWidth < 768 ? 28 : 48;
    particlesRef.current = Array.from({ length: count }, () => spawnParticle());

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

    resize();
    window.addEventListener("resize", resize);

    const drawFrame = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const vpX = w * 0.5;
      const vpY = h * 0.4;
      const glowRadius = Math.min(w, h) * 0.34;
      const maxDist = Math.hypot(w, h) * 0.56;

      ctx.clearRect(0, 0, w, h);

      const horizonGrad = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, glowRadius);
      horizonGrad.addColorStop(0, "rgba(22, 93, 255, 0.15)");
      horizonGrad.addColorStop(0.32, "rgba(54, 211, 153, 0.06)");
      horizonGrad.addColorStop(0.62, "rgba(22, 93, 255, 0.02)");
      horizonGrad.addColorStop(1, "transparent");
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(22, 93, 255, 0.06)";
      ctx.lineWidth = 0.75;
      const lineReach = glowRadius * 1.15;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(vpX + Math.cos(a) * lineReach, vpY + Math.sin(a) * lineReach * 0.75);
        ctx.stroke();
      }

      for (const p of particlesRef.current) {
        p.progress += p.speed;
        if (p.progress > 1) {
          Object.assign(p, spawnParticle());
          p.progress = 0;
        }

        const t = p.progress;
        const dist = t * maxDist;
        const spread = 0.42 + t * 0.48;
        const x = vpX + Math.cos(p.angle) * dist * spread;
        const y = vpY + Math.sin(p.angle) * dist * spread * 0.78;
        const scale = 0.38 + t * 0.62;
        let alpha = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 0.38 + t * 0.22;
        alpha = Math.min(0.62, Math.max(0.1, alpha));

        if (p.kind === "streak") {
          const tail = 0.22 + t * 0.35;
          const x0 = vpX + Math.cos(p.angle) * dist * spread * (1 - tail);
          const y0 = vpY + Math.sin(p.angle) * dist * spread * 0.78 * (1 - tail);
          drawStreak(ctx, x0, y0, x, y, p.tint, alpha, p.width * scale);
        } else {
          const bw = p.width * scale;
          const bh = p.height * scale;
          drawBook(ctx, x - bw / 2, y - bh / 2, bw, bh, p.tint, alpha);

        }
      }

      const coreGlow = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, 42);
      coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.16)");
      coreGlow.addColorStop(0.5, "rgba(22, 93, 255, 0.08)");
      coreGlow.addColorStop(1, "transparent");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(vpX - 56, vpY - 56, 112, 112);

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    if (reducedMotion) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.min(w, h) * 0.34);
      g.addColorStop(0, "rgba(22, 93, 255, 0.15)");
      g.addColorStop(0.4, "rgba(54, 211, 153, 0.07)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else {
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="landing-knowledge-flow" aria-hidden>
      <canvas ref={canvasRef} className="landing-knowledge-flow__canvas" />
      <div className="landing-knowledge-flow__veil" />
    </div>
  );
}
