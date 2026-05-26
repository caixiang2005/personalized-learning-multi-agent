/**
 * @file Login.tsx
 * @description 登录页：毛玻璃卡片 + 邮箱/用户名 + 密码或验证码，成功后跳转 /home。
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ScanFace,
  Boxes,
  Waypoints,
  MessageSquare,
  BrainCircuit,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
// 【待同步】import { loginApi, sendCodeApi } from "../lib/api/client";

/** 【当前 Mock】整段删除，改用 loginApi / sendCodeApi */
const mockApi = {
  loginByEmailPwd: async (data: { email: string; password: string }) =>
    new Promise((resolve, reject) => {
      setTimeout(() => (data.password === "123456" ? resolve({ msg: "登录成功" }) : reject({ msg: "账号密码错误" })), 500);
    }),
  sendCode: async () => Promise.resolve({ msg: "验证码已发送" }),
  loginByCode: async (data: { email: string; code: string }) =>
    new Promise((resolve, reject) => {
      setTimeout(() => (data.code === "123456" ? resolve({ msg: "登录成功" }) : reject({ msg: "验证码错误" })), 500);
    }),
  loginByUsernamePwd: async () => Promise.resolve({ msg: "登录成功" }),
};

const features = [
  { icon: MessageSquare, text: "对话式学习引导" },
  { icon: BrainCircuit, text: "6 维度动态画像" },
  { icon: Boxes, text: "多模态资源生成" },
  { icon: Waypoints, text: "个性化学习路径" },
];

export default function Login() {
  const navigate = useNavigate();
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const [loginType, setLoginType] = useState<"email" | "username">("email");
  const [loginMode, setLoginMode] = useState<"pwd" | "code">("pwd");
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

  useEffect(() => {
    if (tipText.includes("成功")) {
      setLoggedIn(true);
      const t = setTimeout(() => navigate("/home"), 600);
      return () => clearTimeout(t);
    }
  }, [tipText, navigate, setLoggedIn]);

  const submitPwdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTipText("");
    try {
      if (loginType === "email") {
        await mockApi.loginByEmailPwd({ email, password });
      } else {
        await mockApi.loginByUsernamePwd();
      }
      setTipText("登录成功，正在进入学习中心...");
    } catch (err: unknown) {
      setTipText((err as { msg: string }).msg);
    } finally {
      setLoading(false);
    }
  };

  const getCode = async () => {
    if (!email) return setTipText("请先填写邮箱");
    setLoading(true);
    await mockApi.sendCode();
    startCount();
    setTipText("验证码已发送");
    setLoading(false);
  };

  const submitCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTipText("");
    try {
      await mockApi.loginByCode({ email, code });
      setTipText("登录成功，正在进入学习中心...");
    } catch (err: unknown) {
      setTipText((err as { msg: string }).msg);
    } finally {
      setLoading(false);
    }
  };

  const tipSuccess = tipText.includes("成功");

  return (
    <div className="login-shell">
      <div className="login-shell__glow" aria-hidden />

      <div className="login-layout">
        <section className="login-brand landing-glass landing-enter">
          <span className="login-brand__icon">
            <GraduationCap size={22} strokeWidth={2} />
          </span>
          <h1 className="login-brand__title">智慧学习中心</h1>
          <p className="login-brand__sub">高等教育个性化学习平台</p>
          <ul className="login-brand__list">
            {features.map((f) => (
              <li key={f.text} className="login-brand__item">
                <span className="landing-icon-glass landing-icon-glass--sm">
                  <f.icon size={16} strokeWidth={1.75} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-gray-400 flex items-center gap-1.5">
            <ScanFace size={14} strokeWidth={1.75} />
            对话式 · 多模态 · 自适应学习
          </p>
        </section>

        <section className="login-form-area">
          <div
            className="login-glass-card landing-glass landing-enter"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="login-glass-card__title">欢迎登录</h2>
            <p className="login-glass-card__sub">登录后进入个性化学习中心</p>

            <div className="min-h-[260px]">
              {loginType === "email" ? (
                <>
                  {loginMode === "pwd" ? (
                    <form onSubmit={submitPwdLogin}>
                      <div className="login-glass-field">
                        <label htmlFor="login-email">邮箱账号</label>
                        <input
                          id="login-email"
                          className="login-glass-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="请输入邮箱"
                          required
                        />
                      </div>
                      <div className="login-glass-field">
                        <label htmlFor="login-password">登录密码</label>
                        <input
                          id="login-password"
                          className="login-glass-input"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请输入密码"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="landing-btn-glass login-glass-submit"
                        disabled={loading}
                      >
                        {loading ? "登录中…" : "登录"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={submitCodeLogin}>
                      <div className="login-glass-field">
                        <label htmlFor="login-email-code">邮箱账号</label>
                        <input
                          id="login-email-code"
                          className="login-glass-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="请输入邮箱"
                          required
                        />
                      </div>
                      <div className="login-glass-field">
                        <label htmlFor="login-code">短信验证码</label>
                        <div className="flex gap-2">
                          <input
                            id="login-code"
                            className="login-glass-input flex-1"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="请输入验证码"
                            maxLength={6}
                            required
                          />
                          <button
                            type="button"
                            className="landing-glass-inner shrink-0 px-3 text-xs font-medium text-primary"
                            onClick={getCode}
                            disabled={countdown > 0 || loading}
                          >
                            {countdown > 0 ? `${countdown}s` : "获取"}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="landing-btn-glass login-glass-submit"
                        disabled={loading}
                      >
                        {loading ? "登录中…" : "登录"}
                      </button>
                    </form>
                  )}
                  <p className="mt-4 text-center text-sm">
                    {loginMode === "pwd" ? (
                      <button
                        type="button"
                        className="login-form-link"
                        onClick={() => setLoginMode("code")}
                      >
                        忘记密码？验证码登录
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="login-form-link"
                        onClick={() => setLoginMode("pwd")}
                      >
                        返回密码登录
                      </button>
                    )}
                  </p>
                </>
              ) : (
                <form onSubmit={submitPwdLogin}>
                  <div className="login-glass-field">
                    <label htmlFor="login-username">用户名</label>
                    <input
                      id="login-username"
                      className="login-glass-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      required
                    />
                  </div>
                  <div className="login-glass-field">
                    <label htmlFor="login-username-pwd">登录密码</label>
                    <input
                      id="login-username-pwd"
                      className="login-glass-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="landing-btn-glass login-glass-submit"
                    disabled={loading}
                  >
                    {loading ? "登录中…" : "登录"}
                  </button>
                </form>
              )}
            </div>

            {tipText && (
              <p
                className={`mt-3 text-center text-sm ${tipSuccess ? "text-accent font-medium" : "text-red-500"}`}
              >
                {tipText}
              </p>
            )}

            <p className="mt-5 text-center text-sm">
              {loginType === "email" ? (
                <button
                  type="button"
                  className="login-form-link"
                  onClick={() => setLoginType("username")}
                >
                  使用用户名登录
                </button>
              ) : (
                <button
                  type="button"
                  className="login-form-link"
                  onClick={() => setLoginType("email")}
                >
                  使用邮箱登录
                </button>
              )}
            </p>
          </div>

          <Link to="/" className="login-back-link">
            ← 返回门户首页
          </Link>
        </section>
      </div>
    </div>
  );
}
