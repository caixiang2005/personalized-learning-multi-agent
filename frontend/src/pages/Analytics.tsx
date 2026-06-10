/**
 * @file Analytics.tsx
 * @description 学习效果评估（图表、薄弱点、建议）。
 * @route /analytics
 *
 * 【当前 Mock】图表与建议来自 lib/mockData.analyticsData、store.profile.weakPoints。
 * 【待同步后端】
 *   - fetchAnalytics(range) 或拆分三个 GET
 *   - 切换「近7天/近30天」时带 range 参数重新请求
 */
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
import { AlertTriangle, Lightbulb, Clock, Activity } from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import GrowthQuickLinks from "../components/layout/GrowthQuickLinks";
import ProfileRadar from "../components/charts/ProfileRadar";
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

  return (
    <ScholarPageShell>
      <ScholarPageHeader
        badge="加分功能"
        title="学习效果评估"
        subtitle="可视化学习数据，辅助调整学习方案"
        action={
          <div className="flex gap-2">
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
      />

      <GrowthQuickLinks />

      {/* 核心指标 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="section-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
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

        <div className="section-card">
          <p className="text-sm text-gray-500 mb-3">练习正确率变化</p>
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

        <div className="section-card">
          <p className="text-sm text-gray-500 mb-2">知识点掌握度对比</p>
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

      <section className="section-card mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={20} className="text-primary" />
          <h2 className="font-semibold text-gray-900 dark:text-white">学习活跃热力</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">近 12 周学习行为分布 · 悬停查看详情</p>
        <ActivityHeatmap data={analyticsData.activityGrid} weeks={12} />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 薄弱点 */}
        <section className="section-card">
          <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
            <AlertTriangle className="text-red-500" size={20} />
            薄弱知识点分析
          </h2>
          <ul className="space-y-3">
            {profile.weakPoints.map((w) => (
              <li key={w.name}>
                <button
                  type="button"
                  onClick={() => navigate("/path")}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-left transition-colors"
                >
                  <span className="text-sm font-medium">{w.name}</span>
                  <span className="text-xs text-red-500">{w.count} 次错误</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 行为分析 */}
        <section className="section-card">
          <h2 className="font-semibold mb-4">学习行为分析</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            你更偏好 <strong>视频 + 练习题</strong> 组合学习，掌握度提升比纯文档阅读快约 23%。
            活跃时段集中在 {profile.rhythm.period}。
          </p>
          <div className="mt-4 h-40">
            <ProfileRadar dimensions={profile.dimensions} />
          </div>
        </section>
      </div>

      {/* 优化建议 */}
      <section className="section-card mt-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Lightbulb className="text-accent" size={20} />
          学习方案优化建议
        </h2>
        <ul className="space-y-3">
          {analyticsData.suggestions.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs shrink-0">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </section>
    </ScholarPageShell>
  );
}
