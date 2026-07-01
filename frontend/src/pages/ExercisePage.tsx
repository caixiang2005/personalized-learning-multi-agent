/**
 * @file ExercisePage.tsx
 * @description 在线练习：AI 出题、作答提交、AI 批改、画像同步
 * @route /exercise/:id
 * @backend GET /api/exercises/:id · POST …/submit · POST …/sync-profile · POST …/generate
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle, Sparkles,
  Brain, RefreshCw, BookOpen, MessageSquare, RotateCcw,
} from "lucide-react";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import MultiAgentPipeline, { type AgentStage } from "../components/chat/MultiAgentPipeline";
import { fetchExercise, submitExerciseApi, generateExerciseApi, aiReviewExerciseApi, saveExerciseResultApi, syncExerciseProfileApi } from "../lib/api/learn";
import { ApiClientError } from "../lib/api/client";
import { findResourceById } from "../lib/resources";
import { applyExerciseProfilePatch } from "../lib/profileSync";
import { useAppStore } from "../store/useAppStore";

interface Question {
  id: string;
  type: "choice" | "fill";
  title: string;
  options?: string[];
  correctAnswer?: string;
  answer?: string;
  explanation?: string;
}

interface AiReviewResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  mistakeReason?: string;
  knowledgePoint?: string;
}

interface ExerciseData {
  id: string;
  topicId: string;
  questions: Question[];
  status: string;
}

function renderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

function computeScore(questions: Question[], answers: Record<string, string>): number {
  if (!questions.length) return 0;
  let correct = 0;
  questions.forEach((q) => {
    const userAns = answers[q.id]?.trim().toLowerCase() ?? "";
    const correctAns = (q.correctAnswer ?? q.answer ?? "").trim().toLowerCase();
    if (userAns && correctAns && userAns === correctAns) correct++;
  });
  return Math.round((correct / questions.length) * 100);
}

function buildLocalAiReview(
  questions: Question[],
  answers: Record<string, string>
): AiReviewResult[] {
  return questions.map((q) => {
    const userAns = answers[q.id]?.trim() ?? "";
    const correctAns = (q.correctAnswer ?? q.answer ?? "").trim();
    const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();
    return {
      questionId: q.id,
      isCorrect,
      userAnswer: userAns,
      correctAnswer: correctAns,
      explanation: q.explanation ?? "无详细解析",
      mistakeReason: isCorrect ? undefined : "答案不匹配",
      knowledgePoint: q.title,
    };
  });
}

export default function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathStages = useAppStore((s) => s.pathStages);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const resource = id && id !== "ai-generate" ? findResourceById(pathStages, id) : null;

  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiReview, setAiReview] = useState<AiReviewResult[] | null>(null);
  const loadedRef = useRef(false);
  const generatingRef = useRef(false);
  const [aiReviewing, setAiReviewing] = useState(false);

  // AI 出题
  const [generating, setGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<Question[] | null>(null);
  const [agentStages, setAgentStages] = useState<AgentStage[]>([]);

  // 是否是 AI 出题模式
  const isAiGenerate = id === "ai-generate";

  // 加载练习题库
  const loadExercise = useCallback(async () => {
    if (!id || isAiGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchExercise(id);
      if (res.code === 200) {
        setExerciseData(res.data);
      } else {
        setError(res.msg);
      }
    } catch {
      setError("后端未就绪，请启动 learn-service");
    } finally {
      setLoading(false);
    }
  }, [id, isAiGenerate]);

  useEffect(() => {
    if (!isAiGenerate) {
      if (loadedRef.current) return;
      loadedRef.current = true;
      loadExercise();
    } else {
      setLoading(false);
    }
  }, [loadExercise, isAiGenerate]);

  // AI 生成题目
  const handleAiGenerate = async () => {
    if (generatingRef.current) return; // 防止双击 / StrictMode 重复调用
    generatingRef.current = true;
    setGenerating(true);
    setAiQuestions(null);
    setSubmitted(false);
    setScore(null);
    setAiReview(null);
    setAnswers({});

    // 启动多 Agent 流水线
    setAgentStages([
      { id: "profile", name: "画像分析", icon: Brain, status: "processing", detail: "读取学习特征" },
      { id: "exercise", name: "题库生成", icon: BookOpen, status: "idle" },
      { id: "review", name: "内容审核", icon: CheckCircle, status: "idle" },
    ]);

    try {
      // 模拟画像分析完成
      await new Promise(r => setTimeout(r, 600));
      setAgentStages(prev => prev.map(s => s.id === "profile" ? { ...s, status: "done" as const } : s));
      setAgentStages(prev => prev.map(s => s.id === "exercise" ? { ...s, status: "processing" as const, detail: "生成练习题" } : s));

      const weakPoints = profile.weakPoints.map(w => w.name);
      const res = await generateExerciseApi({
        user_input: `${profile.major} ${profile.goal}`,
        weak_points: weakPoints.length > 0 ? weakPoints : undefined,
        count: 5,
        difficulty: "medium",
      });

      if (res.code === 200 && res.data?.questions?.length > 0) {
        setAiQuestions(res.data.questions);
        setAgentStages(prev => prev.map(s => s.id === "exercise" ? { ...s, status: "done" as const } : s));
        setAgentStages(prev => prev.map(s => s.id === "review" ? { ...s, status: "processing" as const, detail: "审核题目质量" } : s));
        await new Promise(r => setTimeout(r, 400));
        setAgentStages(prev => prev.map(s => s.id === "review" ? { ...s, status: "done" as const } : s));
      } else {
        throw new Error(res.msg || "生成失败");
      }
    } catch (err) {
      setAgentStages(prev => prev.map(s =>
        s.status === "processing" ? { ...s, status: "error" as const, detail: err instanceof Error ? err.message : "生成失败" } : s
      ));
      const apiMsg = err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "AI 出题失败";
      const hint =
        err instanceof ApiClientError && err.code === 401
          ? "学习服务未识别登录态（请确认 learn-service 已启动且 Redis 可用）"
          : apiMsg;
      setError(`${hint} · 已使用本地题目`);
      // 使用本地备选题
      setAiQuestions([
        { id: "q1", type: "choice", title: "栈的特点是？", options: ["FIFO", "LIFO", "随机存取", "双向"], correctAnswer: "LIFO", explanation: "栈是后进先出（LIFO）的数据结构" },
        { id: "q2", type: "fill", title: "二叉树前序遍历顺序：根 → ___ → 右", correctAnswer: "左", explanation: "前序遍历顺序为：根节点 → 左子树 → 右子树" },
        { id: "q3", type: "choice", title: "以下哪种排序算法平均时间复杂度为 O(n log n)？", options: ["冒泡排序", "插入排序", "快速排序", "选择排序"], correctAnswer: "快速排序", explanation: "快速排序的平均时间复杂度为 O(n log n)" },
        { id: "q4", type: "fill", title: "链表相比数组的主要优点是 ___ 操作高效", correctAnswer: "插入删除", explanation: "链表在插入和删除操作上比数组更高效" },
      ]);
    } finally {
      setGenerating(false);
      generatingRef.current = false;
      // 3 秒后自动隐藏流水线
      setTimeout(() => setAgentStages([]), 3000);
    }
  };

  // 计算使用的题目列表
  const questions = aiQuestions ?? exerciseData?.questions ?? [];
  const resourceTitle = resource?.title ?? (isAiGenerate ? "AI 智能出题" : "练习题");
  const resourceDesc = resource?.description ?? (isAiGenerate ? "AI 根据你的画像和薄弱点自动生成" : "完成题目后提交批改");

  // 提交答案
  const handleSubmit = async () => {
    if (!id || questions.length === 0) return;
    setSubmitting(true);

    const answerList = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    const localScore = computeScore(questions, answers);
    setScore(localScore);

    const mergeProfile = (raw: unknown) => {
      const patch = applyExerciseProfilePatch(raw as Record<string, unknown>);
      if (patch) setProfile(patch);
    };

    let reviewResults: AiReviewResult[];
    let finalScore = localScore;

    try {
      setAiReviewing(true);
      try {
        const res = await aiReviewExerciseApi(
          id ?? "ai-generate",
          questions as unknown as Record<string, unknown>[],
          answerList as Record<string, unknown>[]
        );
        if (res.code === 200 && res.data?.results?.length) {
          reviewResults = res.data.results as AiReviewResult[];
          setAiReview(reviewResults);
          const correct = reviewResults.filter((r) => r.isCorrect).length;
          finalScore = Math.round((correct / reviewResults.length) * 100);
          setScore(finalScore);
        } else {
          reviewResults = buildLocalAiReview(questions, answers);
          setAiReview(reviewResults);
        }
      } catch {
        reviewResults = buildLocalAiReview(questions, answers);
        setAiReview(reviewResults);
      } finally {
        setAiReviewing(false);
      }

      const profilePayload = {
        score: finalScore,
        questions: questions as unknown as Record<string, unknown>[],
        answers: answerList as unknown as Record<string, unknown>[],
        ai_review: reviewResults as unknown as Record<string, unknown>[],
        topic_id: exerciseData?.topicId ?? "",
      };

      if (isAiGenerate) {
        const saveRes = await saveExerciseResultApi({
          questions: profilePayload.questions,
          answers: profilePayload.answers,
          score: finalScore,
          topic_id: profilePayload.topic_id,
          title: resourceTitle,
          ai_review: profilePayload.ai_review,
        });
        if (saveRes.code === 200 && saveRes.data?.profile) {
          mergeProfile(saveRes.data.profile);
        } else {
          const syncRes = await syncExerciseProfileApi(profilePayload);
          if (syncRes.code === 200) mergeProfile(syncRes.data?.profile);
        }
      } else {
        const submitRes = await submitExerciseApi(
          id,
          answerList as unknown as Record<string, string>[],
          profilePayload.ai_review,
        );
        if (submitRes.code === 200 && submitRes.data?.profile) {
          mergeProfile(submitRes.data.profile);
        } else {
          const syncRes = await syncExerciseProfileApi(profilePayload);
          if (syncRes.code === 200) mergeProfile(syncRes.data?.profile);
        }
      }
    } catch {
      setScore(localScore);
      reviewResults = buildLocalAiReview(questions, answers);
      setAiReview(reviewResults);
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setAiReview(null);
    setError(null);
  };

  if (loading) {
    return (
      <ScholarDashboardLayout badge="在线练习" title="加载中…" subtitle="">
        {renderSkeleton()}
      </ScholarDashboardLayout>
    );
  }

  if (!resource && !exerciseData && !aiQuestions && !isAiGenerate) {
    return (
      <div className="page-container text-center py-20">
        <AlertCircle size={32} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">练习不存在</p>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <button type="button" className="btn-primary" onClick={() => navigate("/path")}>
            返回学习路径
          </button>
          <button type="button" className="btn-secondary" onClick={handleAiGenerate}>
            <Sparkles size={16} /> AI 智能出题
          </button>
        </div>
      </div>
    );
  }

  const correctCount = aiReview ? aiReview.filter(r => r.isCorrect).length :
    score !== null ? Math.round(score / 100 * questions.length) : 0;

  return (
    <ScholarDashboardLayout
      badge={isAiGenerate ? "AI 智能出题" : "在线练习"}
      title={resourceTitle}
      subtitle={resourceDesc}
      aside={
        <div className="flex flex-wrap gap-2 justify-end">
          {isAiGenerate && (
            <button type="button" className="btn-secondary text-sm" onClick={handleAiGenerate} disabled={generating}>
              <RefreshCw size={15} className={generating ? "animate-spin" : ""} /> 重新出题
            </button>
          )}
          <button type="button" className="btn-secondary text-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> 返回
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ {error}
        </div>
      )}

      {/* AI 出题入口 */}
      {!isAiGenerate && !exerciseData && !aiQuestions && (
        <section className="section-card dash-panel text-center py-8">
          <Sparkles size={32} className="mx-auto mb-3 text-[var(--scholar-primary)]" />
          <h3 className="text-lg font-semibold mb-2">AI 智能出题</h3>
          <p className="text-sm text-[var(--scholar-text-muted)] mb-6">
            根据你的学习画像和薄弱知识点，AI 自动生成针对性练习题
          </p>
          <button type="button" className="btn-primary" onClick={handleAiGenerate} disabled={generating}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "生成中…" : "开始 AI 出题"}
          </button>
        </section>
      )}

      {/* AI 出题入口（已有题目时） */}
      {isAiGenerate && !aiQuestions && !generating && (
        <section className="section-card dash-panel text-center py-8">
          <Brain size={32} className="mx-auto mb-3 text-[var(--scholar-primary)]" />
          <h3 className="text-lg font-semibold mb-2">AI 智能出题</h3>
          <p className="text-sm text-[var(--scholar-text-muted)] mb-4">
            点击下方按钮，AI 将根据你的学习画像和薄弱知识点生成 5 道练习题
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-[var(--scholar-text-muted)] mb-6">
            {profile.weakPoints.slice(0, 3).map(w => (
              <span key={w.name} className="px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                薄弱：{w.name}
              </span>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={handleAiGenerate}>
            <Sparkles size={16} /> 开始 AI 出题
          </button>
        </section>
      )}

      {/* 多智能体流水线 */}
      {agentStages.length > 0 && (
        <div className="section-card dash-panel mb-4">
          <MultiAgentPipeline stages={agentStages} title="多智能体协同" />
        </div>
      )}

      {/* 生成中 */}
      {generating && !aiQuestions && (
        <div className="section-card dash-panel text-center py-8">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-[var(--scholar-primary)]" />
          <p className="text-sm text-[var(--scholar-text-muted)]">AI 正在根据你的学习画像生成练习题…</p>
        </div>
      )}

      {/* 题目列表 */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const review = aiReview?.find(r => r.questionId === q.id);
            return (
              <div key={q.id} className="section-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white mb-3">
                    {idx + 1}. {q.title}
                    {q.type === "fill" && <span className="text-xs text-[var(--scholar-accent)] ml-2">[填空题]</span>}
                    {q.type === "choice" && <span className="text-xs text-[var(--scholar-primary)] ml-2">[选择题]</span>}
                  </p>
                </div>

                {q.type === "choice" && q.options ? (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label key={opt} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                        submitted && review
                          ? opt === review.correctAnswer
                            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                            : answers[q.id] === opt && !review.isCorrect
                              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary/40"
                      }`}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          disabled={submitted || submitting || generating}
                          className="accent-[var(--scholar-primary)]"
                        />
                        <span className="text-sm">{opt}</span>
                        {submitted && review && opt === review.correctAnswer && (
                          <CheckCircle size={14} className="text-green-500 shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className={`input-field ${submitted && review ? (
                      review.isCorrect ? "border-green-400" : "border-red-400"
                    ) : ""}`}
                    placeholder="请输入答案"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    disabled={submitted || submitting || generating}
                  />
                )}

                {/* AI 批改反馈 */}
                {submitted && review && (
                  <div className={`mt-3 p-3 rounded-xl text-sm ${
                    review.isCorrect
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  }`}>
                    <p className="font-medium mb-1">
                      {review.isCorrect ? "✓ 正确" : "✗ 错误"}
                    </p>
                    {!review.isCorrect && review.mistakeReason && (
                      <p className="text-xs mb-1">错因：{review.mistakeReason}</p>
                    )}
                    <p className="text-xs opacity-80">解析：{review.explanation}</p>
                    {review.knowledgePoint && (
                      <p className="text-xs mt-1 opacity-70">知识点：{review.knowledgePoint}</p>
                    )}
                  </div>
                )}

                {/* 基础批改（无 AI 时） */}
                {submitted && !aiReview && (
                  <p className={`mt-2 text-sm ${
                    answers[q.id]?.trim().toLowerCase() === (q.correctAnswer ?? q.answer ?? "").trim().toLowerCase()
                      ? "text-green-600" : "text-red-500"
                  }`}>
                    {answers[q.id]?.trim().toLowerCase() === (q.correctAnswer ?? q.answer ?? "").trim().toLowerCase()
                      ? "✓ 正确" : `参考答案：${q.correctAnswer ?? q.answer ?? ""}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 得分 + AI 批改摘要 */}
      {submitted && score !== null && (
        <div className="mt-6 space-y-4">
          <div className="section-card flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
              score >= 80 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
              score >= 60 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
              "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {score}%
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {score >= 80 ? "优秀！" : score >= 60 ? "继续加油！" : "需要多练习"}
              </p>
              <p className="text-sm text-gray-500">
                {correctCount}/{questions.length} 题正确 · 掌握度已同步至学习画像
              </p>
              {profile.weakPoints.length > 0 && (
                <p className="text-xs text-[var(--scholar-text-muted)] mt-1">
                  薄弱点：{profile.weakPoints.slice(0, 3).map((w) => `${w.name}(${w.count})`).join(" · ")}
                </p>
              )}
              {aiReviewing && (
                <p className="text-xs text-[var(--scholar-primary)] mt-1 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> AI 正在生成详细批改…
                </p>
              )}
            </div>
          </div>

          {aiReview && (
            <div className="section-card dash-panel">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--scholar-primary)]" />
                AI 智能批改报告
              </h3>
              <div className="space-y-3">
                {aiReview.map((r) => (
                  <div key={r.questionId} className={`p-3 rounded-xl text-sm ${
                    r.isCorrect
                      ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {r.isCorrect ? "✓" : "✗"} {r.knowledgePoint || `题目 ${r.questionId}`}
                      </span>
                      <span className="text-xs opacity-70">你的答案：{r.userAnswer || "未作答"}</span>
                    </div>
                    <p className="text-xs opacity-80">{r.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-6 flex flex-wrap gap-3">
        {!submitted ? (
          <>
            <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting || generating || questions.length === 0}>
              {submitting ? <><Loader2 size={16} className="animate-spin" /> 提交中...</> : "提交答卷"}
            </button>
            {isAiGenerate && (
              <button type="button" className="btn-secondary" onClick={handleAiGenerate} disabled={generating}>
                <RefreshCw size={15} className={generating ? "animate-spin" : ""} /> 重新出题
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn-primary" onClick={() => navigate("/profile")}>
              <Brain size={16} /> 查看画像更新
            </button>
            <button type="button" className="btn-secondary" onClick={handleRetry}>
              <RotateCcw size={15} /> 重新作答
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/chat")}>
              <MessageSquare size={15} /> 向 AI 提问
            </button>
            <Link to="/path" className="btn-secondary no-underline">
              <BookOpen size={15} /> 继续学习路径
            </Link>
          </>
        )}
      </div>
    </ScholarDashboardLayout>
  );
}
