import { BookOpen, Layers, ListOrdered, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ScanResult } from "../../types";

type Props = {
  result: ScanResult;
  analysisStream: string;
  analyzing: boolean;
};

export default function ScanResultPanel({ result, analysisStream, analyzing }: Props) {
  const analysis = analysisStream || result.analysis;

  return (
    <div className="space-y-4">
      <section className="scholar-card p-5">
        <h3 className="text-sm font-semibold text-[var(--scholar-text)] flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-[var(--scholar-primary)]" aria-hidden />
          OCR 识别结果
        </h3>
        <p className="text-sm leading-relaxed text-[var(--scholar-text-secondary)] whitespace-pre-wrap">
          {result.ocrText}
        </p>
      </section>

      <section className="scholar-card p-5">
        <h3 className="text-sm font-semibold text-[var(--scholar-text)] flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-[var(--scholar-primary)]" aria-hidden />
          AI 知识点解析
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {result.knowledgePoints.map((kp) => (
            <span
              key={kp}
              className="scholar-resource-pill scholar-resource-pill--document text-xs"
            >
              {kp}
            </span>
          ))}
        </div>
        <div className="markdown-body text-sm text-[var(--scholar-text-secondary)]">
          {analyzing && !analysis ? (
            <span className="text-[var(--scholar-text-muted)]">解析生成中…</span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          )}
        </div>
      </section>

      <section className="scholar-card p-5">
        <h3 className="text-sm font-semibold text-[var(--scholar-text)] flex items-center gap-2 mb-4">
          <ListOrdered size={16} className="text-[var(--scholar-primary)]" aria-hidden />
          逐步骤解析
        </h3>
        <ol className="space-y-3">
          {result.steps.map((step) => (
            <li
              key={step.order}
              className="flex gap-3 p-3 rounded-[10px] border border-[var(--scholar-border)] bg-[color-mix(in_srgb,var(--scholar-primary)_2%,var(--scholar-card))]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--scholar-primary)] text-white text-xs font-bold">
                {step.order}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--scholar-text)]">{step.title}</p>
                <p className="text-xs text-[var(--scholar-text-muted)] mt-1 leading-relaxed">
                  {step.content}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="scholar-card p-5">
        <h3 className="text-sm font-semibold text-[var(--scholar-text)] flex items-center gap-2 mb-4">
          <Layers size={16} className="text-[var(--scholar-accent)]" aria-hidden />
          自动生成同类题目
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.similarQuestions.map((q) => (
            <article
              key={q.id}
              className="p-4 rounded-[10px] border border-[var(--scholar-border)] hover:border-[color-mix(in_srgb,var(--scholar-primary)_35%,var(--scholar-border))] transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--scholar-accent)]">
                {q.difficulty}
              </span>
              <p className="text-sm font-medium text-[var(--scholar-text)] mt-2 leading-snug">
                {q.question}
              </p>
              <p className="text-xs text-[var(--scholar-text-muted)] mt-2">{q.knowledgePoint}</p>
              <button type="button" className="mt-3 text-xs font-medium text-[var(--scholar-primary)] cursor-pointer hover:underline">
                开始练习
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
