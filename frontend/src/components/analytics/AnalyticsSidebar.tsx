import { Link } from "react-router-dom";
import {
  Clock,
  TrendingUp,
  BarChart2,
  MessageSquare,
  CalendarDays,
  Route,
  Activity,
  Lightbulb,
} from "lucide-react";
import AnimeReveal from "../motion/AnimeReveal";
import ProfileRadar from "../charts/ProfileRadar";
import type { ActivityDay } from "../charts/ActivityHeatmap";
import { summarizeActivityGrid } from "../../lib/analyticsDisplay";
import { useAppStore } from "../../store/useAppStore";

type Props = {
  range: string;
  weekHours: number;
  latestAccuracy: number;
  suggestions: string[];
  activityGrid: ActivityDay[];
};

export default function AnalyticsSidebar({
  range,
  weekHours,
  latestAccuracy,
  suggestions,
  activityGrid,
}: Props) {
  const { profile } = useAppStore();
  const { activeDays, highDays, totalStudyMin } = summarizeActivityGrid(activityGrid);
  const dims = profile.learnerDimensions?.length ? profile.learnerDimensions : profile.dimensions;

  return (
    <>
      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={110}>
        <h2 className="dash-panel__title">当前周期</h2>
        <p className="dash-sidebar-stat-lg">{range}</p>
        <ul className="dash-sidebar-facts">
          <li>
            <Clock size={14} aria-hidden />
            <span>周期学习 {weekHours.toFixed(1)} 小时</span>
          </li>
          <li>
            <TrendingUp size={14} aria-hidden />
            <span>最新正确率 {latestAccuracy || "—"}%</span>
          </li>
          <li>
            <BarChart2 size={14} aria-hidden />
            <span>画像健康度 {profile.healthScore}%</span>
          </li>
        </ul>
        <p className="dash-panel__desc mt-3">
          活跃时段 · {profile.rhythm?.period || "待记录"}
          {profile.rhythm?.duration ? ` · ${profile.rhythm.duration}` : ""}
        </p>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={130}>
        <h2 className="dash-panel__title">
          <Activity size={14} className="inline mr-1" aria-hidden />
          近 12 周概览
        </h2>
        <ul className="dash-sidebar-facts">
          <li>
            <Activity size={14} aria-hidden />
            <span>{activeDays} 天有学习记录</span>
          </li>
          <li>
            <Activity size={14} aria-hidden />
            <span>{highDays} 天高强度学习</span>
          </li>
          <li>
            <Clock size={14} aria-hidden />
            <span>累计约 {Math.round(totalStudyMin / 60)} 小时</span>
          </li>
        </ul>
        {profile.cognitiveStyle.length > 0 && (
          <div className="dash-sidebar-tags mt-3">
            {profile.cognitiveStyle.slice(0, 4).map((s) => (
              <span key={s} className="dash-sidebar-tag">{s}</span>
            ))}
          </div>
        )}
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={150}>
        <h2 className="dash-panel__title">学习行为分析</h2>
        <p className="dash-panel__desc mb-3">
          六维画像雷达，反映当前各学习维度得分。
        </p>
        <div className="analytics-sidebar-radar">
          <ProfileRadar dimensions={dims} compact />
        </div>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={170}>
        <h2 className="dash-panel__title">
          <Lightbulb size={14} className="inline mr-1 text-[var(--scholar-accent)]" aria-hidden />
          学习方案优化建议
        </h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-[var(--scholar-text-muted)] mb-4">完成练习后将生成个性化建议。</p>
        ) : (
          <ul className="dash-sidebar-notes mb-4">
            {suggestions.map((s, i) => (
              <li key={i}>
                <span className="font-semibold text-[var(--scholar-accent)] mr-1">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ul>
        )}
        <div className="dash-sidebar-links">
          <Link to="/plan" className="btn-primary w-full justify-center text-sm no-underline">
            <CalendarDays size={15} /> 调整今日计划
          </Link>
          <Link to="/chat" className="btn-secondary w-full justify-center text-sm no-underline">
            <MessageSquare size={15} /> 智能辅导巩固
          </Link>
          <Link to="/path" className="btn-secondary w-full justify-center text-sm no-underline">
            <Route size={15} /> 查看学习路径
          </Link>
        </div>
      </AnimeReveal>
    </>
  );
}
