/**
 * 认证页背景：角落星云 + 弧形引力波（宇宙感）
 */
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type CornerId = "bl" | "tr";

type Wave = {
  radius: number;
  corner: CornerId;
  width: number;
  drift: number;
};

type Star = { x: number; y: number; r: number; twinkle: number };

const MAX_WAVES = 3;
const WAVE_SPEED = 24;
const SPAWN_GAP = 52;
const WAVE_WIDTH = 34;

const CORNERS: Record<
  CornerId,
  {
    getOrigin: (w: number, h: number) => { x: number; y: number };
    /** 红笔标注的最大扩散半径（相对视口宽高的角落占比） */
    getMaxRadius: (w: number, h: number) => number;
    arcStart: number;
    arcEnd: number;
    hues: [number, number, number];
  }
> = {
  bl: {
    getOrigin: (_w, h) => ({ x: 0, y: h }),
    getMaxRadius: (w, h) => Math.hypot(w * 0.33, h * 0.43),
    arcStart: -Math.PI / 2,
    arcEnd: 0,
    hues: [228, 198, 172],
  },
  tr: {
    getOrigin: (w, _h) => ({ x: w, y: 0 }),
    getMaxRadius: (w, h) => Math.hypot(w * 0.28, h * 0.28),
    arcStart: Math.PI / 2,
    arcEnd: Math.PI,
    hues: [252, 210, 188],
  },
};

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 扩散进度 0→1，整圈透明度随半径增大而升高（alpha → 0） */
function ringAlphaByTravel(t: number, isDark: boolean): number {
  const peak = isDark ? 0.28 : 0.2;
  return (1 - smoothstep(0.12, 1, Math.max(0, Math.min(1, t)))) * peak;
}

function drawNebulaCore(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  maxR: number,
  hues: [number, number, number],
  isDark: boolean,
  breathe: number
) {
  const span = maxR * (0.9 + breathe * 0.04);
  const nebulaAlpha = isDark ? 0.22 : 0.15;

  const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, span);
  grad.addColorStop(0, hsla(hues[0], isDark ? 48 : 38, isDark ? 60 : 54, nebulaAlpha));
  grad.addColorStop(0.45, hsla(hues[1], isDark ? 36 : 28, isDark ? 72 : 66, nebulaAlpha * 0.55));
  grad.addColorStop(0.78, hsla(hues[2], isDark ? 22 : 18, isDark ? 82 : 78, nebulaAlpha * 0.2));
  grad.addColorStop(1, hsla(hues[2], isDark ? 14 : 12, isDark ? 90 : 88, 0));

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawCosmicArc(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  radius: number,
  width: number,
  travel: number,
  arcStart: number,
  arcEnd: number,
  hues: [number, number, number],
  isDark: boolean
) {
  const alpha = ringAlphaByTravel(travel, isDark);
  if (alpha <= 0.004 || radius < 8) return;

  const inner = Math.max(0, radius - width * 0.5);
  const outer = radius + width * 0.5;
  const sat = isDark ? 44 : 34;
  const light = isDark ? 62 : 54;
  const midAngle = (arcStart + arcEnd) / 2;
  const gx = ox + Math.cos(midAngle) * radius;
  const gy = oy + Math.sin(midAngle) * radius;

  const grad = ctx.createLinearGradient(ox, oy, gx, gy);
  grad.addColorStop(0, hsla(hues[0], sat, light, alpha));
  grad.addColorStop(0.5, hsla(hues[1], sat - 4, light + 4, alpha));
  grad.addColorStop(1, hsla(hues[2], sat - 8, light + 8, alpha));

  ctx.save();
  ctx.globalCompositeOperation = isDark ? "screen" : "source-over";
  ctx.beginPath();
  ctx.arc(ox, oy, outer, arcStart, arcEnd);
  ctx.arc(ox, oy, inner, arcEnd, arcStart, true);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  w: number,
  h: number,
  time: number,
  isDark: boolean
) {
  for (const star of stars) {
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.0012 + star.twinkle));
    const a = (isDark ? 0.55 : 0.28) * tw;
    ctx.fillStyle = isDark ? `rgba(220, 230, 255, ${a})` : `rgba(11, 110, 131, ${a * 0.7})`;
    ctx.beginPath();
    ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function seedStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 28; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() < 0.15 ? 1.1 : 0.55,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export default function AuthCosmicRings() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const waves: Wave[] = [];
    const stars = seedStars();
    let raf = 0;
    let lastTime = performance.now();
    let spawnAcc = { bl: SPAWN_GAP * 0.55, tr: SPAWN_GAP * 0.2 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };

    let { w, h } = resize();

    const seedStatic = () => {
      waves.length = 0;
      (["bl", "tr"] as CornerId[]).forEach((corner) => {
        const maxR = CORNERS[corner].getMaxRadius(w, h);
        for (let r = SPAWN_GAP * 0.55; r < maxR; r += SPAWN_GAP * 1.65) {
          waves.push({ radius: r, corner, width: WAVE_WIDTH, drift: r * 0.01 });
        }
      });
    };

    const onResize = () => {
      ({ w, h } = resize());
      if (reduced) seedStatic();
    };

    if (reduced) seedStatic();
    window.addEventListener("resize", onResize);

    const draw = (time: number) => {
      const isDark = document.documentElement.classList.contains("dark");
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const breathe = 0.5 + 0.5 * Math.sin(time * 0.00045);

      ctx.clearRect(0, 0, w, h);

      (["bl", "tr"] as CornerId[]).forEach((corner) => {
        const cfg = CORNERS[corner];
        const { x, y } = cfg.getOrigin(w, h);
        const maxR = cfg.getMaxRadius(w, h);
        drawNebulaCore(ctx, x, y, w, h, maxR, cfg.hues, isDark, breathe);
      });

      drawStars(ctx, stars, w, h, time, isDark);

      if (!reduced) {
        (["bl", "tr"] as CornerId[]).forEach((corner) => {
          spawnAcc[corner] += WAVE_SPEED * dt;
          while (spawnAcc[corner] >= SPAWN_GAP) {
            spawnAcc[corner] -= SPAWN_GAP;
            waves.push({
              radius: 10,
              corner,
              width: WAVE_WIDTH + (Math.random() - 0.5) * 8,
              drift: (Math.random() - 0.5) * 0.6,
            });
          }
        });

        for (let i = waves.length - 1; i >= 0; i--) {
          const wave = waves[i]!;
          const maxR = CORNERS[wave.corner].getMaxRadius(w, h);
          wave.radius += WAVE_SPEED * dt;
          if (wave.radius > maxR) waves.splice(i, 1);
        }

        while (waves.length > MAX_WAVES * 2) waves.shift();
      }

      for (const wave of waves) {
        const corner = CORNERS[wave.corner];
        const { x: ox, y: oy } = corner.getOrigin(w, h);
        const maxR = corner.getMaxRadius(w, h);
        const travel = Math.max(0, Math.min(1, wave.radius / maxR));

        drawCosmicArc(
          ctx,
          ox,
          oy,
          wave.radius,
          wave.width,
          travel,
          corner.arcStart + wave.drift * 0.04,
          corner.arcEnd + wave.drift * 0.04,
          corner.hues,
          isDark
        );
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return (
    <div className="auth-cosmic-rings" aria-hidden>
      <canvas ref={canvasRef} className="auth-cosmic-rings__canvas" />
    </div>
  );
}
