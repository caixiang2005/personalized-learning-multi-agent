import { Link } from "react-router-dom";
import { Sparkles, CalendarDays, Clock, ListChecks } from "lucide-react";
import AnimeReveal from "../motion/AnimeReveal";
import PlanChatPanel from "./PlanChatPanel";
import type { DailyPlan } from "../../types";

type Props = { plan: DailyPlan };

export default function PlanSidebar({ plan }: Props) {
  const pending = plan.tasks.filter((t) => !t.done);
  const doneCount = plan.tasks.length - pending.length;
  const totalMin = plan.tasks.reduce((s, t) => s + t.durationMin, 0);
  const doneMin = plan.tasks.filter((t) => t.done).reduce((s, t) => s + t.durationMin, 0);

  return (
    <>
      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={110}>
        <h2 className="dash-panel__title">
          <CalendarDays size={14} className="inline mr-1" aria-hidden />
          今日节奏
        </h2>
        <p className="dash-sidebar-stat-lg">{doneCount}/{plan.tasks.length} 任务完成</p>
        <ul className="dash-sidebar-facts">
          <li>
            <Clock size={14} aria-hidden />
            <span>预计总时长 {totalMin} 分钟</span>
          </li>
          <li>
            <Clock size={14} aria-hidden />
            <span>已完成 {doneMin} 分钟</span>
          </li>
        </ul>
        <div className="progress-bar h-1.5 mt-3">
          <div
            className="progress-bar-fill"
            style={{ width: `${plan.tasks.length ? Math.round((doneCount / plan.tasks.length) * 100) : 0}%` }}
          />
        </div>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={130}>
        <h2 className="dash-panel__title">
          <ListChecks size={14} className="inline mr-1" aria-hidden />
          任务概览
        </h2>
        <ul className="dash-sidebar-tasks">
          {plan.tasks.map((t) => (
            <li key={t.id}>
              <span className={t.done ? "line-through opacity-60" : ""}>{t.title}</span>
              <span>{t.durationMin} 分钟</span>
            </li>
          ))}
        </ul>
      </AnimeReveal>

      <AnimeReveal
        as="section"
        id="plan-sidebar-chat"
        className="section-card dash-panel scroll-mt-24"
        y={14}
        delay={150}
      >
        <h2 className="dash-panel__title">对话式学习</h2>
        <p className="dash-panel__desc mb-3">针对今日知识点与任务，向助手提问或巩固练习。</p>
        <PlanChatPanel embedded />
        <Link to="/chat" className="btn-secondary w-full justify-center text-sm no-underline mt-3">
          <Sparkles size={15} /> 进入智能辅导
        </Link>
      </AnimeReveal>
    </>
  );
}
