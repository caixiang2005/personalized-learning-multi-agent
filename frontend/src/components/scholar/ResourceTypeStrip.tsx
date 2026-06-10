import { FileText, GitBranch, ClipboardList, Video, Code2 } from "lucide-react";
import { resourceTypes } from "../../lib/designTokens";
import type { ResourceType } from "../../types";

const iconMap = {
  document: FileText,
  mindmap: GitBranch,
  exercise: ClipboardList,
  video: Video,
  practice: Code2,
} as const;

interface Props {
  /** static：仅展示；interactive：点击触发意图 */
  mode?: "static" | "interactive";
  activeKey?: ResourceType | null;
  onSelect?: (key: ResourceType) => void;
}

export default function ResourceTypeStrip({
  mode = "static",
  activeKey = null,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="支持的学习资源类型">
      {resourceTypes.map(({ key, label }) => {
        const Icon = iconMap[key as keyof typeof iconMap];
        const className = `scholar-resource-pill scholar-resource-pill--${key} ${
          activeKey === key ? "scholar-resource-pill--active" : ""
        }`;

        if (mode === "interactive") {
          return (
            <button
              key={key}
              type="button"
              className={`${className} scholar-resource-pill--btn`}
              onClick={() => onSelect?.(key as ResourceType)}
            >
              <Icon size={13} strokeWidth={1.75} aria-hidden />
              {label}
            </button>
          );
        }

        return (
          <span key={key} className={className}>
            <Icon size={13} strokeWidth={1.75} aria-hidden />
            {label}
          </span>
        );
      })}
    </div>
  );
}
