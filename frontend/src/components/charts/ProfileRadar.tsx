/**
 * @file ProfileRadar.tsx
 * @description 学习画像「知识基础」雷达图（Recharts），展示各知识点掌握度。
 * @backend 数据来自 GET /api/profile 或 GET /api/profile/dimensions
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

/** 维度掌握等级对应的颜色说明（图例用） */
export function DimensionLegend() {
  return (
    <div className="flex gap-4 text-xs text-gray-500 mt-2">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-500" /> 薄弱
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-yellow-500" /> 一般
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-accent" /> 熟练
      </span>
    </div>
  );
}

export default function ProfileRadar({ dimensions }: { dimensions: ProfileDimension[] }) {
  const data = dimensions.map((d) => ({
    subject: d.label,
    value: d.value,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="78%">
        <PolarGrid stroke="#e5e7eb" gridType="polygon" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar
          name="掌握度"
          dataKey="value"
          stroke="#165DFF"
          fill="url(#radarFill)"
          fillOpacity={0.45}
          strokeWidth={2}
          animationDuration={800}
        />
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#165DFF" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#36D399" stopOpacity={0.25} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}
