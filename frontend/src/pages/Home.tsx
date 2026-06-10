/**
 * @file Home.tsx
 * @description 登录后工作台：未完成画像 → 对话式构建；已完成 → 学习驾驶舱
 * @backend POST /api/agent/chat 仅在 /chat 调用；画像/路径/评估待后续接口
 */
import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  Route,
  Brain,
  BarChart3,
  CalendarCheck,
  Camera,
  type LucideIcon,
} from "lucide-react";
import ProfileBuildSection from "../components/home/ProfileBuildSection";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import ScholarPageShell from "../components/scholar/ScholarPageShell";
import ScholarPageHeader from "../components/scholar/ScholarPageHeader";
import AnimeStagger from "../components/motion/AnimeStagger";
import AnimeReveal from "../components/motion/AnimeReveal";
import { useAppStore } from "../store/useAppStore";
import {
  formatDashboardSubtitle,
  formatProfileCardHint,
  getLastUserChatPreview,
} from "../lib/profileDisplay";
import { shouldShowDashboard } from "../lib/profileReady";
import type { ResourceType } from "../types";

const TOOL_LINKS: { to: string; label: string; desc: string; icon: LucideIcon }[] = [
  { to: "/analytics", label: "效果评估", desc: "学习数据与薄弱点分析", icon: BarChart3 },
  { to: "/plan", label: "今日计划", desc: "每日任务与节奏安排", icon: CalendarCheck },
  { to: "/scan", label: "拍照搜题", desc: "拍照识别 · 逐步讲解", icon: Camera },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, profileInitialized, pathStages, tutorMessages, user } = useAppStore();

  const hasPath = pathStages.length > 0;
  const pathProgress = useMemo(() => {
    if (!hasPath) return null;
    const topics = pathStages.flatMap((s) => s.topics);
    if (!topics.length) return 0;
    const sum = topics.reduce((n, t) => n + (t.progress ?? 0), 0);
    return Math.round(sum / topics.length);
  }, [pathStages, hasPath]);

  const lastChatPreview = getLastUserChatPreview(tutorMessages);
  const hasChatHistory = Boolean(lastChatPreview);
  const displayName = profile.name || user?.username || "学习者";
  const showDashboard = shouldShowDashboard(profile, profileInitialized);

  const goToChatWithIntent = (key: ResourceType) => {
    navigate(`/chat?intent=${key}`);
  };

  const profileHint = formatProfileCardHint(profile);

  if (!showDashboard) {
    return (
      <ScholarPageShell maxWidth="5xl">
        <ScholarPageHeader
          badge="第一步 · 学习画像"
          title={`你好，${displayName}`}
          subtitle="先通过对话构建学习画像，完成后自动开放学习驾驶舱"
        />
        <ProfileBuildSection />
      </ScholarPageShell>
    );
  }

  return (
    <ScholarPageShell maxWidth="5xl">
      <ScholarPageHeader
        badge="学习驾驶舱"
        title={`你好，${displayName}`}
        subtitle={formatDashboardSubtitle(profile)}
      />

      <AnimeStagger className="home-dashboard-grid" staggerMs={90} y={20} delay={80}>
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
      </AnimeStagger>

      <AnimeReveal as="section" className="scholar-card home-dashboard-panel" y={16} delay={160}>
        <div className="home-dashboard-panel__resources">
          <h2 className="home-dashboard-panel__title">多智能体资源生成</h2>
          <p className="home-dashboard-panel__desc">
            选择资源类型，进入智能辅导后由多智能体协同为你生成学习内容
          </p>
          <AnimeStagger selector=".scholar-resource-pill" staggerMs={55} y={10} delay={200}>
            <ResourceTypeStrip mode="interactive" onSelect={goToChatWithIntent} />
          </AnimeStagger>
        </div>
        <div className="home-dashboard-panel__tools">
          <h2 className="home-dashboard-panel__title">学习工具</h2>
          <AnimeStagger className="home-tool-grid" staggerMs={65} y={12} delay={220}>
            {TOOL_LINKS.map(({ to, label, desc, icon: Icon }) => (
              <Link key={to} to={to} className="home-tool-tile no-underline">
                <span className="home-tool-tile__icon" aria-hidden>
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <span className="home-tool-tile__label">{label}</span>
                <span className="home-tool-tile__desc">{desc}</span>
              </Link>
            ))}
          </AnimeStagger>
        </div>
      </AnimeReveal>
    </ScholarPageShell>
  );
}
