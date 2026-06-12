/**
 * @file PathGraphCanvas.tsx
 * @description 学习路径节点图（参考路径可视化：阶段节点 + 虚线连接）
 */
import { useMemo } from "react";
import type { PathStage } from "../../types";

export interface PathGraphNode {
  id: string;
  stageIndex: number;
  topicIndex: number;
  name: string;
  progress: number;
  locked: boolean;
  stageTitle: string;
}

interface Props {
  stages: PathStage[];
  selectedId: string | null;
  onSelect: (node: PathGraphNode) => void;
  title?: string;
  overallProgress?: number;
  completedCount?: number;
  totalCount?: number;
}

function flattenNodes(stages: PathStage[]): PathGraphNode[] {
  const nodes: PathGraphNode[] = [];
  stages.forEach((stage, stageIndex) => {
    stage.topics.forEach((topic, topicIndex) => {
      const prevStageDone =
        stageIndex === 0 ||
        stages[stageIndex - 1].topics.every((t) => t.progress >= 80);
      const prevTopicDone =
        topicIndex === 0 || stage.topics[topicIndex - 1].progress >= 40;
      nodes.push({
        id: topic.id,
        stageIndex,
        topicIndex,
        name: topic.name,
        progress: topic.progress,
        locked: !prevStageDone || !prevTopicDone,
        stageTitle: stage.title,
      });
    });
  });
  return nodes;
}

export default function PathGraphCanvas({
  stages,
  selectedId,
  onSelect,
  title,
  overallProgress = 0,
  completedCount = 0,
  totalCount = 0,
}: Props) {
  const nodes = useMemo(() => flattenNodes(stages), [stages]);
  const totalNodes = nodes.length;
  const completed = nodes.filter((n) => n.progress >= 80).length;
  const maxStageTopics = Math.max(...stages.map((s) => s.topics.length), 1);

  const nodePositions = useMemo(() => {
    const padX = 48;
    const padY = 56;
    const colW = 120;
    const rowH = 96;
    const width = padX * 2 + maxStageTopics * colW;
    const height = padY * 2 + stages.length * rowH;

    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      map.set(node.id, {
        x: padX + node.topicIndex * colW + colW / 2,
        y: padY + node.stageIndex * rowH + rowH / 2,
      });
    });
    return { map, width, height, padX, padY, colW, rowH };
  }, [nodes, stages.length, maxStageTopics]);

  const edges = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 1; i < nodes.length; i++) {
      const a = nodePositions.map.get(nodes[i - 1].id);
      const b = nodePositions.map.get(nodes[i].id);
      if (a && b) lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return lines;
  }, [nodes, nodePositions.map]);

  return (
    <div className="path-graph">
      <div className="path-graph__header">
        <div className="path-graph__header-main">
          {title && <h2 className="path-graph__title">{title}</h2>}
          <div className="path-graph__progress-row">
            <span className="path-graph__progress-label">
              {completedCount}/{totalCount || totalNodes}
            </span>
            <div className="path-graph__progress-bar">
              <span style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>
        <div className="path-graph__stats">
          <span>{totalNodes} 节点</span>
          <span>{stages.length} 阶段</span>
          <span>{completed} 已完成</span>
        </div>
      </div>
      <div className="path-graph__toolbar">
        <div className="path-graph__legend">
          <span className="path-graph__legend-item path-graph__legend-item--done">已完成</span>
          <span className="path-graph__legend-item path-graph__legend-item--active">进行中</span>
          <span className="path-graph__legend-item path-graph__legend-item--locked">未解锁</span>
        </div>
      </div>

      <div className="path-graph__canvas-wrap">
        <svg
          className="path-graph__svg"
          viewBox={`0 0 ${nodePositions.width} ${nodePositions.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <pattern id="path-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="color-mix(in srgb, var(--scholar-border) 55%, transparent)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#path-grid)" />

          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              className="path-graph__edge"
            />
          ))}
        </svg>

        <div
          className="path-graph__nodes"
          style={{
            aspectRatio: `${nodePositions.width} / ${nodePositions.height}`,
          }}
        >
          {nodes.map((node, i) => {
            const pos = nodePositions.map.get(node.id);
            if (!pos) return null;
            const active = node.id === selectedId;
            const done = node.progress >= 80;
            const inProgress = !done && !node.locked && node.progress > 0;
            const leftPct = (pos.x / nodePositions.width) * 100;
            const topPct = (pos.y / nodePositions.height) * 100;

            return (
              <button
                key={node.id}
                type="button"
                className={[
                  "path-graph__node",
                  done && "path-graph__node--done",
                  inProgress && "path-graph__node--active",
                  node.locked && "path-graph__node--locked",
                  active && "path-graph__node--selected",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                onClick={() => onSelect(node)}
                aria-label={`${node.name}，进度 ${node.progress}%`}
                aria-pressed={active}
              >
                <span className="path-graph__node-num">#{i + 1}</span>
                <span className="path-graph__node-title">{node.name}</span>
                <span className="path-graph__node-meta">
                  {node.locked ? "未解锁" : `${node.progress}%`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { flattenNodes };
