/**
 * @file Login.tsx
 * @description 登录页：user-service login / loginByUsername / loginByEmailCode。
 */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import AuthPageBackground from "../components/auth/AuthPageBackground";
import { AuthFormCard, AuthModeTabs } from "../components/auth/AuthFormCard";
import { useAppStore } from "../store/useAppStore";
import type { UserInfo } from "../lib/api/endpoints";
import { hydrateAccountProfile } from "../lib/api/account";
import {
  loginByCode,
  loginByEmail,
  loginByUsername,
  persistLogin,
  sendLoginEmailCode,
  UserApiError,
} from "../lib/api/user";

type LoginVariant = "email-pwd" | "email-code" | "username";

const LOGIN_VARIANTS: { value: LoginVariant; label: string }[] = [
  { value: "email-pwd", label: "邮箱密码" },
  { value: "email-code", label: "验证码" },
  { value: "username", label: "用户名" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? "";
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);
  const [variant, setVariant] = useState<LoginVariant>("email-pwd");
  const [email, setEmail] = useState(prefilledEmail);
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

  const afterLogin = (data: UserInfo) => {
    setUser(data);
    setLoggedIn(true);
    void hydrateAccountProfile();
    setTipText("登录成功，正在进入学习中心…");
    setTimeout(() => navigate("/home"), 600);
  };

  const submitPwdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTipText("");
    try {
      const data =
        variant === "username"
          ? await loginByUsername(username, password)
          : await loginByEmail(email, password);
      afterLogin(persistLogin(data));
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const getCode = async () => {
    if (!email) {
      setTipText("请先填写邮箱");
      return;
    }
    setLoading(true);
    setTipText("");
    try {
      await sendLoginEmailCode(email);
      startCount();
      setTipText("验证码已发送，请查收邮件");
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const submitCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTipText("");
    try {
      const data = await loginByCode(email, code);
      afterLogin(persistLogin(data));
    } catch (e) {
      setTipText(e instanceof UserApiError ? e.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const tipSuccess = tipText.includes("成功");

  return (
    <div className="login-shell landing-shell app-page-scrim">
      <AuthPageBackground />

      <div className="login-layout">
        <AuthBrandPanel />

        <section className="login-form-area">
          <AuthFormCard
            title="欢迎登录"
            subtitle="登录后进入个性化学习中心"
            tip={tipText ? { text: tipText, success: tipSuccess } : undefined}
            footer={
              <p className="login-card-foot__text">
                还没有账号？{" "}
                <Link to="/register" className="login-form-link">
                  立即注册
                </Link>
              </p>
            }
          >
            <AuthModeTabs
              ariaLabel="登录方式"
              value={variant}
              onChange={setVariant}
              options={LOGIN_VARIANTS}
            />

            <div className="login-form-body">
              {variant === "email-pwd" && (
                <form key="email-pwd" onSubmit={submitPwdLogin} className="login-form">
                  <div className="login-glass-field">
                    <label htmlFor="login-email">邮箱账号</label>
                    <input
                      id="login-email"
                      className="login-glass-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="login-glass-field">
                    <div className="login-field-label-row">
                      <label htmlFor="login-password">登录密码</label>
                      <Link to="/reset-password" className="login-form-link login-form-link--subtle">
                        忘记密码？
                      </Link>
                    </div>
                    <input
                      id="login-password"
                      className="login-glass-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <button type="submit" className="landing-btn-glass login-glass-submit" disabled={loading}>
                    {loading ? "登录中…" : "登录"}
                  </button>
                </form>
              )}

              {variant === "email-code" && (
                <form key="email-code" onSubmit={submitCodeLogin} className="login-form">
                  <div className="login-glass-field">
                    <label htmlFor="login-email-code">邮箱账号</label>
                    <input
                      id="login-email-code"
                      className="login-glass-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="login-glass-field">
                    <label htmlFor="login-code">邮件验证码</label>
                    <div className="login-code-row">
                      <input
                        id="login-code"
                        className="login-glass-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="6 位验证码"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
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
                    {loading ? "登录中…" : "登录"}
                  </button>
                </form>
              )}

              {variant === "username" && (
                <form key="username" onSubmit={submitPwdLogin} className="login-form">
                  <div className="login-glass-field">
                    <label htmlFor="login-username">用户名</label>
                    <input
                      id="login-username"
                      className="login-glass-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div className="login-glass-field">
                    <div className="login-field-label-row">
                      <label htmlFor="login-username-pwd">登录密码</label>
                      <Link to="/reset-password" className="login-form-link login-form-link--subtle">
                        忘记密码？
                      </Link>
                    </div>
                    <input
                      id="login-username-pwd"
                      className="login-glass-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <button type="submit" className="landing-btn-glass login-glass-submit" disabled={loading}>
                    {loading ? "登录中…" : "登录"}
                  </button>
                </form>
              )}
            </div>
          </AuthFormCard>
        </section>
      </div>
    </div>
  );
}
