/**
 * 账号安全页：邮箱、用户名、密码管理
 * 与 PersonalInfo 共用 AccountCenterLayout，视觉统一
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AccountInfoSection from "../../components/account/AccountInfoSection";
import ChangePasswordForm from "../../components/account/ChangePasswordForm";
import DsCard from "../../components/ui/DsCard";
import { useAppStore } from "../../store/useAppStore";

export default function AccountSecurityPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppStore((s) => s.user);
  const [editingPwd, setEditingPwd] = useState(() => searchParams.get("edit") === "password");

  useEffect(() => {
    if (searchParams.get("edit") === "password") {
      setEditingPwd(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const email = user?.email ?? "";
  const username = user?.username ?? "—";

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <header className="personal-info__header">
        <p className="personal-info__eyebrow">安全设置</p>
        <h1 className="personal-info__title">账号安全</h1>
        <p className="personal-info__sub">管理登录凭据与账号绑定信息</p>
      </header>

      {editingPwd ? (
        <DsCard>
          <ChangePasswordForm
            defaultEmail={email}
            accountLabel="注册邮箱"
            onCancel={() => setEditingPwd(false)}
            onSuccess={() => setEditingPwd(false)}
          />
        </DsCard>
      ) : (
        <DsCard>
          <AccountInfoSection
            title="账号绑定"
            rows={[
              {
                label: "电子邮箱",
                value: email || "未添加",
                valueMuted: !email,
              },
              {
                label: "用户名",
                value: username,
              },
              {
                label: "登录密码",
                value: email ? "已设置" : "未设置",
                valueMuted: !email,
                action: {
                  label: "修改密码",
                  icon: "edit",
                  onClick: () => setEditingPwd(true),
                },
              },
            ]}
          />
        </DsCard>
      )}
    </div>
  );
}
