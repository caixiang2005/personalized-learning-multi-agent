/**
 * @file Account.tsx
 * @description 个人中心主页：侧栏导航 + 资料卡片 + 编辑表单。
 * @route /account
 */
import { useState } from "react";
import AccountCenterLayout from "../components/account/AccountCenterLayout";
import MotionModal from "../components/motion/MotionModal";
import { AccountPageSkeleton } from "../components/motion/Skeleton";
import { useAccountPage } from "../hooks/useAccountPage";
import AccountFormPanel from "./account/AccountFormPanel";
import AccountOverviewPanel from "./account/AccountOverviewPanel";
import AccountProfileHeader from "./account/AccountProfileHeader";

export default function Account() {
  const [editing, setEditing] = useState(false);
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
    if (ok) {
      setSaveSuccess(true);
      setEditing(false);
    }
  };

  if (loading || !profile) {
    return (
      <AccountCenterLayout>
        <AccountPageSkeleton />
      </AccountCenterLayout>
    );
  }

  return (
    <AccountCenterLayout>
      <div className="account-home">
        <AccountProfileHeader
          profile={profile}
          editing={editing}
          onEdit={() => setEditing((v) => !v)}
        />

        {editing && (
          <AccountFormPanel
            profile={profile}
            form={form}
            dirty={dirty}
            saving={saving}
            error={error}
            onChange={patchForm}
            onSubmit={handleSave}
          />
        )}

        <AccountOverviewPanel profile={profile} stats={stats} />
      </div>

      <MotionModal open={saveSuccess} onClose={() => setSaveSuccess(false)} title="保存成功">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          个人资料已更新。
        </p>
        <button
          type="button"
          className="btn-primary mt-5 w-full cursor-pointer"
          onClick={() => setSaveSuccess(false)}
        >
          知道了
        </button>
      </MotionModal>
    </AccountCenterLayout>
  );
}
