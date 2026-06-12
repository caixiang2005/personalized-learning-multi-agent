/**
 * @file DailyPlan.tsx
 * @description AI 每日学习计划：推送 · 对话 · 练习 · 进度
 * @route /plan
 */
import { useMemo, useState } from "react";
import { CalendarDays, Target, ListChecks, CheckCircle2, Clock, Lightbulb } from "lucide-react";
import PlanSidebar from "../components/plan/PlanSidebar";
import ScholarDashboardLayout, { DashboardHealthAside } from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import PlanTaskCard from "../components/plan/PlanTaskCard";
import {
  getDefaultDailyPlan,
  recalcPlanProgress,
} from "../lib/mockDailyPlan";

const PLAN_TIPS = [
  "优先完成对话类任务，针对易错点向助手提问",
  "练习任务建议在精讲与对话后进行，巩固效果更好",
  "每完成一项任务，系统会自动更新今日完成度",
];

export default function DailyPlan() {
  const [plan, setPlan] = useState(getDefaultDailyPlan);

  const overall = useMemo(() => recalcPlanProgress(plan.tasks), [plan.tasks]);

  const doneCount = plan.tasks.filter((t) => t.done).length;
  const totalMin = plan.tasks.reduce((s, t) => s + t.durationMin, 0);
  const doneMin = plan.tasks.filter((t) => t.done).reduce((s, t) => s + t.durationMin, 0);

  const toggleTask = (id: string) => {
    setPlan((p) => {
      const tasks = p.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done, progress: !t.done ? 100 : 0 } : t
      );
      return { ...p, tasks, overallProgress: recalcPlanProgress(tasks) };
    });
  };

  const scrollToChat = () => {
    document.getElementById("plan-sidebar-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formattedDate = new Date(plan.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <ScholarDashboardLayout
      badge="AI 每日计划"
      title="今日学习计划"
      subtitle={plan.summary}
      aside={<DashboardHealthAside score={overall} label="今日完成度" />}
      sidebar={<PlanSidebar plan={plan} />}
    >
      <AnimeStagger className="dash-stats mb-6" staggerMs={60} y={12} delay={70}>
        <div className="dash-stats__item">
          <ListChecks size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{plan.tasks.length}</span>
          <span className="dash-stats__label">今日任务</span>
        </div>
        <div className="dash-stats__item">
          <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{doneCount}</span>
          <span className="dash-stats__label">已完成</span>
        </div>
        <div className="dash-stats__item">
          <Target size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{overall}%</span>
          <span className="dash-stats__label">完成度</span>
        </div>
        <div className="dash-stats__item">
          <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
          <span className="dash-stats__num">{plan.tasks.length - doneCount}</span>
          <span className="dash-stats__label">待完成</span>
        </div>
      </AnimeStagger>

      <section className="section-card dash-panel mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--scholar-primary)] flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden />
            {formattedDate}
          </p>
          <p className="text-lg font-semibold text-[var(--scholar-text)] mt-1">{plan.greeting}</p>
          <ul className="dash-sidebar-facts mt-3">
            <li>
              <Clock size={14} aria-hidden />
              <span>{doneCount}/{plan.tasks.length} 任务完成 · 预计 {totalMin} 分钟</span>
            </li>
            <li>
              <Clock size={14} aria-hidden />
              <span>已完成 {doneMin} 分钟</span>
            </li>
          </ul>
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
        <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-3">今日知识点推送</h2>
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
              onChat={scrollToChat}
            />
          ))}
        </div>
      </section>

      <section className="section-card dash-panel">
        <h2 className="dash-panel__title">
          <Lightbulb size={16} className="inline mr-1 text-[var(--scholar-accent)]" aria-hidden />
          今日学习建议
        </h2>
        <ul className="dash-sidebar-notes">
          {PLAN_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </ScholarDashboardLayout>
  );
}
