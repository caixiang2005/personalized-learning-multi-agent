/**
 * @file MultiAgentStrip.tsx
 * @description 多智能体协同能力展示。
 */

import {
  Brain,
  Route,
  FileText,
  GitBranch,
  ClipboardList,
  Film,
  Code2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingTiltCard from "../landing/LandingTiltCard";

const agents: { icon: LucideIcon; name: string; desc: string }[] = [
  { icon: Brain, name: "画像构建", desc: "对话抽取 6 维学习特征" },
  { icon: Route, name: "路径规划", desc: "动态学习路径与推送" },
  { icon: FileText, name: "文档生成", desc: "课程讲解与拓展阅读" },
  { icon: GitBranch, name: "导图生成", desc: "知识点思维导图" },
  { icon: ClipboardList, name: "题库生成", desc: "选择/填空/综合练习" },
  { icon: Film, name: "多模态讲解", desc: "教学视频与动画脚本" },
  { icon: Code2, name: "实操案例", desc: "可运行代码与实践项目" },
];

const tones = ["blue", "green", "purple", "orange"] as const;

type Props = {
  compact?: boolean;
  landing?: boolean;
};

export default function MultiAgentStrip({ compact = false, landing = false }: Props) {
  if (landing) {
    return (
      <section className="home-agents">
        <div className="landing-panel__head">
          <h2>多智能体协同</h2>
          <span>个性化资源生成</span>
        </div>
        <div className="home-agents__grid">
          {agents.map((a, i) => (
            <LandingTiltCard
              key={a.name}
              className="landing-glass-card home-agent-card"
              intensity={5}
            >
              <span className={`landing-icon-tone landing-icon-tone--${tones[i % tones.length]}`}>
                <a.icon size={20} strokeWidth={1.75} />
              </span>
              <p className="home-agent-card__title">{a.name}</p>
              <p className="home-agent-card__desc">{a.desc}</p>
            </LandingTiltCard>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "" : "mb-8"}>
      {!compact && (
        <div className="landing-panel__head mb-4">
          <h2>多智能体协同</h2>
          <span>个性化资源生成</span>
        </div>
      )}
      <div
        className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}
      >
        {agents.map((a, i) => (
          <div key={a.name} className="landing-glass-card home-agent-card">
            <span className={`landing-icon-tone landing-icon-tone--${tones[i % tones.length]}`}>
              <a.icon size={20} strokeWidth={1.75} />
            </span>
            <p className="home-agent-card__title">{a.name}</p>
            <p className="home-agent-card__desc">{a.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
