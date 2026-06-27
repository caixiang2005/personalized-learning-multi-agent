/**
 * @file DailyPlan.tsx
 * @description AI 每日学习计划：从后端拉取真实数据，支持任务完成度切换。
 * @route /plan
 * @backend GET /api/plan/daily · POST /api/plan/tasks/:id/toggle
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Target, ListChecks, CheckCircle2, Clock, Lightbulb, RefreshCw, AlertCircle,
} from "lucide-react";
import PlanSidebar from "../components/plan/PlanSidebar";
import ScholarDashboardLayout, { DashboardHealthAside } from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import PlanTaskCard from "../components/plan/PlanTaskCard";
import { fetchDailyPlan, toggleTaskApi } from "../lib/api/learn";
import { recalcPlanProgress } from "../lib/mockDailyPlan";
import type { DailyPlan as DailyPlanType } from "../types";

const PLAN_TIPS = [
  "优先完成对话类任务，针对易错点向助手提问",
  "练习任务建议在精讲与对话后进行，巩固效果更好",
  "每完成一项任务，系统会自动更新今日完成度",
];

function renderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 flex-1 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="h-36 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

function renderErrorState(message: string, onRetry: () => void) {
  return (
    <div className="section-card dash-panel text-center py-16 px-6">
      <AlertCircle size={40} className="mx-auto mb-4 text-amber-500" aria-hidden />
      <p className="text-[var(--scholar-text)] font-medium mb-2">无法加载今日计划</p>
      <p className="text-sm text-[var(--scholar-text-muted)] mb-6">{message}</p>
      <button type="button" onClick={onRetry} className="btn-primary inline-flex items-center gap-2">
        <RefreshCw size={16} aria-hidden />
        重试
      </button>
    </div>
  );
}

export default function DailyPlan() {
  const [plan, setPlan] = useState<DailyPlanType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDailyPlan();
      if (res.code === 200 && res.data) {
        setPlan(res.data);
      } else {
        setPlan(null);
        setError(res.msg || "获取计划失败");
      }
    } catch {
      setPlan(null);
      setError("无法连接 learn-service，请确认后端 :8002 已启动");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const overall = useMemo(
    () => (plan ? recalcPlanProgress(plan.tasks) : 0),
    [plan]
  );
  const doneCount = useMemo(
    () => (plan ? plan.tasks.filter((t) => t.done).length : 0),
    [plan]
  );
  const totalMin = useMemo(
    () => (plan ? plan.tasks.reduce((s, t) => s + t.durationMin, 0) : 0),
    [plan]
  );
  const doneMin = useMemo(
    () => (plan ? plan.tasks.filter((t) => t.done).reduce((s, t) => s + t.durationMin, 0) : 0),
    [plan]
  );

  const toggleTask = async (id: string) => {
    const prev = plan?.tasks.find((t) => t.id === id);
    const newDone = !prev?.done;

    setPlan((p) => {
      if (!p) return p;
      const tasks = p.tasks.map((t) =>
        t.id === id ? { ...t, done: newDone, progress: newDone ? 100 : 0 } : t
      );
      return { ...p, tasks, overallProgress: recalcPlanProgress(tasks) };
    });

    try {
      await toggleTaskApi(id, newDone);
    } catch {
      setPlan((p) => {
        if (!p) return p;
        const tasks = p.tasks.map((t) =>
          t.id === id ? { ...t, done: !newDone, progress: !newDone ? 0 : 100 } : t
        );
        return { ...p, tasks, overallProgress: recalcPlanProgress(tasks) };
      });
    }
  };

  const scrollToChat = () => {
    document.getElementById("plan-sidebar-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <ScholarDashboardLayout badge="AI 每日计划" title="今日学习计划" subtitle="加载中…">
        {renderSkeleton()}
      </ScholarDashboardLayout>
    );
  }

  if (!plan) {
    return (
      <ScholarDashboardLayout badge="AI 每日计划" title="今日学习计划" subtitle="加载失败">
        {renderErrorState(error ?? "未知错误", loadPlan)}
      </ScholarDashboardLayout>
    );
  }

  const formattedDate = new Date(plan.date).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <ScholarDashboardLayout
      badge="AI 每日计划"
      title="今日学习计划"
      subtitle={plan.summary}
      aside={
        <div className="flex items-center gap-2">
          <DashboardHealthAside score={overall} label="今日完成度" />
          <button type="button" onClick={loadPlan} className="btn-secondary text-xs py-1 px-2" title="刷新">
            <RefreshCw size={14} />
          </button>
        </div>
      }
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
                cx="18" cy="18" r="15" fill="none"
                stroke="var(--scholar-primary)" strokeWidth="3"
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
          {(plan.knowledgePush ?? []).map((kp) => (
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
              onToggle={() => toggleTask(task.id)}
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
