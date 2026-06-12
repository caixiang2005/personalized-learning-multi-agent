import { Link } from "react-router-dom";
import { Clock, Target, TrendingUp, Sparkles } from "lucide-react";
import AnimeReveal from "../motion/AnimeReveal";
import { useAppStore } from "../../store/useAppStore";
import { PROFILE_BUILD_PATH } from "../../lib/navConfig";

const PROFILE_TIPS = [
  "与画像智能体对话可自动更新六维得分",
  "练习与辅导记录会反哺薄弱点统计",
  "目标或专业变化时建议重新构建画像",
];

export default function ProfileSidebar() {
  const { profile } = useAppStore();
  const dims = profile.learnerDimensions?.length ? profile.learnerDimensions : profile.dimensions;
  const topDims = [...dims].sort((a, b) => b.value - a.value).slice(0, 3);
  const lowDims = [...dims].sort((a, b) => a.value - b.value).slice(0, 2);

  return (
    <>
      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={110}>
        <h2 className="dash-panel__title">学习节律</h2>
        <ul className="dash-sidebar-facts">
          <li>
            <Clock size={14} aria-hidden />
            <span>活跃时段 · {profile.rhythm?.period || "待记录"}</span>
          </li>
          <li>
            <Clock size={14} aria-hidden />
            <span>单次时长 · {profile.rhythm?.duration || "待记录"}</span>
          </li>
        </ul>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={130}>
        <h2 className="dash-panel__title">认知风格</h2>
        {profile.cognitiveStyle.length > 0 ? (
          <div className="dash-sidebar-tags">
            {profile.cognitiveStyle.map((s) => (
              <span key={s} className="dash-sidebar-tag">{s}</span>
            ))}
          </div>
        ) : (
          <p className="dash-panel__desc">完成画像对话后，系统会自动识别你的学习偏好。</p>
        )}
      </AnimeReveal>

      {dims.length > 0 && (
        <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={150}>
          <h2 className="dash-panel__title">
            <TrendingUp size={14} className="inline mr-1" aria-hidden />
            维度速览
          </h2>
          <div className="dash-sidebar-dims">
            <p className="dash-sidebar-dims__label">相对优势</p>
            <ul>
              {topDims.map((d) => (
                <li key={d.key}>
                  <span>{d.label}</span>
                  <strong>{d.value}</strong>
                </li>
              ))}
            </ul>
            <p className="dash-sidebar-dims__label dash-sidebar-dims__label--weak">待提升</p>
            <ul>
              {lowDims.map((d) => (
                <li key={d.key}>
                  <span>{d.label}</span>
                  <strong>{d.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </AnimeReveal>
      )}

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={170}>
        <h2 className="dash-panel__title">
          <Target size={14} className="inline mr-1" aria-hidden />
          学习目标
        </h2>
        {profile.goal ? (
          <>
            <p className="dash-sidebar-goal">{profile.goal}</p>
            {profile.goalProgress?.label && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[var(--scholar-text-muted)] mb-1">
                  <span>{profile.goalProgress.label}</span>
                  <span>{profile.goalProgress.percent}%</span>
                </div>
                <div className="progress-bar h-1.5">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.max(profile.goalProgress.percent, 4)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="dash-panel__desc">尚未设定目标，可在画像智能体对话中补充。</p>
        )}
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={190}>
        <h2 className="dash-panel__title">
          <Sparkles size={14} className="inline mr-1" aria-hidden />
          画像完善建议
        </h2>
        <ul className="dash-sidebar-notes">
          {PROFILE_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <Link to={PROFILE_BUILD_PATH} className="btn-secondary w-full justify-center text-sm no-underline mt-3">
          进入画像智能体
        </Link>
      </AnimeReveal>
    </>
  );
}
