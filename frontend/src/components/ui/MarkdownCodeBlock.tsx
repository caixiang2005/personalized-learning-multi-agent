/**
 * @file MarkdownCodeBlock.tsx
 * @description 豆包式代码块：语言标签 + 复制 / 换行 / 展开
 */
import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Check, ChevronDown, Copy, Maximize2, Minimize2, WrapText, X } from "lucide-react";

const LANG_LABELS: Record<string, string> = {
  python: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  powershell: "powershell",
  ps1: "powershell",
  json: "json",
  sql: "sql",
  html: "html",
  css: "css",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  rust: "rust",
  yaml: "yaml",
  yml: "yaml",
  markdown: "markdown",
  md: "markdown",
  text: "text",
};

function resolveLang(className?: string): string {
  const raw = className?.replace(/^language-/, "").trim().toLowerCase() || "text";
  return LANG_LABELS[raw] ?? raw;
}

interface Props {
  className?: string;
  children: ReactNode;
}

export default function MarkdownCodeBlock({ className, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lang = resolveLang(className);
  const codeText = String(children).replace(/\n$/, "");

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [codeText]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  const block = (
    <div className={`doubao-code-block ${expanded ? "doubao-code-block--expanded" : ""}`}>
      <div className="doubao-code-block__head">
        <button
          type="button"
          className="doubao-code-block__lang"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          <span>{lang}</span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`doubao-code-block__chevron ${collapsed ? "doubao-code-block__chevron--up" : ""}`}
          />
        </button>
        <div className="doubao-code-block__actions">
          <button type="button" onClick={copyCode} title="复制代码" aria-label="复制代码">
            {copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={2} />}
          </button>
          <button
            type="button"
            onClick={() => setWrap((v) => !v)}
            title={wrap ? "取消自动换行" : "自动换行"}
            aria-label="自动换行"
            className={wrap ? "doubao-code-block__action--active" : ""}
          >
            <WrapText size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "退出全屏" : "全屏查看"}
            aria-label={expanded ? "退出全屏" : "全屏查看"}
          >
            {expanded ? <Minimize2 size={15} strokeWidth={2} /> : <Maximize2 size={15} strokeWidth={2} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre className={`doubao-code-block__pre ${wrap ? "doubao-code-block__pre--wrap" : ""}`}>
          <code className={className}>{children}</code>
        </pre>
      )}
    </div>
  );

  if (expanded) {
    return (
      <div className="doubao-code-block-overlay" role="dialog" aria-modal="true" aria-label="代码全屏">
        <button
          type="button"
          className="doubao-code-block-overlay__close"
          onClick={() => setExpanded(false)}
          aria-label="关闭全屏"
        >
          <X size={18} />
        </button>
        {block}
      </div>
    );
  }

  return block;
}
