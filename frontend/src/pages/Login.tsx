/**
 * @file Login.tsx
 * @description 登录页：邮箱/用户名 + 密码或验证码，成功后跳转 /home。
 *
 * 【当前 Mock】下方 mockApi 模拟延迟与校验，演示账号密码/验证码均为 123456，不请求网络。
 * 【待同步后端】
 *   - submitPwdLogin / submitCodeLogin → loginApi()，见 lib/api/client.ts
 *   - getCode → sendCodeApi()
 *   - 成功后在 loginApi 内写入 localStorage.access_token（client 已写好）
 *   - setLoggedIn(true) 保留，用于路由守卫
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, BookOpen, Brain, MessageSquare } from "lucide-react";
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
  { icon: Brain, text: "6 维度动态画像" },
  { icon: BookOpen, text: "多模态资源生成" },
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 左侧品牌区 */}
      <div className="lg:w-1/2 gradient-hero text-white p-10 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="relative z-10 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-8">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">智慧学习中心</h1>
          <p className="text-white/85 text-lg mb-10">高等教育个性化学习平台</p>
          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-white/90">
                <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <f.icon size={20} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
          <p className="mt-12 text-sm text-white/60">对话式 · 多模态 · 自适应 · 科技蓝与教育白</p>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-gray-900">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">登录学习中心</h2>
            <p className="text-sm text-gray-500 mt-2">开启你的专属 AI 学习之旅</p>
          </div>

          <div className="min-h-[280px]">
            {loginType === "email" ? (
              <>
                {loginMode === "pwd" ? (
                  <form onSubmit={submitPwdLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">邮箱账号</label>
                      <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">登录密码</label>
                      <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="演示密码：123456" required />
                    </div>
                    <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                      {loading ? "登录中..." : "立即登录"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submitCodeLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">邮箱账号</label>
                      <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">短信验证码</label>
                      <div className="flex gap-2">
                        <input className="input-field flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="演示验证码：123456" maxLength={6} required />
                        <button type="button" className="btn-secondary shrink-0 px-4" onClick={getCode} disabled={countdown > 0 || loading}>
                          {countdown > 0 ? `${countdown}s` : "获取验证码"}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                      {loading ? "登录中..." : "立即登录"}
                    </button>
                  </form>
                )}
                <p className="mt-4 text-sm">
                  {loginMode === "pwd" ? (
                    <button type="button" className="text-primary hover:underline" onClick={() => setLoginMode("code")}>
                      忘记密码？验证码登录
                    </button>
                  ) : (
                    <button type="button" className="text-primary hover:underline" onClick={() => setLoginMode("pwd")}>
                      返回密码登录
                    </button>
                  )}
                </p>
              </>
            ) : (
              <form onSubmit={submitPwdLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">用户名</label>
                  <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">登录密码</label>
                  <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="演示密码：123456" required />
                </div>
                <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                  {loading ? "登录中..." : "立即登录"}
                </button>
              </form>
            )}
          </div>

          {tipText && (
            <p className={`mt-4 text-center text-sm ${tipSuccess ? "text-accent font-medium" : "text-red-500"}`}>
              {tipText}
            </p>
          )}

          <p className="mt-6 text-center text-sm">
            <Link to="/" className="text-gray-500 hover:text-primary">
              ← 返回门户首页
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-gray-500">
            {loginType === "email" ? (
              <button type="button" className="text-primary hover:underline" onClick={() => setLoginType("username")}>
                使用用户名登录
              </button>
            ) : (
              <button type="button" className="text-primary hover:underline" onClick={() => setLoginType("email")}>
                使用邮箱登录
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
