/**
 * 滚动进入视口时 fade-up，支持交错子元素与回调。
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
  stagger?: boolean;
  onVisible?: () => void;
};

export default function LandingReveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  stagger = false,
  onVisible,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      onVisibleRef.current?.();
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onVisibleRef.current?.();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  const style = { "--landing-reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref as never}
      className={`landing-reveal${visible ? " landing-reveal--visible" : ""}${stagger ? " landing-reveal--stagger" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
