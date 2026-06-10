/**
 * @file Home.tsx
 * @description 登录后工作台：冷启动引导 → /chat（agent-service）；已有画像 → 驾驶舱（store）
 * @backend POST /api/agent/chat 仅在 /chat 调用；画像/路径/评估待后续接口
 */
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Send,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Route,
  Brain,
  BarChart3,
  Boxes,
  ShieldCheck,
  CalendarCheck,
  Camera,
  type LucideIcon,
} from "lucide-react";
import AgentAvatar from "../components/chat/AgentAvatar";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import { useAppStore } from "../store/useAppStore";
import {
  formatDashboardSubtitle,
  formatProfileCardHint,
  getLastUserChatPreview,
} from "../lib/profileDisplay";
import type { ResourceType } from "../types";

const PROFILE_EXAMPLES = [
  "计算机科学与技术 - 数据结构，期末 85 分",
  "薄弱点：二叉树、图算法，偏好视频学习",
  "学过一半，需要生成专属学习路径",
];

const AGENT_PIPELINE = [
  { icon: Brain, label: "画像智能体" },
  { icon: Boxes, label: "资源生成" },
  { icon: Route, label: "路径规划" },
  { icon: ShieldCheck, label: "内容审核" },
];

const TOOL_LINKS: { to: string; label: string; desc: string; icon: LucideIcon }[] = [
  { to: "/analytics", label: "效果评估", desc: "学习数据与薄弱点分析", icon: BarChart3 },
  { to: "/plan", label: "今日计划", desc: "每日任务与节奏安排", icon: CalendarCheck },
  { to: "/scan", label: "拍照搜题", desc: "拍照识别 · 逐步讲解", icon: Camera },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, profileInitialized, pathStages, messages, user } = useAppStore();
  const [input, setInput] = useState("");

  const hasPath = pathStages.length > 0;
  const pathProgress = useMemo(() => {
    if (!hasPath) return null;
    const topics = pathStages.flatMap((s) => s.topics);
    if (!topics.length) return 0;
    const sum = topics.reduce((n, t) => n + (t.progress ?? 0), 0);
    return Math.round(sum / topics.length);
  }, [pathStages, hasPath]);

  const lastChatPreview = getLastUserChatPreview(messages);
  const hasChatHistory = Boolean(lastChatPreview);
  const displayName = profile.name || user?.username || "学习者";

  const goToChat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    navigate("/chat", { state: { initialMessage: trimmed } });
  };

  const goToChatWithIntent = (key: ResourceType) => {
    navigate(`/chat?intent=${key}`);
  };

  const profileHint = formatProfileCardHint(profile);

  if (profileInitialized) {
    return (
      <ScholarPageShell maxWidth="5xl">
        <ScholarPageHeader
          badge="学习驾驶舱"
          title={`你好，${displayName}`}
          subtitle={formatDashboardSubtitle(profile)}
        />

        <div className="home-dashboard-grid">
          <Link to="/profile" className="home-dashboard-card scholar-card p-5 no-underline">
            <span className="home-dashboard-card__icon" aria-hidden>
              <Brain size={18} strokeWidth={1.75} />
            </span>
            <p className="text-xs text-[var(--scholar-text-muted)]">画像健康度</p>
            <p className="text-3xl font-bold text-[var(--scholar-primary)] tabular-nums mt-1">
              {profile.healthScore}%
            </p>
            <p className="text-sm text-[var(--scholar-text-secondary)] mt-2 line-clamp-2">
              {profileHint}
            </p>
            <span className="home-dashboard-card__link">
              查看六维画像 <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/path" className="home-dashboard-card scholar-card p-5 no-underline">
            <span className="home-dashboard-card__icon" aria-hidden>
              <Route size={18} strokeWidth={1.75} />
            </span>
            <p className="text-xs text-[var(--scholar-text-muted)]">学习路径</p>
            {hasPath ? (
              <>
                <p className="text-3xl font-bold text-[var(--scholar-primary)] tabular-nums mt-1">
                  {pathProgress}%
                </p>
                <p className="text-sm text-[var(--scholar-text-secondary)] mt-2 line-clamp-2">
                  {pathStages[0]?.title} · 共 {pathStages.length} 阶段
                </p>
                <span className="home-dashboard-card__link">
                  继续学习 <ArrowRight size={14} />
                </span>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-[var(--scholar-text)] mt-2">尚未规划</p>
                <p className="text-sm text-[var(--scholar-text-muted)] mt-1">
                  在智能辅导中描述需求，生成路径后将显示进度
                </p>
                <span className="home-dashboard-card__link">
                  去生成路径 <ArrowRight size={14} />
                </span>
              </>
            )}
          </Link>

          <Link to="/chat" className="home-dashboard-card scholar-card p-5 no-underline">
            <span className="home-dashboard-card__icon" aria-hidden>
              <MessageSquare size={18} strokeWidth={1.75} />
            </span>
            <p className="text-xs text-[var(--scholar-text-muted)]">智能辅导</p>
            <p className="text-lg font-semibold text-[var(--scholar-text)] mt-1">
              {hasChatHistory ? "继续上次对话" : "开始新对话"}
            </p>
            <p className="text-sm text-[var(--scholar-text-muted)] mt-1 truncate">
              {lastChatPreview ?? "向助手提问或生成学习资源"}
            </p>
            <span className="home-dashboard-card__link">
              进入辅导 <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        <section className="scholar-card home-dashboard-panel">
          <div className="home-dashboard-panel__resources">
            <h2 className="home-dashboard-panel__title">多智能体资源生成</h2>
            <p className="home-dashboard-panel__desc">
              选择资源类型，进入智能辅导后由多智能体协同为你生成学习内容
            </p>
            <ResourceTypeStrip mode="interactive" onSelect={goToChatWithIntent} />
          </div>
          <div className="home-dashboard-panel__tools">
            <h2 className="home-dashboard-panel__title">学习工具</h2>
            <div className="home-tool-grid">
              {TOOL_LINKS.map(({ to, label, desc, icon: Icon }) => (
                <Link key={to} to={to} className="home-tool-tile no-underline">
                  <span className="home-tool-tile__icon" aria-hidden>
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <span className="home-tool-tile__label">{label}</span>
                  <span className="home-tool-tile__desc">{desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </ScholarPageShell>
    );
  }

  return (
    <ScholarPageShell maxWidth="5xl">
      <ScholarPageHeader
        badge="第一步 · 学习画像"
        title="先构建你的学习画像"
        subtitle="赛题要求：对话式抽取 ≥6 维特征，完成后才开放学习驾驶舱"
      />

      <ol className="home-onboard-steps">
        <li className="home-onboard-steps__item home-onboard-steps__item--active">
          <span>1</span> 对话描述学习背景
        </li>
        <li className="home-onboard-steps__item">
          <span>2</span> 生成六维画像
        </li>
        <li className="home-onboard-steps__item">
          <span>3</span> 进入学习驾驶舱
        </li>
      </ol>

      <section className="scholar-card p-5 md:p-6 mb-6 home-onboard">
        <div className="flex gap-4 mb-5">
          <AgentAvatar />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--scholar-text)] flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--scholar-primary)]" aria-hidden />
              开始构建你的学习画像
            </p>
            <p className="text-xs text-[var(--scholar-text-muted)] mt-1">
              用自然语言描述即可，无需填表；提交后进入<strong>智能辅导</strong>开始对话。
            </p>
            <ul className="mt-2 text-sm text-[var(--scholar-text-muted)] space-y-1 list-disc list-inside">
              <li>专业 / 课程方向</li>
              <li>学习目标（如期末 80 分）</li>
              <li>当前水平与薄弱知识点</li>
            </ul>
          </div>
        </div>

        <p className="text-xs font-medium text-[var(--scholar-text-muted)] mb-2">
          完成画像后，可生成以下类型资源（预览）
        </p>
        <ResourceTypeStrip mode="static" />

        <div className="home-agent-pipeline" aria-label="多智能体协作流程">
          {AGENT_PIPELINE.map(({ icon: Icon, label }, i) => (
            <span key={label} className="home-agent-pipeline__item">
              {i > 0 && <span className="home-agent-pipeline__arrow" aria-hidden>→</span>}
              <Icon size={14} strokeWidth={1.75} />
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
              onClick={() => goToChat(ex)}
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
                goToChat(input);
              }
            }}
            placeholder="例：计算机大二，复习数据结构，薄弱二叉树…"
            className="doubao-composer__input"
            rows={2}
            aria-label="学习背景描述"
          />
          <div className="doubao-composer__toolbar">
            <p className="text-[10px] text-[var(--scholar-text-muted)]">
              按 Enter 发送 · 将进入智能辅导
            </p>
            <button
              type="button"
              onClick={() => goToChat(input)}
              disabled={!input.trim()}
              className="doubao-composer__send"
              aria-label="开始对话"
            >
              <Send size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>
    </ScholarPageShell>
  );
}
