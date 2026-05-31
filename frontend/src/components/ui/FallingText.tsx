/**
 * Gravity-based falling text — adapted from React Bits (https://reactbits.dev/text-animations/falling-text).
 */
import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type SplitBy = "word" | "char";
type Trigger = "auto" | "scroll" | "click" | "hover";

type Props = {
  text?: string;
  highlightWords?: string[];
  highlightClass?: string;
  trigger?: Trigger;
  backgroundColor?: string;
  wireframes?: boolean;
  gravity?: number;
  mouseConstraintStiffness?: number;
  fontSize?: string;
  splitBy?: SplitBy;
  className?: string;
};

function splitUnits(text: string, splitBy: SplitBy): string[] {
  if (splitBy === "char") {
    return [...text].filter((c) => c.trim() !== "");
  }
  return text.split(/\s+/).filter(Boolean);
}

function isHighlighted(unit: string, highlightWords: string[], splitBy: SplitBy) {
  if (splitBy === "char") {
    return highlightWords.some((hw) => hw.includes(unit));
  }
  return highlightWords.some((hw) => unit.startsWith(hw));
}

export default function FallingText({
  text = "",
  highlightWords = [],
  highlightClass = "falling-text__highlight",
  trigger = "auto",
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
  fontSize = "1rem",
  splitBy = "word",
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [effectStarted, setEffectStarted] = useState(false);

  useEffect(() => {
    if (!textRef.current || reduced) return;
    const units = splitUnits(text, splitBy);
    textRef.current.innerHTML = units
      .map((unit) => {
        const highlighted = isHighlighted(unit, highlightWords, splitBy);
        return `<span class="falling-text__unit${highlighted ? ` ${highlightClass}` : ""}">${unit}</span>`;
      })
      .join(splitBy === "char" ? "" : " ");
  }, [text, highlightWords, highlightClass, splitBy, reduced]);

  useEffect(() => {
    if (reduced) return;
    if (trigger === "auto") {
      setEffectStarted(true);
      return;
    }
    if (trigger === "scroll" && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEffectStarted(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, reduced]);

  useEffect(() => {
    if (!effectStarted || reduced) return;

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;
    const container = containerRef.current;
    const canvasHost = canvasContainerRef.current;
    const textEl = textRef.current;
    if (!container || !canvasHost || !textEl) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    if (width <= 0 || height <= 0) return;

    const engine = Engine.create();
    engine.world.gravity.y = gravity;

    const render = Render.create({
      element: canvasHost,
      engine,
      options: {
        width,
        height,
        background: backgroundColor,
        wireframes,
      },
    });

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };
    const floor = Bodies.rectangle(width / 2, height + 25, width, 50, boundaryOptions);
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions);
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions);
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions);

    const wordSpans = textEl.querySelectorAll<HTMLSpanElement>(".falling-text__unit");
    const wordBodies = [...wordSpans].map((elem) => {
      const rect = elem.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: "transparent" },
        restitution: 0.8,
        frictionAir: 0.01,
        friction: 0.2,
      });
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 5,
        y: 0,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      return { elem, body };
    });

    wordBodies.forEach(({ elem, body }) => {
      elem.style.position = "absolute";
      elem.style.left = `${body.position.x - body.bounds.max.x + body.bounds.min.x / 2}px`;
      elem.style.top = `${body.position.y - body.bounds.max.y + body.bounds.min.y / 2}px`;
      elem.style.transform = "none";
    });

    const mouse = Mouse.create(container);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
      },
    });
    render.mouse = mouse;

    World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    let frameId = 0;
    const updateLoop = () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      Matter.Engine.update(engine);
      frameId = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    return () => {
      cancelAnimationFrame(frameId);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasHost.contains(render.canvas)) {
        canvasHost.removeChild(render.canvas);
      }
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [
    effectStarted,
    gravity,
    wireframes,
    backgroundColor,
    mouseConstraintStiffness,
    reduced,
  ]);

  const handleTrigger = () => {
    if (!effectStarted && (trigger === "click" || trigger === "hover")) {
      setEffectStarted(true);
    }
  };

  if (reduced) {
    return (
      <span className={className} style={{ fontSize }}>
        {text}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`falling-text ${className}`.trim()}
      onClick={handleTrigger}
      onMouseEnter={handleTrigger}
      role={trigger === "click" || trigger === "hover" ? "button" : undefined}
      tabIndex={trigger === "click" ? 0 : undefined}
      onKeyDown={
        trigger === "click"
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleTrigger();
            }
          : undefined
      }
    >
      <div ref={canvasContainerRef} className="falling-text__canvas" aria-hidden />
      <div ref={textRef} className="falling-text__target" style={{ fontSize }} />
    </div>
  );
}
