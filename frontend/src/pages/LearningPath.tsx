/**
 * @file LearningPath.tsx
 * @description 学习路径中心：入口 hub，引导至路径智能体规划与路径详情
 * @route /path
 */

import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Route,
  BrainCircuit,
  Signpost,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import { useAppStore } from "../store/useAppStore";
import { needsProfileBuild } from "../lib/profileGate";
import { resolvePathPlanTarget } from "../lib/pathGate";
import { PATH_PLAN_PATH, PATH_VIEW_PATH } from "../lib/pathRoutes";

const FLOW_STEPS = [
  {
    icon: BrainCircuit,
    title: "完成学习画像",
    desc: "画像智能体对话抽取 ≥6 维特征",
  },
  {
    icon: Signpost,
    title: "路径智能体规划",
    desc: "分阶段路径 + 五类多模态资源推送",
  },
  {
    icon: Layers,
    title: "按阶段学习",
    desc: "跟踪进度 · 动态调整推送策略",
  },
] as const;

export default function LearningPath() {
  const navigate = useNavigate();
  const { pathStages, learningPathMeta, profile, profileInitialized } = useAppStore();
  const hasPath = pathStages.length > 0;
  const profileReady = !needsProfileBuild(profileInitialized, profile);

  const totalTopics = pathStages.reduce((a, s) => a + s.topics.length, 0);
  const doneTopics = pathStages.reduce(
    (a, s) => a + s.topics.filter((t) => t.progress >= 80).length,
    0
  );
  const overallProgress = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

  const startPlan = () => {
    const target = resolvePathPlanTarget(profileInitialized, profile);
    navigate(target.to, { state: target.state });
  };

  const subtitle = hasPath
    ? `${learningPathMeta?.course ?? "我的课程"} · ${pathStages.length} 阶段 · 完成度 ${overallProgress}%`
    : "赛题核心：依托画像与路径智能体，规划科学学习步骤并精准推送多模态资源";

  return (
    <ScholarPageShell>
      <ScholarPageHeader
        badge="路径规划"
        title="个性化学习路径"
        subtitle={subtitle}
        action={
          hasPath ? (
            <Link to={PATH_VIEW_PATH} className="btn-primary">
              <Play size={16} /> 进入我的路径
            </Link>
          ) : (
            <button type="button" onClick={startPlan} className="btn-primary">
              <Route size={16} /> {profileReady ? "开始路径规划" : "先完成画像"}
            </button>
          )
        }
      />

      <div className="mb-6">
        <ResourceTypeStrip />
      </div>

      <section className="path-hub-flow section-card mb-8" aria-label="学习路径流程">
        <h2 className="path-hub-flow__title">三步开启个性化路径</h2>
        <ol className="path-hub-flow__steps">
          {FLOW_STEPS.map((step, i) => (
            <li key={step.title} className="path-hub-flow__step">
              <span className="path-hub-flow__index">{String(i + 1).padStart(2, "0")}</span>
              <span className="path-hub-flow__icon">
                <step.icon size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="path-hub-flow__step-title">{step.title}</p>
                <p className="path-hub-flow__step-desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {!hasPath ? (
        <section className="section-card text-center py-14 px-6">
          <p className="text-lg font-medium text-gray-900 dark:text-white">尚未生成学习路径</p>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
            路径由<strong className="font-medium text-[var(--scholar-text)]">路径规划智能体</strong>
            结合你的六维画像生成，包含阶段划分与文档、导图、题库、视频、实操五类资源推送。
            {!profileReady && " 请先完成学习画像构建。"}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button type="button" onClick={startPlan} className="btn-primary">
              <Route size={16} /> {profileReady ? "进入路径智能体" : "去完成画像"}
            </button>
            {profileReady && (
              <Link to={PATH_PLAN_PATH} className="btn-secondary">
                了解规划流程 <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="section-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--scholar-primary)] flex items-center gap-1">
                <Sparkles size={14} /> 已生成路径
              </p>
              <h3 className="text-lg font-semibold text-[var(--scholar-text)] mt-1">
                {learningPathMeta?.title ?? "我的学习路径"}
              </h3>
              <p className="text-sm text-[var(--scholar-text-muted)] mt-1">
                {pathStages.length} 个阶段 · {totalTopics} 个知识点 · 更新于{" "}
                {learningPathMeta?.generatedAt ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-[var(--scholar-primary)]">{overallProgress}%</p>
              <p className="text-xs text-[var(--scholar-text-muted)]">整体完成度</p>
            </div>
          </div>
          <div className="progress-bar h-2 mt-4">
            <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to={PATH_VIEW_PATH} className="btn-primary">
              <Play size={16} /> 继续学习
            </Link>
            <Link to={PATH_PLAN_PATH} className="btn-secondary">
              <Route size={16} /> 重新规划
            </Link>
          </div>
        </section>
      )}
    </ScholarPageShell>
  );
}
