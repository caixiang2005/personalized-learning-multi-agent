/**
 * @file ResourceDetail.tsx
 * @description 资源详情（文档 / 导图 / 视频 / 实操）。练习题类型会重定向到 /exercise/:id。
 * @route /resource/:id
 *
 * 【当前 Mock】findResourceById 从 store.pathStages 查找；正文为组件内默认 Markdown。
 * 【待同步后端】fetchResourceDetail(id) 返回 content、mermaid、videoUrl 等，替换本地查找与占位文案
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import MarkdownContent from "../components/ui/MarkdownContent";
import { useAppStore } from "../store/useAppStore";
import { findResourceById, findTopicNameByResourceId } from "../lib/resources";

const typeLabel: Record<string, string> = {
  document: "文档笔记",
  mindmap: "思维导图",
  exercise: "练习题",
  video: "视频讲解",
  practice: "实操案例",
};

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathStages = useAppStore((s) => s.pathStages);

  // 【待同步后端】useEffect → fetchResourceDetail(id)，setState 展示接口返回
  const resource = id ? findResourceById(pathStages, id) : null;
  const topicName = id ? findTopicNameByResourceId(pathStages, id) : "";

  if (!resource) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">未找到该资源</p>
        <button type="button" className="btn-primary mt-4" onClick={() => navigate("/path")}>
          返回学习路径
        </button>
      </div>
    );
  }

  // 练习题类型跳转到答题页
  if (resource.type === "exercise") {
    navigate(`/exercise/${resource.id}`, { replace: true });
    return null;
  }

  const docContent =
    resource.content ??
    `## ${resource.title}\n\n${resource.description}\n\n### 知识要点\n\n1. 核心概念梳理\n2. 典型例题分析\n3. 易错点提醒\n\n> 参考资料：课程讲义第 3 章`;

  return (
    <ScholarPageShell maxWidth="4xl">
      <button type="button" onClick={() => navigate(-1)} className="btn-secondary mb-4 text-sm">
        <ArrowLeft size={16} /> 返回
      </button>

      <ScholarPageHeader
        badge="资源详情"
        title={resource.title}
        subtitle={`${topicName} · ${typeLabel[resource.type] ?? resource.type}`}
        action={
          <button type="button" className="btn-secondary">
            <Download size={16} /> 导出
          </button>
        }
      />

      <div className="section-card mb-4 flex items-center gap-2 text-xs text-accent">
        <ShieldCheck size={14} /> 内容已校验
      </div>

      {resource.mermaid && (
        <div className="section-card mb-6">
          <h3 className="font-semibold mb-3">思维导图</h3>
          <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-mono overflow-x-auto border">
            {resource.mermaid}
          </pre>
          <p className="text-xs text-gray-400 mt-2">【对接后端】可改为 Mermaid 渲染组件或后端返回的图片 URL</p>
        </div>
      )}

      {resource.type === "video" && (
        <div className="section-card mb-6 aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-gray-400 text-sm">
          视频播放器占位 — 【对接后端】嵌入 videoUrl
        </div>
      )}

      {resource.type === "practice" && (
        <div className="section-card mb-6">
          <p className="text-sm text-gray-500 mb-3">代码实操区占位</p>
          <pre className="p-4 bg-gray-900 text-green-400 rounded-xl text-sm">{`// 示例代码\nfunction traverse(root) {\n  if (!root) return;\n  // ...\n}`}</pre>
        </div>
      )}

      {(resource.type === "document" || resource.type === "mindmap") && (
        <div className="section-card">
          <MarkdownContent content={docContent} />
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/chat" className="btn-primary">
          在对话中继续提问
        </Link>
        <Link to="/path" className="btn-secondary">
          回到学习路径
        </Link>
      </div>
    </ScholarPageShell>
  );
}
