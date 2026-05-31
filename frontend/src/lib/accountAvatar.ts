/** 根据 userId 生成稳定头像底色 */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #165dff, #36d399)",
  "linear-gradient(135deg, #6366f1, #165dff)",
  "linear-gradient(135deg, #0ea5e9, #36d399)",
  "linear-gradient(135deg, #8b5cf6, #165dff)",
];

export function avatarInitial(displayName: string, username: string) {
  const source = (displayName || username || "学").trim();
  return source.charAt(0).toUpperCase();
}

export function avatarGradient(userId: number) {
  return AVATAR_GRADIENTS[Math.abs(userId) % AVATAR_GRADIENTS.length]!;
}
