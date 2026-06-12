/**
 * @file PathDetail.tsx
 * @description 三栏路径视图：节点列表 · 图谱 · 详情与资源
 * @route /path/view
 */
import { useMemo, useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  FileText,
  GitBranch,
  ClipboardList,
  Video,
  Code2,
  CheckCircle2,
  ArrowLeft,
  Route,
  Lock,
  Clock,
  Target,
  Activity,
  Sparkles,
} from "lucide-react";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import PathGraphCanvas, {
  flattenNodes,
  type PathGraphNode,
} from "../components/path/PathGraphCanvas";
import PathTopicList from "../components/path/PathTopicList";
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
  todo: "path-res-badge--todo",
  learning: "path-res-badge--learning",
  done: "path-res-badge--done",
  mastered: "path-res-badge--mastered",
  favorite: "path-res-badge--favorite",
};

export default function PathDetail() {
  const { pathStages, learningPathMeta, updateResourceStatus } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const nodes = useMemo(() => flattenNodes(pathStages), [pathStages]);
  const [selectedNode, setSelectedNode] = useState<PathGraphNode | null>(
    () => nodes.find((n) => !n.locked) ?? nodes[0] ?? null
  );

  useEffect(() => {
    if (!nodes.length) return;
    if (!selectedNode || !nodes.some((n) => n.id === selectedNode.id)) {
      setSelectedNode(nodes.find((n) => !n.locked) ?? nodes[0] ?? null);
    }
  }, [nodes, selectedNode]);

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

  const activeTopic = selectedNode
    ? pathStages[selectedNode.stageIndex]?.topics[selectedNode.topicIndex]
    : null;

  const nodeIndex = selectedNode ? nodes.findIndex((n) => n.id === selectedNode.id) : -1;

  const difficulty =
    selectedNode && selectedNode.stageIndex === 0
      ? "入门"
      : selectedNode && selectedNode.stageIndex === pathStages.length - 1
        ? "进阶"
        : "巩固";

  const prevNode = nodeIndex > 0 ? nodes[nodeIndex - 1] : null;

  const filteredResources =
    activeTopic?.resources.filter((r) => typeFilter === "all" || r.type === typeFilter) ?? [];

  return (
    <ScholarDashboardLayout
      badge="路径智能体"
      title={learningPathMeta?.title ?? "我的学习路径"}
      subtitle={`${learningPathMeta?.course ?? "我的课程"} · ${pathStages.length} 阶段 · ${totalTopics} 节点 · 完成 ${overallProgress}%`}
      className="path-cockpit-page"
      aside={
        <div className="flex flex-wrap gap-2 justify-end">
          <Link to={PATH_HUB_PATH} className="btn-secondary text-sm">
            <ArrowLeft size={15} /> 路径中心
          </Link>
          <Link to={PATH_PLAN_PATH} className="btn-secondary text-sm">
            <Route size={15} /> 调整规划
          </Link>
        </div>
      }
    >
      <div className="path-cockpit">
        <aside className="path-cockpit__list section-card">
          <PathTopicList
            nodes={nodes}
            selectedId={selectedNode?.id ?? null}
            onSelect={setSelectedNode}
          />
        </aside>

        <section className="path-cockpit__graph section-card">
          <PathGraphCanvas
            stages={pathStages}
            selectedId={selectedNode?.id ?? null}
            onSelect={setSelectedNode}
            title={learningPathMeta?.title}
            overallProgress={overallProgress}
            completedCount={doneTopics}
            totalCount={totalTopics}
          />
        </section>

        <aside className="path-cockpit__detail section-card">
          {selectedNode && activeTopic ? (
            <div className="path-detail-side">
              <div className="path-detail-side__head">
                {selectedNode.locked ? (
                  <span className="path-detail-side__lock">
                    <Lock size={14} /> 未解锁
                  </span>
                ) : (
                  <span className="path-detail-side__unlock">可学习</span>
                )}
                <span className="path-detail-side__stage">节点 {nodeIndex + 1}</span>
              </div>

              <h3 className="path-detail-side__title">{selectedNode.name}</h3>
              <p className="path-detail-side__desc">
                {selectedNode.stageTitle} · 路径智能体依据画像推送五类多模态资源
              </p>

              <div className="path-detail-metrics">
                <div className="path-detail-metric">
                  <Clock size={15} aria-hidden />
                  <span className="path-detail-metric__label">预计</span>
                  <span className="path-detail-metric__value">25 分钟</span>
                </div>
                <div className="path-detail-metric">
                  <Target size={15} aria-hidden />
                  <span className="path-detail-metric__label">难度</span>
                  <span className="path-detail-metric__value">{difficulty}</span>
                </div>
                <div className="path-detail-metric">
                  <Activity size={15} aria-hidden />
                  <span className="path-detail-metric__label">进度</span>
                  <span className="path-detail-metric__value">{selectedNode.progress}%</span>
                </div>
                <div className="path-detail-metric path-detail-metric--accent">
                  <span className="path-detail-metric__label">资源</span>
                  <span className="path-detail-metric__value">{activeTopic.resources.length} 项</span>
                </div>
              </div>

              {prevNode && selectedNode.locked && (
                <div className="path-detail-prereq">
                  <p className="path-detail-prereq__label">前置节点</p>
                  <button
                    type="button"
                    className="path-detail-prereq__item"
                    onClick={() => setSelectedNode(prevNode)}
                  >
                    <Lock size={13} aria-hidden />
                    {prevNode.name}
                  </button>
                </div>
              )}

              {selectedNode.locked && (
                <p className="path-detail-side__warn">请先完成前置节点后再学习本知识点。</p>
              )}

              <div className="path-detail-side__resources">
                <div className="path-detail-side__resources-head">
                  <h4>推送资源</h4>
                  <div className="path-detail-filters path-detail-filters--compact">
                    {["all", "document", "mindmap", "exercise", "video", "practice"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        className={typeFilter === t ? "chip chip--active" : "chip"}
                      >
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="path-detail-side__resource-list">
                  {filteredResources.map((resource) => (
                    <li key={resource.id}>
                      <ResourceRow
                        resource={resource}
                        topicId={activeTopic.id}
                        onStatusChange={updateResourceStatus}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              {!selectedNode.locked && (
                <div className="path-detail-side__actions">
                  <Link to="/chat" className="btn-primary text-sm w-full justify-center">
                    <Sparkles size={15} /> 生成资源
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="path-detail-side path-detail-side--empty">
              <p className="path-detail-side__empty-title">节点详情</p>
              <p className="path-detail-side__empty-desc">在左侧列表或中间图谱中选择知识点，查看推送资源与学习进度。</p>
            </div>
          )}
        </aside>
      </div>
    </ScholarDashboardLayout>
  );
}

function ResourceRow({
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
    <article className="path-side-res">
      <div className="path-side-res__head">
        <span className="path-side-res__icon" aria-hidden>
          <Icon size={14} strokeWidth={1.75} />
        </span>
        <span className="path-side-res__title">{resource.title}</span>
        <span className={`path-res-badge ${statusColors[status]}`}>{statusLabels[status]}</span>
      </div>
      <p className="path-side-res__desc">{resource.description}</p>
      <div className="path-side-res__actions">
        <button type="button" className="btn-primary text-xs py-1 px-2.5" onClick={openResource}>
          打开
        </button>
        <button type="button" onClick={cycleStatus} className="btn-secondary text-xs py-1 px-2.5">
          <CheckCircle2 size={11} /> 标记
        </button>
      </div>
    </article>
  );
}
