/**
 * @file ExerciseBank.tsx
 * @description 用户专属习题银行 — 查看所有历史练习记录，可重新作答
 * @route /exercise/bank
 * @backend GET /api/exercises
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, Brain, RefreshCw, Sparkles, BarChart3,
} from "lucide-react";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import { fetchMyExercises } from "../lib/api/learn";

interface ExerciseRecord {
  id: string;
  topicId: string;
  questions: { id: string; type: string; title: string }[];
  score: number | null;
  status: string;
  createdAt: string;
}

export default function ExerciseBank() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyExercises();
      if (res.code === 200 && Array.isArray(res.data)) {
        setExercises(res.data);
      } else {
        setError(res.msg || "获取失败");
      }
    } catch {
      setError("后端未就绪，请启动 learn-service(:8002)");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, [load]);

  const avgScore = exercises.length
    ? Math.round(exercises.reduce((s, e) => s + (e.score ?? 0), 0) / exercises.length)
    : 0;
  const doneCount = exercises.filter(e => e.status === "done").length;
  const totalQuestions = exercises.reduce((s, e) => s + (e.questions?.length ?? 0), 0);

  return (
    <ScholarDashboardLayout
      badge="习题银行"
      title="我的题库"
      subtitle={`${exercises.length} 次练习 · 平均 ${avgScore}%`}
      aside={
        <button type="button" className="btn-secondary text-sm" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> 刷新
        </button>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
          <button type="button" className="ml-auto text-xs underline" onClick={load}>重试</button>
        </div>
      )}

      {loading ? (
        <div className="section-card dash-panel flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--scholar-primary)]" />
          <span className="ml-3 text-sm text-[var(--scholar-text-muted)]">加载中…</span>
        </div>
      ) : exercises.length === 0 ? (
        <div className="section-card dash-panel flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList size={48} className="text-[var(--scholar-text-muted)] mb-4 opacity-40" />
          <h3 className="text-lg font-semibold mb-2">暂无练习记录</h3>
          <p className="text-sm text-[var(--scholar-text-muted)] mb-6">
            完成 AI 出题或路径中的练习题后，记录将保存在这里
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/exercise/ai-generate" className="btn-primary">
              <Sparkles size={16} /> AI 智能出题
            </Link>
            <Link to="/path" className="btn-secondary">
              去学习路径
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 统计 */}
          <AnimeStagger className="dash-stats mb-6" staggerMs={60} y={12} delay={70}>
            <div className="dash-stats__item">
              <ClipboardList size={16} strokeWidth={1.75} aria-hidden />
              <span className="dash-stats__num">{exercises.length}</span>
              <span className="dash-stats__label">练习次数</span>
            </div>
            <div className="dash-stats__item">
              <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />
              <span className="dash-stats__num">{doneCount}</span>
              <span className="dash-stats__label">已完成</span>
            </div>
            <div className="dash-stats__item">
              <Brain size={16} strokeWidth={1.75} aria-hidden />
              <span className="dash-stats__num">{totalQuestions}</span>
              <span className="dash-stats__label">总题数</span>
            </div>
            <div className="dash-stats__item">
              <BarChart3 size={16} strokeWidth={1.75} aria-hidden />
              <span className="dash-stats__num">{avgScore}%</span>
              <span className="dash-stats__label">平均分</span>
            </div>
          </AnimeStagger>

          {/* 练习列表 */}
          <div className="space-y-3">
            {exercises.map((ex, idx) => {
              const qCount = ex.questions?.length ?? 0;
              const done = ex.status === "done";
              return (
                <div key={ex.id} className="section-card flex items-center gap-4 hover:border-[var(--scholar-primary)]/30 transition-colors cursor-pointer" onClick={() => navigate(`/exercise/${ex.id}`)}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-800"
                  }`}>
                    {done ? (
                      <CheckCircle2 size={22} className="text-green-500" />
                    ) : (
                      <ClipboardList size={22} className="text-[var(--scholar-text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--scholar-text)]">
                      练习 #{exercises.length - idx}
                      {ex.topicId && ` · ${ex.topicId}`}
                    </p>
                    <p className="text-xs text-[var(--scholar-text-muted)] mt-0.5">
                      {qCount} 题 · {done ? `得分 ${ex.score}%` : "未完成"} · {ex.createdAt ? new Date(ex.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {done && ex.score !== null && (
                      <span className={`text-sm font-bold ${
                        ex.score >= 80 ? "text-green-500" : ex.score >= 60 ? "text-amber-500" : "text-red-500"
                      }`}>
                        {ex.score}%
                      </span>
                    )}
                    <ArrowRight size={16} className="text-[var(--scholar-text-muted)]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI 出题入口 */}
          <div className="section-card dash-panel mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--scholar-text)]">想要更多练习？</p>
              <p className="text-xs text-[var(--scholar-text-muted)] mt-0.5">AI 根据你的薄弱知识点生成定制题目</p>
            </div>
            <Link to="/exercise/ai-generate" className="btn-primary text-sm">
              <Sparkles size={15} /> AI 出题
            </Link>
          </div>
        </>
      )}
    </ScholarDashboardLayout>
  );
}
