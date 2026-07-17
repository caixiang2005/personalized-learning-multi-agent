/**
 * @file ProfileBuildSection.tsx
 * @description 首页 · 对话式学习画像自主构建入口
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles } from "lucide-react";
import AgentAvatar from "../chat/AgentAvatar";
import ResourceTypeStrip from "../scholar/ResourceTypeStrip";
import AnimeStagger from "../motion/AnimeStagger";
import AnimeReveal from "../motion/AnimeReveal";
import { PROFILE_BUILD_PATH } from "../../lib/navConfig";

const PROFILE_EXAMPLES = [
  "我是软件工程专业，正在学数据结构",
  "目标是期末考 85 分以上",
  "薄弱点：二叉树、图算法，偏好视频学习",
];

const DEMO_TURNS = [
  {
    role: "assistant" as const,
    text: "你好！请用自然语言告诉我：专业 / 课程、学习目标、当前水平与薄弱点。",
  },
  {
    role: "user" as const,
    text: "计算机大二，复习数据结构，二叉树和图比较薄弱，想期末 80+。",
  },
  {
    role: "assistant" as const,
    text: "收到。你还偏好哪种学习方式？我可以据此生成文档、导图或推荐视频。",
  },
];

const SIX_DIMENSIONS = [
  "知识掌握",
  "习题完成",
  "专注度",
  "薄弱点改善",
  "学习效率",
  "提升趋势",
];

const AGENT_PIPELINE = [
  "画像智能体",
  "资源生成",
  "路径规划",
  "内容审核",
];

export default function ProfileBuildSection() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const goToProfileAgent = (text?: string) => {
    const trimmed = text?.trim() ?? "";
    navigate(PROFILE_BUILD_PATH, {
      state: trimmed ? { initialMessage: trimmed } : undefined,
    });
  };

  return (
    <>
      <AnimeStagger as="ol" className="home-onboard-steps" staggerMs={90} y={12}>
        <li className="home-onboard-steps__item home-onboard-steps__item--active">
          <span>1</span> 对话描述学习背景
        </li>
        <li className="home-onboard-steps__item">
          <span>2</span> 生成六维画像
        </li>
        <li className="home-onboard-steps__item">
          <span>3</span> 进入学习驾驶舱
        </li>
      </AnimeStagger>

      <AnimeReveal as="section" className="scholar-card profile-build" y={18} delay={80}>
        <div className="profile-build__header">
          <AgentAvatar />
          <div className="profile-build__intro">
            <p className="profile-build__title">
              <Sparkles size={16} className="text-[var(--scholar-primary)]" aria-hidden />
              对话式学习画像 · 自主构建
            </p>
            <p className="profile-build__desc">
              通过<strong>画像智能体</strong>多轮对话抽取六维学习特征，无需填表。
              完成后生成专属画像，并开放学习驾驶舱与智能辅导。
            </p>
          </div>
        </div>

        <AnimeStagger className="profile-build__demo" aria-label="对话示例" staggerMs={100} y={14} delay={120}>
          {DEMO_TURNS.map((turn, i) => (
            <div
              key={i}
              className={`profile-build__turn profile-build__turn--${turn.role}`}
            >
              {turn.role === "assistant" && (
                <span className="profile-build__turn-label">画像智能体</span>
              )}
              <p>{turn.text}</p>
            </div>
          ))}
        </AnimeStagger>

        <AnimeStagger className="profile-build__dims" aria-label="将生成的六维画像" staggerMs={55} y={10} delay={200}>
          {SIX_DIMENSIONS.map((label) => (
            <span key={label} className="profile-build__dim-chip">
              {label}
            </span>
          ))}
        </AnimeStagger>

        <p className="profile-build__resource-hint">
          完成画像后，可协同生成以下类型资源
        </p>
        <AnimeStagger selector=".scholar-resource-pill" staggerMs={50} y={8} delay={240}>
          <ResourceTypeStrip mode="static" />
        </AnimeStagger>

        <div className="home-agent-pipeline" aria-label="多智能体协作流程">
          {AGENT_PIPELINE.map((label, i) => (
            <span key={label} className="home-agent-pipeline__item">
              {i > 0 && <span className="home-agent-pipeline__arrow" aria-hidden>→</span>}
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          {PROFILE_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="doubao-suggest-chip"
              onClick={() => goToProfileAgent(ex)}
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="doubao-composer__box">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                goToProfileAgent(input);
              }
            }}
            placeholder="从这里开始：专业、课程、目标、薄弱点…"
            className="doubao-composer__input"
            rows={2}
            aria-label="学习背景描述"
          />
          <div className="doubao-composer__toolbar">
            <p className="text-[10px] text-[var(--scholar-text-muted)]">
              按 Enter 发送 · 进入画像智能体
            </p>
            <button
              type="button"
              onClick={() => goToProfileAgent(input)}
              disabled={!input.trim()}
              className="doubao-composer__send"
              aria-label="开始与画像智能体对话"
            >
              <Send size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="profile-build__cta-secondary"
          onClick={() => goToProfileAgent()}
        >
          进入画像智能体 · 开始多轮对话
        </button>
      </AnimeReveal>
    </>
  );
}
