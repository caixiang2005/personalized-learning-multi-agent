/**
 * @file Analytics.tsx
 * @description 学习效果评估：从后端拉取真实数据，含图表展示、薄弱点分析、优化建议。
 * @route /analytics
 * @backend GET /api/analytics/overview · /weak-points · /suggestions · /activity
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Clock, Activity, TrendingUp, Target, BarChart2, AlertTriangle } from "lucide-react";
import AnalyticsSidebar from "../components/analytics/AnalyticsSidebar";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import ActivityHeatmap, { type ActivityDay } from "../components/charts/ActivityHeatmap";
import { useAppStore } from "../store/useAppStore";
import {
  fetchAnalyticsOverview,
  fetchWeakPoints,
  fetchSuggestions,
  fetchAnalyticsActivity,
} from "../lib/api/learn";
import {
  buildStudyHours,
  buildAccuracyData,
  buildCompareData,
  emptyActivityGrid,
} from "../lib/analyticsDisplay";

const ranges = ["近 7 天", "近 30 天", "自定义"];

interface OverviewData {
  range: string;
  startDate: string;
  endDate: string;
  metrics: {
    studyDays: number;
    totalExercises: number;
    avgScore: number;
    healthScore: number;
    progress: number;
  };
  dailyRecords: { date: string; metrics: Record<string, unknown> }[];
  learnerDimensions: Record<string, unknown>[];
}

interface WeakPointItem {
  name: string;
  count: number;
}

function renderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 flex-1 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const { profile } = useAppStore();
  const [range, setRange] = useState("近 7 天");

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [weakData, setWeakData] = useState<{ weakPoints: WeakPointItem[] } | null>(null);
  const [suggestions, setSuggestions] = useState<{ suggestions: string[] } | null>(null);
  const [activityGrid, setActivityGrid] = useState<ActivityDay[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setBusy(true);
    setErr(null);
    const rangeDays = range === "近 30 天" ? 30 : 7;
    Promise.all([
      fetchAnalyticsOverview(rangeDays),
      fetchWeakPoints(),
      fetchSuggestions(),
      fetchAnalyticsActivity(12),
    ])
      .then(([o, w, s, a]) => {
        if (o?.code === 200) setOverview(o.data);
        if (w?.code === 200) setWeakData(w.data);
        if (s?.code === 200) setSuggestions(s.data);
        if (a?.code === 200 && Array.isArray(a.data?.activityGrid)) {
          setActivityGrid(a.data.activityGrid);
        } else {
          setActivityGrid(emptyActivityGrid(12));
        }
        if (o?.code !== 200 && w?.code !== 200 && s?.code !== 200) {
          setErr("无法连接 learn-service，请确认 :8002 已启动");
        }
      })
      .catch(() => {
        setErr("无法连接 learn-service，请确认 :8002 已启动");
        setActivityGrid(emptyActivityGrid(12));
      })
      .finally(() => setBusy(false));
  }, [range]);

  const studyHours = useMemo(
    () => buildStudyHours(overview?.dailyRecords ?? []),
    [overview]
  );
  const accuracyData = useMemo(
    () =>
      buildAccuracyData(
        overview?.learnerDimensions ?? [],
        overview?.metrics.avgScore
      ),
    [overview]
  );
  const compareData = useMemo(
    () => buildCompareData(weakData?.weakPoints ?? profile.weakPoints ?? []),
    [weakData, profile.weakPoints]
  );

  const weekHours = studyHours.reduce((s, d) => s + (d.hours ?? 0), 0);
  const latestAccuracy =
    accuracyData[accuracyData.length - 1]?.rate ??
    Math.round(overview?.metrics.avgScore ?? 0);
  const weakPoints = weakData?.weakPoints ?? profile.weakPoints ?? [];
  const maxWeakCount = Math.max(...weakPoints.map((w) => w.count), 1);
  const suggestionsList = suggestions?.suggestions ?? [];

  if (busy) {
    return (
      <ScholarDashboardLayout badge="学习效果" title="学习效果评估" subtitle="加载中…">
        {renderSkeleton()}
      </ScholarDashboardLayout>
    );
  }

  return (
    <ScholarDashboardLayout
      badge="学习效果"
      title="学习效果评估"
      subtitle="可视化学习数据，辅助调整学习方案"
      aside={
        <div className="flex flex-wrap gap-2 justify-end">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              disabled={r === "自定义"}
              className={range === r ? "btn-primary text-sm py-2" : "btn-secondary text-sm py-2"}
            >
              {r}
            </button>
          ))}
        </div>
      }
      sidebar={
        <AnalyticsSidebar
          range={range}
          weekHours={weekHours}
          latestAccuracy={latestAccuracy}
          suggestions={suggestionsList}
          activityGrid={activityGrid}
        />
      }
    >
      {err && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ {err}
        </div>
      )}

      <AnimeStagger className="dash-stats" staggerMs={60} y={12} delay={70}>
        <div className="dash-stats__item">
          <Clock size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{weekHours.toFixed(1)}h</span>
          <span className="dash-stats__label">本周学习</span>
        </div>
        <div className="dash-stats__item">
          <TrendingUp size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{latestAccuracy || "—"}%</span>
          <span className="dash-stats__label">练习正确率</span>
        </div>
        <div className="dash-stats__item">
          <Target size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{weakPoints.length}</span>
          <span className="dash-stats__label">薄弱知识点</span>
        </div>
        <div className="dash-stats__item">
          <BarChart2 size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{overview?.metrics.healthScore ?? profile.healthScore}%</span>
          <span className="dash-stats__label">画像健康度</span>
        </div>
      </AnimeStagger>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="section-card dash-panel">
          <div className="flex items-center gap-2 text-[var(--scholar-text-muted)] text-sm mb-3">
            <Clock size={16} /> 学习时长
          </div>
          {studyHours.length === 0 ? (
            <p className="text-sm text-[var(--scholar-text-muted)] py-12 text-center">
              该周期暂无学习记录，完成练习或辅导对话后将自动统计。
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={studyHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="var(--scholar-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="section-card dash-panel">
          <p className="text-sm text-[var(--scholar-text-muted)] mb-3">正确率 / 六维得分</p>
          {accuracyData.length === 0 ? (
            <p className="text-sm text-[var(--scholar-text-muted)] py-12 text-center">
              完成练习或构建画像后，将展示各维度得分。
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="var(--scholar-accent-cool)" strokeWidth={2} dot={{ fill: "var(--scholar-accent-cool)" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="section-card dash-panel">
          <p className="text-sm text-[var(--scholar-text-muted)] mb-2">薄弱点掌握对比</p>
          {compareData.length === 0 ? (
            <p className="text-sm text-[var(--scholar-text-muted)] py-12 text-center">暂无薄弱点对比数据。</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="before" fill="#94a3b8" name="之前" radius={[2, 2, 0, 0]} />
                <Bar dataKey="after" fill="var(--scholar-primary)" name="现在" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <section className="section-card dash-panel">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={20} className="text-[var(--scholar-primary)]" />
          <h2 className="font-semibold text-[var(--scholar-text)]">学习活跃热力</h2>
        </div>
        <p className="text-sm text-[var(--scholar-text-muted)] mb-5">近 12 周学习行为分布（练习、辅导对话等）</p>
        <ActivityHeatmap data={activityGrid} weeks={12} />
      </section>

      <section className="section-card dash-panel">
        <h2 className="font-semibold flex items-center gap-2 text-[var(--scholar-text)] mb-4">
          <AlertTriangle className="text-[var(--scholar-accent)]" size={20} />
          薄弱知识点分析
        </h2>
        {weakPoints.length === 0 ? (
          <p className="text-sm text-[var(--scholar-text-muted)]">暂无薄弱点记录，完成练习后将自动统计。</p>
        ) : (
          <ul className="space-y-4">
            {weakPoints.map((w) => (
              <li key={w.name}>
                <button
                  type="button"
                  onClick={() => navigate("/path")}
                  className="w-full text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[var(--scholar-text)] group-hover:text-[var(--scholar-primary)] transition-colors">
                      {w.name}
                    </span>
                    <span className="text-xs text-[var(--scholar-accent)]">{w.count} 次错误</span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <div
                      className="progress-bar-fill bg-[var(--scholar-accent)]"
                      style={{ width: `${Math.round((w.count / maxWeakCount) * 100)}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card dash-panel">
        <h2 className="dash-panel__title">优化建议</h2>
        {suggestionsList.length === 0 ? (
          <p className="text-sm text-[var(--scholar-text-muted)]">暂无个性化建议，请先完成画像构建与练习。</p>
        ) : (
          <ul className="dash-sidebar-notes">
            {suggestionsList.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </section>
    </ScholarDashboardLayout>
  );
}
