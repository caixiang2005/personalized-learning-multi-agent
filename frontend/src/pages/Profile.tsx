/**
 * @file Profile.tsx
 * @description 六维学习画像雷达图（比赛规范）
 * @route /profile
 */
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import GrowthQuickLinks from "../components/layout/GrowthQuickLinks";
import LearnerRadarChart, { LearnerDimensionLegend } from "../components/profile/LearnerRadarChart";
import DimensionStatCard from "../components/profile/DimensionStatCard";
import { useAppStore } from "../store/useAppStore";

export default function Profile() {
  const { profile, setProfile } = useAppStore();
  const [editNote, setEditNote] = useState("");
  const [updating, setUpdating] = useState(false);

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

  const avgScore = Math.round(dims.reduce((s, d) => s + d.value, 0) / dims.length);

  return (
    <ScholarPageShell maxWidth="5xl">
      <ScholarPageHeader
        badge="6 维动态画像"
        title={`${profile.name} 的学习画像`}
        subtitle={`${profile.major} · 目标：${profile.goal}`}
      />

      <GrowthQuickLinks />

      <section className="scholar-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--scholar-text-muted)]">画像更新时间 · {profile.updatedAt}</p>
          <p className="text-sm text-[var(--scholar-text-secondary)] mt-1">{profile.level}</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--scholar-primary)] tabular-nums">{avgScore}</p>
            <p className="text-xs text-[var(--scholar-text-muted)]">综合得分</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--scholar-accent)] tabular-nums">{profile.healthScore}</p>
            <p className="text-xs text-[var(--scholar-text-muted)]">健康度</p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="scholar-card p-5">
          <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-1">六维雷达图</h2>
          <p className="text-xs text-[var(--scholar-text-muted)] mb-2">
            知识掌握 · 习题完成 · 专注度 · 薄弱点改善 · 学习效率 · 提升趋势
          </p>
          <LearnerDimensionLegend />
          <LearnerRadarChart dimensions={dims} />
        </section>

        <section className="grid gap-3 content-start">
          {dims.map((d) => (
            <DimensionStatCard key={d.key} dimension={d} />
          ))}
        </section>
      </div>

      <section className="scholar-card p-5">
        <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-3">对话更新画像</h2>
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
    </ScholarPageShell>
  );
}
