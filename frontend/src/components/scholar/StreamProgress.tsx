import { Loader2 } from "lucide-react";

type Props = {
  progress: number | null;
  label?: string;
};

export default function StreamProgress({ progress, label = "智能体正在生成…" }: Props) {
  if (progress == null) return null;

  return (
    <div className="scholar-stream-panel px-4 py-3 border-t border-[var(--scholar-border)]" role="status" aria-live="polite">
      <div className="scholar-stream-bar" aria-hidden>
        <div className="scholar-stream-bar__fill" style={{ width: `${Math.min(100, progress)}%` }} />
      </div>
      <p className="scholar-stream-status">
        <Loader2 size={14} className="animate-spin text-[var(--scholar-primary)]" aria-hidden />
        {label} {progress}%
      </p>
    </div>
  );
}
