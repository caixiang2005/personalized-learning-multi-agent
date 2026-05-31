import { Calendar, Mail, Pencil } from "lucide-react";
import UserAvatar from "../../components/account/UserAvatar";
import type { UserProfileDto } from "../../types/account";

function formatDate(raw: string | null) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

type Props = {
  profile: UserProfileDto;
  editing: boolean;
  onEdit: () => void;
};

export default function AccountProfileHeader({ profile, editing, onEdit }: Props) {
  const educationHint =
    profile.major.trim() || profile.goal.trim()
      ? `${profile.major || "未填写专业"} · ${profile.goal || "未填写目标"}`
      : "未填写学习背景，点击编辑完善资料";

  return (
    <section className="account-profile-head landing-glass-card">
      <div className="account-profile-head__main">
        <UserAvatar
          userId={profile.userId}
          displayName={profile.displayName}
          username={profile.username}
          size="lg"
        />
        <div className="account-profile-head__info">
          <h1 className="account-profile-head__name">{profile.displayName || profile.username}</h1>
          <p className="account-profile-head__username">@{profile.username}</p>
          <p className="account-profile-head__meta">{educationHint}</p>
          <div className="account-profile-head__tags">
            <span className="account-chip">
              <Mail size={12} strokeWidth={1.75} />
              {profile.email}
            </span>
            <span className="account-chip">
              <Calendar size={12} strokeWidth={1.75} />
              注册 {formatDate(profile.registerTime)}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        className={`account-profile-head__edit${editing ? " account-profile-head__edit--active" : ""}`}
        onClick={onEdit}
      >
        <Pencil size={15} strokeWidth={1.75} />
        {editing ? "收起编辑" : "编辑信息"}
      </button>
    </section>
  );
}
