/**
 * 画像未构建 · 右侧引导栏
 */
import { Link } from "react-router-dom";
import { Lock, MessageSquare, Route, Sparkles, LayoutDashboard } from "lucide-react";
import AnimeReveal from "../motion/AnimeReveal";
import { PROFILE_BUILD_PATH } from "../../lib/navConfig";

const UNLOCK_ITEMS = [
  { label: "六维雷达图", icon: Sparkles },
  { label: "薄弱点统计", icon: MessageSquare },
  { label: "学习驾驶舱", icon: LayoutDashboard },
  { label: "路径规划", icon: Route },
] as const;

const BUILD_TIPS = [
  "说明专业、课程与当前阶段",
  "写下可量化的学习目标",
  "点出 1～2 个薄弱知识点",
];

export default function ProfileEmptySidebar() {
  return (
    <>
      <AnimeReveal as="section" className="section-card dash-panel profile-empty__unlock" y={14} delay={110}>
        <h2 className="dash-panel__title">构建后解锁</h2>
        <ul className="profile-empty__unlock-list">
          {UNLOCK_ITEMS.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span className="profile-empty__unlock-icon" aria-hidden>
                <Icon size={14} strokeWidth={1.75} />
              </span>
              <span>{label}</span>
              <Lock size={12} className="profile-empty__unlock-lock" aria-hidden />
            </li>
          ))}
        </ul>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={140}>
        <h2 className="dash-panel__title">对话时可以这样说</h2>
        <ul className="dash-sidebar-tips">
          {BUILD_TIPS.map((tip) => (
            <li key={tip}>
              <Sparkles size={12} aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel profile-empty__cta-card" y={14} delay={170}>
        <h2 className="dash-panel__title">准备好开始了？</h2>
        <p className="dash-panel__desc">进入画像智能体，用自然语言描述你的学习背景即可。</p>
        <Link to={PROFILE_BUILD_PATH} className="btn-primary w-full justify-center text-sm no-underline mt-3">
          进入画像智能体
        </Link>
      </AnimeReveal>
    </>
  );
}
