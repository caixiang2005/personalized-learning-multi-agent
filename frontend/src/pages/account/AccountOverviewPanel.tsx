import { useState } from "react";
import FadeInView from "../../components/motion/FadeInView";
import type { UserProfileDto, UserStatsDto } from "../../types/account";

type Props = {
  profile: UserProfileDto;
  stats?: UserStatsDto | null;
};

const tabs = [
  { id: "learning", label: "我的学习" },
  { id: "stats", label: "学习统计" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AccountOverviewPanel({ profile, stats }: Props) {
  const [tab, setTab] = useState<TabId>("learning");

  const statItems = [
    { label: "画像健康度", value: stats?.healthScore ?? "—", suffix: "" },
    { label: "目标进度", value: stats?.goalProgress ?? "—", suffix: "%" },
    { label: "路径进度", value: stats?.pathProgress ?? "—", suffix: "%" },
  ];

  return (
    <FadeInView delay={0.08}>
      <section className="account-overview section-card">
        <div className="account-overview__tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`account-overview__tab${tab === item.id ? " account-overview__tab--active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "learning" && (
          <div className="account-overview__panel" role="tabpanel">
            <div className="account-overview__stats">
              {statItems.map((item) => (
                <div key={item.label} className="account-overview__stat">
                  <p className="account-overview__stat-value">
                    {item.value}
                    {item.suffix}
                  </p>
                  <p className="account-overview__stat-label">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="account-overview__chart landing-glass-card">
              <p className="account-overview__chart-title">学习趋势（预留）</p>
              <p className="account-overview__chart-placeholder">
                主站功能完善后将展示学习时长、会话与路径进度曲线
              </p>
            </div>

            <div className="account-overview__recent">
              <h3 className="account-overview__recent-title">上次学到</h3>
              <ul className="account-overview__recent-list">
                <li>数据结构 · 栈与队列（Mock）</li>
                <li>机器学习 · 线性回归入门（Mock）</li>
                <li>人工智能导论 · 搜索算法（Mock）</li>
              </ul>
            </div>
          </div>
        )}

        {tab === "stats" && (
          <div className="account-overview__panel" role="tabpanel">
            <div className="account-overview__stats">
              <div className="account-overview__stat">
                <p className="account-overview__stat-value">{stats?.sessionCount ?? 0}</p>
                <p className="account-overview__stat-label">历史会话</p>
              </div>
              <div className="account-overview__stat">
                <p className="account-overview__stat-value">{profile.updatedAt || "—"}</p>
                <p className="account-overview__stat-label">资料更新</p>
              </div>
              <div className="account-overview__stat">
                <p className="account-overview__stat-value">—</p>
                <p className="account-overview__stat-label">有效学习时长</p>
              </div>
            </div>
            <p className="account-overview__hint">详细统计接口：GET /api/user/stats（后端联调中）</p>
          </div>
        )}
      </section>
    </FadeInView>
  );
}
