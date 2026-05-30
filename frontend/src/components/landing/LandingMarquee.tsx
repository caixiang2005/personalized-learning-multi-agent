/**
 * 资源类型横滑条（<1280px 显示，宽屏由右侧栏承担）。
 */
import type { LucideIcon } from "lucide-react";
import LandingReveal from "./LandingReveal";

type Item = { icon: LucideIcon; label: string };

type Props = {
  title: string;
  items: Item[];
};

export default function LandingMarquee({ title, items }: Props) {
  const chips = items.map((item, i) => (
    <span key={`${item.label}-${i}`} className="landing-marquee__chip landing-glass">
      <item.icon size={14} strokeWidth={1.75} aria-hidden />
      {item.label}
    </span>
  ));

  return (
    <LandingReveal as="section" className="landing-marquee landing-section-frame" delay={60}>
      <p className="landing-marquee__title">{title}</p>
      <div className="landing-marquee__viewport">
        <div className="landing-marquee__track">
          <div className="landing-marquee__group">{chips}</div>
          <div className="landing-marquee__group" aria-hidden>
            {items.map((item, i) => (
              <span key={`${item.label}-dup-${i}`} className="landing-marquee__chip landing-glass">
                <item.icon size={14} strokeWidth={1.75} aria-hidden />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
