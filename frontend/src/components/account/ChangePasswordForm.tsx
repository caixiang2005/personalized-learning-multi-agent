/**
 * 设置密码表单（内嵌，参考 MOOC 账号安全 · 图2 横排标签布局）。
 */
import { useId, useState } from "react";
import { Lock, Mail } from "lucide-react";
import {
  resetPassword,
  sendResetEmailCode,
  UserApiError,
} from "../../lib/api/user";
import { maskEmail } from "./AccountInfoSection";

type Props = {
  defaultEmail?: string;
  /** 只读展示：手机号或邮箱掩码 */
  accountLabel?: string;
  accountDisplay?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  compact?: boolean;
  /** 嵌套在小浮层内，去掉外层卡片 */
  embedded?: boolean;
};

export default function ChangePasswordForm({
  defaultEmail = "",
  accountLabel = "注册邮箱",
  accountDisplay,
  onCancel,
  onSuccess,
  compact = false,
  embedded = false,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const email = defaultEmail;
  const display = accountDisplay ?? (email ? maskEmail(email) : "未绑定");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipText, setTipText] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCount = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) clearInterval(timer);
        return v - 1;
      });
    }, 1000);
  };

  const getCode = async () => {
    if (!email.includes("@")) {
      setTipText("请先绑定注册邮箱");
      return;
    }
    setLoading(true);
    setTipText("");
    try {
      await sendResetEmailCode(email);
      startCount();
      setTipText("验证码已发送，请查收邮箱");
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setTipText("两次密码不一致");
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 64) {
      setTipText("密码长度需为 6–64 位");
      return;
    }
    setLoading(true);
    setTipText("");
    try {
      await resetPassword({ email, code, newPassword });
      setTipText("密码设置成功");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "设置失败");
    } finally {
      setLoading(false);
    }
  };

  const tipSuccess = tipText.includes("成功");
  const labelW = compact ? "w-[4.5rem]" : "w-[5.5rem]";
  const textSize = compact ? "text-xs" : "text-sm";

  const shellCls = embedded
    ? ""
    : `rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/40 ${compact ? "px-4 py-4" : "px-8 py-6"}`;

  return (
    <div className={shellCls}>
      {!embedded && (
        <h2 className={`font-medium text-gray-900 dark:text-gray-100 ${compact ? "text-sm mb-4" : "text-base mb-6"}`}>
          设置密码
        </h2>
      )}

      {tipText && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 ${textSize} ${
            tipSuccess
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
          }`}
          role="status"
        >
          {tipText}
        </p>
      )}

      <form onSubmit={onSubmit}>
        <FormRow label={accountLabel} required={false} labelW={labelW} textSize={textSize}>
          <span className={`${textSize} text-gray-800 dark:text-gray-200 pt-2`}>{display}</span>
        </FormRow>

        <FormRow label="新密码" required labelW={labelW} textSize={textSize} hint="6–64 位，建议包含字母与数字">
          <IconInput
            id={`${uid}-new`}
            type="password"
            icon={Lock}
            value={newPassword}
            onChange={setNewPassword}
            placeholder="请输入密码"
            minLength={6}
            maxLength={64}
            compact={compact}
          />
        </FormRow>

        <FormRow label="新密码" required labelW={labelW} textSize={textSize}>
          <IconInput
            id={`${uid}-confirm`}
            type="password"
            icon={Lock}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="再次输入密码"
            minLength={6}
            maxLength={64}
            compact={compact}
          />
        </FormRow>

        <FormRow label="验证码" required labelW={labelW} textSize={textSize}>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Mail
                size={compact ? 14 : 16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                id={`${uid}-code`}
                className={inputCls(compact)}
                style={{ paddingLeft: compact ? "2rem" : "2.25rem" }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>
            <button
              type="button"
              className={`shrink-0 rounded-md border border-[#0d9488]/30 px-3 font-medium text-[#0d9488] hover:bg-[#0d9488]/5 disabled:opacity-50 cursor-pointer ${compact ? "text-xs py-2" : "text-sm py-2.5"}`}
              onClick={getCode}
              disabled={countdown > 0 || loading}
            >
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </button>
          </div>
        </FormRow>

        <div className={`flex justify-center gap-3 ${compact ? "mt-5" : "mt-8"}`}>
          <button
            type="submit"
            disabled={loading}
            className={`min-w-[5.5rem] rounded-md bg-[#0d9488] px-6 font-medium text-white hover:bg-[#0f766e] disabled:opacity-60 cursor-pointer ${compact ? "py-2 text-xs" : "py-2.5 text-sm"}`}
          >
            {loading ? "提交中…" : "确定"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`min-w-[5.5rem] rounded-md border border-[#0d9488] bg-white px-6 font-medium text-[#0d9488] hover:bg-[#0d9488]/5 cursor-pointer dark:bg-transparent ${compact ? "py-2 text-xs" : "py-2.5 text-sm"}`}
            >
              取消
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function FormRow({
  label,
  required,
  hint,
  labelW,
  textSize,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  labelW: string;
  textSize: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-4 border-b border-gray-50 py-4 last:border-0 dark:border-gray-800/60 ${textSize}`}>
      <label className={`shrink-0 text-right text-gray-700 dark:text-gray-300 pt-2.5 ${labelW}`}>
        {required && <span className="text-red-500 mr-0.5">*</span>}
        {label}
      </label>
      <div className="flex-1 min-w-0">
        {children}
        {hint && <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">{hint}</p>}
      </div>
    </div>
  );
}

function IconInput({
  id,
  type,
  icon: Icon,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  compact,
}: {
  id: string;
  type: string;
  icon: typeof Lock;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minLength?: number;
  maxLength?: number;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      <Icon
        size={compact ? 14 : 16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        id={id}
        type={type}
        className={inputCls(compact)}
        style={{ paddingLeft: compact ? "2rem" : "2.25rem" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        required
      />
    </div>
  );
}

function inputCls(compact?: boolean) {
  return `w-full rounded-md border border-gray-200 bg-white py-2 pr-3 text-gray-900 outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-100 ${compact ? "text-xs py-2" : "text-sm py-2.5"}`;
}
