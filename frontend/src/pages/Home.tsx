/**
 * @file Home.tsx
 * @description 登录后工作台：主内容区 + 右侧组件栏
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
  Sparkles,
  Clock,
  Layers,
  Bot,
  Settings,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import ProfileBuildSection from "../components/home/ProfileBuildSection";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import HomeSidebar from "../components/home/HomeSidebar";
import ScholarDashboardLayout, { DashboardHealthAside } from "../components/dashboard/ScholarDashboardLayout";
import AnimeStagger from "../components/motion/AnimeStagger";
import AnimeReveal from "../components/motion/AnimeReveal";
import { useAppStore } from "../store/useAppStore";
import {
  formatDashboardSubtitle,
  formatProfileCardHint,
  getLastUserChatPreview,
} from "../lib/profileDisplay";
import { shouldShowDashboard } from "../lib/profileReady";
import { PATH_VIEW_PATH } from "../lib/pathRoutes";
import type { ResourceType } from "../types";

const TOOL_LINKS: { to: string; label: string; desc: string; icon: LucideIcon }[] = [
  { to: "/analytics", label: "效果评估", desc: "学习数据与薄弱点分析", icon: BarChart3 },
  { to: "/plan", label: "今日计划", desc: "每日任务与节奏安排", icon: CalendarCheck },
  { to: "/scan", label: "拍照搜题", desc: "拍照识别 · 逐步讲解", icon: Camera },
  { to: "/exercise/ai-generate", label: "AI 出题", desc: "智能生成练习题 · AI 批改", icon: ClipboardList },
  { to: "/exercise/bank", label: "习题银行", desc: "查看历史练习记录", icon: Brain },
  { to: "/settings", label: "系统设置", desc: "账号安全 · 显示偏好", icon: Settings },
];

function formatTodayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

export default function Home() {
  const navigate = useNavigate();
  const {
    profile,
    profileInitialized,
    pathStages,
    tutorMessages,
    user,
  } = useAppStore();

  const hasPath = pathStages.length > 0;
  const pathProgress = useMemo(() => {
    if (!hasPath) return null;
    const topics = pathStages.flatMap((s) => s.topics);
    if (!topics.length) return 0;
    const sum = topics.reduce((n, t) => n + (t.progress ?? 0), 0);
    return Math.round(sum / topics.length);
  }, [pathStages, hasPath]);

  const resourceCount = useMemo(
    () => pathStages.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.resources.length, 0), 0),
    [pathStages]
  );

  const lastChatPreview = getLastUserChatPreview(tutorMessages);
  const hasChatHistory = Boolean(lastChatPreview);
  const displayName = profile.name || user?.username || "学习者";
  const showDashboard = shouldShowDashboard(profile, profileInitialized);
  const profileHint = formatProfileCardHint(profile);

  const goToChatWithIntent = (key: ResourceType) => {
    navigate(`/chat?intent=${key}`);
  };

  if (!showDashboard) {
    return (
      <ScholarDashboardLayout
        badge="第一步 · 学习画像"
        title={`你好，${displayName}`}
        subtitle="先通过对话构建学习画像，完成后自动开放学习驾驶舱"
      >
        <ProfileBuildSection />
      </ScholarDashboardLayout>
    );
  }

  const continueItems = [
    {
      key: "path",
      to: hasPath ? PATH_VIEW_PATH : "/path",
      icon: Route,
      title: hasPath ? pathStages[0]?.title ?? "我的学习路径" : "规划学习路径",
      meta: hasPath
        ? `${pathStages.length} 阶段 · 完成度 ${pathProgress}%`
        : "路径智能体 · 分阶段资源推送",
      progress: pathProgress ?? 0,
      action: hasPath ? "继续学习" : "开始规划",
    },
    {
      key: "chat",
      to: "/chat",
      icon: MessageSquare,
      title: hasChatHistory ? "继续智能辅导" : "开始智能辅导",
      meta: lastChatPreview ?? "向助手提问或生成学习资源",
      progress: hasChatHistory ? 35 : 0,
      action: "进入对话",
    },
    {
      key: "profile",
      to: "/profile",
      icon: Brain,
      title: "学习画像",
      meta: profileHint,
      progress: profile.healthScore,
      action: "查看画像",
    },
  ] as const;

  return (
    <ScholarDashboardLayout
      eyebrow={
        <p className="home-cockpit__date">
          <Clock size={14} strokeWidth={1.75} aria-hidden />
          {formatTodayLabel()}
        </p>
      }
      title="今天，从哪里继续？"
      subtitle={formatDashboardSubtitle(profile)}
      aside={<DashboardHealthAside score={profile.healthScore} />}
      sidebar={<HomeSidebar />}
    >
      <AnimeStagger className="home-stats" staggerMs={60} y={12} delay={70}>
        <div className="home-stats__item">
          <Bot size={16} strokeWidth={1.75} aria-hidden />
          <span className="home-stats__num">5</span>
          <span className="home-stats__label">协同智能体</span>
        </div>
        <div className="home-stats__item">
          <Layers size={16} strokeWidth={1.75} aria-hidden />
          <span className="home-stats__num">{resourceCount || "—"}</span>
          <span className="home-stats__label">路径资源</span>
        </div>
        <div className="home-stats__item">
          <Route size={16} strokeWidth={1.75} aria-hidden />
          <span className="home-stats__num">{pathStages.length || "—"}</span>
          <span className="home-stats__label">学习阶段</span>
        </div>
        <div className="home-stats__item">
          <Sparkles size={16} strokeWidth={1.75} aria-hidden />
          <span className="home-stats__num">{profile.learnerDimensions.length || 6}</span>
          <span className="home-stats__label">画像维度</span>
        </div>
      </AnimeStagger>

      <AnimeReveal as="section" className="section-card home-continue" y={14} delay={100}>
        <div className="home-continue__head">
          <h2 className="home-continue__title">继续学习</h2>
          <p className="home-continue__desc">从上次进度接着走，或开启新的辅导会话</p>
        </div>
        <ul className="home-continue__list">
          {continueItems.map((item) => (
            <li key={item.key}>
              <Link to={item.to} className="home-continue__row no-underline">
                <span className="home-continue__icon" aria-hidden>
                  <item.icon size={18} strokeWidth={1.75} />
                </span>
                <span className="home-continue__body">
                  <span className="home-continue__row-title">{item.title}</span>
                  <span className="home-continue__row-meta">{item.meta}</span>
                  <span className="home-continue__progress-track">
                    <span
                      className="home-continue__progress-fill"
                      style={{ width: `${Math.min(100, item.progress)}%` }}
                    />
                  </span>
                </span>
                <span className="home-continue__action">
                  {item.action}
                  <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card home-panel" y={14} delay={120}>
        <h2 className="home-panel__title">多智能体资源生成</h2>
        <p className="home-panel__desc">
          选择资源类型，进入智能辅导后由多智能体协同生成学习内容
        </p>
        <ResourceTypeStrip mode="interactive" onSelect={goToChatWithIntent} />
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card home-panel home-panel--tools" y={14} delay={140}>
        <h2 className="home-panel__title">学习工具</h2>
        <div className="home-tools-grid">
          {TOOL_LINKS.map(({ to, label, desc, icon: Icon }) => (
            <Link key={to} to={to} className="home-tools-grid__item no-underline">
              <span className="home-tools-grid__icon" aria-hidden>
                <Icon size={17} strokeWidth={1.75} />
              </span>
              <span className="home-tools-grid__label">{label}</span>
              <span className="home-tools-grid__desc">{desc}</span>
            </Link>
          ))}
        </div>
      </AnimeReveal>
    </ScholarDashboardLayout>
  );
}
