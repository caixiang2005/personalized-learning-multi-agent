/**
 * @file Scan.tsx
 * @description 拍照搜题：上传图片 + 输入题目 → AI 解析 → 结果展示
 * @route /scan
 * @backend POST /api/agent/scan (agent-service)
 */
import { useCallback, useState } from "react";
import { Loader2, ScanLine, AlertCircle, Camera, Send } from "lucide-react";
import ScanSidebar from "../components/scan/ScanSidebar";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import StreamProgress from "../components/scholar/StreamProgress";
import ScanUploadZone from "../components/scan/ScanUploadZone";
import ScanResultPanel from "../components/scan/ScanResultPanel";
import { getToken } from "../lib/auth/token";
import type { ScanResult, SimilarQuestion, ScanStep } from "../types";
const WORKFLOW = [
  "上传或拍摄题目图片",
  "输入题目文字",
  "AI 标注知识点并分步讲解",
  "自动生成同类巩固练习",
];
const QUESTION_TYPES = ["选择题", "填空题", "计算推导", "几何作图"];

function mapSimilarQuestions(raw: unknown): SimilarQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    const row = item as Record<string, unknown>;
    const difficulty = String(row.difficulty ?? "基础");
    const normalized =
      difficulty === "中等" || difficulty === "进阶" ? difficulty : "基础";
    return {
      id: String(row.id ?? `sq-${idx + 1}`),
      question: String(row.question ?? row.title ?? ""),
      difficulty: normalized as SimilarQuestion["difficulty"],
      knowledgePoint: String(row.knowledgePoint ?? row.knowledge_point ?? ""),
    };
  }).filter((q) => q.question);
}

function mapSteps(raw: unknown): ScanStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    const row = item as Record<string, unknown>;
    return {
      order: Number(row.order ?? idx + 1),
      title: String(row.title ?? `步骤 ${idx + 1}`),
      content: String(row.content ?? ""),
    };
  }).filter((s) => s.content);
}

async function scanImageApi(file: File, text: string): Promise<ScanResult & { ocrStatus: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (text.trim()) formData.append("text", text.trim());
  const token = getToken();
  const res = await fetch("/api/agent/scan", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    signal: AbortSignal.timeout(180000),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.msg || "识别失败");
  const data = json.data ?? {};
  return {
    ocrText: data.ocr_text ?? "",
    analysis: data.ai_analysis ?? "",
    knowledgePoints: Array.isArray(data.knowledge_points)
      ? data.knowledge_points.map(String)
      : [],
    steps: mapSteps(data.steps),
    similarQuestions: mapSimilarQuestions(data.similar_questions),
    ocrStatus: data.ocr_status ?? "disabled",
  };
}

export default function Scan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [textInput, setTextInput] = useState("");
  const [statusText, setStatusText] = useState("");

  const handleFile = useCallback((file: File) => {
    if (busy) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setError(null);
    // 只预览，等用户点「分析」再请求（避免未填题干就卡在 OCR）
  }, [busy]);

  const runAnalyze = useCallback(async () => {
    if (busy) return;
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("请先上传题目图片");
      return;
    }
    if (!getToken()) {
      setError("登录已失效，请重新登录后再试");
      return;
    }

    setBusy(true);
    setProgress(0);
    setStatusText(textInput.trim() ? "AI 分析中…" : "OCR 识别并分析中…");
    setError(null);
    setResult(null);

    try {
      const progressTimer = setInterval(() => {
        setProgress((p) => (p !== null && p < 85 ? p + 5 : p));
      }, 400);

      const data = await scanImageApi(file, textInput);
      clearInterval(progressTimer);
      setProgress(100);

      setResult({
        ocrText: data.ocrText || textInput,
        knowledgePoints: data.knowledgePoints,
        analysis: data.analysis,
        steps: data.steps,
        similarQuestions: data.similarQuestions,
      });
      if (data.ocrStatus?.startsWith("error") && !data.ocrText && !textInput.trim()) {
        setError("OCR 未识别到文字，请在下方输入题目后再点分析");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "识别失败";
      setError(msg.includes("登录") ? "登录已失效，请重新登录后再试" : msg);
    } finally {
      setBusy(false);
      setProgress(null);
      setStatusText("");
    }
  }, [busy, textInput]);

  return (
    <ScholarDashboardLayout
      badge="多模态 · 拍照搜题"
      title="拍照搜题"
      subtitle="上传题目图片或输入文字，AI 帮你解析"
      sidebar={<ScanSidebar />}
    >
      <ScanUploadZone preview={preview} disabled={busy} onFile={handleFile} />

      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* 手动输入区 */}
      {preview && (
        <div className="section-card dash-panel mt-4">
          <label className="block text-sm font-medium text-[var(--scholar-text)] mb-1.5">
            题目文字
          </label>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="可选：手动输入题干（OCR 不准时建议填写）"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && preview && !busy) {
                  e.preventDefault();
                  void runAnalyze();
                }
              }}
              disabled={busy}
            />
            <button
              type="button"
              className="btn-primary text-sm shrink-0"
              disabled={busy}
              onClick={() => void runAnalyze()}
            >
              <Send size={14} /> 分析
            </button>
          </div>
          <p className="text-[10px] text-[var(--scholar-text-muted)] mt-1">
            上传图片后点击「分析」；若 OCR 较慢或不准，可先填写题目文字再分析
          </p>
        </div>
      )}

      {!result && !busy && !preview && (
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
                上传后系统将自动识别文字，AI 标注知识点并分步讲解，同时生成同类巩固练习。
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
            {statusText || "处理中…"}
          </div>
          {progress !== null && (
            <StreamProgress progress={progress} label={statusText || "处理中"} />
          )}
        </div>
      )}

      {result && (
        <div className="mt-6">
          {result.ocrText && (
            <div className="section-card dash-panel mb-4">
              <h3 className="text-sm font-semibold text-[var(--scholar-text)] mb-2 flex items-center gap-2">
                <Camera size={15} /> 题目文字
              </h3>
              <pre className="text-sm text-[var(--scholar-text-secondary)] whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                {result.ocrText}
              </pre>
            </div>
          )}

          <ScanResultPanel
            result={result}
            analysisStream={result.analysis}
            analyzing={false}
          />
        </div>
      )}
    </ScholarDashboardLayout>
  );
}
