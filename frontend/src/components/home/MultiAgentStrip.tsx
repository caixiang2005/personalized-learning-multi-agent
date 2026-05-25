/**
 * @file MultiAgentStrip.tsx
 * @description 多智能体协同能力展示（赛题核心：≥5 类资源生成）。
 */

import {
  Brain,
  Route,
  FileText,
  GitBranch,
  ClipboardList,
  Film,
  Code2,
  Sparkles,
} from "lucide-react";

const agents = [
  { icon: Brain, name: "画像构建", desc: "对话抽取 6 维学习特征", color: "from-primary to-blue-400" },
  { icon: Route, name: "路径规划", desc: "动态学习路径与推送", color: "from-indigo-500 to-violet-500" },
  { icon: FileText, name: "文档生成", desc: "课程讲解与拓展阅读", color: "from-sky-500 to-cyan-500" },
  { icon: GitBranch, name: "导图生成", desc: "知识点思维导图", color: "from-emerald-500 to-teal-500" },
  { icon: ClipboardList, name: "题库生成", desc: "选择/填空/综合练习", color: "from-amber-500 to-orange-500" },
  { icon: Film, name: "多模态讲解", desc: "教学视频与动画脚本", color: "from-rose-500 to-pink-500" },
  { icon: Code2, name: "实操案例", desc: "可运行代码与实践项目", color: "from-slate-600 to-slate-800" },
];

export default function MultiAgentStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "mb-8"}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            多智能体协同 · 个性化资源生成
          </h2>
        </div>
      )}
      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
        {agents.map((a) => (
          <div
            key={a.name}
            className="card-hover section-card !p-4 flex flex-col gap-2 border-primary/10"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-sm`}
            >
              <a.icon size={20} />
            </div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{a.name}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{a.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
