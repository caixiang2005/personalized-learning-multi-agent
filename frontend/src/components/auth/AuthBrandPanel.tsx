import {
  GraduationCap,
  ScanFace,
  Boxes,
  Waypoints,
  MessageSquare,
  BrainCircuit,
} from "lucide-react";

const features = [
  { icon: MessageSquare, text: "对话式学习引导" },
  { icon: BrainCircuit, text: "6 维度动态画像" },
  { icon: Boxes, text: "多模态资源生成" },
  { icon: Waypoints, text: "个性化学习路径" },
];

export default function AuthBrandPanel() {
  return (
    <section className="login-brand landing-glass landing-enter">
      <span className="login-brand__icon">
        <GraduationCap size={22} strokeWidth={2} />
      </span>
      <h1 className="login-brand__title">智慧学习中心</h1>
      <p className="login-brand__sub">高等教育个性化学习平台</p>
      <ul className="login-brand__list">
        {features.map((f) => (
          <li key={f.text} className="login-brand__item">
            <span className="landing-icon-glass landing-icon-glass--sm">
              <f.icon size={16} strokeWidth={1.75} />
            </span>
            {f.text}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-gray-400 flex items-center gap-1.5">
        <ScanFace size={14} strokeWidth={1.75} />
        对话式 · 多模态 · 自适应学习
      </p>
    </section>
  );
}
