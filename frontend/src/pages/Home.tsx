/**
 * @file Home.tsx
 * @description 登录后首页：学习背景引导、画像反馈、Flowing Menu 快捷导航。
 * @route /home
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentAvatar from "../components/chat/AgentAvatar";
import FlowingMenu from "../components/layout/FlowingMenu";
import MultiAgentStrip from "../components/home/MultiAgentStrip";
import LandingReveal from "../components/landing/LandingReveal";
import LandingMotionLayer from "../components/landing/LandingMotionLayer";
import LandingTiltCard from "../components/landing/LandingTiltCard";
import ShinyText from "../components/ui/ShinyText";
import { useAppStore } from "../store/useAppStore";
import { useLandingScroll } from "../hooks/useLandingScroll";
import { simulateStream } from "../lib/stream";

const flowingItems = [
  { link: "/path", text: "学习路径", image: "linear-gradient(135deg, #4f46e5, #818cf8)" },
  { link: "/profile", text: "学习画像", image: "linear-gradient(135deg, #22c55e, #6ee7b7)" },
  { link: "/chat", text: "学习对话", image: "linear-gradient(135deg, #6366f1, #a78bfa)" },
  { link: "/analytics", text: "效果评估", image: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
];

const examples = [
  "计算机科学与技术 - 数据结构，期末 85 分",
  "薄弱点：二叉树、图算法，偏好视频学习",
  "学过一半，需要生成专属学习路径",
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, setProfile, setProfileInitialized, profileInitialized } = useAppStore();
  const { scrollY, progress } = useLandingScroll();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);

  const handleSubmit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput(content);
    setThinking(true);
    setShowReply(true);
    setReply("");

    setProfile({
      major: content.includes("数据结构") ? "计算机科学与技术 - 数据结构" : profile.major,
      level: content,
      name: "学习者",
    });
    setProfileInitialized(true);

    const response =
      "已根据你的描述生成初步学习画像，并为你规划学习路径。\n\n**画像摘要：**\n- 知识基础：数据结构中等\n- 薄弱点：二叉树、图算法\n- 学习偏好：视频 + 练习\n\n可从下方入口进入各模块。";

    await simulateStream(response, setReply, 22);
    setThinking(false);
  };

  return (
    <div className="home-shell page-container max-w-4xl">
      <LandingMotionLayer scrollY={scrollY} progress={progress} />

      <LandingReveal className="home-hero">
        <ShinyText as="h1" className="landing-hero__title">
          智慧学习中心
        </ShinyText>
        <p className="home-hero__sub">为你定制学习方案</p>
        <p className="landing-hero__desc home-hero__desc">
          告诉我你的专业、目标和薄弱点，系统将生成学习路径与配套资源
        </p>
      </LandingReveal>

      <LandingReveal delay={60}>
        <LandingTiltCard className="home-onboard landing-glass-card" intensity={4}>
          <div className="home-onboard__inner">
            <div className="flex gap-4 mb-5">
              <AgentAvatar thinking={thinking} done={showReply && !thinking} />
              <div className="flex-1 min-w-0">
                <p className="home-onboard__label">可以按下面几点介绍自己：</p>
                <ul className="home-onboard__tips">
                  <li>专业 / 课程方向</li>
                  <li>学习目标（如期末 80 分）</li>
                  <li>当前水平与薄弱知识点</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {examples.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => handleSubmit(ex)}>
                  {ex}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="例：计算机大二，复习数据结构，薄弱二叉树..."
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={thinking}
                className="btn-primary px-5 shrink-0"
              >
                {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>

            {showReply && (
              <div className="mt-6 p-4 landing-glass-inner">
                {thinking && !reply ? (
                  <div className="flex items-center gap-2 text-sm home-onboard__muted">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    正在生成学习画像...
                  </div>
                ) : (
                  <div className="markdown-body text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply}</ReactMarkdown>
                  </div>
                )}
                {!thinking && profileInitialized && (
                  <button
                    type="button"
                    onClick={() => navigate("/path")}
                    className="mt-4 landing-btn-glass text-sm py-2 px-4"
                  >
                    查看学习路径 <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </LandingTiltCard>
      </LandingReveal>

      <LandingReveal
        as="section"
        className="home-flowing landing-section-frame landing-reveal--cards"
        delay={100}
      >
        <div className="landing-panel__head home-flowing__head">
          <h2>快捷入口</h2>
          <span>悬停查看流动导航</span>
        </div>
        <FlowingMenu
          variant="stack"
          items={flowingItems}
          textColor="var(--landing-text)"
          bgColor="transparent"
          marqueeBgColor="var(--color-primary, #4f46e5)"
          marqueeTextColor="#ffffff"
          borderColor="var(--glass-card-border, rgba(199, 210, 254, 0.55))"
          className="home-flowing__menu"
        />
      </LandingReveal>

      <LandingReveal delay={140}>
        <MultiAgentStrip landing />
      </LandingReveal>
    </div>
  );
}
