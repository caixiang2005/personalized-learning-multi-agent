/**
 * 路径左栏 · 知识点列表（参考三栏路径布局）
 */
import { Lock, Sparkles } from "lucide-react";
import type { PathGraphNode } from "./PathGraphCanvas";

interface Props {
  nodes: PathGraphNode[];
  selectedId: string | null;
  onSelect: (node: PathGraphNode) => void;
}

export default function PathTopicList({ nodes, selectedId, onSelect }: Props) {
  return (
    <nav className="path-topic-list" aria-label="路径知识点列表">
      <p className="path-topic-list__label">学习节点</p>
      <ul className="path-topic-list__items">
        {nodes.map((node, index) => {
          const active = node.id === selectedId;
          const done = node.progress >= 80;
          const inProgress = !done && !node.locked && node.progress > 0;

          return (
            <li key={node.id}>
              <button
                type="button"
                className={[
                  "path-topic-card",
                  active && "path-topic-card--active",
                  done && "path-topic-card--done",
                  node.locked && "path-topic-card--locked",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(node)}
                aria-current={active ? "true" : undefined}
              >
                <span className="path-topic-card__stage">{node.stageTitle}</span>
                <span className="path-topic-card__title">{node.name}</span>
                <span className="path-topic-card__meta">
                  {inProgress && !node.locked && (
                    <span className="path-topic-card__tag path-topic-card__tag--active">进行中</span>
                  )}
                  {done && (
                    <span className="path-topic-card__tag path-topic-card__tag--done">已完成</span>
                  )}
                  {node.locked && (
                    <span className="path-topic-card__tag path-topic-card__tag--locked">
                      <Lock size={10} aria-hidden /> 未解锁
                    </span>
                  )}
                  {!node.locked && !done && !inProgress && (
                    <span className="path-topic-card__tag path-topic-card__tag--new">
                      <Sparkles size={10} aria-hidden /> 可学习
                    </span>
                  )}
                  <span className="path-topic-card__progress">#{index + 1} · {node.progress}%</span>
                </span>
                <span className="path-topic-card__hint">
                  {node.locked
                    ? "完成前置节点后解锁"
                    : done
                      ? "本节点已掌握，可复习推送资源"
                      : "点击查看详情与推送资源"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
