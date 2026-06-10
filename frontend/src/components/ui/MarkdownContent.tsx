/**
 * @file MarkdownContent.tsx
 * @description Markdown 渲染：B 站视频卡片、外链、豆包式代码块工具栏
 */
import { useMemo } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ExternalLink } from "lucide-react";
import BilibiliVideoCard from "../chat/BilibiliVideoCard";
import DoubaoNote, { isProseNote } from "./DoubaoNote";
import MarkdownCodeBlock from "./MarkdownCodeBlock";
import {
  groupVideoSegments,
  splitMarkdownWithVideos,
} from "../../lib/parseBilibiliVideos";

function resolveLinkLabel(href: string | undefined, children: ReactNode): ReactNode {
  const text = String(children ?? "").trim();
  if (text && text !== href && !/^https?:\/\//i.test(text)) return children;
  if (!href) return children ?? "链接";
  try {
    const u = new URL(href);
    if (u.hostname.includes("bilibili.com")) return "B站视频";
    return u.hostname.replace(/^www\./, "");
  } catch {
    return text || "外部链接";
  }
}

function MarkdownLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && /bilibili\.com\/video\//i.test(href)) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="markdown-link"
      title={href ? `${href}（新窗口打开）` : undefined}
      {...rest}
    >
      {resolveLinkLabel(href, children)}
      <ExternalLink className="markdown-link__icon" size={12} strokeWidth={2} aria-hidden />
    </a>
  );
}

function MarkdownPre({ children }: { children?: ReactNode }) {
  const child = Array.isArray(children) ? children[0] : children;
  if (
    child &&
    typeof child === "object" &&
    "props" in child &&
    child.props &&
    typeof child.props === "object" &&
    "className" in child.props
  ) {
    const props = child.props as { className?: string; children?: ReactNode };
    const codeText = String(props.children ?? "").replace(/\n$/, "");
    if (isProseNote(props.className, codeText)) {
      return <DoubaoNote>{codeText}</DoubaoNote>;
    }
    return (
      <MarkdownCodeBlock className={props.className}>
        {props.children}
      </MarkdownCodeBlock>
    );
  }

  const codeText = String(children ?? "").replace(/\n$/, "");
  if (isProseNote(undefined, codeText)) {
    return <DoubaoNote>{codeText}</DoubaoNote>;
  }

  return (
    <MarkdownCodeBlock className="language-text">
      {children}
    </MarkdownCodeBlock>
  );
}

function MarkdownBlockquote({ children }: { children?: ReactNode }) {
  return <DoubaoNote>{children}</DoubaoNote>;
}

const markdownComponents: Components = {
  a: MarkdownLink,
  pre: MarkdownPre,
  blockquote: MarkdownBlockquote,
};

export default function MarkdownContent({ content }: { content: string }) {
  const grouped = useMemo(() => {
    const segments = splitMarkdownWithVideos(content);
    return groupVideoSegments(segments);
  }, [content]);

  return (
    <div className="markdown-body text-sm text-gray-700 dark:text-gray-300">
      {grouped.map((seg, i) => {
        if (seg.type === "video-grid") {
          return (
            <div key={`grid-${i}`} className="bili-video-grid">
              {seg.videos.map((video) => (
                <BilibiliVideoCard key={video.bvid + video.url} video={video} />
              ))}
            </div>
          );
        }

        if (seg.type === "markdown") {
          const md = seg.content.trim();
          if (!md) return null;

          return (
            <ReactMarkdown
              key={`md-${i}`}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {seg.content}
            </ReactMarkdown>
          );
        }

        return null;
      })}
    </div>
  );
}
