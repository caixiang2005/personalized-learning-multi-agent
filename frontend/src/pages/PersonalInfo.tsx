/**
 * @file PersonalInfo.tsx
 * @description 个人信息页 · 对接 GET getProfile / POST updateProfile / POST uploadAvatar
 * @route /account
 *
 * 模块：学习数据概览 · 头像上传 · 账号信息 · 可编辑资料 · 修改密码 · 快捷入口 · 退出登录
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
  MessageSquare,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import AccountCenterLayout from "../components/account/AccountCenterLayout";
import ChangePasswordForm from "../components/account/ChangePasswordForm";
import DsButton from "../components/ui/DsButton";
import DsCard from "../components/ui/DsCard";
import { DsInput, DsSelect, DsTextarea } from "../components/ui/DsField";
import { avatarDisplayUrl } from "../lib/avatar";
import { avatarInitial } from "../lib/accountAvatar";
import { logoutLocal } from "../lib/api/user";
import { useAccountPage } from "../hooks/useAccountPage";
import { useAppStore } from "../store/useAppStore";

import { GENDER_OPTIONS, genderLabel } from "../lib/gender";

function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function formatRegisterDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("zh-CN"); }
  catch { return iso.slice(0, 10); }
}

/* ══════════════════════ 子组件 ══════════════════════ */

/** 学习数据概览卡片 */
function StatCard({ label, value, icon: Icon, suffix = "", color = "primary" }: {
  label: string; value: number | string; icon: typeof Target;
  suffix?: string; color?: "primary" | "accent" | "green" | "amber";
}) {
  const colorMap = {
    primary: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
    accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
    green: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {typeof value === "number" && !suffix ? value : value}{suffix}
        </p>
      </div>
    </div>
  );
}

/** 只读元信息条目 */
function MetaItem({ label, value, icon: Icon }: {
  label: string; value: string; icon?: typeof Calendar;
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

/** 可展开操作行 */
function ActionRow({ icon: Icon, title, desc, onClick, open }: {
  icon: typeof Lock; title: string; desc: string;
  onClick: () => void; open?: boolean;
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
      <ChevronRight size={18}
        className={`shrink-0 text-[#86909C] transition-transform ${open ? "rotate-90" : ""}`} />
    </button>
  );
}

/* ══════════════════════ 主组件 ══════════════════════ */

export default function PersonalInfo() {
  const navigate = useNavigate();
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);

  const {
    profile, stats, loading, saving, uploadingAvatar,
    error, dirty, save, uploadAvatar, patchForm, form,
    avatarVersion, saveSuccess, setSaveSuccess,
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

  /* ── 加载态 ── */
  if (loading || !profile) {
    return (
      <AccountCenterLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="加载中" />
        </div>
      </AccountCenterLayout>
    );
  }

  const displayName = form.nickname.trim() || profile.username;
  const initial = avatarInitial(displayName, profile.username);
  const baseAvatar = avatarDisplayUrl(profile.avatarUrl);
  const avatarSrc = baseAvatar
    ? `${baseAvatar}${profile.avatarUrl?.startsWith("/static/") ? `?v=${avatarVersion}` : ""}`
    : null;

  return (
    <AccountCenterLayout>
      <div className="personal-info space-y-5">

        {/* ═══ 页头 ═══ */}
        <header className="personal-info__header">
          <p className="personal-info__eyebrow">账号资料</p>
          <h1 className="personal-info__title">个人信息</h1>
          <p className="personal-info__sub">管理你的账号资料与学习数据，所有修改实时同步</p>
        </header>

        {/* ═══ 学习数据概览 ═══ */}
        {stats && (
          <section>
            <h2 className="personal-info__section-title mb-3">
              <TrendingUp size={16} strokeWidth={1.75} />
              学习数据概览
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="健康分" value={stats.healthScore} icon={Zap} color="accent" suffix="分" />
              <StatCard label="目标进度" value={stats.goalProgress} icon={Target} color="green" suffix="%" />
              <StatCard label="路径进度" value={stats.pathProgress} icon={Route} color="primary" suffix="%" />
              <StatCard label="对话次数" value={stats.sessionCount} icon={MessageSquare} color="amber" />
            </div>
          </section>
        )}

        {/* ═══ 头像卡片 ═══ */}
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
              <input ref={fileRef} type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only" onChange={handleAvatar} />
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
          <p className="personal-info__avatar-hint">支持 JPG / PNG / WEBP / GIF，最大 2MB</p>
        </DsCard>

        {/* ═══ 账号信息（只读） ═══ */}
        <DsCard className="personal-info__readonly">
          <h2 className="personal-info__section-title">
            <User size={16} strokeWidth={1.75} />
            账号信息
          </h2>
          <dl className="personal-info__meta-grid">
            <MetaItem label="用户名" value={profile.username} />
            <MetaItem label="登录邮箱" value={profile.email} />
            <MetaItem label="性别" value={genderLabel(profile.gender)} />
            <MetaItem label="注册时间" value={formatRegisterDate(profile.registerTime)} icon={Calendar} />
            <MetaItem label="最近登录" value={formatDateTime(profile.lastLoginTime)} icon={Clock} />
          </dl>
        </DsCard>

        {/* ═══ 可编辑资料 ═══ */}
        <DsCard className="personal-info__form">
          <h2 className="personal-info__section-title">
            <Sparkles size={16} strokeWidth={1.75} />
            编辑资料
          </h2>
          <div className="personal-info__fields space-y-5">
            <DsInput
              label="昵称" value={form.nickname}
              onChange={(e) => patchForm({ nickname: e.target.value })}
              placeholder="在平台内展示的名称" maxLength={32}
              hint="对应接口字段 nickname，最多 32 字"
            />
            <DsInput
              label="手机号" type="tel" inputMode="numeric"
              value={form.phoneNumber}
              onChange={(e) => patchForm({ phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              placeholder="11 位大陆手机号"
              hint={form.phoneNumber ? `当前：${maskPhone(form.phoneNumber)}` : "留空可清空绑定"}
            />
            <div className="personal-info__field-row">
              <DsSelect
                label="性别" value={form.gender}
                onChange={(e) => patchForm({ gender: e.target.value })}
                hint={`当前：${genderLabel(profile.gender)} · 数据库编码 0=未知 1=男 2=女`}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value || "unset"} value={o.value}>{o.label}</option>
                ))}
              </DsSelect>
              <DsInput
                label="生日" type="date" value={form.birthday}
                onChange={(e) => patchForm({ birthday: e.target.value })}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <DsInput
              label="专业 / 课程方向" value={form.major}
              onChange={(e) => patchForm({ major: e.target.value })}
              placeholder="例：计算机科学" maxLength={32} hint="最多 32 字"
            />
            <DsTextarea
              label="个性签名" value={form.signature}
              onChange={(e) => patchForm({ signature: e.target.value })}
              placeholder="写一句介绍自己的话…" maxLength={100}
              hint={`${form.signature.length}/100 · 对应 signature 字段`}
            />
          </div>

          {/* 保存状态反馈 */}
          {(error || saveSuccess) && (
            <p role="status" className={`personal-info__status mt-4 ${
              error ? "personal-info__status--error" : "personal-info__status--ok"
            }`}>
              {error ?? "✅ 资料已保存"}
            </p>
          )}

          <DsButton fullWidth disabled={!dirty || saving} onClick={handleSave} className="mt-5">
            {saving ? <><Loader2 size={16} className="animate-spin" /> 保存中…</> : "保存资料"}
          </DsButton>
        </DsCard>

        {/* ═══ 快捷操作 ═══ */}
        <DsCard padding="none" className="personal-info__actions overflow-hidden">
          <ActionRow icon={Lock} title="修改密码"
            desc="通过邮箱验证码重置登录密码"
            onClick={() => setShowPassword((v) => !v)} open={showPassword} />
          {showPassword && (
            <div className="personal-info__panel">
              <ChangePasswordForm
                defaultEmail={profile.email} embedded compact
                onCancel={() => setShowPassword(false)}
                onSuccess={() => setShowPassword(false)}
              />
            </div>
          )}

          <ActionRow icon={Sparkles} title="学习画像"
            desc="查看与更新你的学习特征、薄弱点与六维能力"
            onClick={() => navigate("/profile")} />

          <ActionRow icon={Route} title="学习路径"
            desc="管理你的学习路径与课程进度"
            onClick={() => navigate("/path")} />

          <ActionRow icon={GraduationCap} title="效果评估"
            desc="查看学习分析、活动热力图与建议"
            onClick={() => navigate("/analytics")} />
        </DsCard>

        {/* ═══ 退出登录 ═══ */}
        <DsButton variant="danger" fullWidth onClick={logout} className="personal-info__logout">
          <LogOut size={18} /> 退出登录
        </DsButton>

      </div>
    </AccountCenterLayout>
  );
}
