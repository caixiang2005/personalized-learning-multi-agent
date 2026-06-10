/**
 * 鼠标跟随的轻 3D 倾斜（桌面端）。
 */
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  children: ReactNode;
  className?: string;
  intensity?: number;
  style?: CSSProperties;
};

export default function LandingTiltCard({
  children,
  className = "",
  intensity = 7,
  style: outerStyle,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>({});

  const reset = () => {
    setTiltStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg)",
    });
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({
      transform: `perspective(900px) rotateX(${(-y * intensity).toFixed(2)}deg) rotateY(${(x * intensity).toFixed(2)}deg) translateZ(0)`,
    });
  };

  return (
    <div
      ref={ref}
      className={`landing-tilt${className ? ` ${className}` : ""}`}
      style={{ ...outerStyle, ...tiltStyle }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      <div className="landing-tilt__shine" aria-hidden />
      {children}
    </div>
  );
}
