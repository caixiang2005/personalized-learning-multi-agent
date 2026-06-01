/** 根据 userId 生成稳定头像底色（V2 indigo/green） */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #4f46e5, #22c55e)",
  "linear-gradient(135deg, #6366f1, #4f46e5)",
  "linear-gradient(135deg, #818cf8, #22c55e)",
  "linear-gradient(135deg, #7c3aed, #6366f1)",
];

export function avatarInitial(displayName: string, username: string) {
  const source = (displayName || username || "学").trim();
  return source.charAt(0).toUpperCase();
}

export function avatarGradient(userId: number) {
  return AVATAR_GRADIENTS[Math.abs(userId) % AVATAR_GRADIENTS.length]!;
}
