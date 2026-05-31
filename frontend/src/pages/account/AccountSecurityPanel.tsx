/**
 * 账号安全页：侧栏 + 主内容区（仅本系统支持的账号字段）。
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AccountInfoSection from "../../components/account/AccountInfoSection";
import ChangePasswordForm from "../../components/account/ChangePasswordForm";
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
    <div className="min-h-[20rem] rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
      {editingPwd ? (
        <ChangePasswordForm
          defaultEmail={email}
          accountLabel="注册邮箱"
          onCancel={() => setEditingPwd(false)}
          onSuccess={() => setEditingPwd(false)}
        />
      ) : (
        <AccountInfoSection
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
              label: "密码",
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
      )}
    </div>
  );
}
