/**
 * @file PersonalInfo.tsx
 * @description 个人信息页（统一 DESIGN.md 视觉规范）。
 * @route /account
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  ChevronRight,
  Loader2,
  Lock,
  LogOut,
  Phone,
  User,
} from "lucide-react";
import AccountStandaloneLayout from "../components/account/AccountStandaloneLayout";
import ChangePasswordForm from "../components/account/ChangePasswordForm";
import DsButton from "../components/ui/DsButton";
import DsCard from "../components/ui/DsCard";
import { DsInput, DsTextarea } from "../components/ui/DsField";
import { avatarGradient, avatarInitial } from "../lib/accountAvatar";
import { logoutLocal } from "../lib/api/user";
import { useAccountPage } from "../hooks/useAccountPage";
import { useAppStore } from "../store/useAppStore";

const PHONE_KEY = "profile-bound-phone";
const BIO_KEY = "profile-user-bio";
const AVATAR_KEY = "profile-avatar-url";

function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function loadStored(key: string, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function PersonalInfo() {
  const navigate = useNavigate();
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);
  const setProfile = useAppStore((s) => s.setProfile);

  const { profile, loading, saving, error, dirty, save, patchForm, form } = useAccountPage();

  const [bio, setBio] = useState(() => loadStored(BIO_KEY, "热爱学习，正在探索个性化成长路径。"));
  const [phone, setPhone] = useState(() => loadStored(PHONE_KEY));
  const [avatarUrl, setAvatarUrl] = useState(() => loadStored(AVATAR_KEY));
  const [savedBio, setSavedBio] = useState(bio);

  const [showPassword, setShowPassword] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneTip, setPhoneTip] = useState("");
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [saveTip, setSaveTip] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !loadStored(BIO_KEY)) {
      const seed = profile.goal ? `目标：${profile.goal}` : "热爱学习，正在探索个性化成长路径。";
      setBio(seed);
      setSavedBio(seed);
    }
  }, [profile]);

  const bioDirty = bio.trim() !== savedBio.trim();
  const formDirty = dirty || bioDirty;

  const handleSave = async () => {
    setSaveTip(null);
    let ok = true;
    if (dirty) {
      ok = (await save()) ?? false;
    }
    if (ok) {
      localStorage.setItem(BIO_KEY, bio.trim());
      setSavedBio(bio.trim());
      if (form.displayName) {
        setProfile({ name: form.displayName });
      }
      setSaveTip("资料已保存");
    }
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    localStorage.setItem(AVATAR_KEY, url);
  };

  const sendPhoneCode = useCallback(() => {
    if (!/^1\d{10}$/.test(phoneInput)) {
      setPhoneTip("请输入正确的 11 位手机号");
      return;
    }
    setPhoneTip("验证码已发送（演示）");
    setPhoneCountdown(60);
    const timer = setInterval(() => {
      setPhoneCountdown((v) => {
        if (v <= 1) clearInterval(timer);
        return v - 1;
      });
    }, 1000);
  }, [phoneInput]);

  const bindPhone = () => {
    if (!/^1\d{10}$/.test(phoneInput)) {
      setPhoneTip("请输入正确的 11 位手机号");
      return;
    }
    if (phoneCode.length < 4) {
      setPhoneTip("请输入验证码");
      return;
    }
    setPhone(phoneInput);
    localStorage.setItem(PHONE_KEY, phoneInput);
    setPhoneTip("绑定成功");
    setShowPhone(false);
    setPhoneInput("");
    setPhoneCode("");
  };

  const logout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
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

  const initial = avatarInitial(form.displayName, profile.username);

  return (
    <AccountStandaloneLayout>
      <div className="personal-info">
        <header className="personal-info__header">
          <p className="personal-info__eyebrow">账号资料</p>
          <h1 className="personal-info__title">个人信息</h1>
          <p className="personal-info__sub">管理头像、昵称与账号安全设置</p>
        </header>

        <DsCard className="personal-info__avatar-card">
          <div className="personal-info__avatar-wrap">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="personal-info__avatar-btn"
              aria-label="更换头像"
            >
              <div
                className="personal-info__avatar-ring"
                style={{ background: avatarGradient(profile.userId) }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="personal-info__avatar-img" />
                ) : (
                  <span className="personal-info__avatar-fallback">{initial}</span>
                )}
              </div>
              <span className="personal-info__avatar-camera">
                <Camera size={14} strokeWidth={2} />
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatar}
              />
            </button>
            <div className="personal-info__avatar-meta">
              <p className="personal-info__name">{form.displayName || profile.username}</p>
              <p className="personal-info__email">{profile.email}</p>
            </div>
          </div>
        </DsCard>

        <DsCard className="personal-info__form space-y-5">
          <DsInput
            label="昵称"
            value={form.displayName}
            onChange={(e) => patchForm({ displayName: e.target.value })}
            placeholder="请输入昵称"
            maxLength={24}
          />
          <DsTextarea
            label="简介"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="写一句介绍自己的话…"
            maxLength={120}
            hint={`${bio.length}/120`}
          />

          {(error || saveTip) && (
            <p
              role="status"
              className={`personal-info__status ${error ? "personal-info__status--error" : "personal-info__status--ok"}`}
            >
              {error ?? saveTip}
            </p>
          )}

          <DsButton fullWidth disabled={!formDirty || saving} onClick={handleSave}>
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
            onClick={() => {
              setShowPassword((v) => !v);
              setShowPhone(false);
            }}
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
            icon={Phone}
            title="绑定手机"
            desc={phone ? maskPhone(phone) : "未绑定，点击绑定"}
            onClick={() => {
              setShowPhone((v) => !v);
              setShowPassword(false);
              setPhoneInput(phone);
            }}
            open={showPhone}
          />
          {showPhone && (
            <div className="personal-info__panel space-y-4">
              {phoneTip && <p className="personal-info__status personal-info__status--ok">{phoneTip}</p>}
              <DsInput
                label="手机号"
                type="tel"
                inputMode="numeric"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="请输入 11 位手机号"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-0">
                  <DsInput
                    label="验证码"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6 位验证码"
                  />
                </div>
                <DsButton
                  variant="secondary"
                  size="sm"
                  disabled={phoneCountdown > 0}
                  onClick={sendPhoneCode}
                  className="sm:mb-0.5 shrink-0"
                >
                  {phoneCountdown > 0 ? `${phoneCountdown}s` : "获取验证码"}
                </DsButton>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-1">
                <DsButton fullWidth onClick={bindPhone}>
                  确认绑定
                </DsButton>
                <DsButton variant="ghost" onClick={() => setShowPhone(false)}>
                  取消
                </DsButton>
              </div>
            </div>
          )}
        </DsCard>

        <DsButton variant="danger" fullWidth onClick={logout} className="personal-info__logout">
          <LogOut size={18} />
          退出登录
        </DsButton>

        <p className="personal-info__foot">
          <User size={12} strokeWidth={1.75} />
          注册于 {profile.registerTime ?? "—"}
        </p>
      </div>
    </AccountStandaloneLayout>
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
