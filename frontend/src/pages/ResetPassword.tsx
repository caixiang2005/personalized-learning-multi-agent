/**
 * @file ResetPassword.tsx
 * @description 重置密码：邮箱验证码 + 新密码。
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import { AuthFormCard } from "../components/auth/AuthFormCard";
import {
  resetPassword,
  sendResetEmailCode,
  UserApiError,
} from "../lib/api/user";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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
      setTipText("请输入合法邮箱");
      return;
    }
    setLoading(true);
    setTipText("");
    try {
      await sendResetEmailCode(email);
      startCount();
      setTipText("重置验证码已发送");
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
    setLoading(true);
    setTipText("");
    try {
      await resetPassword({ email, code, newPassword });
      setTipText("密码重置成功，即将跳转登录…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "重置失败");
    } finally {
      setLoading(false);
    }
  };

  const tipSuccess = tipText.includes("成功");

  return (
    <div className="login-shell app-page-scrim">
      <div className="login-shell__glow" aria-hidden />
      <div className="login-layout">
        <AuthBrandPanel />
        <section className="login-form-area">
          <AuthFormCard
            title="重置密码"
            subtitle="通过注册邮箱验证后设置新密码"
            tip={tipText ? { text: tipText, success: tipSuccess } : undefined}
            footer={
              <p className="login-card-foot__text">
                <Link to="/login" className="login-form-link">
                  ← 返回登录
                </Link>
              </p>
            }
          >
            <form onSubmit={onSubmit} className="login-form">
              <div className="login-glass-field">
                <label htmlFor="reset-email">注册邮箱</label>
                <input
                  id="reset-email"
                  type="email"
                  className="login-glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入注册邮箱"
                  required
                />
              </div>
              <div className="login-glass-field">
                <label htmlFor="reset-code">验证码</label>
                <div className="login-code-row">
                  <input
                    id="reset-code"
                    className="login-glass-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6 位验证码"
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                  <button
                    type="button"
                    className="login-code-btn"
                    onClick={getCode}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `${countdown}s` : "获取验证码"}
                  </button>
                </div>
              </div>
              <div className="login-glass-field">
                <label htmlFor="reset-new-pwd">新密码</label>
                <input
                  id="reset-new-pwd"
                  type="password"
                  className="login-glass-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6–64 位新密码"
                  minLength={6}
                  maxLength={64}
                  required
                />
              </div>
              <div className="login-glass-field">
                <label htmlFor="reset-confirm-pwd">确认新密码</label>
                <input
                  id="reset-confirm-pwd"
                  type="password"
                  className="login-glass-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  maxLength={64}
                  required
                />
              </div>
              <button type="submit" className="landing-btn-glass login-glass-submit" disabled={loading}>
                {loading ? "提交中…" : "确认重置"}
              </button>
            </form>
          </AuthFormCard>
        </section>
      </div>
    </div>
  );
}
