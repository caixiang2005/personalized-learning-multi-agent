/**
 * @file MarkdownContent.tsx
 * @description 将 Markdown 字符串渲染为 HTML（笔记、助手回复、资源正文）。
 * @backend 正文内容来自接口返回的 content 字段，前端不做二次生成
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-body text-sm text-gray-700 dark:text-gray-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
