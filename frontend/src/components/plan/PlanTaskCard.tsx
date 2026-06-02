import {
  BookOpen,
  CheckCircle2,
  Circle,
  MessageSquare,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { DailyPlanTask, DailyTaskType } from "../../types";

const typeMeta: Record<DailyTaskType, { icon: LucideIcon; label: string; color: string }> = {
  learn: { icon: BookOpen, label: "学习", color: "text-[var(--scholar-primary)]" },
  chat: { icon: MessageSquare, label: "对话", color: "text-violet-600" },
  exercise: { icon: ClipboardList, label: "练习", color: "text-[var(--scholar-accent)]" },
};

type Props = {
  task: DailyPlanTask;
  onToggle: (id: string) => void;
  onChat?: (id: string) => void;
};

export default function PlanTaskCard({ task, onToggle, onChat }: Props) {
  const meta = typeMeta[task.type];
  const Icon = meta.icon;

  return (
    <article className="scholar-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="flex items-start gap-3 flex-1 min-w-0 text-left cursor-pointer group"
        aria-pressed={task.done}
      >
        {task.done ? (
          <CheckCircle2 size={22} className="shrink-0 text-[var(--scholar-accent)]" />
        ) : (
          <Circle size={22} className="shrink-0 text-[var(--scholar-text-muted)] group-hover:text-[var(--scholar-primary)]" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.color}`}>
              <Icon size={13} aria-hidden />
              {meta.label}
            </span>
            <span className="text-xs text-[var(--scholar-text-muted)]">{task.durationMin} 分钟</span>
          </div>
          <p className={`text-sm font-medium ${task.done ? "line-through text-[var(--scholar-text-muted)]" : "text-[var(--scholar-text)]"}`}>
            {task.title}
          </p>
          <p className="text-xs text-[var(--scholar-text-muted)] mt-0.5">{task.topic}</p>
        </div>
      </button>

      {!task.done && (
        <div className="sm:w-36 shrink-0">
          <div className="flex justify-between text-[10px] text-[var(--scholar-text-muted)] mb-1">
            <span>进度</span>
            <span>{task.done ? 100 : task.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--scholar-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--scholar-primary)] transition-all"
              style={{ width: `${task.done ? 100 : task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.type === "chat" && !task.done && onChat && (
        <button
          type="button"
          onClick={() => onChat(task.id)}
          className="btn-primary text-xs py-2 px-3 shrink-0 cursor-pointer"
        >
          开始对话
        </button>
      )}
    </article>
  );
}
