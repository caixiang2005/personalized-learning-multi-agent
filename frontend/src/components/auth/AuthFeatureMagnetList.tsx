/**
 * 特性列表：每条整体磁吸跟随鼠标，靠近时微微被吸过去。
 */
import type { ComponentType } from "react";
import Magnet from "../ui/Magnet";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Feature = {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  text: string;
};

type Props = {
  features: Feature[];
};

export default function AuthFeatureMagnetList({ features }: Props) {
  const reduced = usePrefersReducedMotion();

  return (
    <ul className="login-brand__list login-brand__list--magnet">
      {features.map((f) => (
        <li key={f.text} className="login-brand__item">
          <Magnet
            disabled={reduced}
            padding={56}
            magnetStrength={5.5}
            wrapperClassName="login-brand__magnet-row"
            innerClassName="login-brand__magnet-inner"
            activeTransition="transform 0.22s ease-out"
            inactiveTransition="transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)"
          >
            <span className="landing-icon-glass landing-icon-glass--sm shrink-0">
              <f.icon size={16} strokeWidth={1.75} />
            </span>
            <span className="login-brand__item-text">{f.text}</span>
          </Magnet>
        </li>
      ))}
    </ul>
  );
}
