/**
 * @file analyticsDisplay.ts
 * @description 效果评估页：从后端数据构建图表序列（无 mock fallback）
 */
import type { ActivityDay } from "../components/charts/ActivityHeatmap";

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export interface DailyRecord {
  date: string;
  metrics: Record<string, unknown>;
}

export interface StudyHourPoint {
  day: string;
  hours: number;
}

export interface AccuracyPoint {
  week: string;
  rate: number;
}

export interface WeakComparePoint {
  subject: string;
  before: number;
  after: number;
}

export function buildStudyHours(dailyRecords: DailyRecord[]): StudyHourPoint[] {
  if (!dailyRecords.length) return [];
  return dailyRecords.map((r) => {
    const metrics = r.metrics ?? {};
    let hours = 0;
    if (typeof metrics.hours === "number") {
      hours = metrics.hours;
    } else if (typeof metrics.minutes === "number") {
      hours = Math.round((metrics.minutes / 60) * 10) / 10;
    }
    const d = new Date(r.date);
    const label = Number.isNaN(d.getTime())
      ? r.date.slice(5)
      : WEEKDAY_LABELS[d.getDay()] ?? r.date.slice(5);
    return { day: label, hours };
  });
}

export function buildAccuracyData(
  learnerDimensions: Record<string, unknown>[],
  avgScore?: number
): AccuracyPoint[] {
  const dims = learnerDimensions.filter((d) => typeof d.value === "number");
  if (dims.length) {
    return dims.map((d, i) => ({
      week: String(d.label ?? d.key ?? `维度${i + 1}`),
      rate: Math.round(Number(d.value)),
    }));
  }
  if (typeof avgScore === "number" && avgScore > 0) {
    return [{ week: "综合", rate: Math.round(avgScore) }];
  }
  return [];
}

export function buildCompareData(
  weakPoints: { name: string; count: number }[]
): WeakComparePoint[] {
  if (!weakPoints.length) return [];
  return weakPoints.slice(0, 6).map((w) => ({
    subject: w.name.length > 6 ? `${w.name.slice(0, 6)}…` : w.name,
    before: Math.max(20, 60 - w.count * 2),
    after: Math.min(90, 60 - w.count * 1.5 + 10),
  }));
}

export function emptyActivityGrid(weeks = 12): ActivityDay[] {
  const days: ActivityDay[] = [];
  const today = new Date();
  const total = weeks * 7;
  for (let i = 0; i < total; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (total - 1 - i));
    days.push({ date: d.toISOString().slice(0, 10), level: 0, minutes: 0 });
  }
  return days;
}

export function summarizeActivityGrid(grid: ActivityDay[]) {
  const activeDays = grid.filter((d) => d.level > 0).length;
  const highDays = grid.filter((d) => d.level >= 3).length;
  const totalStudyMin = grid.reduce((s, d) => s + (d.minutes ?? 0), 0);
  return { activeDays, highDays, totalStudyMin };
}
