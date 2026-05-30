import { Brain, Hash, Route, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import FadeInView from "../../components/motion/FadeInView";
import HoverLift from "../../components/motion/HoverLift";
import MotionCountUp from "../../components/motion/MotionCountUp";
import type { UserStatsDto } from "../../types/account";

const statMeta: {
  key: keyof UserStatsDto;
  label: string;
  suffix: string;
  tone: "blue" | "green" | "purple" | "orange";
  icon: LucideIcon;
}[] = [
  { key: "healthScore", label: "画像健康度", suffix: "分", tone: "blue", icon: Brain },
  { key: "goalProgress", label: "目标进度", suffix: "%", tone: "green", icon: Target },
  { key: "pathProgress", label: "学习路径", suffix: "%", tone: "purple", icon: Route },
  { key: "sessionCount", label: "对话会话", suffix: "个", tone: "orange", icon: Hash },
];

type Props = {
  stats: UserStatsDto;
  ready: boolean;
};

export default function AccountStatsGrid({ stats, ready }: Props) {
  return (
    <div className="account-stats">
      {statMeta.map((item, i) => (
        <FadeInView key={item.key} delay={0.08 + i * 0.06}>
          <HoverLift className="account-stat landing-glass-card">
            <div className="flex items-center gap-3">
              <span className={`landing-icon-tone landing-icon-tone--${item.tone} landing-icon-tone--sm`}>
                <item.icon size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="account-stat__value">
                  <MotionCountUp value={stats[item.key]} suffix={item.suffix} active={ready} />
                </p>
                <p className="account-stat__label">{item.label}</p>
              </div>
            </div>
          </HoverLift>
        </FadeInView>
      ))}
    </div>
  );
}
