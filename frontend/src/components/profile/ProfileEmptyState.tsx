/**
 * 画像未构建 · 主内容引导
 */
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import AgentAvatar from "../chat/AgentAvatar";
import AnimeReveal from "../motion/AnimeReveal";
import AnimeStagger from "../motion/AnimeStagger";
import { PROFILE_BUILD_PATH } from "../../lib/navConfig";

const STEPS = [
  { num: 1, title: "对话描述背景", desc: "专业、目标与薄弱点" },
  { num: 2, title: "生成六维画像", desc: "自动抽取学习特征" },
  { num: 3, title: "解锁全站能力", desc: "驾驶舱、辅导与路径" },
] as const;

const SIX_DIMENSIONS = [
  "知识掌握",
  "习题完成",
  "专注度",
  "薄弱点改善",
  "学习效率",
  "提升趋势",
];

const PREVIEW_POINTS = [
  { title: "六维雷达图", desc: "一眼看清各维度得分与趋势" },
  { title: "薄弱点追踪", desc: "练习错题自动汇总到画像" },
  { title: "动态更新", desc: "学习进展持续反哺画像分数" },
];

export default function ProfileEmptyState() {
  const navigate = useNavigate();

  return (
    <>
      <AnimeReveal as="section" className="section-card profile-empty__hero" y={14} delay={70}>
        <div className="profile-empty__hero-main">
          <AgentAvatar />
          <div className="profile-empty__hero-copy">
            <p className="profile-empty__eyebrow">
              <Sparkles size={14} aria-hidden />
              对话式画像构建
            </p>
            <h2 className="profile-empty__hero-title">还没有学习画像</h2>
            <p className="profile-empty__hero-desc">
              与<strong>画像智能体</strong>聊几句，系统会自动生成六维学习画像，
              并开放学习驾驶舱、智能辅导与路径规划。
            </p>
            <button
              type="button"
              className="btn-primary profile-empty__hero-btn"
              onClick={() => navigate(PROFILE_BUILD_PATH)}
            >
              开始构建画像
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>

        <AnimeStagger as="ol" className="profile-empty__steps" staggerMs={60} y={8} delay={100}>
          {STEPS.map((step) => (
            <li key={step.num} className={step.num === 1 ? "profile-empty__step profile-empty__step--active" : "profile-empty__step"}>
              <span className="profile-empty__step-num">{step.num}</span>
              <span className="profile-empty__step-body">
                <span className="profile-empty__step-title">{step.title}</span>
                <span className="profile-empty__step-desc">{step.desc}</span>
              </span>
            </li>
          ))}
        </AnimeStagger>
      </AnimeReveal>

      <AnimeStagger className="profile-empty__features" staggerMs={70} y={12} delay={120}>
        {PREVIEW_POINTS.map((item) => (
          <div key={item.title} className="section-card profile-empty__feature">
            <h3 className="profile-empty__feature-title">{item.title}</h3>
            <p className="profile-empty__feature-desc">{item.desc}</p>
          </div>
        ))}
      </AnimeStagger>

      <AnimeReveal as="section" className="section-card dash-panel profile-empty__preview" y={14} delay={150}>
        <div className="profile-empty__preview-head">
          <h2 className="dash-panel__title">将生成的六维画像</h2>
          <p className="dash-panel__desc">完成对话后，此处会展示雷达图与各维度得分</p>
        </div>
        <div className="profile-empty__radar-placeholder" aria-hidden>
          <div className="profile-empty__radar-ring profile-empty__radar-ring--outer" />
          <div className="profile-empty__radar-ring profile-empty__radar-ring--mid" />
          <div className="profile-empty__radar-ring profile-empty__radar-ring--inner" />
          <Bot size={28} strokeWidth={1.5} className="profile-empty__radar-icon" />
        </div>
        <AnimeStagger className="profile-empty__dims" staggerMs={45} y={6} delay={180}>
          {SIX_DIMENSIONS.map((label) => (
            <span key={label} className="profile-empty__dim-chip">
              {label}
            </span>
          ))}
        </AnimeStagger>
      </AnimeReveal>
    </>
  );
}
