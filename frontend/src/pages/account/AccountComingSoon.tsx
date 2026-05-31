import { BarChart3, Brain, Route } from "lucide-react";
import FadeInView from "../../components/motion/FadeInView";

const placeholders = [
  {
    icon: Brain,
    title: "学习画像",
    desc: "6 维度动态分析，登录后主页完善中",
    tone: "green" as const,
  },
  {
    icon: Route,
    title: "学习路径",
    desc: "阶段规划与资源推送，即将接入",
    tone: "blue" as const,
  },
  {
    icon: BarChart3,
    title: "学习统计",
    desc: "进度与效果评估，预留接口待开发",
    tone: "purple" as const,
  },
];

/** 主功能未完善时的占位区块 */
export default function AccountComingSoon() {
  return (
    <FadeInView delay={0.18}>
      <section className="account-soon section-card">
        <div className="account-soon__head">
          <h3 className="account-soon__title">更多功能</h3>
          <p className="account-soon__desc">主页模块仍在开发，以下入口稍后开放</p>
        </div>
        <ul className="account-soon__grid">
          {placeholders.map((item) => (
            <li key={item.title} className="account-soon__item landing-glass-card">
              <span className={`landing-icon-tone landing-icon-tone--${item.tone} landing-icon-tone--sm`}>
                <item.icon size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="account-soon__item-title">{item.title}</p>
                <p className="account-soon__item-desc">{item.desc}</p>
              </div>
              <span className="account-soon__badge">即将推出</span>
            </li>
          ))}
        </ul>
      </section>
    </FadeInView>
  );
}
