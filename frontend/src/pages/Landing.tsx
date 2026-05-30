/**
 * @file Landing.tsx
 * @description 未登录门户：毛玻璃组件 + 知识遨游背景 + 顶栏登录入口。
 * @route /
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  LogIn,
  ArrowRight,
  ScanFace,
  Boxes,
  Waypoints,
  LineChart,
  MessageSquare,
  Route,
  BookOpen,
  GitBranch,
  ListChecks,
  Clapperboard,
  BrainCircuit,
  Network,
  Signpost,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ParticleText from "../components/ui/ParticleText";
import GuestAssistantFab from "../components/guest/GuestAssistantFab";
import GuestChatDrawer from "../components/guest/GuestChatDrawer";
import LandingReveal from "../components/landing/LandingReveal";
import LandingMarquee from "../components/landing/LandingMarquee";
import LandingFaq from "../components/landing/LandingFaq";
import LandingMotionLayer from "../components/landing/LandingMotionLayer";
import LandingTiltCard from "../components/landing/LandingTiltCard";
import LandingCountUp from "../components/landing/LandingCountUp";
import { useLandingHeaderScrolled } from "../hooks/useLandingHeaderScrolled";
import { useLandingScroll } from "../hooks/useLandingScroll";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const stats = [
  { value: "6 维", label: "学习画像" },
  { value: "5+", label: "资源类型" },
  { value: "7+", label: "协同智能体" },
];

const sideAgents: { icon: LucideIcon; label: string; desc: string }[] = [
  { icon: BrainCircuit, label: "画像智能体", desc: "对话抽取学习特征" },
  { icon: Network, label: "资源智能体", desc: "协同生成学习内容" },
  { icon: Signpost, label: "路径智能体", desc: "按进度推送路径" },
];

const sideResources: { icon: LucideIcon; label: string }[] = [
  { icon: BookOpen, label: "精讲文档" },
  { icon: GitBranch, label: "思维导图" },
  { icon: ListChecks, label: "专项题库" },
  { icon: Clapperboard, label: "视频讲解" },
];

const features = [
  {
    icon: ScanFace,
    tone: "blue" as const,
    title: "对话式学习画像",
    desc: "用自然语言描述专业、目标与薄弱点，系统自动抽取并持续更新 6 维学习特征。",
  },
  {
    icon: Boxes,
    tone: "green" as const,
    title: "多智能体资源生成",
    desc: "文档、思维导图、题库、视频脚本、实操案例等由多智能体协同生成。",
  },
  {
    icon: Waypoints,
    tone: "purple" as const,
    title: "个性化学习路径",
    desc: "结合画像与进度，按阶段推送知识点与配套资源，动态调整学习节奏。",
  },
  {
    icon: LineChart,
    tone: "orange" as const,
    title: "学习效果评估",
    desc: "追踪薄弱点、学习活跃与掌握情况，用数据驱动方案优化。",
  },
];

const steps = [
  { num: "01", title: "登录账号", desc: "邮箱或用户名登录，验证码 / 密码均可" },
  { num: "02", title: "描述学习背景", desc: "与智能体对话，构建个人学习画像" },
  { num: "03", title: "获取学习路径", desc: "生成资源并进入个性化学习中心" },
];

export default function Landing() {
  const [chatOpen, setChatOpen] = useState(false);
  const [statsActive, setStatsActive] = useState(false);
  const headerScrolled = useLandingHeaderScrolled();
  const { scrollY, progress } = useLandingScroll();
  const reducedMotion = usePrefersReducedMotion();

  const heroMainStyle = reducedMotion
    ? undefined
    : { transform: `translate3d(0, ${scrollY * 0.1}px, 0)` };
  const heroCardStyle = reducedMotion
    ? undefined
    : { transform: `translate3d(0, ${scrollY * -0.06}px, 0)` };

  return (
    <div className="landing-shell app-page-scrim">
      <LandingMotionLayer scrollY={scrollY} progress={progress} />
      <header
        className={`landing-header landing-glass landing-header--bar${headerScrolled ? " landing-header--scrolled" : ""}`}
      >
        <div className="landing-header__inner">
          <Link to="/" className="landing-brand">
            <span className="landing-brand__icon">
              <GraduationCap size={18} strokeWidth={2} />
            </span>
            <span>
              <span className="landing-brand__title">智慧学习中心</span>
              <span className="landing-brand__sub">个性化学习多智能体系统</span>
            </span>
          </Link>

          <div className="landing-header__actions">
            <Link to="/login" className="landing-btn-glass">
              <LogIn size={16} strokeWidth={1.75} />
              登入 / 注册
            </Link>
          </div>
        </div>
      </header>

      <div className="landing-layout">
        <aside className="landing-side landing-side--left" aria-hidden>
          <p className="landing-side__title">多智能体</p>
          {sideAgents.map((a, i) => (
            <div key={a.label} className="landing-side-chip landing-glass landing-enter" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="landing-icon-glass landing-icon-glass--sm">
                <a.icon size={17} strokeWidth={1.75} />
              </span>
              <div>
                <p className="landing-side-chip__label">{a.label}</p>
                <p className="landing-side-chip__desc">{a.desc}</p>
              </div>
            </div>
          ))}
        </aside>

        <main className="landing-page">
          <LandingReveal as="section" className="landing-hero landing-hero--motion">
            <div className="landing-hero__main landing-hero__parallax" style={heroMainStyle}>
              <ParticleText
                text="AI 驱动的个性化学习平台"
                className="landing-hero__title landing-hero__title--particle"
                textAlign="left"
                assemble
                assembleOrigin="left"
                assembleDuration={1800}
                fontSize={40}
                particleGap={2}
                particleSize={1.5}
                mouseRadius={120}
                mouseStrength={4.5}
              />
              <p className="landing-hero__desc">
                面向高校与自学场景，通过多智能体协同完成画像构建、资源生成、路径规划与学习评估。登录后进入完整学习系统。
              </p>
              <div className="landing-hero__actions">
                <Link to="/login" className="landing-btn-glass landing-hero__cta-primary landing-hero__cta-shimmer">
                  <LogIn size={16} strokeWidth={1.75} />
                  立即登录
                  <ArrowRight size={16} strokeWidth={1.75} className="landing-hero__cta-arrow" />
                </Link>
                <button
                  type="button"
                  className="landing-hero__cta-secondary landing-glass"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageSquare size={16} strokeWidth={1.75} />
                  先体验智能助手
                </button>
              </div>
            </div>

            <div className="landing-hero__parallax" style={heroCardStyle}>
              <LandingTiltCard
                className="landing-hero__card landing-glass landing-glass--accent landing-float"
                intensity={5}
              >
                <p className="landing-hero__card-label">登录后可使用</p>
                <ul className="landing-hero__card-list">
                  <li>
                    <MessageSquare size={16} strokeWidth={1.75} /> 多轮学习对话与画像构建
                  </li>
                  <li>
                    <BookOpen size={16} strokeWidth={1.75} /> 文档 / 导图 / 题库等资源生成
                  </li>
                  <li>
                    <Route size={16} strokeWidth={1.75} /> 阶段性学习路径推送
                  </li>
                </ul>
              </LandingTiltCard>
            </div>
          </LandingReveal>

          <LandingReveal
            className="landing-stats"
            delay={80}
            stagger
            onVisible={() => setStatsActive(true)}
          >
            {stats.map((s) => (
              <LandingTiltCard key={s.label} className="landing-stat landing-glass-card" intensity={6}>
                <LandingCountUp
                  value={s.value}
                  active={statsActive}
                  className="landing-stat__value shiny-text-subtle"
                />
                <span className="landing-stat__label">{s.label}</span>
              </LandingTiltCard>
            ))}
          </LandingReveal>

          <LandingMarquee title="资源类型" items={sideResources} />

          <LandingReveal
            as="section"
            className="landing-panel landing-section-frame landing-reveal--cards"
            delay={100}
            stagger
          >
            <div className="landing-panel__head">
              <h2>平台能力</h2>
              <span>登录后完整可用</span>
            </div>
            <div className="landing-features">
              {features.map((f) => (
                <LandingTiltCard key={f.title} className="landing-feature-card landing-glass-card" intensity={6}>
                  <span className={`landing-icon-tone landing-icon-tone--${f.tone}`}>
                    <f.icon size={20} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="landing-feature-card__title">{f.title}</h3>
                    <p className="landing-feature-card__desc">{f.desc}</p>
                  </div>
                </LandingTiltCard>
              ))}
            </div>
          </LandingReveal>

          <LandingReveal
            as="section"
            className="landing-steps landing-section-frame landing-reveal--cards"
            delay={140}
            stagger
          >
            <h2 className="landing-steps__title">使用流程</h2>
            <div className="landing-steps__grid">
              {steps.map((s) => (
                <LandingTiltCard key={s.num} className="landing-step landing-glass-card" intensity={6}>
                  <span className="landing-step__num">{s.num}</span>
                  <h3 className="landing-step__title">{s.title}</h3>
                  <p className="landing-step__desc">{s.desc}</p>
                </LandingTiltCard>
              ))}
            </div>
          </LandingReveal>

          <LandingFaq />
        </main>

        <aside className="landing-side landing-side--right" aria-hidden>
          <p className="landing-side__title">资源类型</p>
          {sideResources.map((r, i) => (
            <div key={r.label} className="landing-side-tag landing-glass landing-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <r.icon size={14} strokeWidth={1.75} />
              {r.label}
            </div>
          ))}
        </aside>
      </div>

      <GuestAssistantFab onClick={() => setChatOpen(true)} active={chatOpen} />
      <GuestChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
