import { Calendar, Mail, User } from "lucide-react";
import FadeInView from "../../components/motion/FadeInView";
import type { UserProfileDto } from "../../types/account";

function formatDate(raw: string | null) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function avatarInitial(name: string, username: string) {
  return (name || username || "学").trim().charAt(0).toUpperCase();
}

type Props = {
  profile: UserProfileDto;
};

export default function AccountHero({ profile }: Props) {
  return (
    <FadeInView parallax={6}>
      <section className="account-hero landing-glass-card">
        <div className="account-hero__main">
          <div className="account-avatar" aria-hidden>
            {avatarInitial(profile.displayName, profile.username)}
          </div>
          <div className="account-hero__info">
            <h2 className="account-hero__name">{profile.displayName}</h2>
            <p className="account-hero__meta">
              <Mail size={14} strokeWidth={1.75} />
              {profile.email}
            </p>
            <p className="account-hero__meta">
              <User size={14} strokeWidth={1.75} />
              @{profile.username}
            </p>
            <p className="account-hero__meta">
              <Calendar size={14} strokeWidth={1.75} />
              注册于 {formatDate(profile.registerTime)}
            </p>
          </div>
        </div>
        <div className="account-hero__chips">
          <span className="account-chip">{profile.major}</span>
          <span className="account-chip account-chip--accent">{profile.goal}</span>
        </div>
      </section>
    </FadeInView>
  );
}
