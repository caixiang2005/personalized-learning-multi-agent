/**
 * @file DailyPlan.tsx
 * @description AI 每日学习计划：推送 · 对话 · 练习 · 进度
 * @route /plan
 */
import { useMemo, useState } from "react";
import { CalendarDays, Target } from "lucide-react";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import GrowthQuickLinks from "../components/layout/GrowthQuickLinks";
import PlanTaskCard from "../components/plan/PlanTaskCard";
import PlanChatPanel from "../components/plan/PlanChatPanel";
import {
  getDefaultDailyPlan,
  recalcPlanProgress,
} from "../lib/mockDailyPlan";

export default function DailyPlan() {
  const [plan, setPlan] = useState(getDefaultDailyPlan);
  const [chatOpen, setChatOpen] = useState(false);

  const overall = useMemo(() => recalcPlanProgress(plan.tasks), [plan.tasks]);

  const toggleTask = (id: string) => {
    setPlan((p) => {
      const tasks = p.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done, progress: !t.done ? 100 : 0 } : t
      );
      return { ...p, tasks, overallProgress: recalcPlanProgress(tasks) };
    });
  };

  const formattedDate = new Date(plan.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <ScholarPageShell maxWidth="5xl">
      <ScholarPageHeader
        badge="AI 每日计划"
        title="今日学习计划"
        subtitle={plan.summary}
      />

      <GrowthQuickLinks />

      <section className="scholar-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--scholar-primary)] flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden />
            {formattedDate}
          </p>
          <p className="text-lg font-semibold text-[var(--scholar-text)] mt-1">{plan.greeting}</p>
        </div>
        <div className="text-center min-w-[5rem]">
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--scholar-border)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--scholar-primary)"
                strokeWidth="3"
                strokeDasharray={`${overall} 100`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--scholar-primary)]">
              {overall}%
            </span>
          </div>
          <p className="text-xs text-[var(--scholar-text-muted)] mt-1">今日完成度</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-3 flex items-center gap-2">
          <Target size={18} className="text-[var(--scholar-accent)]" aria-hidden />
          每日知识点推送
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {plan.knowledgePush.map((kp) => (
            <article key={kp.id} className="scholar-cap-card">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--scholar-accent)]">
                {kp.tag}
              </span>
              <span className="scholar-cap-card__title">{kp.title}</span>
              <span className="scholar-cap-card__desc">{kp.desc}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-3">今日任务</h2>
        <div className="space-y-3">
          {plan.tasks.map((task) => (
            <PlanTaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onChat={() => setChatOpen(true)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-3">对话式学习</h2>
        {chatOpen ? (
          <PlanChatPanel />
        ) : (
          <div className="scholar-card p-6 text-center">
            <p className="text-sm text-[var(--scholar-text-muted)] mb-4">
              点击任务中的「开始对话」，或下方按钮进入今日学习助手
            </p>
            <button
              type="button"
              className="btn-primary cursor-pointer"
              onClick={() => setChatOpen(true)}
            >
              打开学习对话
            </button>
          </div>
        )}
      </section>
    </ScholarPageShell>
  );
}
