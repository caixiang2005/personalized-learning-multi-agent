/**
 * @file navConfig.ts
 * @description 主导航信息架构（对齐赛题五大核心能力）
 *
 * 顶栏 4 项：首页 · 智能辅导 · 学习路径 · 成长档案（下拉）
 * - 智能辅导：对话式画像 + 多智能体答疑/资源生成（赛题 1、2、4）
 * - 学习路径：路径规划 + 多模态资源推送（赛题 3）
 * - 成长档案：画像可视化、效果评估 + 拍照搜题/日计划等辅助工具（赛题 1、5）
 */

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  CalendarCheck,
  Camera,
  Home,
  MessageSquare,
  Route,
  Sparkles,
} from "lucide-react";

export interface PrimaryNavItem {
  to: string;
  label: string;
  hint?: string;
  end?: boolean;
}

export interface GrowthNavItem {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  group: "core" | "tool";
}

/** 顶栏主入口（≤4 项） */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  { to: "/home", label: "首页", end: true },
  {
    to: "/chat",
    label: "智能辅导",
    hint: "对话画像 · 答疑 · 资源生成",
  },
  {
    to: "/path",
    label: "学习路径",
    hint: "路径规划 · 资源推送",
  },
];

export const GROWTH_NAV: GrowthNavItem[] = [
  {
    to: "/profile",
    label: "学习画像",
    desc: "六维动态画像与雷达图",
    icon: Sparkles,
    group: "core",
  },
  {
    to: "/analytics",
    label: "效果评估",
    desc: "学习行为分析与方案优化",
    icon: BarChart3,
    group: "core",
  },
  {
    to: "/scan",
    label: "拍照搜题",
    desc: "多模态 OCR 即时辅导",
    icon: Camera,
    group: "tool",
  },
  {
    to: "/plan",
    label: "日计划",
    desc: "每日学习任务与节奏",
    icon: CalendarCheck,
    group: "tool",
  },
];

export const GROWTH_PATHS = GROWTH_NAV.map((i) => i.to);

export function isGrowthPath(pathname: string): boolean {
  return GROWTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** 移动端底栏（4 Tab） */
export const MOBILE_NAV = [
  { to: "/home", label: "首页", icon: Home, end: true },
  { to: "/chat", label: "辅导", icon: MessageSquare },
  { to: "/path", label: "路径", icon: Route },
  { to: "/profile", label: "成长", icon: Brain },
] as const;
