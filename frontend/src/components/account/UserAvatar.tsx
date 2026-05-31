import { avatarGradient, avatarInitial } from "../../lib/accountAvatar";

type Props = {
  userId: number;
  displayName: string;
  username: string;
  size?: "md" | "lg";
  className?: string;
};

const sizeClass = {
  md: "user-avatar--md",
  lg: "user-avatar--lg",
} as const;

/** 默认文字头像（首字母），后续可扩展为上传图片 */
export default function UserAvatar({
  userId,
  displayName,
  username,
  size = "lg",
  className = "",
}: Props) {
  const initial = avatarInitial(displayName, username);

  return (
    <div
      className={`user-avatar ${sizeClass[size]} ${className}`.trim()}
      style={{ background: avatarGradient(userId) }}
      aria-hidden
      title={`${displayName || username} 的头像`}
    >
      {initial}
    </div>
  );
}
