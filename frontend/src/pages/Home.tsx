/**
 * @file Home.tsx
 * @description 登录后首页：学习背景引导、画像反馈、Flowing Menu 快捷导航。
 * @route /home
 *
 * 【当前 Mock】handleSubmit 用 simulateStream 输出固定 Markdown，setProfile 只改本地 store。
 * 【待同步后端】
 *   - 提交背景 → POST /api/learning-path/generate（body: 用户输入全文）
 *   - 响应中的画像摘要、路径是否创建，写入 store 或跳转 /path
 *   - 流式文案若后端 SSE 返回，改用 streamChat 或接口中的 stream 字段
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Sparkles, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentAvatar from "../components/chat/AgentAvatar";
import FlowingMenu from "../components/layout/FlowingMenu";
import MultiAgentStrip from "../components/home/MultiAgentStrip";
import { useAppStore } from "../store/useAppStore";
import { simulateStream } from "../lib/stream";

const flowingItems = [
  { link: "/path", text: "学习路径", image: "linear-gradient(135deg, #165dff, #4f8cff)" },
  { link: "/profile", text: "学习画像", image: "linear-gradient(135deg, #36d399, #6ee7b7)" },
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

    // 【待同步后端】POST /api/learning-path/generate  { rawText: content }
    const response =
      "已根据你的描述生成初步学习画像，并为你规划学习路径。\n\n**画像摘要：**\n- 知识基础：数据结构中等\n- 薄弱点：二叉树、图算法\n- 学习偏好：视频 + 练习\n\n可从下方入口进入各模块。";

    await simulateStream(response, setReply, 22);
    setThinking(false);
  };

  return (
    <div className="page-container max-w-4xl">
      <section className="text-center mb-10 animate-fade-in">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-medium rounded-full bg-primary/10 text-primary">
          <Sparkles size={14} />
          个性化学习平台
        </span>
        <h1 className="text-3xl md:text-[2rem] font-bold text-gray-900 dark:text-white leading-snug tracking-tight">
          智慧学习中心
          <br className="hidden sm:block" />
          <span className="text-lg md:text-xl font-normal text-gray-500 mt-2 block">为你定制学习方案</span>
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-base max-w-lg mx-auto">
          告诉我你的专业、目标和薄弱点，系统将生成学习路径与配套资源
        </p>
      </section>

      <section className="section-card mb-8">
        <div className="flex gap-4 mb-5">
          <AgentAvatar thinking={thinking} done={showReply && !thinking} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">可以按下面几点介绍自己：</p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                专业 / 课程方向
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                学习目标（如期末 80 分）
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                当前水平与薄弱知识点
              </li>
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
          <button type="button" onClick={() => handleSubmit()} disabled={thinking} className="btn-primary px-5 shrink-0">
            {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        {showReply && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/8 to-accent/8 border border-primary/15 animate-fade-in">
            {thinking && !reply ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin text-primary" />
                正在生成学习画像...
              </div>
            ) : (
              <div className="markdown-body text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply}</ReactMarkdown>
              </div>
            )}
            {!thinking && profileInitialized && (
              <button type="button" onClick={() => navigate("/path")} className="mt-4 btn-primary text-sm py-2">
                查看学习路径 <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">快捷入口</h2>
        <p className="text-xs text-gray-400 mb-3">悬停查看流动导航动效</p>
        <FlowingMenu
          variant="stack"
          items={flowingItems}
          textColor="#1d2129"
          bgColor="rgba(255,255,255,0.6)"
          marqueeBgColor="#165dff"
          marqueeTextColor="#ffffff"
          borderColor="rgba(22,93,255,0.12)"
          className="section-card !p-0 overflow-hidden dark:[&_.menu__item-link]:text-gray-100"
        />
      </section>

      <MultiAgentStrip compact />
    </div>
  );
}
