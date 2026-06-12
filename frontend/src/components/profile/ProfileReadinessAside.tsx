/** 画像未构建时 · 顶栏状态指示 */
export default function ProfileReadinessAside() {
  return (
    <div className="profile-empty__readiness">
      <span className="home-cockpit__health-label">画像状态</span>
      <span className="profile-empty__readiness-value">待构建</span>
      <span className="profile-empty__readiness-hint">约 3 分钟对话即可完成</span>
    </div>
  );
}
