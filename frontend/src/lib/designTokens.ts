/**
 * Scholar · 青墨学术配色（告别渐变紫）
 * @see COMPETITION-DESIGN.md
 */
export const colors = {
  primary: "#0B6E83",
  primaryLight: "#1496A9",
  accent: "#C27803",
  accentCool: "#14B8A6",
  surface: "#EDF2F6",
  card: "#FFFFFF",
  text: "#0C1222",
  textSecondary: "#3D4F61",
  textMuted: "#7A8FA3",
  border: "#D4DEE6",
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
} as const;

export const shadows = {
  card: "0 1px 3px rgb(12 18 34 / 6%), 0 1px 2px rgb(12 18 34 / 4%)",
  elevated: "0 8px 32px rgb(11 110 131 / 12%)",
} as const;

export const brandGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`;

export const meshGradients = {
  plan: "linear-gradient(135deg, #0B6E83, #14B8A6)",
  scan: "linear-gradient(135deg, #1496A9, #2DD4BF)",
  path: "linear-gradient(135deg, #0B6E83, #3D8B9E)",
  profile: "linear-gradient(135deg, #C27803, #E8A849)",
  chat: "linear-gradient(135deg, #1496A9, #0B6E83)",
  analytics: "linear-gradient(135deg, #B45309, #D97706)",
} as const;

export const capabilities = [
  {
    id: "scan",
    title: "拍照搜题",
    desc: "OCR 识题 · AI 逐步解析 · 自动生成同类练习",
    path: "/scan",
    tone: "cyan" as const,
  },
  {
    id: "plan",
    title: "AI 每日计划",
    desc: "每日推送知识点、对话学习与练习巩固",
    path: "/plan",
    tone: "teal" as const,
  },
  {
    id: "profile",
    title: "六维学习画像",
    desc: "知识掌握、专注度、效率与提升趋势雷达图",
    path: "/profile",
    tone: "amber" as const,
  },
  {
    id: "agents",
    title: "多智能体资源生成",
    desc: "文档、导图、题库、视频、实操案例协同生成",
    path: "/path",
    tone: "slate" as const,
  },
  {
    id: "tutor",
    title: "智能辅导",
    desc: "流式答疑、易错点解析与快捷学习指令",
    path: "/chat",
    tone: "cyan" as const,
  },
  {
    id: "analytics",
    title: "学习效果评估",
    desc: "追踪薄弱点与掌握情况，数据驱动方案优化",
    path: "/analytics",
    tone: "amber" as const,
  },
] as const;

export const resourceTypes = [
  { key: "document", label: "文档" },
  { key: "mindmap", label: "思维导图" },
  { key: "exercise", label: "题库" },
  { key: "video", label: "视频" },
  { key: "practice", label: "实操案例" },
] as const;
