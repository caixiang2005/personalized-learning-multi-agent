/**
 * 六维学习画像雷达图（比赛规范）
 */
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { ProfileDimension } from "../../types";

export function LearnerDimensionLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-[var(--scholar-text-muted)] mt-2">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden /> 待加强
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden /> 良好
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[var(--scholar-accent)]" aria-hidden /> 优秀
      </span>
    </div>
  );
}

export default function LearnerRadarChart({ dimensions }: { dimensions: ProfileDimension[] }) {
  const data = dimensions.map((d) => ({
    subject: d.label,
    value: d.value,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="76%">
        <PolarGrid stroke="var(--scholar-border)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "var(--scholar-text-secondary)" }}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar
          name="得分"
          dataKey="value"
          stroke="var(--scholar-primary)"
          fill="url(#learnerRadarFill)"
          fillOpacity={0.42}
          strokeWidth={2}
          animationDuration={900}
        />
        <defs>
          <linearGradient id="learnerRadarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B6E83" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.25} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}
