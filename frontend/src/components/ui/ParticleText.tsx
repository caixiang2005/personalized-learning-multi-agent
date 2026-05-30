/**
 * 交互式粒子文字：粒子从指定原点飞出并聚合成字，之后支持鼠标斥力。
 * @see https://pro.reactbits.dev/docs/components/particle-text
 */
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Particle = {
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  /** 归一化延迟 0–1，控制聚合先后顺序 */
  delay: number;
};

type Props = {
  text: string;
  className?: string;
  textAlign?: "left" | "center";
  color?: string;
  colors?: string[];
  fontSize?: number;
  particleSize?: number;
  particleGap?: number;
  mouseRadius?: number;
  mouseStrength?: number;
  friction?: number;
  ease?: number;
  /** 入场：粒子从原点聚合成字 */
  assemble?: boolean;
  /** 粒子发射原点 */
  assembleOrigin?: "left" | "center" | "top-left";
  /** 聚合动画时长（ms） */
  assembleDuration?: number;
  /** 品牌蓝绿渐变粒子（DESIGN.md #165DFF / #36D399） */
  colorScheme?: "mono" | "brand";
  /** 按文字宽度收缩画布（避免毛玻璃底框过大留白） */
  fitContent?: boolean;
};

/** 项目品牌色粒子盘 */
export const BRAND_PARTICLE_COLORS = [
  "#165dff",
  "#3b82f6",
  "#60a5fa",
  "#36d399",
  "#4ade80",
  "#6ee7b7",
];

function resolveParticleColor(color?: string): string {
  if (color) return color;
  return document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#1a1a1a";
}

function resolvePalette(
  colors: string[] | undefined,
  colorScheme: "mono" | "brand",
  color?: string
): string[] {
  if (colors?.length) return colors;
  if (colorScheme === "brand") return BRAND_PARTICLE_COLORS;
  return [resolveParticleColor(color)];
}

function pickColor(colors: string[], i: number) {
  return colors[i % colors.length];
}

function pickBrandColor(x: number, width: number, colors: string[]) {
  if (width <= 0) return colors[0];
  const t = Math.min(1, Math.max(0, x / width));
  const idx = Math.min(colors.length - 1, Math.floor(t * colors.length));
  return colors[idx];
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function getOrigin(
  width: number,
  height: number,
  origin: "left" | "center" | "top-left",
  textAlign: "left" | "center"
) {
  if (origin === "top-left") return { x: 0, y: height * 0.35 };
  if (origin === "center") return { x: width / 2, y: height / 2 };
  if (textAlign === "left") return { x: 0, y: height / 2 };
  return { x: width * 0.15, y: height / 2 };
}

function buildParticles(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  fontSize: number,
  gap: number,
  particleSize: number,
  colors: string[],
  textAlign: "left" | "center",
  assemble: boolean,
  assembleOrigin: "left" | "center" | "top-left",
  colorScheme: "mono" | "brand"
): Particle[] {
  ctx.clearRect(0, 0, width, height);
  ctx.font = `600 ${fontSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  if (textAlign === "left") {
    ctx.textAlign = "left";
    ctx.fillText(text, 0, height / 2);
  } else {
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height / 2);
  }

  const { data } = ctx.getImageData(0, 0, width, height);
  const particles: Particle[] = [];
  const { x: ox0, y: oy0 } = getOrigin(width, height, assembleOrigin, textAlign);
  const maxDist = Math.hypot(width, height);
  let idx = 0;

  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 140) {
        const dist = Math.hypot(x - ox0, y - oy0);
        const spread = Math.random() * Math.PI * 2;
        const jitter = Math.random() * 10;
        particles.push({
          ox: x,
          oy: y,
          sx: ox0 + Math.cos(spread) * jitter,
          sy: oy0 + Math.sin(spread) * jitter,
          x: ox0 + Math.cos(spread) * jitter,
          y: oy0 + Math.sin(spread) * jitter,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          color:
            colorScheme === "brand"
              ? pickBrandColor(x, width, colors)
              : pickColor(colors, idx++),
          size: particleSize,
          delay: assemble ? (dist / maxDist) * 0.72 + Math.random() * 0.12 : 0,
        });
      }
    }
  }

  if (!assemble) {
    for (const p of particles) {
      p.x = p.ox;
      p.y = p.oy;
      p.vx = 0;
      p.vy = 0;
    }
  }

  return particles;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number
) {
  let size = maxFontSize;
  while (size > minFontSize) {
    ctx.font = `600 ${size}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth * 0.92) return size;
    size -= 2;
  }
  return minFontSize;
}

export default function ParticleText({
  text,
  className = "",
  textAlign = "center",
  color,
  colors,
  fontSize = 28,
  particleSize = 1.5,
  particleGap = 2,
  mouseRadius = 120,
  mouseStrength = 4.5,
  friction = 0.78,
  ease = 0.06,
  assemble = true,
  assembleOrigin = "left",
  assembleDuration = 1600,
  colorScheme = "mono",
  fitContent = false,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const brandGlow = colorScheme === "brand";
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const assembleStartRef = useRef(0);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced) return;

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const setup = () => {
      const style = getComputedStyle(wrap);
      const padX =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const maxW = Math.max(wrap.clientWidth || wrap.parentElement?.clientWidth || 200, 200);
      const maxH = Math.max(wrap.clientHeight - padY, 32);

      const fitted = fitFontSize(offCtx, text, maxW, fontSize, 20);
      offCtx.font = `600 ${fitted}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      const textW = offCtx.measureText(text).width;

      const cssW = fitContent
        ? Math.ceil(textW + 6)
        : maxW;
      const cssH = fitContent
        ? Math.ceil(fitted * 1.28)
        : maxH;

      if (fitContent) {
        wrap.style.width = `${cssW + padX}px`;
        wrap.style.height = `${cssH + padY}px`;
      } else {
        wrap.style.width = "";
        wrap.style.height = "";
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      offscreen.width = Math.floor(cssW);
      offscreen.height = Math.floor(cssH);

      const particleColors = resolvePalette(colors, colorScheme, color);
      particlesRef.current = buildParticles(
        offCtx,
        text,
        offscreen.width,
        offscreen.height,
        fitted,
        particleGap,
        particleSize,
        particleColors,
        textAlign,
        assemble,
        assembleOrigin,
        colorScheme
      );
      assembleStartRef.current = performance.now();
      setReady(true);
    };

    setup();

    const ro = new ResizeObserver(() => setup());
    ro.observe(wrap);

    const themeObserver = new MutationObserver(() => setup());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const tick = () => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const elapsed = performance.now() - assembleStartRef.current;
      const globalT = assemble ? Math.min(1, elapsed / assembleDuration) : 1;
      const interactive = !assemble || elapsed > assembleDuration + 120;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        if (!interactive) {
          const span = Math.max(0.08, 1 - p.delay * 0.85);
          const localT = Math.max(0, Math.min(1, (globalT - p.delay) / span));
          const eased = easeOutCubic(localT);
          p.x = p.sx + (p.ox - p.sx) * eased;
          p.y = p.sy + (p.oy - p.sy) * eased;
          if (localT < 1) {
            p.vx *= 0.9;
            p.vy *= 0.9;
          } else {
            p.x = p.ox;
            p.y = p.oy;
            p.vx = 0;
            p.vy = 0;
          }
        } else {
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < mouseRadius && dist > 0.01) {
              const force = (1 - dist / mouseRadius) * mouseStrength;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          p.vx += (p.ox - p.x) * ease;
          p.vy += (p.oy - p.y) * ease;
          p.vx *= friction;
          p.vy *= friction;
          p.x += p.vx;
          p.y += p.vy;
        }

        ctx.fillStyle = p.color;
        if (brandGlow) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      themeObserver.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [
    reduced,
    text,
    textAlign,
    color,
    colors,
    fontSize,
    particleGap,
    particleSize,
    mouseRadius,
    mouseStrength,
    friction,
    ease,
    assemble,
    assembleOrigin,
    assembleDuration,
    colorScheme,
    fitContent,
  ]);

  if (reduced) {
    return <h1 className={className}>{text}</h1>;
  }

  return (
    <div
      ref={wrapRef}
      className={`particle-text${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={text}
    >
      <h1 className="sr-only">{text}</h1>
      <canvas
        ref={canvasRef}
        className={`particle-text__canvas${ready ? " particle-text__canvas--ready" : ""}`}
      />
      {!ready && (
        <span className="particle-text__fallback" aria-hidden>
          {text}
        </span>
      )}
    </div>
  );
}
