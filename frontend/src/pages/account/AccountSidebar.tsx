import { Link } from "react-router-dom";
import { ArrowRight, Shield } from "lucide-react";
import FadeInView from "../../components/motion/FadeInView";
import HoverLift from "../../components/motion/HoverLift";
import type { UserProfileDto } from "../../types/account";

type Props = {
  profile: UserProfileDto;
};

export default function AccountSidebar({ profile }: Props) {
  return (
    <aside className="account-grid__side">
      <FadeInView delay={0.14}>
        <HoverLift className="account-side-card section-card">
          <section>
            <h3 className="account-side-card__title">
              <Shield size={17} strokeWidth={1.75} className="text-primary" />
              账号与安全
            </h3>
            <dl className="account-dl">
              <div>
                <dt>用户 ID</dt>
                <dd>{profile.userId || "—"}</dd>
              </div>
              <div>
                <dt>资料更新</dt>
                <dd>{profile.updatedAt || "—"}</dd>
              </div>
            </dl>
            <Link to="/reset-password" className="account-link-row">
              修改密码
              <ArrowRight size={15} strokeWidth={1.75} />
            </Link>
          </section>
        </HoverLift>
      </FadeInView>

      <FadeInView delay={0.17}>
        <section className="account-side-card section-card account-side-card--muted">
          <h3 className="account-side-card__title">说明</h3>
          <p className="account-side-card__note">
            用户名注册后不可更改。如需更换绑定邮箱或注销账号，请联系管理员或等待后续版本支持。
          </p>
        </section>
      </FadeInView>
    </aside>
  );
}
