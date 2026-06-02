/**
 * @file Scan.tsx
 * @description 拍照搜题：OCR → AI 解析 → 逐步骤讲解 → 同类题生成
 * @route /scan
 */
import { useCallback, useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
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
    <ScholarPageShell maxWidth="4xl">
      <ScholarPageHeader
        badge="多模态 · 拍照搜题"
        title="拍照搜题"
        subtitle="上传题目图片，OCR 识别后由 AI 解析知识点、逐步讲解并生成同类练习"
      />

      <ScanUploadZone preview={preview} disabled={busy} onFile={handleFile} />

      {busy && (
        <div className="scholar-card p-4 mt-4" role="status" aria-live="polite">
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
    </ScholarPageShell>
  );
}
