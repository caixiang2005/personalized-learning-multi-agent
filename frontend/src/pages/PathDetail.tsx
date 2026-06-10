/**
 * @file PathDetail.tsx
 * @description 个性化学习路径详情：阶段 / 知识点 / 五类多模态资源推送
 * @route /path/view
 *
 * 【待同步后端】GET /api/learning-path · PUT resource-status
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  FileText,
  GitBranch,
  ClipboardList,
  Video,
  Code2,
  Filter,
  CheckCircle2,
  ArrowLeft,
  Route,
} from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import { useAppStore } from "../store/useAppStore";
import { PATH_HUB_PATH, PATH_PLAN_PATH } from "../lib/pathRoutes";
import type { MultimodalResource, ResourceType } from "../types";

const typeLabels: Record<string, string> = {
  all: "全部",
  document: "文档",
  mindmap: "导图",
  exercise: "练习",
  video: "视频",
  practice: "实操",
};

const typeIcons: Record<ResourceType, typeof FileText> = {
  document: FileText,
  mindmap: GitBranch,
  exercise: ClipboardList,
  video: Video,
  practice: Code2,
};

const statusLabels: Record<string, string> = {
  todo: "未学习",
  learning: "学习中",
  done: "已学习",
  mastered: "已掌握",
  favorite: "已收藏",
};

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  learning: "bg-primary/10 text-primary",
  done: "bg-accent/10 text-accent",
  mastered: "bg-green-100 text-green-700",
  favorite: "bg-yellow-100 text-yellow-700",
};

export default function PathDetail() {
  const { pathStages, learningPathMeta, updateResourceStatus } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeStage, setActiveStage] = useState(0);

  const hasPath = pathStages.length > 0;
  if (!hasPath) {
    return <Navigate to={PATH_HUB_PATH} replace />;
  }

  const totalTopics = pathStages.reduce((a, s) => a + s.topics.length, 0);
  const doneTopics = pathStages.reduce(
    (a, s) => a + s.topics.filter((t) => t.progress >= 80).length,
    0
  );
  const overallProgress = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

  const subtitle = learningPathMeta
    ? `${learningPathMeta.course} · ${pathStages.length} 阶段 · 更新 ${learningPathMeta.generatedAt}`
    : `共 ${pathStages.length} 阶段 · 当前：${pathStages[activeStage]?.title ?? ""}`;

  return (
    <ScholarPageShell>
      <ScholarPageHeader
        badge="路径智能体"
        title={learningPathMeta?.title ?? "我的学习路径"}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to={PATH_HUB_PATH} className="btn-secondary">
              <ArrowLeft size={16} /> 路径中心
            </Link>
            <Link to={PATH_PLAN_PATH} className="btn-secondary">
              <Route size={16} /> 调整规划
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <ResourceTypeStrip />
      </div>

      <section className="section-card mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">整体完成度</span>
          <span className="text-primary font-semibold">{overallProgress}%</span>
        </div>
        <div className="progress-bar h-3">
          <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="text-xs text-[var(--scholar-text-muted)] mt-2">
          路径依据学习画像动态规划 · 资源状态变更将同步至效果评估（联调后由后端写入）
        </p>
      </section>

      <div className="flex flex-wrap gap-2 mb-8">
        {pathStages.map((stage, i) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => setActiveStage(i)}
            className={`flex-1 min-w-[140px] p-4 rounded-xl text-left card-hover transition-all ${
              activeStage === i
                ? "section-card ring-2 ring-primary/30 !border-primary/40"
                : "section-card opacity-80 hover:opacity-100"
            }`}
          >
            <span className="text-xs text-primary font-medium">阶段 {i + 1}</span>
            <p className="font-medium text-sm mt-1 text-gray-900 dark:text-white">{stage.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter size={16} className="text-gray-400" />
        {["all", "document", "mindmap", "exercise", "video", "practice"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={typeFilter === t ? "chip !bg-primary/15 !border-primary" : "chip !text-gray-500 !border-gray-200"}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {pathStages[activeStage]?.topics.map((topic) => (
        <div key={topic.id} className="section-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{topic.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-40 progress-bar h-2">
                  <div className="progress-bar-fill" style={{ width: `${topic.progress}%` }} />
                </div>
                <span className="text-xs text-gray-500">{topic.progress}%</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {topic.resources
              .filter((r) => typeFilter === "all" || r.type === typeFilter)
              .map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  topicId={topic.id}
                  onStatusChange={updateResourceStatus}
                />
              ))}
          </div>
        </div>
      ))}
    </ScholarPageShell>
  );
}

function ResourceCard({
  resource,
  topicId,
  onStatusChange,
}: {
  resource: MultimodalResource;
  topicId: string;
  onStatusChange: (topicId: string, resourceId: string, status: string) => void;
}) {
  const Icon = typeIcons[resource.type];
  const status = resource.status || "todo";
  const navigate = useNavigate();

  const openResource = () => {
    navigate(resource.type === "exercise" ? `/exercise/${resource.id}` : `/resource/${resource.id}`);
  };

  const cycleStatus = () => {
    const order = ["todo", "learning", "done", "mastered"];
    const idx = order.indexOf(status);
    const next = order[(idx + 1) % order.length];
    onStatusChange(topicId, resource.id, next);
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/70 dark:bg-gray-800/50 card-hover">
      <div className="flex items-start gap-3">
        <div className="icon-box shrink-0 !w-10 !h-10">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mt-1">{resource.title}</h4>
          <p className="text-sm text-gray-500">{resource.description}</p>
          {resource.mermaid && (
            <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto">
              {resource.mermaid}
            </pre>
          )}
          <div className="flex gap-2 mt-3">
            <button type="button" className="btn-primary text-xs py-1.5 px-3" onClick={openResource}>
              查看
            </button>
            <button type="button" onClick={cycleStatus} className="btn-secondary text-xs py-1.5 px-3">
              <CheckCircle2 size={12} /> 标记状态
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
