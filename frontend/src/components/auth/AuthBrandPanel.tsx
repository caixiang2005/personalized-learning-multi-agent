import {
  GraduationCap,
  ScanFace,
  Boxes,
  Waypoints,
  MessageSquare,
  BrainCircuit,
} from "lucide-react";
import AuthSpiralText from "./AuthSpiralText";
import AuthFeatureMagnetList from "./AuthFeatureMagnetList";

const features = [
  { icon: MessageSquare, text: "对话式学习引导" },
  { icon: BrainCircuit, text: "6 维度动态画像" },
  { icon: Boxes, text: "多模态资源生成" },
  { icon: Waypoints, text: "个性化学习路径" },
];

export default function AuthBrandPanel() {
  return (
    <section className="login-brand landing-glass landing-enter">
      <div className="login-brand__emblem">
        <AuthSpiralText className="login-brand__spiral" />
        <span className="login-brand__icon">
          <GraduationCap size={22} strokeWidth={2} />
        </span>
      </div>
      <h1 className="login-brand__title">智慧学习中心</h1>
      <p className="login-brand__sub">高等教育个性化学习平台</p>
      <AuthFeatureMagnetList features={features} />
      <p className="mt-8 text-xs text-gray-400 flex items-center gap-1.5">
        <ScanFace size={14} strokeWidth={1.75} />
        对话式 · 多模态 · 自适应学习
      </p>
    </section>
  );
}
