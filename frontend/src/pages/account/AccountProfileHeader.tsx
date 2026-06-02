import { Calendar, Mail, Pencil } from "lucide-react";
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
  editing: boolean;
  onEdit: () => void;
  avatarVersion?: number;
};

export default function AccountProfileHeader({ profile, editing, onEdit, avatarVersion = 0 }: Props) {
  const educationHint = profile.major?.trim()
    ? profile.major
    : profile.signature?.trim()
      ? profile.signature
      : "未填写专业或签名，点击编辑完善资料";

  return (
    <section className="account-profile-head landing-glass-card">
      <div className="account-profile-head__main">
        <UserAvatar
          userId={profile.userId}
          displayName={profile.nickname ?? profile.username}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          avatarVersion={avatarVersion}
          size="lg"
        />
        <div className="account-profile-head__info">
          <h1 className="account-profile-head__name">{profile.nickname || profile.username}</h1>
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
