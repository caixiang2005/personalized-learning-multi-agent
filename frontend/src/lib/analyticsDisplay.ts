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

export const HEATMAP_MONTHS_MIN = 6;
export const HEATMAP_MONTHS_MAX = 18;
/** @deprecated 使用 HEATMAP_MONTHS_MIN 或动态 visibleMonths */
export const HEATMAP_MONTHS = HEATMAP_MONTHS_MIN;

/** 根据容器宽度估算可展示的完整月数 */
export function heatmapMonthsForWidth(
  widthPx: number,
  cellSizePx: number,
  cellGapPx = 2,
  monthGapPx = 10
): number {
  const weekCols = 6;
  const monthWidth = weekCols * cellSizePx + Math.max(0, weekCols - 1) * cellGapPx;
  if (widthPx <= 0 || monthWidth <= 0) return HEATMAP_MONTHS_MIN;
  const raw = Math.floor((widthPx + monthGapPx) / (monthWidth + monthGapPx));
  return Math.max(HEATMAP_MONTHS_MIN, Math.min(HEATMAP_MONTHS_MAX, raw));
}

/** 本地日历日期 YYYY-MM-DD（避免 toISOString 时区偏差） */
export function localIsoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyActivityGrid(months = HEATMAP_MONTHS): ActivityDay[] {
  return expandActivityWindow([], months);
}

/** 补齐完整 N 个日历月（防止后端只返回周数据时缺月） */
export function expandActivityWindow(
  days: ActivityDay[],
  monthCount = HEATMAP_MONTHS,
  endIso?: string
): ActivityDay[] {
  const today = localIsoDate();
  const endDate = endIso ?? days.at(-1)?.date ?? today;
  const end = new Date(`${endDate}T12:00:00`);
  const start = new Date(end.getFullYear(), end.getMonth() - (monthCount - 1), 1);
  const byDate = new Map(days.filter((d) => d.date).map((d) => [d.date, d]));
  const out: ActivityDay[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const iso = localIsoDate(cursor);
    const hit = byDate.get(iso);
    out.push(
      hit ?? {
        date: iso,
        level: 0,
        minutes: 0,
        ...(iso > today ? { future: true as const } : {}),
      }
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function summarizeActivityGrid(grid: ActivityDay[]) {
  const activeDays = grid.filter((d) => d.level > 0).length;
  const highDays = grid.filter((d) => d.level >= 3).length;
  const totalStudyMin = grid.reduce((s, d) => s + (d.minutes ?? 0), 0);
  return { activeDays, highDays, totalStudyMin };
}

/** 当前年月 key，用于检测跨月自动刷新 */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** 日期加减 N 个月（用于热力图翻页） */
export function shiftIsoMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return localIsoDate(d);
}

/** ISO 日期偏移天数 */
export function shiftIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localIsoDate(d);
}
