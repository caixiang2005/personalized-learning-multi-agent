/**
 * @file Home.tsx
 * @description 登录后工作台：画像引导对话 + 比赛能力矩阵 + 快捷入口
 * @route /home
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowRight, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentAvatar from "../components/chat/AgentAvatar";
import FlowingMenu from "../components/layout/FlowingMenu";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import CapabilityGrid from "../components/scholar/CapabilityGrid";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import StreamProgress from "../components/scholar/StreamProgress";
import { useAppStore } from "../store/useAppStore";
import { simulateStream } from "../lib/stream";

const flowingItems = [
  { link: "/plan", text: "日计划", image: "linear-gradient(135deg, #0b6e83, #14b8a6)" },
  { link: "/scan", text: "拍照搜题", image: "linear-gradient(135deg, #1496a9, #5ecadb)" },
  { link: "/path", text: "学习路径", image: "linear-gradient(135deg, #0b6e83, #1496a9)" },
  { link: "/profile", text: "学习画像", image: "linear-gradient(135deg, #c27803, #e8a849)" },
  { link: "/chat", text: "学习对话", image: "linear-gradient(135deg, #14b8a6, #0b6e83)" },
  { link: "/analytics", text: "效果评估", image: "linear-gradient(135deg, #b45309, #fbbf24)" },
];

const examples = [
  "计算机科学与技术 - 数据结构，期末 85 分",
  "薄弱点：二叉树、图算法，偏好视频学习",
  "学过一半，需要生成专属学习路径",
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, setProfile, setProfileInitialized, profileInitialized } = useAppStore();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamPct, setStreamPct] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);

  const handleSubmit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput(content);
    setThinking(true);
    setShowReply(true);
    setReply("");
    setStreamPct(0);

    const tick = setInterval(() => {
      setStreamPct((p) => (p !== null && p < 92 ? p + 8 : p));
    }, 180);

    setProfile({
      major: content.includes("数据结构") ? "计算机科学与技术 - 数据结构" : profile.major,
      level: content,
      name: "学习者",
    });
    setProfileInitialized(true);

    const response =
      "已根据你的描述生成初步学习画像，并为你规划学习路径。\n\n**画像摘要：**\n- 知识基础：数据结构中等\n- 薄弱点：二叉树、图算法\n- 学习偏好：视频 + 练习\n\n可从下方能力入口继续学习。";

    await simulateStream(response, setReply, 22);
    clearInterval(tick);
    setStreamPct(100);
    setTimeout(() => setStreamPct(null), 400);
    setThinking(false);
  };

  return (
    <ScholarPageShell maxWidth="5xl">
      <ScholarPageHeader
        badge="个性化学习多智能体"
        title="智慧学习中心"
        subtitle="对话构建画像 · 多智能体生成资源 · 路径规划与效果评估"
      />

      <section className="scholar-card p-5 md:p-6 mb-6">
        <div className="flex gap-4 mb-5">
          <AgentAvatar thinking={thinking} done={showReply && !thinking} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--scholar-text)] flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--scholar-primary)]" aria-hidden />
              开始构建你的学习画像
            </p>
            <ul className="mt-2 text-sm text-[var(--scholar-text-muted)] space-y-1 list-disc list-inside">
              <li>专业 / 课程方向</li>
              <li>学习目标（如期末 80 分）</li>
              <li>当前水平与薄弱知识点</li>
            </ul>
          </div>
        </div>

        <ResourceTypeStrip />

        <div className="flex flex-wrap gap-2 mt-4 mb-4">
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
            placeholder="例：计算机大二，复习数据结构，薄弱二叉树…"
            className="input-field flex-1"
            aria-label="学习背景描述"
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={thinking}
            className="btn-primary px-5 shrink-0 cursor-pointer"
            aria-label="发送"
          >
            {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        <StreamProgress progress={streamPct} label="正在分析并生成画像" />

        {showReply && (
          <div className="mt-5 p-4 rounded-[var(--scholar-radius-md)] border border-[var(--scholar-border)] bg-[color-mix(in_srgb,var(--scholar-primary)_4%,var(--scholar-card))]">
            {thinking && !reply ? (
              <div className="flex items-center gap-2 text-sm text-[var(--scholar-text-muted)]">
                <Loader2 size={16} className="animate-spin text-[var(--scholar-primary)]" />
                流式生成中…
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
                className="mt-4 btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2 cursor-pointer"
              >
                查看学习路径 <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold text-[var(--scholar-text)] mb-3">平台核心能力</h2>
        <CapabilityGrid />
      </section>

      <section className="scholar-card overflow-hidden p-0 mb-6">
        <div className="px-5 py-4 border-b border-[var(--scholar-border)] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--scholar-text)]">快捷入口</h2>
          <span className="text-xs text-[var(--scholar-text-muted)]">悬停展开流动导航</span>
        </div>
        <FlowingMenu
          variant="stack"
          items={flowingItems}
          textColor="var(--scholar-text)"
          bgColor="transparent"
          marqueeBgColor="var(--scholar-primary)"
          marqueeTextColor="#ffffff"
          borderColor="var(--scholar-border)"
          className="home-flowing__menu"
        />
      </section>
    </ScholarPageShell>
  );
}
