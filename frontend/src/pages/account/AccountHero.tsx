import { Calendar, Mail } from "lucide-react";
import FadeInView from "../../components/motion/FadeInView";
import UserAvatar from "../../components/account/UserAvatar";
import type { AccountProfileView } from "../../types/account";

function formatDate(raw: string | null) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

type Props = {
  profile: AccountProfileView;
};

export default function AccountHero({ profile }: Props) {
  return (
    <FadeInView parallax={4}>
      <section className="account-hero landing-glass-card">
        <div className="account-hero__main">
          <UserAvatar
            userId={profile.userId}
            displayName={profile.nickname ?? profile.username}
            username={profile.username}
            size="lg"
          />
          <div className="account-hero__info">
            <h1 className="account-hero__name">{profile.nickname || profile.username}</h1>
            <p className="account-hero__username">@{profile.username}</p>
            <p className="account-hero__meta">
              <Mail size={14} strokeWidth={1.75} />
              {profile.email}
            </p>
            <p className="account-hero__meta">
              <Calendar size={14} strokeWidth={1.75} />
              注册于 {formatDate(profile.registerTime)}
            </p>
          </div>
        </div>
        <p className="account-hero__avatar-tip">默认头像为昵称首字母，头像上传功能预留中</p>
      </section>
    </FadeInView>
  );
}
