/**
 * V2 设计 token（UI/UX Pro Max · Claymorphism）
 * 全局 Source of Truth：design-system/智慧学习中心/MASTER.md
 */
export const colors = {
  primary: "#4F46E5",
  secondary: "#818CF8",
  accent: "#22C55E",
  surface: "#EEF2FF",
  text: "#312E81",
  textSecondary: "#4338CA",
  textMuted: "#6366A0",
  border: "#C7D2FE",
} as const;

export const radius = {
  sm: "0.625rem",
  md: "1rem",
  lg: "1.25rem",
} as const;

export const brandGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;
