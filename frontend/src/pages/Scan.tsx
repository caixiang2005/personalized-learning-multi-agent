/**
 * @file Scan.tsx
 * @description 拍照搜题：OCR → AI 解析 → 逐步骤讲解 → 同类题生成
 * @route /scan
 */
import { useCallback, useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import ScanSidebar from "../components/scan/ScanSidebar";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import StreamProgress from "../components/scholar/StreamProgress";
import ScanUploadZone from "../components/scan/ScanUploadZone";
import ScanResultPanel from "../components/scan/ScanResultPanel";
import { runScanPipeline, type ScanPhase } from "../lib/mockScan";
import type { ScanResult } from "../types";

const phaseLabel: Record<ScanPhase, string> = {
  idle: "",
  ocr: "OCR 识别题目中",
  analyze: "AI 解析知识点",
  generate: "生成同类练习题",
  done: "完成",
};

const WORKFLOW = [
  "上传或拍摄题目图片",
  "OCR 识别文字与公式",
  "AI 标注知识点并分步讲解",
  "自动生成同类巩固练习",
];

const QUESTION_TYPES = ["选择题", "填空题", "计算推导", "几何作图"];

export default function Scan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [analysisStream, setAnalysisStream] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (busy) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setAnalysisStream("");
    setBusy(true);
    setProgress(0);

    try {
      const data = await runScanPipeline(
        (p, pct) => {
          setPhase(p);
          setProgress(p === "done" ? null : pct);
        },
        setAnalysisStream
      );
      setResult(data);
    } finally {
      setBusy(false);
      setPhase("done");
      setProgress(null);
    }
  }, [busy]);

  const statusLabel = phase !== "idle" && phase !== "done" ? phaseLabel[phase] : null;

  return (
    <ScholarDashboardLayout
      badge="多模态 · 拍照搜题"
      title="拍照搜题"
      subtitle="上传题目图片，OCR 识别后由 AI 解析知识点、逐步讲解并生成同类练习"
      sidebar={<ScanSidebar />}
    >
      <ScanUploadZone preview={preview} disabled={busy} onFile={handleFile} />

      {!result && !busy && (
        <section className="section-card dash-panel mt-4">
          <h2 className="dash-panel__title">识别流程与适用题型</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--scholar-text)] mb-3">识别流程</h3>
              <ol className="dash-sidebar-workflow">
                {WORKFLOW.map((step, i) => (
                  <li key={step}>
                    <span className="dash-sidebar-workflow__num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--scholar-text)] mb-3">适用题型</h3>
              <div className="dash-sidebar-tags mb-4">
                {QUESTION_TYPES.map((t) => (
                  <span key={t} className="dash-sidebar-tag">{t}</span>
                ))}
              </div>
              <p className="dash-panel__desc">
                上传后系统将自动识别文字与公式，标注知识点并分步讲解，同时生成同类巩固练习。
              </p>
            </div>
          </div>
        </section>
      )}

      {busy && (
        <div className="section-card dash-panel p-4 mt-4" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-[var(--scholar-text-secondary)] mb-2">
            <Loader2 size={16} className="animate-spin text-[var(--scholar-primary)]" />
            <ScanLine size={16} className="text-[var(--scholar-accent)]" aria-hidden />
            {statusLabel ?? "处理中…"}
          </div>
          {progress !== null && (
            <StreamProgress progress={progress} label={statusLabel ?? "处理中"} />
          )}
        </div>
      )}

      {result && (
        <div className="mt-6 animate-[fade-in_0.4s_ease-out]">
          <ScanResultPanel
            result={result}
            analysisStream={analysisStream}
            analyzing={busy && phase === "analyze"}
          />
        </div>
      )}
    </ScholarDashboardLayout>
  );
}
