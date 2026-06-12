import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Clock, Activity, TrendingUp, Target, BarChart2, AlertTriangle } from "lucide-react";
import AnalyticsSidebar from "../components/analytics/AnalyticsSidebar";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import ActivityHeatmap from "../components/charts/ActivityHeatmap";
import { analyticsData } from "../lib/mockData";
import { useAppStore } from "../store/useAppStore";

const ranges = ["近 7 天", "近 30 天", "自定义"];

const compareData = [
  { subject: "栈", before: 60, after: 72 },
  { subject: "二叉树", before: 30, after: 38 },
  { subject: "图", before: 25, after: 45 },
  { subject: "排序", before: 70, after: 80 },
];

export default function Analytics() {
  const navigate = useNavigate();
  const { profile } = useAppStore();
  const [range, setRange] = useState("近 7 天");
  const weekHours = analyticsData.studyHours.reduce((s, d) => s + d.hours, 0);
  const latestAccuracy = analyticsData.accuracy[analyticsData.accuracy.length - 1]?.rate ?? 0;
  const maxWeakCount = Math.max(...profile.weakPoints.map((w) => w.count), 1);

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
              className={range === r ? "btn-primary text-sm py-2" : "btn-secondary text-sm py-2"}
            >
              {r}
            </button>
          ))}
        </div>
      }
      sidebar={<AnalyticsSidebar range={range} />}
    >
      <AnimeStagger className="dash-stats" staggerMs={60} y={12} delay={70}>
        <div className="dash-stats__item">
          <Clock size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{weekHours.toFixed(1)}h</span>
          <span className="dash-stats__label">本周学习</span>
        </div>
        <div className="dash-stats__item">
          <TrendingUp size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{latestAccuracy}%</span>
          <span className="dash-stats__label">练习正确率</span>
        </div>
        <div className="dash-stats__item">
          <Target size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{profile.weakPoints.length}</span>
          <span className="dash-stats__label">薄弱知识点</span>
        </div>
        <div className="dash-stats__item">
          <BarChart2 size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{profile.healthScore}%</span>
          <span className="dash-stats__label">画像健康度</span>
        </div>
      </AnimeStagger>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="section-card dash-panel">
          <div className="flex items-center gap-2 text-[var(--scholar-text-muted)] text-sm mb-3">
            <Clock size={16} /> 学习时长（周）
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analyticsData.studyHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="var(--scholar-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card dash-panel">
          <p className="text-sm text-[var(--scholar-text-muted)] mb-3">练习正确率变化</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analyticsData.accuracy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="var(--scholar-accent-cool)" strokeWidth={2} dot={{ fill: "var(--scholar-accent-cool)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card dash-panel">
          <p className="text-sm text-[var(--scholar-text-muted)] mb-2">知识点掌握度对比</p>
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
        </div>
      </div>

      <section className="section-card dash-panel">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={20} className="text-[var(--scholar-primary)]" />
          <h2 className="font-semibold text-[var(--scholar-text)]">学习活跃热力</h2>
        </div>
        <p className="text-sm text-[var(--scholar-text-muted)] mb-5">近 12 周学习行为分布 · 悬停查看详情</p>
        <ActivityHeatmap data={analyticsData.activityGrid} weeks={12} />
      </section>

      <section className="section-card dash-panel">
        <h2 className="font-semibold flex items-center gap-2 text-[var(--scholar-text)] mb-4">
          <AlertTriangle className="text-[var(--scholar-accent)]" size={20} />
          薄弱知识点分析
        </h2>
        {profile.weakPoints.length === 0 ? (
          <p className="text-sm text-[var(--scholar-text-muted)]">暂无薄弱点记录，完成练习后将自动统计。</p>
        ) : (
          <ul className="space-y-4">
            {profile.weakPoints.map((w) => (
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
    </ScholarDashboardLayout>
  );
}
