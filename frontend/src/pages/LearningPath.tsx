/**
 * @file LearningPath.tsx
 * @description 学习路径中心：入口 hub，引导至路径智能体规划与路径详情
 * @route /path
 */

import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Route,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Layers,
} from "lucide-react";
import PathHubSidebar from "../components/path/PathHubSidebar";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import { useAppStore } from "../store/useAppStore";
import { needsProfileBuild } from "../lib/profileGate";
import { resolvePathPlanTarget } from "../lib/pathGate";
import { PATH_PLAN_PATH, PATH_VIEW_PATH } from "../lib/pathRoutes";

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

  const totalResources = pathStages.reduce(
    (a, s) => a + s.topics.reduce((n, t) => n + t.resources.length, 0),
    0
  );

  const startPlan = () => {
    const target = resolvePathPlanTarget(profileInitialized, profile);
    navigate(target.to, { state: target.state });
  };

  const subtitle = hasPath
    ? `${learningPathMeta?.course ?? "我的课程"} · ${pathStages.length} 阶段 · 完成度 ${overallProgress}%`
    : "赛题核心：依托画像与路径智能体，规划科学学习步骤并精准推送多模态资源";

  return (
    <ScholarDashboardLayout
      badge="路径规划"
      title="个性化学习路径"
      subtitle={subtitle}
      aside={
        hasPath ? (
          <Link to={PATH_VIEW_PATH} className="btn-primary text-sm">
            <Play size={16} /> 进入我的路径
          </Link>
        ) : (
          <button type="button" onClick={startPlan} className="btn-primary text-sm">
            <Route size={16} /> {profileReady ? "开始路径规划" : "先完成画像"}
          </button>
        )
      }
      sidebar={<PathHubSidebar profileReady={profileReady} hasPath={hasPath} />}
    >
      {hasPath && (
        <AnimeStagger className="dash-stats mb-6" staggerMs={60} y={12} delay={70}>
          <div className="dash-stats__item">
            <Layers size={16} strokeWidth={1.75} aria-hidden />
            <span className="dash-stats__num">{pathStages.length}</span>
            <span className="dash-stats__label">学习阶段</span>
          </div>
          <div className="dash-stats__item">
            <BookOpen size={16} strokeWidth={1.75} aria-hidden />
            <span className="dash-stats__num">{totalTopics}</span>
            <span className="dash-stats__label">知识点</span>
          </div>
          <div className="dash-stats__item">
            <Route size={16} strokeWidth={1.75} aria-hidden />
            <span className="dash-stats__num">{totalResources}</span>
            <span className="dash-stats__label">推送资源</span>
          </div>
          <div className="dash-stats__item">
            <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />
            <span className="dash-stats__num">{overallProgress}%</span>
            <span className="dash-stats__label">整体完成度</span>
          </div>
        </AnimeStagger>
      )}

      {!hasPath && (
        <section className="section-card dash-panel">
          <p className="text-xs font-medium text-[var(--scholar-primary)] mb-2">三步开启个性化路径</p>
          <h2 className="text-lg font-semibold text-[var(--scholar-text)]">尚未生成学习路径</h2>
          <p className="text-sm text-[var(--scholar-text-muted)] mt-2 leading-relaxed">
            路径由<strong className="font-medium text-[var(--scholar-text)]">路径规划智能体</strong>
            结合你的六维画像生成，按阶段推送文档、导图、题库、视频、实操等资源。
            {!profileReady && " 请先完成学习画像构建。"}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button type="button" onClick={startPlan} className="btn-primary">
              <Route size={16} /> {profileReady ? "进入路径智能体" : "去完成画像"}
            </button>
            {profileReady && (
              <Link to={PATH_PLAN_PATH} className="btn-secondary">
                了解规划流程 <ArrowRight size={14} />
              </Link>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-[color-mix(in_srgb,var(--scholar-border)_70%,transparent)]">
            <h3 className="text-sm font-medium text-[var(--scholar-text)] mb-3">规划流程</h3>
            <ol className="dash-sidebar-workflow">
              <li>
                <span className="dash-sidebar-workflow__num">1</span>
                <span>完成学习画像（≥6 维特征）</span>
              </li>
              <li>
                <span className="dash-sidebar-workflow__num">2</span>
                <span>路径智能体划分阶段并推送资源</span>
              </li>
              <li>
                <span className="dash-sidebar-workflow__num">3</span>
                <span>按阶段学习，可随时重新规划</span>
              </li>
            </ol>
          </div>

          <div className="mt-6 pt-5 border-t border-[color-mix(in_srgb,var(--scholar-border)_70%,transparent)]">
            <p className="text-sm text-[var(--scholar-text-muted)] mb-3">每个知识点可匹配的多模态材料</p>
            <ResourceTypeStrip />
          </div>
        </section>
      )}

      {hasPath && (
        <section className="section-card dash-panel">
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
          <div className="mt-6 pt-5 border-t border-[color-mix(in_srgb,var(--scholar-border)_70%,transparent)]">
            <p className="text-sm font-medium text-[var(--scholar-text)] mb-3">阶段概览</p>
            <ul className="space-y-2">
              {pathStages.map((stage, i) => (
                <li
                  key={stage.id}
                  className="flex items-center justify-between gap-3 text-sm py-2 border-b border-[color-mix(in_srgb,var(--scholar-border)_50%,transparent)] last:border-0"
                >
                  <span className="text-[var(--scholar-text-secondary)]">
                    阶段 {i + 1} · {stage.title}
                  </span>
                  <span className="text-xs text-[var(--scholar-text-muted)] shrink-0">
                    {stage.topics.length} 节点
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </ScholarDashboardLayout>
  );
}
