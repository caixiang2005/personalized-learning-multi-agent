import { Link } from "react-router-dom";
import { ArrowRight, Brain, Route, Settings, Shield } from "lucide-react";
import FadeInView from "../../components/motion/FadeInView";
import HoverLift from "../../components/motion/HoverLift";
import type { UserProfileDto } from "../../types/account";

const quickLinks = [
  { to: "/profile", label: "学习画像", desc: "6 维度动态分析", icon: Brain, tone: "green" as const },
  { to: "/path", label: "学习路径", desc: "阶段与资源进度", icon: Route, tone: "blue" as const },
  { to: "/settings", label: "偏好设置", desc: "主题与账号安全", icon: Settings, tone: "purple" as const },
];

type Props = {
  profile: UserProfileDto;
};

export default function AccountSidebar({ profile }: Props) {
  return (
    <aside className="account-grid__side">
      <FadeInView delay={0.15}>
        <HoverLift className="account-side-card section-card">
          <section>
            <h3 className="account-side-card__title">
              <Shield size={17} strokeWidth={1.75} className="text-primary" />
              账号信息
            </h3>
            <dl className="account-dl">
              <div>
                <dt>用户 ID</dt>
                <dd>{profile.userId || "—"}</dd>
              </div>
              <div>
                <dt>登录邮箱</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>用户名</dt>
                <dd>{profile.username}</dd>
              </div>
              <div>
                <dt>画像更新</dt>
                <dd>{profile.updatedAt}</dd>
              </div>
            </dl>
            <Link to="/reset-password" className="account-link-row">
              修改密码
              <ArrowRight size={15} strokeWidth={1.75} />
            </Link>
          </section>
        </HoverLift>
      </FadeInView>

      <FadeInView delay={0.19}>
        <section className="account-side-card section-card">
          <h3 className="account-side-card__title">快捷入口</h3>
          <ul className="account-quick-links">
            {quickLinks.map((item) => (
              <li key={item.to}>
                <HoverLift as="div">
                  <Link to={item.to} className="account-quick-link">
                    <span className={`landing-icon-tone landing-icon-tone--${item.tone} landing-icon-tone--sm`}>
                      <item.icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="account-quick-link__text">
                      <span className="account-quick-link__label">{item.label}</span>
                      <span className="account-quick-link__desc">{item.desc}</span>
                    </span>
                    <ArrowRight size={15} strokeWidth={1.75} className="account-quick-link__arrow" />
                  </Link>
                </HoverLift>
              </li>
            ))}
          </ul>
        </section>
      </FadeInView>
    </aside>
  );
}
