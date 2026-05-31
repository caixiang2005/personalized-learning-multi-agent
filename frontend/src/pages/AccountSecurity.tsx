/**
 * @file AccountSecurity.tsx
 * @description 个人中心 — 账号安全页。
 * @route /account/security
 */
import AccountCenterLayout from "../components/account/AccountCenterLayout";
import AccountSecurityPanel from "./account/AccountSecurityPanel";

export default function AccountSecurity() {
  return (
    <AccountCenterLayout>
      <AccountSecurityPanel />
    </AccountCenterLayout>
  );
}
