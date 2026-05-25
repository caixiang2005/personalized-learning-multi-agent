/**
 * @file Profile.tsx
 * @description 学习画像详情页（≥6 维度雷达图等）。
 * @route /profile
 *
 * 【当前 Mock】profile 来自 store（初始 mockData）；handleUpdate 用 setTimeout 改本地 dimensions。
 * 【待同步后端】
 *   - 进入页：fetchProfile() 刷新 store.profile
 *   - 手动更新：patchProfile(note) 替换 handleUpdate 内逻辑
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Target, Clock } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ProfileRadar, { DimensionLegend } from "../components/charts/ProfileRadar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAppStore } from "../store/useAppStore";

export default function Profile() {
  const { profile, setProfile } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>("tree");
  const [editNote, setEditNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = () => {
    if (!editNote.trim()) return;
    setUpdating(true);
    setTimeout(() => {
      setProfile({
        updatedAt: new Date().toISOString().slice(0, 10),
        healthScore: Math.min(100, profile.healthScore + 5),
        dimensions: profile.dimensions.map((d) =>
          d.key === "tree" ? { ...d, value: 55, level: "medium" as const, source: "用户手动更新" } : d
        ),
      });
      setUpdating(false);
      setEditNote("");
    }, 800);
  };

  return (
    <div className="page-container">
      <PageHeader
        title={`${profile.name} 的学习画像`}
        subtitle={profile.major}
        badge="6 维度动态画像"
      />

      <section className="section-card mb-6 flex flex-wrap gap-6 items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">画像更新时间 · {profile.updatedAt}</p>
          <p className="text-sm text-gray-400 mt-1">目标：{profile.goal}</p>
        </div>
        <div className="text-center">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#165DFF"
                strokeWidth="3"
                strokeDasharray={`${profile.healthScore} 100`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">
              {profile.healthScore}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">画像健康度</p>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 知识基础雷达 */}
        <div className="section-card card-hover">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">知识基础（6 维度）</h2>
          <DimensionLegend />
          <ProfileRadar dimensions={profile.dimensions} />
          <div className="space-y-2 mt-4">
            {profile.dimensions.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setExpanded(expanded === d.key ? null : d.key)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      d.level === "weak" ? "bg-red-500" : d.level === "medium" ? "bg-yellow-500" : "bg-accent"
                    }`}
                  />
                  {d.label}
                </span>
                <span className="flex items-center gap-2 text-gray-500">
                  {d.value}%
                  {expanded === d.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
            ))}
            {expanded && (
              <p className="text-xs text-gray-500 px-2 animate-fade-in">
                数据来源：{profile.dimensions.find((d) => d.key === expanded)?.source || "基于对话与练习记录"}
              </p>
            )}
          </div>
        </div>

        {/* 认知风格 */}
        <div className="section-card card-hover">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">认知风格分析</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            视觉型学习者，偏好思维导图和视频讲解，边练边学效果最佳。
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.cognitiveStyle.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {tag}
              </span>
            ))}
          </div>

          <h3 className="font-medium mt-6 mb-3 text-gray-800 dark:text-gray-200">易错点偏好</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={profile.weakPoints} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {profile.weakPoints.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? "#ef4444" : "#165DFF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 学习进度 */}
        <div className="section-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target size={18} className="text-primary" /> 学习进度
          </h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{profile.goalProgress.label}</span>
              <span className="text-primary">{profile.goalProgress.percent}%</span>
            </div>
            <div className="progress-bar h-2.5">
              <div className="progress-bar-fill" style={{ width: `${profile.goalProgress.percent}%` }} />
            </div>
          </div>
          <p className="text-sm text-gray-500">目标：{profile.goal}</p>
        </div>

        {/* 学习节奏 */}
        <div className="section-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary" /> 学习节奏
          </h2>
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-gray-500">活跃时段：</span>
              {profile.rhythm.period}
            </p>
            <p>
              <span className="text-gray-500">单次时长：</span>
              {profile.rhythm.duration}
            </p>
          </div>
        </div>
      </div>

      {/* 编辑区 */}
      <section className="section-card mt-6">
        <h2 className="font-semibold mb-3">手动更新学习状态</h2>
        <textarea
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          placeholder="例：我刚学完二叉树，掌握度一般"
          className="input-field min-h-[88px] resize-y"
        />
        <button type="button" onClick={handleUpdate} disabled={updating} className="mt-3 btn-primary">
          <RefreshCw size={16} className={updating ? "animate-spin" : ""} />
          {updating ? "更新中..." : "触发画像动态更新"}
        </button>
      </section>
    </div>
  );
}
