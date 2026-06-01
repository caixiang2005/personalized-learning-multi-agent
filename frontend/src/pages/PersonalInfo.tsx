/**
 * @file PersonalInfo.tsx
 * @description 个人信息页 · 对接 GET getProfile / POST updateProfile / POST uploadAvatar
 * @route /account
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  Calendar,
  Camera,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  Lock,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import AccountStandaloneLayout from "../components/account/AccountStandaloneLayout";
import ChangePasswordForm from "../components/account/ChangePasswordForm";
import DsButton from "../components/ui/DsButton";
import DsCard from "../components/ui/DsCard";
import { DsInput, DsSelect, DsTextarea } from "../components/ui/DsField";
import { avatarDisplayUrl } from "../lib/avatar";
import { avatarInitial } from "../lib/accountAvatar";
import { logoutLocal } from "../lib/api/user";
import { useAccountPage } from "../hooks/useAccountPage";
import { useAppStore } from "../store/useAppStore";

const GENDER_OPTIONS = [
  { value: "", label: "未设置" },
  { value: "0", label: "未知" },
  { value: "1", label: "男" },
  { value: "2", label: "女" },
] as const;

function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatRegisterDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso.slice(0, 10);
  }
}

export default function PersonalInfo() {
  const navigate = useNavigate();
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);

  const {
    profile,
    loading,
    saving,
    uploadingAvatar,
    error,
    dirty,
    save,
    uploadAvatar,
    patchForm,
    form,
    avatarVersion,
    saveSuccess,
    setSaveSuccess,
  } = useAccountPage();

  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const logout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadAvatar(file);
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    await save();
  };

  if (loading || !profile) {
    return (
      <AccountStandaloneLayout>
        <div className="personal-info personal-info--loading">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="加载中" />
        </div>
      </AccountStandaloneLayout>
    );
  }

  const displayName = form.nickname.trim() || profile.username;
  const initial = avatarInitial(displayName, profile.username);
  const baseAvatar = avatarDisplayUrl(profile.avatarUrl);
  const avatarSrc = baseAvatar
    ? `${baseAvatar}${profile.avatarUrl?.startsWith("/static/") ? `?v=${avatarVersion}` : ""}`
    : null;

  return (
    <AccountStandaloneLayout>
      <div className="personal-info">
        <header className="personal-info__header">
          <p className="personal-info__eyebrow">账号资料</p>
          <h1 className="personal-info__title">个人信息</h1>
          <p className="personal-info__sub">资料保存在 user_info，与登录账号信息分开维护</p>
        </header>

        <DsCard className="personal-info__avatar-card">
          <div className="personal-info__avatar-wrap">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="personal-info__avatar-btn"
              aria-label="上传头像"
              disabled={uploadingAvatar}
            >
              <div className="personal-info__avatar-ring personal-info__avatar-ring--clay">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="personal-info__avatar-img" />
                ) : (
                  <span className="personal-info__avatar-fallback">{initial}</span>
                )}
              </div>
              <span className="personal-info__avatar-camera">
                {uploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} strokeWidth={2} />
                )}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleAvatar}
              />
            </button>
            <div className="personal-info__avatar-meta">
              <p className="personal-info__name">{displayName}</p>
              <p className="personal-info__email">
                <AtSign size={12} className="inline mr-0.5 opacity-70" />
                {profile.email}
              </p>
              <p className="personal-info__username">@{profile.username}</p>
            </div>
          </div>
          <p className="personal-info__avatar-hint">JPG / PNG / WEBP / GIF，最大 2MB</p>
        </DsCard>

        <DsCard className="personal-info__readonly">
          <h2 className="personal-info__section-title">
            <User size={16} strokeWidth={1.75} />
            账号信息
          </h2>
          <dl className="personal-info__meta-grid">
            <MetaItem label="用户名" value={profile.username} />
            <MetaItem label="登录邮箱" value={profile.email} />
            <MetaItem
              label="注册时间"
              value={formatRegisterDate(profile.registerTime)}
              icon={Calendar}
            />
            <MetaItem
              label="最近登录"
              value={formatDateTime(profile.lastLoginTime)}
              icon={Clock}
            />
          </dl>
        </DsCard>

        <DsCard className="personal-info__form">
          <h2 className="personal-info__section-title">
            <Sparkles size={16} strokeWidth={1.75} />
            可编辑资料
          </h2>
          <div className="personal-info__fields space-y-5">
            <DsInput
              label="昵称"
              value={form.nickname}
              onChange={(e) => patchForm({ nickname: e.target.value })}
              placeholder="在平台内展示的名称"
              maxLength={32}
              hint="对应接口字段 nickname，最多 32 字"
            />
            <DsInput
              label="手机号"
              type="tel"
              inputMode="numeric"
              value={form.phoneNumber}
              onChange={(e) =>
                patchForm({ phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 11) })
              }
              placeholder="11 位大陆手机号"
              hint={form.phoneNumber ? `当前：${maskPhone(form.phoneNumber)}` : "留空可清空绑定"}
            />
            <div className="personal-info__field-row">
              <DsSelect
                label="性别"
                value={form.gender}
                onChange={(e) => patchForm({ gender: e.target.value })}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value || "unset"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </DsSelect>
              <DsInput
                label="生日"
                type="date"
                value={form.birthday}
                onChange={(e) => patchForm({ birthday: e.target.value })}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <DsInput
              label="专业 / 课程方向"
              value={form.major}
              onChange={(e) => patchForm({ major: e.target.value })}
              placeholder="例：计算机科学"
              maxLength={32}
              hint="最多 32 字"
            />
            <DsTextarea
              label="个性签名"
              value={form.signature}
              onChange={(e) => patchForm({ signature: e.target.value })}
              placeholder="写一句介绍自己的话…"
              maxLength={100}
              hint={`${form.signature.length}/100 · 对应 signature`}
            />
          </div>

          {(error || saveSuccess) && (
            <p
              role="status"
              className={`personal-info__status mt-4 ${
                error ? "personal-info__status--error" : "personal-info__status--ok"
              }`}
            >
              {error ?? "资料已保存"}
            </p>
          )}

          <DsButton
            fullWidth
            disabled={!dirty || saving}
            onClick={handleSave}
            className="mt-5"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中…
              </>
            ) : (
              "保存资料"
            )}
          </DsButton>
        </DsCard>

        <DsCard padding="none" className="personal-info__actions overflow-hidden">
          <ActionRow
            icon={Lock}
            title="修改密码"
            desc="通过邮箱验证码重置"
            onClick={() => setShowPassword((v) => !v)}
            open={showPassword}
          />
          {showPassword && (
            <div className="personal-info__panel">
              <ChangePasswordForm
                defaultEmail={profile.email}
                embedded
                compact
                onCancel={() => setShowPassword(false)}
                onSuccess={() => setShowPassword(false)}
              />
            </div>
          )}
          <ActionRow
            icon={GraduationCap}
            title="学习画像"
            desc="在「学习画像」页查看与更新学习特征"
            onClick={() => navigate("/profile")}
          />
        </DsCard>

        <DsButton variant="danger" fullWidth onClick={logout} className="personal-info__logout">
          <LogOut size={18} />
          退出登录
        </DsButton>
      </div>
    </AccountStandaloneLayout>
  );
}

function MetaItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Calendar;
}) {
  return (
    <div className="personal-info__meta-item">
      <dt className="personal-info__meta-label">
        {Icon && <Icon size={13} strokeWidth={1.75} className="shrink-0 opacity-70" />}
        {label}
      </dt>
      <dd className="personal-info__meta-value">{value}</dd>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  title,
  desc,
  onClick,
  open,
}: {
  icon: typeof Lock;
  title: string;
  desc: string;
  onClick: () => void;
  open?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="personal-info__action-row">
      <span className="icon-box personal-info__action-icon">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-medium text-[#1D2129] dark:text-gray-100">{title}</span>
        <span className="block text-xs text-[#86909C] dark:text-gray-400 mt-0.5 truncate">{desc}</span>
      </span>
      <ChevronRight
        size={18}
        className={`shrink-0 text-[#86909C] transition-transform ${open ? "rotate-90" : ""}`}
      />
    </button>
  );
}
