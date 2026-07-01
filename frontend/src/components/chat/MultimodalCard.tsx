/**
 * @file MultimodalCard.tsx
 * @description 对话区嵌入的多模态资源卡片，支持跳转资源详情或练习页。
 * @backend 资源元数据来自 POST /api/chat/stream 的 resource 事件；详情见 GET /api/resources/:id
 */
import {
  FileText,
  GitBranch,
  ClipboardList,
  Video,
  Code2,
  Download,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MultimodalResource, ResourceType } from "../../types";

const icons: Record<ResourceType, typeof FileText> = {
  document: FileText,
  mindmap: GitBranch,
  exercise: ClipboardList,
  video: Video,
  practice: Code2,
};

const labels: Record<ResourceType, string> = {
  document: "文档笔记",
  mindmap: "思维导图",
  exercise: "练习题",
  video: "视频动画",
  practice: "实操案例",
};

interface Props {
  resource: MultimodalResource;
  onProgress?: number;
}

export default function MultimodalCard({ resource, onProgress }: Props) {
  const navigate = useNavigate();
  const Icon = icons[resource.type];
  const progress = onProgress ?? resource.progress;

  const openResource = () => {
    if (resource.type === "video" && resource.url) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
      return;
    }
    const path = resource.type === "exercise" ? `/exercise/${resource.id}` : `/resource/${resource.id}`;
    navigate(path);
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-br from-gray-50/80 to-white dark:from-gray-800/50 dark:to-gray-900/50 card-hover">
      <div className="flex items-start gap-3">
        <div className="icon-box shrink-0 !w-10 !h-10">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="badge badge-primary">{labels[resource.type]}</span>
            <span className="flex items-center gap-1 text-[11px] text-accent font-medium">
              <ShieldCheck size={11} /> 已校验
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{resource.title}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{resource.description}</p>

          {progress !== undefined && progress < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>生成中</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar h-1.5">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {resource.mermaid && (
            <pre className="mt-3 p-3 bg-gray-900/5 dark:bg-black/30 rounded-lg text-xs overflow-x-auto font-mono text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50">
              {resource.mermaid}
            </pre>
          )}

          <div className="flex gap-2 mt-3">
            <button type="button" className="btn-primary text-xs py-1.5 px-3" onClick={openResource}>
              <ExternalLink size={12} /> 查看
            </button>
            <button type="button" className="btn-secondary text-xs py-1.5 px-3">
              <Download size={12} /> 下载
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
