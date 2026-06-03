import { avatarGradient, avatarInitial } from "../../lib/accountAvatar";
import { avatarDisplayUrl } from "../../lib/avatar";

type Props = {
  userId: number;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  avatarVersion?: number;
  size?: "md" | "lg";
  className?: string;
};

const sizeClass = {
  md: "user-avatar--md",
  lg: "user-avatar--lg",
} as const;

/** 用户头像：优先展示个人信息中的照片，无图时显示昵称首字母 */
export default function UserAvatar({
  userId,
  displayName,
  username,
  avatarUrl,
  avatarVersion = 0,
  size = "lg",
  className = "",
}: Props) {
  const initial = avatarInitial(displayName, username);
  const base = avatarDisplayUrl(avatarUrl);
  const src = base
    ? `${base}${avatarUrl?.startsWith("/static/") ? `?v=${avatarVersion}` : ""}`
    : null;

  return (
    <div
      className={`user-avatar ${sizeClass[size]} ${src ? "user-avatar--photo" : ""} ${className}`.trim()}
      style={src ? undefined : { background: avatarGradient(userId) }}
      aria-hidden={src ? true : undefined}
      title={src ? undefined : `${displayName || username} 的头像`}
    >
      {src ? <img src={src} alt="" className="user-avatar__img" /> : initial}
    </div>
  );
}
