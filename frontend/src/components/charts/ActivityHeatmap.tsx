/**
 * @file ActivityHeatmap.tsx
 * @description 学习活跃热力图（GitHub 贡献图风格），用于效果评估页。
 * @backend GET /api/analytics/activity
 */

import { useMemo, useState } from "react";
import { Flame, CalendarDays, TrendingUp } from "lucide-react";

export interface ActivityDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  minutes?: number;
}

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

const LEVEL_STYLE: Record<number, string> = {
  0: "heatmap-cell--0",
  1: "heatmap-cell--1",
  2: "heatmap-cell--2",
  3: "heatmap-cell--3",
  4: "heatmap-cell--4",
};

const LEVEL_LABEL = ["无学习", "较少", "一般", "活跃", "高强度"];

interface Props {
  data: ActivityDay[];
  weeks?: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 将 chronological 数据转为 [周列][星期行] */
function toWeekMatrix(data: ActivityDay[], weeks: number): ActivityDay[][] {
  const total = weeks * 7;
  const slice = data.slice(-total);
  const matrix: ActivityDay[][] = [];

  for (let w = 0; w < weeks; w++) {
    const week: ActivityDay[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(slice[w * 7 + d] ?? { date: "", level: 0 });
    }
    matrix.push(week);
  }
  return matrix;
}

function monthLabels(matrix: ActivityDay[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  matrix.forEach((week, col) => {
    const first = week.find((c) => c.date);
    if (!first?.date) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      labels.push({ label: `${m + 1}月`, col });
      lastMonth = m;
    }
  });
  return labels;
}

export default function ActivityHeatmap({ data, weeks = 12 }: Props) {
  const matrix = useMemo(() => toWeekMatrix(data, weeks), [data, weeks]);
  const months = useMemo(() => monthLabels(matrix), [matrix]);
  const [hover, setHover] = useState<ActivityDay | null>(null);

  const stats = useMemo(() => {
    const flat = matrix.flat().filter((c) => c.date);
    const active = flat.filter((c) => c.level > 0).length;
    const intense = flat.filter((c) => c.level >= 3).length;
    const totalMin = flat.reduce((s, c) => s + (c.minutes ?? c.level * 25), 0);
    return { active, intense, totalMin };
  }, [matrix]);

  return (
    <div className="heatmap-panel">
      <div className="heatmap-stats">
        <div className="heatmap-stat">
          <span className="heatmap-stat__icon heatmap-stat__icon--primary">
            <CalendarDays size={16} />
          </span>
          <div>
            <p className="heatmap-stat__value">{stats.active}</p>
            <p className="heatmap-stat__label">活跃天数</p>
          </div>
        </div>
        <div className="heatmap-stat">
          <span className="heatmap-stat__icon heatmap-stat__icon--accent">
            <Flame size={16} />
          </span>
          <div>
            <p className="heatmap-stat__value">{stats.intense}</p>
            <p className="heatmap-stat__label">高强度日</p>
          </div>
        </div>
        <div className="heatmap-stat">
          <span className="heatmap-stat__icon heatmap-stat__icon--blue">
            <TrendingUp size={16} />
          </span>
          <div>
            <p className="heatmap-stat__value">{Math.round(stats.totalMin / 60)}h</p>
            <p className="heatmap-stat__label">累计学习</p>
          </div>
        </div>
      </div>

      <div className="heatmap-scroll">
        <div className="heatmap-chart">
          <div className="heatmap-months" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
            {months.map((m) => (
              <span
                key={`${m.label}-${m.col}`}
                className="heatmap-month"
                style={{ gridColumn: m.col + 1 }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="heatmap-body">
            <div className="heatmap-days">
              {DAY_LABELS.map((d, i) => (
                <span key={d} className={`heatmap-day-label ${i % 2 === 0 ? "" : "opacity-0"}`}>
                  {d}
                </span>
              ))}
            </div>

            <div
              className="heatmap-grid"
              style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
            >
              {DAY_LABELS.map((_, di) =>
                matrix.map((week, wi) => {
                  const cell = week[di];
                  return (
                    <div
                      key={`${wi}-${di}`}
                      className={`heatmap-cell ${LEVEL_STYLE[cell.level] ?? LEVEL_STYLE[0]}`}
                      onMouseEnter={() => cell.date && setHover(cell)}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="heatmap-tooltip" aria-live="polite">
        {hover?.date ? (
          <>
            <strong>{formatDate(hover.date)}</strong>
            <span> · {LEVEL_LABEL[hover.level]}</span>
            {hover.minutes != null && <span> · {hover.minutes} 分钟</span>}
          </>
        ) : (
          <span className="text-gray-400">悬停格子查看当日学习情况</span>
        )}
      </p>

      <div className="heatmap-legend">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`heatmap-cell heatmap-cell--${l} heatmap-cell--legend`} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
