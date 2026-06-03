import { FileText, GitBranch, ClipboardList, Video, Code2 } from "lucide-react";
import { resourceTypes } from "../../lib/designTokens";

const iconMap = {
  document: FileText,
  mindmap: GitBranch,
  exercise: ClipboardList,
  video: Video,
  practice: Code2,
} as const;

export default function ResourceTypeStrip() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="支持的学习资源类型">
      {resourceTypes.map(({ key, label }) => {
        const Icon = iconMap[key as keyof typeof iconMap];
        return (
          <span
            key={key}
            className={`scholar-resource-pill scholar-resource-pill--${key}`}
          >
            <Icon size={13} strokeWidth={1.75} aria-hidden />
            {label}
          </span>
        );
      })}
    </div>
  );
}
