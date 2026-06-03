/** 根据 userId 生成稳定头像底色（Scholar 青墨/琥珀） */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #0b6e83, #14b8a6)",
  "linear-gradient(135deg, #1496a9, #0b6e83)",
  "linear-gradient(135deg, #14b8a6, #c27803)",
  "linear-gradient(135deg, #c27803, #e8a849)",
];

export function avatarInitial(displayName: string, username: string) {
  const source = (displayName || username || "学").trim();
  return source.charAt(0).toUpperCase();
}

export function avatarGradient(userId: number) {
  return AVATAR_GRADIENTS[Math.abs(userId) % AVATAR_GRADIENTS.length]!;
}
