/**
 * 磁吸跟随 — adapted from React Bits (https://reactbits.dev/animations/magnet).
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
};

export default function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.5s ease-in-out",
  wrapperClassName = "",
  innerClassName = "",
  className,
  ...props
}: Props) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      setIsActive(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const el = magnetRef.current;
      if (!el) return;

      const { left, top, width, height } = el.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        setPosition({
          x: (e.clientX - centerX) / magnetStrength,
          y: (e.clientY - centerY) / magnetStrength,
        });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  const innerStyle: CSSProperties = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    transition: isActive ? activeTransition : inactiveTransition,
    willChange: "transform",
  };

  return (
    <div
      ref={magnetRef}
      className={`magnet ${wrapperClassName} ${className ?? ""}`.trim()}
      {...props}
    >
      <div className={`magnet__inner ${innerClassName}`.trim()} style={innerStyle}>
        {children}
      </div>
    </div>
  );
}
