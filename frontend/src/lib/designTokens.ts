/**
 * 设计 token（与 DESIGN.md、index.css @theme 对齐）
 * 供 TS 内联样式或图表等无法使用 Tailwind 的场景。
 */
export const colors = {
  primary: "#165DFF",
  accent: "#36D399",
  surface: "#F9FAFB",
  textPrimary: "#1D2129",
  textSecondary: "#4E5969",
  textMuted: "#86909C",
  border: "#E5E7EB",
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.625rem",
  lg: "0.75rem",
} as const;

export const brandGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`;
