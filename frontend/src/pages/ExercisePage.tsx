/**
 * @file ExercisePage.tsx
 * @description 在线练习答题与提交批改。
 * @route /exercise/:id
 *
 * 【当前 Mock】题目为页面内 mockQuestions；提交后本地算分，不更新服务端画像。
 * 【待同步后端】
 *   - 进入：fetchExercise(id) 拉题目
 *   - 提交：submitExercise(id, answers) 用得分解析，并同步画像（或再调 fetchProfile）
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import { findResourceById } from "../lib/resources";
import { useAppStore } from "../store/useAppStore";

/** 演示题目，联调后由 fetchExercise 返回 */
const mockQuestions = [
  { id: "q1", type: "choice", title: "栈的特点是？", options: ["FIFO", "LIFO", "随机存取", "双向"], answer: "LIFO" },
  { id: "q2", type: "fill", title: "二叉树前序遍历顺序：根 → ___ → 右", answer: "左" },
];

export default function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathStages = useAppStore((s) => s.pathStages);
  const resource = id ? findResourceById(pathStages, id) : null;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // 【待同步后端】const result = await submitExercise(id!, answers);
    await new Promise((r) => setTimeout(r, 800));
    let correct = 0;
    mockQuestions.forEach((q) => {
      if (answers[q.id]?.trim() === q.answer) correct++;
    });
    setScore(Math.round((correct / mockQuestions.length) * 100));
    setSubmitted(true);
    setLoading(false);
    // 【对接后端】提交成功后刷新画像：fetchProfile() 或后端在 submit 响应中返回更新后的掌握度
  };

  if (!resource) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">练习不存在</p>
        <button type="button" className="btn-primary mt-4" onClick={() => navigate("/path")}>
          返回学习路径
        </button>
      </div>
    );
  }

  return (
    <ScholarPageShell maxWidth="4xl">
      <button type="button" onClick={() => navigate(-1)} className="btn-secondary mb-4 text-sm">
        <ArrowLeft size={16} /> 返回
      </button>

      <ScholarPageHeader badge="在线练习" title={resource.title} subtitle={resource.description} />

      <div className="space-y-6">
        {mockQuestions.map((q, idx) => (
          <div key={q.id} className="section-card">
            <p className="font-medium text-gray-900 dark:text-white mb-3">
              {idx + 1}. {q.title}
            </p>
            {q.type === "choice" && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/40">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      disabled={submitted}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="input-field"
                placeholder="请输入答案"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                disabled={submitted}
              />
            )}
            {submitted && (
              <p className={`mt-2 text-sm ${answers[q.id] === q.answer ? "text-accent" : "text-red-500"}`}>
                {answers[q.id] === q.answer ? "✓ 正确" : `参考答案：${q.answer}`}
              </p>
            )}
          </div>
        ))}
      </div>

      {submitted && score !== null && (
        <div className="section-card mt-6 flex items-center gap-3 text-primary">
          <CheckCircle size={24} />
          <div>
            <p className="font-semibold">得分 {score}%</p>
            <p className="text-sm text-gray-500">掌握度将同步至学习画像（联调后由后端写入）</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {!submitted ? (
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "提交中..." : "提交答卷"}
          </button>
        ) : (
          <>
            <button type="button" className="btn-primary" onClick={() => navigate("/profile")}>
              查看画像更新
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/path")}>
              继续学习路径
            </button>
          </>
        )}
      </div>
    </ScholarPageShell>
  );
}
