/**
 * @file ActivityHeatmap.tsx
 * @description 学习活跃热力图（按日历月分块 + 连续学习统计）。
 * @backend GET /api/analytics/activity
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  HEATMAP_MONTHS_MIN,
  expandActivityWindow,
  heatmapMonthsForWidth,
  localIsoDate,
} from "../../lib/analyticsDisplay";

export interface ActivityDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  minutes?: number;
  /** 当前月内尚未到来的日期（占位格） */
  future?: boolean;
}

const LEVEL_STYLE: Record<number, string> = {
  0: "heatmap-cell--0",
  1: "heatmap-cell--1",
  2: "heatmap-cell--2",
  3: "heatmap-cell--3",
  4: "heatmap-cell--4",
};

const LEVEL_LABEL = ["无学习", "较少", "一般", "活跃", "高强度"];
const EMPTY_CELL: ActivityDay = { date: "", level: 0 };

interface Props {
  data: ActivityDay[];
  loading?: boolean;
  onPrevPeriod?: () => void;
  onNextPeriod?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onVisibleMonthsChange?: (months: number) => void;
}

interface MonthBlock {
  key: string;
  label: string;
  isCurrentMonth: boolean;
  weeks: ActivityDay[][];
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function sliceWindow(data: ActivityDay[]): ActivityDay[] {
  return data.filter((d) => d.date);
}

/** 当前月一次性铺满整月格子，未来日期用灰色占位 */
function fillCurrentMonthToEnd(
  monthDays: ActivityDay[],
  year: number,
  month: number
): ActivityDay[] {
  const byDate = new Map(monthDays.map((d) => [d.date, d]));
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = localIsoDate();
  const filled: ActivityDay[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const existing = byDate.get(dateStr);
    if (existing) {
      filled.push(existing);
    } else {
      filled.push({
        date: dateStr,
        level: 0,
        minutes: 0,
        future: dateStr > today,
      });
    }
  }
  return filled;
}

/** 按日历月切分，每月内再按周一至周日排周列（跨月周会拆到对应月份） */
function buildCalendarMonthBlocks(days: ActivityDay[]): MonthBlock[] {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;

  const monthMap = new Map<string, { year: number; month: number; days: ActivityDay[] }>();
  for (const day of days) {
    if (!day.date) continue;
    const d = new Date(`${day.date}T12:00:00`);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { year: d.getFullYear(), month: d.getMonth(), days: [] });
    }
    monthMap.get(key)!.days.push(day);
  }

  const blocks: MonthBlock[] = [];

  for (const [key, { year, month, days: monthDays }] of monthMap) {
    const isCurrentMonth = key === currentKey;
    const label = `${month + 1}月`;

    const calendarDays = isCurrentMonth
      ? fillCurrentMonthToEnd(monthDays, year, month)
      : [...monthDays].sort((a, b) => a.date.localeCompare(b.date));

    blocks.push({
      key,
      label,
      isCurrentMonth,
      weeks: layoutMonthWeeks(calendarDays, year, month),
    });
  }

  return blocks;
}

function layoutMonthWeeks(
  monthDays: ActivityDay[],
  year: number,
  month: number
): ActivityDay[][] {
  if (!monthDays.length) return [];

  const weeks: ActivityDay[][] = [];
  const firstOfMonth = new Date(year, month, 1);
  const lead = (firstOfMonth.getDay() + 6) % 7; // 周一=0
  let week: ActivityDay[] = Array.from({ length: lead }, () => EMPTY_CELL);

  for (const day of monthDays) {
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  }

  if (week.length) {
    while (week.length < 7) week.push(EMPTY_CELL);
    weeks.push(week);
  }

  return weeks;
}

function calcStreaks(days: ActivityDay[], isLive: boolean) {
  const sorted = days
    .filter((d) => d.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.filter((d) => d.level > 0).length;

  let maxStreak = 0;
  let streak = 0;
  let prev: string | null = null;

  for (const day of sorted) {
    if (day.level <= 0) {
      streak = 0;
      prev = null;
      continue;
    }
    if (prev) {
      const prevD = new Date(`${prev}T12:00:00`);
      const curD = new Date(`${day.date}T12:00:00`);
      const diff = Math.round((curD.getTime() - prevD.getTime()) / 86400000);
      streak = diff === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    maxStreak = Math.max(maxStreak, streak);
    prev = day.date;
  }

  let currentStreak = 0;
  if (isLive) {
    const byDate = new Map(sorted.map((d) => [d.date, d]));
    const cursor = new Date();
    let skippedToday = false;
    const todayKey = localIsoDate();

    while (currentStreak < sorted.length + 1) {
      const key = localIsoDate(cursor);
      const entry = byDate.get(key);
      if (entry && entry.level > 0) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      if (!skippedToday && key === todayKey) {
        skippedToday = true;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return { current: currentStreak, max: maxStreak, total };
}

function yearRangeLabel(data: ActivityDay[]): string {
  const years = [
    ...new Set(
      data
        .filter((d) => d.date)
        .map((d) => new Date(`${d.date}T12:00:00`).getFullYear())
    ),
  ].sort((a, b) => a - b);
  if (years.length === 0) return String(new Date().getFullYear());
  if (years.length === 1) return String(years[0]);
  return `${years[0]}-${years[years.length - 1]}`;
}

export default function ActivityHeatmap({
  data,
  loading = false,
  onPrevPeriod,
  onNextPeriod,
  canPrev = true,
  canNext = false,
  onVisibleMonthsChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleMonths, setVisibleMonths] = useState(HEATMAP_MONTHS_MIN);
  const isLive = !canNext;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      const probe = el.querySelector(".heatmap-cell:not(.heatmap-cell--legend)") as HTMLElement | null;
      const cellSize = probe?.offsetWidth ?? 9;
      const next = heatmapMonthsForWidth(width, cellSize);
      setVisibleMonths((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.length, loading]);

  useLayoutEffect(() => {
    onVisibleMonthsChange?.(visibleMonths);
  }, [visibleMonths, onVisibleMonthsChange]);

  const windowDays = useMemo(
    () => expandActivityWindow(sliceWindow(data), visibleMonths),
    [data, visibleMonths]
  );
  const monthBlocks = useMemo(() => buildCalendarMonthBlocks(windowDays), [windowDays]);
  const streaks = useMemo(() => calcStreaks(windowDays, isLive), [windowDays, isLive]);
  const yearLabel = useMemo(() => yearRangeLabel(windowDays), [windowDays]);
  const [hover, setHover] = useState<ActivityDay | null>(null);

  return (
    <div className="heatmap-panel heatmap-panel--ref">
      <div className="heatmap-toolbar">
        <div className="heatmap-streaks">
          <span className="heatmap-streaks__item">
            当前连续学习 <strong>{streaks.current}</strong> 天
          </span>
          <span className="heatmap-streaks__dot" aria-hidden />
          <span className="heatmap-streaks__item">
            最大连续学习 <strong className="heatmap-streaks__accent">{streaks.max}</strong> 天
          </span>
          <span className="heatmap-streaks__dot" aria-hidden />
          <span className="heatmap-streaks__item">
            总学习天数 <strong className="heatmap-streaks__accent">{streaks.total}</strong> 天
          </span>
        </div>

        <div className="heatmap-toolbar__right">
          <div className="heatmap-legend heatmap-legend--inline" aria-hidden>
            <span>少</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className={`heatmap-cell heatmap-cell--${l} heatmap-cell--legend`} />
            ))}
            <span>多</span>
          </div>
          <div className="heatmap-year-nav">
            <button
              type="button"
              className="heatmap-nav-btn"
              onClick={onPrevPeriod}
              disabled={!canPrev || loading}
              aria-label={`查看更早 ${visibleMonths} 个月`}
              title={`更早 ${visibleMonths} 个月`}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <span className="heatmap-year">{yearLabel}</span>
            <button
              type="button"
              className="heatmap-nav-btn"
              onClick={onNextPeriod}
              disabled={!canNext || loading}
              aria-label={`查看更近 ${visibleMonths} 个月`}
              title={`更近 ${visibleMonths} 个月`}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`heatmap-scroll${loading ? " heatmap-scroll--loading" : ""}`}
      >
        <div className="heatmap-month-blocks heatmap-month-blocks--fill">
          {monthBlocks.map((block) => (
            <div
              key={block.key}
              className="heatmap-month-block"
            >
              <div className="heatmap-month-block__grid">
                {block.weeks.map((week, wi) => (
                  <div key={`${block.key}-w-${wi}`} className="heatmap-week-col">
                    {week.map((cell, di) => (
                      <div
                        key={`${block.key}-${wi}-${di}`}
                        className={`heatmap-cell ${
                          !cell.date
                            ? "heatmap-cell--pad"
                            : cell.future
                              ? "heatmap-cell--future"
                              : LEVEL_STYLE[cell.level] ?? LEVEL_STYLE[0]
                        }`}
                        onMouseEnter={() => cell.date && setHover(cell)}
                        onMouseLeave={() => setHover(null)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <span
                className={`heatmap-month-block__label${
                  block.isCurrentMonth ? " heatmap-month-block__label--current" : ""
                }`}
              >
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="heatmap-tooltip" aria-live="polite">
        {hover?.date ? (
          <>
            <strong>{formatDate(hover.date)}</strong>
            {hover.future ? (
              <span> · 尚未到来</span>
            ) : (
              <>
                <span> · {LEVEL_LABEL[hover.level]}</span>
                {hover.minutes != null && hover.minutes > 0 && (
                  <span> · {hover.minutes} 分钟</span>
                )}
              </>
            )}
          </>
        ) : (
          <span className="text-gray-400">悬停格子查看当日学习情况</span>
        )}
      </p>
    </div>
  );
}
