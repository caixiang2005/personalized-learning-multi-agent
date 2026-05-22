import { useState, useEffect } from 'react';
import axios from 'axios';
import './Login.css';

// 后端真实地址
const BASE_URL = 'http://127.0.0.1:8000/api/user';

const Login = () => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  // 登录表单状态
  const [activeTab, setActiveTab] = useState<'pwd' | 'code'>('pwd');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  // 重置密码表单状态
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 倒计时逻辑
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
  };

  // 自动清空提示文案
  useEffect(() => {
    if (tip) {
      const timer = setTimeout(() => setTip(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [tip]);

  // 密码登录
  const handlePwdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      setTip('账号密码不能为空');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/login/password`, {
        email: account.includes('@') ? account : null,
        username: account.includes('@') ? null : account,
        password: password
      });
      setTip('登录成功！');
      console.log('登录成功', res.data);
    } catch (err) {
      setTip('登录失败：邮箱或密码错误');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !code) {
      setTip('邮箱和验证码不能为空');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/login/code`, {
        email: account,
        code: code
      });
      setTip('验证码登录成功！');
      console.log('登录成功', res.data);
    } catch (err) {
      setTip('验证码错误或已过期');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 获取登录验证码
  const handleGetLoginCode = async () => {
    if (!account.includes('@')) {
      setTip('请输入合法邮箱');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/sendLoginEmailCode`, {
        email: account
      });
      setTip('验证码已发送至邮箱');
      startCountdown();
    } catch (err) {
      setTip('验证码发送失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 获取重置密码验证码
  const handleGetResetCode = async () => {
    if (!resetEmail.includes('@')) {
      setTip('请输入合法邮箱');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/sendResetPasswordEmailCode`, {
        email: resetEmail
      });
      setTip('重置验证码已发送');
      startCountdown();
    } catch (err) {
      setTip('验证码发送失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 提交重置密码
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setTip('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/password/reset`, {
        email: resetEmail,
        code: resetCode,
        password: newPwd
      });
      setTip('密码重置成功！');
      setTimeout(() => setMode('login'), 1500);
    } catch (err) {
      setTip('重置失败：验证码无效');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <h1>智能学习系统</h1>
          <p>个性化资源生成与多智能体协同平台</p>
        </div>

        {mode === 'login' && (
          <>
            <div className="login-tabs">
              <button
                className={activeTab === 'pwd' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('pwd')}>
                密码登录
              </button>
              <button
                className={activeTab === 'code' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('code')}>
                验证码登录
              </button>
            </div>

            <div className="form-content">
              {activeTab === 'pwd' ? (
                <form onSubmit={handlePwdLogin} className="login-form">
                  <div className="form-item">
                    <label>用户名/邮箱</label>
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="请输入用户名或邮箱"
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>密码</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      required
                    />
                  </div>

                  <div className="forgot-row">
                    <span className="forgot-btn" onClick={() => setMode('reset')}>忘记密码</span>
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? '登录中...' : '登录'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCodeLogin} className="login-form">
                  <div className="form-item">
                    <label>邮箱</label>
                    <input
                      type="email"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="请输入邮箱"
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>验证码</label>
                    <div className="code-input-group">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="请输入验证码"
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="code-btn"
                        onClick={handleGetLoginCode}
                        disabled={countdown > 0 || loading}>
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? '登录中...' : '登录'}
                  </button>
                </form>
              )}
            </div>

            <div className="login-footer">
              <span>还没有账号？</span>
              <a href="#">立即注册</a>
            </div>
          </>
        )}

        {mode === 'reset' && (
          <div className="reset-content reset-custom">
            <h2>重置密码</h2>

            <form onSubmit={handleResetSubmit} className="login-form">
              <div className="form-item reset-form-item">
                <label>注册邮箱</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="请输入注册邮箱"
                  required
                />
              </div>

              <div className="form-item reset-form-item">
                <label>重置验证码</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="重置验证码"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="code-btn"
                    onClick={handleGetResetCode}
                    disabled={countdown > 0 || loading}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              <div className="form-item reset-form-item">
                <label>新密码</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="请输入新密码"
                  required
                />
              </div>

              <div className="form-item reset-form-item">
                <label>确认新密码</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="再次输入新密码"
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? '重置中...' : '确认重置'}
              </button>
            </form>

            <div className="back-login-footer">
              <span onClick={() => setMode('login')}>← 返回登录</span>
            </div>
          </div>
        )}

        {tip && <div className={`tip ${tip.includes('成功') ? 'success' : 'error'}`}>{tip}</div>}
      </div>

      <div className="login-footer-info">
        <p>© 2024 个性化学习多智能体系统 | 第十五届中国软件杯大赛</p>
      </div>
    </div>
  );
};

export default Login;