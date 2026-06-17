/**
 * @file Profile.tsx
 * @description 六维学习画像雷达图（比赛规范）
 * @route /profile
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Target, Sparkles, Brain, AlertTriangle, RefreshCw, RotateCcw, Settings } from "lucide-react";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import ProfileEmptyState from "../components/profile/ProfileEmptyState";
import ProfileEmptySidebar from "../components/profile/ProfileEmptySidebar";
import ProfileReadinessAside from "../components/profile/ProfileReadinessAside";
import ScholarDashboardLayout, { DashboardHealthAside } from "../components/dashboard/ScholarDashboardLayout";
import LearnerRadarChart, { LearnerDimensionLegend } from "../components/profile/LearnerRadarChart";
import DimensionStatCard from "../components/profile/DimensionStatCard";
import AnimeReveal from "../components/motion/AnimeReveal";
import AnimeStagger from "../components/motion/AnimeStagger";
import { PROFILE_BUILD_PATH } from "../lib/navConfig";
import { isProfileReady } from "../lib/profileReady";
import { useAppStore } from "../store/useAppStore";

export default function Profile() {
  const navigate = useNavigate();
  const { profile, user, setProfile, resetProfileForRebuild } = useAppStore();
  const profileReady = isProfileReady(profile);
  const displayName = profile.name || user?.username || "学习者";
  const [editNote, setEditNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [confirmRebuild, setConfirmRebuild] = useState(false);

  const dims = profile.learnerDimensions?.length
    ? profile.learnerDimensions
    : profile.dimensions;

  const handleUpdate = () => {
    if (!editNote.trim()) return;
    setUpdating(true);
    setTimeout(() => {
      setProfile({
        updatedAt: new Date().toISOString().slice(0, 10),
        healthScore: Math.min(100, profile.healthScore + 3),
        learnerDimensions: dims.map((d) =>
          d.key === "knowledge"
            ? {
                ...d,
                value: Math.min(100, d.value + 4),
                trendDelta: (d.trendDelta ?? 0) + 2,
                source: "用户手动更新 + 对话",
              }
            : d
        ),
      });
      setUpdating(false);
      setEditNote("");
    }, 700);
  };

  const avgScore = dims.length
    ? Math.round(dims.reduce((s, d) => s + d.value, 0) / dims.length)
    : 0;

  const handleRebuildProfile = () => {
    resetProfileForRebuild();
    setConfirmRebuild(false);
    navigate(PROFILE_BUILD_PATH);
  };

  if (!profileReady) {
    const subtitle = profile.major
      ? `${profile.major} · 完成对话后即可生成六维画像`
      : "通过对话描述学习背景，自动生成六维画像";

    return (
      <ScholarDashboardLayout
        className="profile-page--empty"
        badge="学习画像"
        title={`${displayName} 的学习画像`}
        subtitle={subtitle}
        aside={<ProfileReadinessAside />}
        sidebar={<ProfileEmptySidebar />}
      >
        <ProfileEmptyState />
      </ScholarDashboardLayout>
    );
  }

  return (
    <ScholarDashboardLayout
      badge="6 维动态画像"
      title={`${displayName} 的学习画像`}
      subtitle={`${profile.major}${profile.major && profile.goal ? " · " : ""}${profile.goal ? `目标：${profile.goal}` : profile.level || ""}${profile.updatedAt ? ` · 更新 ${profile.updatedAt}` : ""}`}
      aside={<DashboardHealthAside score={profile.healthScore} />}
      sidebar={<ProfileSidebar />}
    >
      <AnimeStagger className="dash-stats mb-6" staggerMs={60} y={12} delay={70}>
        <div className="dash-stats__item">
          <Target size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{avgScore}</span>
          <span className="dash-stats__label">综合得分</span>
        </div>
        <div className="dash-stats__item">
          <Sparkles size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{profile.healthScore}</span>
          <span className="dash-stats__label">画像健康度</span>
        </div>
        <div className="dash-stats__item">
          <Brain size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{dims.length}</span>
          <span className="dash-stats__label">画像维度</span>
        </div>
        <div className="dash-stats__item">
          <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{profile.weakPoints.length}</span>
          <span className="dash-stats__label">薄弱知识点</span>
        </div>
      </AnimeStagger>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <AnimeReveal as="section" className="section-card dash-panel" y={16} delay={140}>
          <h2 className="dash-panel__title">六维雷达图</h2>
          <p className="dash-panel__desc">
            知识掌握 · 习题完成 · 专注度 · 薄弱点改善 · 学习效率 · 提升趋势
          </p>
          <LearnerDimensionLegend />
          <LearnerRadarChart dimensions={dims} />
        </AnimeReveal>

        <div className="flex flex-col gap-3 min-w-0">
          <AnimeStagger as="section" className="grid grid-cols-1 sm:grid-cols-2 gap-3" staggerMs={70} y={14} delay={180}>
            {dims.map((d, i) => (
              <DimensionStatCard key={d.key} dimension={d} index={i} />
            ))}
          </AnimeStagger>

          <section className="section-card dash-panel">
            <h2 className="dash-panel__title">
              <AlertTriangle size={16} className="inline mr-1 text-[var(--scholar-accent)]" aria-hidden />
              薄弱知识点
            </h2>
            {profile.weakPoints.length > 0 ? (
              <ul className="dash-sidebar-weak">
                {profile.weakPoints.map((w) => (
                  <li key={w.name}>
                    <span>{w.name}</span>
                    <span>{w.count} 次</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-panel__desc">完成练习后，系统会自动统计错误集中的知识点。</p>
            )}
          </section>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="section-card dash-panel">
          <h2 className="dash-panel__title">对话更新画像</h2>
          <p className="dash-panel__desc mb-3">记录最新学习进展，触发六维画像动态更新。</p>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="例：刚完成二叉树练习，正确率 70%"
            className="input-field min-h-[88px] resize-y w-full"
          />
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            className="mt-3 btn-primary inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} className={updating ? "animate-spin" : ""} />
            {updating ? "更新中…" : "触发画像动态更新"}
          </button>
        </section>

        <section className="section-card dash-panel">
          <h2 className="dash-panel__title">重新构建画像</h2>
          <p className="dash-panel__desc mb-4">
            专业、目标或薄弱点有变化时，可清空当前六维画像，重新与画像智能体对话生成。
          </p>
          {!confirmRebuild ? (
            <button
              type="button"
              onClick={() => setConfirmRebuild(true)}
              className="btn-secondary inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              重新构建画像
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-[var(--scholar-text-secondary)]">确认清空当前画像并重新开始？</p>
              <button type="button" onClick={handleRebuildProfile} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
                确认，进入画像智能体
              </button>
              <button type="button" onClick={() => setConfirmRebuild(false)} className="btn-secondary cursor-pointer">
                取消
              </button>
            </div>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Link to="/account" className="section-card dash-panel flex items-center gap-4 no-underline hover:border-[var(--scholar-primary)]/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--scholar-bg)] flex items-center justify-center shrink-0">
            <Settings size={20} className="text-[var(--scholar-text-secondary)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--scholar-text)]">个人信息设置</p>
            <p className="text-sm text-[var(--scholar-text-muted)]">编辑头像、昵称、手机号等账号资料</p>
          </div>
        </Link>
        <Link to="/settings" className="section-card dash-panel flex items-center gap-4 no-underline hover:border-[var(--scholar-primary)]/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--scholar-bg)] flex items-center justify-center shrink-0">
            <Settings size={20} className="text-[var(--scholar-text-secondary)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--scholar-text)]">系统设置</p>
            <p className="text-sm text-[var(--scholar-text-muted)]">主题切换、数据库管理等</p>
          </div>
        </Link>
      </div>
    </ScholarDashboardLayout>
  );
}
