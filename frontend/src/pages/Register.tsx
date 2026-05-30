/**
 * @file Register.tsx
 * @description 用户注册：邮箱验证码 + 用户名密码。
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import { AuthFormCard } from "../components/auth/AuthFormCard";
import {
  register,
  sendRegEmailCode,
  UserApiError,
} from "../lib/api/user";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
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
      await sendRegEmailCode(email);
      startCount();
      setTipText("注册验证码已发送，请查收邮件");
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTipText("");
    try {
      await register({ email, username, password, code });
      setTipText("注册成功，即将跳转登录…");
      setTimeout(() => navigate("/login", { state: { email } }), 1200);
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "注册失败");
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
            title="注册账号"
            subtitle="创建账号后登录智慧学习中心"
            tip={tipText ? { text: tipText, success: tipSuccess } : undefined}
            footer={
              <p className="login-card-foot__text">
                已有账号？{" "}
                <Link to="/login" className="login-form-link">
                  去登录
                </Link>
              </p>
            }
          >
            <form onSubmit={onSubmit} className="login-form">
              <div className="login-glass-field">
                <label htmlFor="reg-email">邮箱</label>
                <input
                  id="reg-email"
                  type="email"
                  className="login-glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                />
              </div>
              <div className="login-glass-field">
                <label htmlFor="reg-username">用户名</label>
                <input
                  id="reg-username"
                  className="login-glass-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div className="login-glass-field">
                <label htmlFor="reg-password">密码</label>
                <input
                  id="reg-password"
                  type="password"
                  className="login-glass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6–64 位密码"
                  minLength={6}
                  maxLength={64}
                  required
                />
              </div>
              <div className="login-glass-field">
                <label htmlFor="reg-code">邮箱验证码</label>
                <div className="login-code-row">
                  <input
                    id="reg-code"
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
              <button type="submit" className="landing-btn-glass login-glass-submit" disabled={loading}>
                {loading ? "提交中…" : "注册"}
              </button>
            </form>
          </AuthFormCard>
        </section>
      </div>
    </div>
  );
}
