/**
 * @file Landing.tsx
 * @description 未登录门户：功能介绍 + 顶栏登录入口；AI 助手仅右下角 FAB。
 * @route /
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  LogIn,
  UserCircle,
  Layers,
  Route,
  BarChart3,
  MessageSquare,
  Bot,
  FileText,
  Brain,
  GitBranch,
  ClipboardList,
  PlayCircle,
} from "lucide-react";
import GuestAssistantFab from "../components/guest/GuestAssistantFab";
import GuestChatDrawer from "../components/guest/GuestChatDrawer";
import { useAppStore } from "../store/useAppStore";

const stats = [
  { value: "6 维", label: "学习画像" },
  { value: "5+", label: "资源类型" },
  { value: "3 轮", label: "免费体验对话" },
];

const sideAgents = [
  { icon: Brain, label: "画像智能体", desc: "对话抽取学习特征" },
  { icon: Layers, label: "资源智能体", desc: "协同生成学习内容" },
  { icon: Route, label: "路径智能体", desc: "按进度推送路径" },
];

const sideResources = [
  { icon: FileText, label: "精讲文档" },
  { icon: GitBranch, label: "思维导图" },
  { icon: ClipboardList, label: "专项题库" },
  { icon: PlayCircle, label: "视频讲解" },
];

const features = [
  {
    icon: UserCircle,
    title: "对话式学习画像",
    desc: "用自然语言描述专业、目标与薄弱点，系统自动抽取并持续更新 6 维学习特征。",
    color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40",
  },
  {
    icon: Layers,
    title: "多智能体资源生成",
    desc: "文档、思维导图、题库、视频脚本、实操案例等由多智能体协同生成。",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: Route,
    title: "个性化学习路径",
    desc: "结合画像与进度，按阶段推送知识点与配套资源，动态调整学习节奏。",
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: BarChart3,
    title: "学习效果评估",
    desc: "追踪薄弱点、学习活跃与掌握情况，用数据驱动方案优化。",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  },
];

const steps = [
  { num: "01", title: "登录账号", desc: "邮箱或用户名登录，验证码 / 密码均可" },
  { num: "02", title: "描述学习背景", desc: "与智能体对话，构建个人学习画像" },
  { num: "03", title: "获取学习路径", desc: "生成资源并进入个性化学习中心" },
];

export default function Landing() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="landing-shell">
      <div className="landing-shell__bg" aria-hidden />

      <header className="landing-header">
        <div className="landing-header__inner">
          <Link to="/" className="landing-brand">
            <span className="landing-brand__icon">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="landing-brand__title">智慧学习中心</span>
              <span className="landing-brand__sub">个性化学习多智能体系统</span>
            </span>
          </Link>

          <div className="landing-header__actions">
            <Link to="/login" className="btn-primary text-sm py-2">
              <LogIn size={16} />
              登入 / 注册
            </Link>
          </div>
        </div>
      </header>

      <div className="landing-layout">
        <aside className="landing-side landing-side--left" aria-hidden>
          <p className="landing-side__title">多智能体</p>
          {sideAgents.map((a) => (
            <div key={a.label} className="landing-side-chip">
              <a.icon size={16} className="landing-side-chip__icon" />
              <div>
                <p className="landing-side-chip__label">{a.label}</p>
                <p className="landing-side-chip__desc">{a.desc}</p>
              </div>
            </div>
          ))}
        </aside>

        <main className="landing-page">
          <section className="landing-hero">
            <div className="landing-hero__main">
              <h1 className="landing-hero__title">AI 驱动的个性化学习平台</h1>
              <p className="landing-hero__desc">
                面向高校与自学场景，通过多智能体协同完成画像构建、资源生成、路径规划与学习评估。
                {!isLoggedIn && " 请先登录后进入主系统。"}
              </p>
              {!isLoggedIn && (
                <p className="landing-hero__fab-hint">
                  <Bot size={14} />
                  未登录可先点右下角助手，免费体验 3 轮 · 演示密码 / 验证码 123456
                </p>
              )}
            </div>

            <div className="landing-hero__card">
              <p className="landing-hero__card-label">登录后可使用</p>
              <ul className="landing-hero__card-list">
                <li>
                  <MessageSquare size={16} /> 多轮学习对话与画像构建
                </li>
                <li>
                  <FileText size={16} /> 文档 / 导图 / 题库等资源生成
                </li>
                <li>
                  <Route size={16} /> 阶段性学习路径推送
                </li>
              </ul>
            </div>
          </section>

          <div className="landing-stats">
            {stats.map((s) => (
              <div key={s.label} className="landing-stat">
                <span className="landing-stat__value">{s.value}</span>
                <span className="landing-stat__label">{s.label}</span>
              </div>
            ))}
          </div>

          <section className="landing-panel">
            <div className="landing-panel__head">
              <h2>平台能力</h2>
              <span>登录后完整可用</span>
            </div>
            <div className="landing-features">
              {features.map((f) => (
                <div key={f.title} className="landing-feature-card">
                  <span className={`landing-feature-card__icon ${f.color}`}>
                    <f.icon size={20} />
                  </span>
                  <div>
                    <h3 className="landing-feature-card__title">{f.title}</h3>
                    <p className="landing-feature-card__desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="landing-steps">
            <h2 className="landing-steps__title">使用流程</h2>
            <div className="landing-steps__grid">
              {steps.map((s) => (
                <div key={s.num} className="landing-step">
                  <span className="landing-step__num">{s.num}</span>
                  <h3 className="landing-step__title">{s.title}</h3>
                  <p className="landing-step__desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="landing-side landing-side--right" aria-hidden>
          <p className="landing-side__title">资源类型</p>
          {sideResources.map((r) => (
            <div key={r.label} className="landing-side-tag">
              <r.icon size={14} />
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
