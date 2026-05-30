/**
 * @file Account.tsx
 * @description 个人信息页：Framer Motion 动效 + REST 接口预留。
 * @route /account
 *
 * 接口（RESTful，前缀 /api）：
 *   GET    /api/user/profile  — 用户资料与学习背景
 *   PUT    /api/user/update   — 更新资料
 *   GET    /api/user/stats    — 统计概览
 *   DELETE /api/user/profile  — 注销（预留）
 *
 * 实现：hooks/useAccountPage.ts · lib/api/account.ts · types/account.ts
 */
import PageHeader from "../components/ui/PageHeader";
import FadeInView from "../components/motion/FadeInView";
import MotionModal from "../components/motion/MotionModal";
import { AccountPageSkeleton } from "../components/motion/Skeleton";
import { useAccountPage } from "../hooks/useAccountPage";
import AccountFormPanel from "./account/AccountFormPanel";
import AccountHero from "./account/AccountHero";
import AccountSidebar from "./account/AccountSidebar";
import AccountStatsGrid from "./account/AccountStatsGrid";

export default function Account() {
  const {
    profile,
    stats,
    form,
    loading,
    saving,
    error,
    saveSuccess,
    dirty,
    save,
    patchForm,
    setSaveSuccess,
  } = useAccountPage();

  const handleSave = async () => {
    const ok = await save();
    if (ok) setSaveSuccess(true);
  };

  if (loading || !profile || !stats) {
    return <AccountPageSkeleton />;
  }

  return (
    <div className="account-shell page-container max-w-5xl">
      <FadeInView>
        <PageHeader
          title="个人信息"
          subtitle="管理账号资料与学习背景，画像与路径将据此个性化推荐"
          badge="账号中心"
        />
      </FadeInView>

      <AccountHero profile={profile} />
      <AccountStatsGrid stats={stats} ready={!loading} />

      <div className="account-grid">
        <AccountFormPanel
          form={form}
          dirty={dirty}
          saving={saving}
          error={error}
          onChange={patchForm}
          onSubmit={handleSave}
        />
        <AccountSidebar profile={profile} />
      </div>

      <MotionModal open={saveSuccess} onClose={() => setSaveSuccess(false)} title="保存成功">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          学习背景已更新，系统将据此优化画像与路径推荐。
        </p>
        <button
          type="button"
          className="btn-primary mt-5 w-full cursor-pointer"
          onClick={() => setSaveSuccess(false)}
        >
          知道了
        </button>
      </MotionModal>
    </div>
  );
}
