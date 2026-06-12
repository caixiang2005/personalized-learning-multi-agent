/**
 * 首页专用右侧栏
 */
import { Link } from "react-router-dom";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import UserAvatar from "../account/UserAvatar";
import AnimeReveal from "../motion/AnimeReveal";
import { useAppStore } from "../../store/useAppStore";
import { HOME_AGENT_STATUS } from "../../lib/homeAgentStatus";
import { PATH_VIEW_PATH, PATH_PLAN_PATH } from "../../lib/pathRoutes";

export default function HomeSidebar() {
  const { profile, pathStages, user, userAvatarUrl, avatarCacheVersion } = useAppStore();
  const userId = user?.userId ?? 1;
  const displayName = profile.name || user?.username || "学习者";
  const username = user?.username ?? "";
  const hasPath = pathStages.length > 0;
  const topWeakPoints = profile.weakPoints.slice(0, 2);
  const activeAgents = HOME_AGENT_STATUS.filter((a) => a.status !== "idle").slice(0, 3);

  return (
    <>
      <AnimeReveal as="section" className="section-card home-profile-card" y={14} delay={110}>
        <div className="home-profile-card__user">
          <UserAvatar
            userId={userId}
            displayName={displayName}
            username={username}
            avatarUrl={userAvatarUrl}
            avatarVersion={avatarCacheVersion}
            size="lg"
          />
          <div>
            <p className="home-profile-card__name">{displayName}</p>
            <p className="home-profile-card__major">{profile.major || "未设置专业"}</p>
          </div>
        </div>
        {profile.goal && (
          <p className="home-profile-card__goal-line">
            <Target size={14} aria-hidden />
            {profile.goal}
          </p>
        )}
        {profile.goalProgress?.label && (
          <div className="home-profile-card__goal-track">
            <div className="home-profile-card__goal-track-head">
              <span>目标进展</span>
              <span>
                {profile.goalProgress.percent > 0 ? `${profile.goalProgress.percent}%` : "待跟踪"}
              </span>
            </div>
            <div className="home-profile-card__goal-bar">
              <span style={{ width: `${Math.max(profile.goalProgress.percent, 4)}%` }} />
            </div>
          </div>
        )}
        {topWeakPoints.length > 0 && (
          <ul className="home-profile-card__weak">
            {topWeakPoints.map((w) => (
              <li key={w.name}>{w.name}</li>
            ))}
          </ul>
        )}
        <Link to="/profile" className="home-profile-card__link">
          查看完整画像 <ArrowRight size={14} />
        </Link>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card home-rail-tips" y={14} delay={150}>
        <h2 className="home-rail__title">
          <TrendingUp size={14} aria-hidden /> 今日建议
        </h2>
        <ul className="home-rail-tips__list">
          <li>
            <Link to="/chat" className="home-rail-tips__link no-underline">
              用智能辅导巩固薄弱知识点
            </Link>
          </li>
          <li>
            <Link to={hasPath ? PATH_VIEW_PATH : PATH_PLAN_PATH} className="home-rail-tips__link no-underline">
              {hasPath ? "继续路径中的下一阶段" : "先完成路径智能体规划"}
            </Link>
          </li>
          <li>
            <Link to="/plan" className="home-rail-tips__link no-underline">
              查看今日计划安排
            </Link>
          </li>
        </ul>
      </AnimeReveal>

      {activeAgents.length > 0 && (
        <AnimeReveal as="section" className="section-card home-rail-agents home-rail-agents--compact" y={14} delay={170}>
          <div className="home-rail-agents__head">
            <h2 className="home-rail__title">协同动态</h2>
            <span className="home-agents__live">LIVE</span>
          </div>
          <ul className="home-rail-agents__list">
            {activeAgents.map((agent) => (
              <li key={agent.id} className={`home-rail-agent home-rail-agent--${agent.status}`}>
                <div className="home-rail-agent__row">
                  <agent.icon size={14} strokeWidth={1.75} aria-hidden />
                  <span className="home-rail-agent__name">{agent.name}</span>
                  <span className="home-rail-agent__pct">{agent.progress}%</span>
                </div>
                <p className="home-rail-agent__msg">{agent.message}</p>
              </li>
            ))}
          </ul>
        </AnimeReveal>
      )}

    </>
  );
}
