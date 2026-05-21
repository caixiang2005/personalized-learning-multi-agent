(function () {
  const msgEl = document.getElementById("login-message");
  const tabs = document.querySelectorAll(".auth-tab");
  const panelPassword = document.getElementById("form-password");
  const panelCode = document.getElementById("form-code");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      panelPassword.classList.toggle("active", target === "password");
      panelCode.classList.toggle("active", target === "code");
      hideToast(msgEl);
    });
  });

  async function afterLoginSuccess(data) {
    AuthAPI.saveTokens(data);
    showToast(msgEl, "登录成功，正在跳转…", "success");
    try {
      await AuthAPI.getMe();
    } catch {
      /* 用户信息接口未就绪时不阻塞跳转 */
    }
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  }

  document.getElementById("form-password").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideToast(msgEl);
    const email = document.getElementById("pwd-email").value.trim();
    const password = document.getElementById("pwd-password").value;
    if (!isValidEmail(email)) {
      showToast(msgEl, "请输入有效邮箱");
      return;
    }
    const btn = document.getElementById("btn-pwd-login");
    btn.disabled = true;
    try {
      const data = await AuthAPI.loginWithPassword(email, password);
      await afterLoginSuccess(data);
    } catch (err) {
      showToast(msgEl, err.message);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("btn-send-login-code").addEventListener("click", async () => {
    hideToast(msgEl);
    const email = document.getElementById("code-email").value.trim();
    if (!isValidEmail(email)) {
      showToast(msgEl, "请先填写有效邮箱");
      return;
    }
    const btn = document.getElementById("btn-send-login-code");
    try {
      await AuthAPI.loginSendCode(email);
      showToast(msgEl, "验证码已发送，请查收邮箱", "success");
      startCooldown(btn);
    } catch (err) {
      showToast(msgEl, err.message);
    }
  });

  document.getElementById("form-code").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideToast(msgEl);
    const email = document.getElementById("code-email").value.trim();
    const code = document.getElementById("code-value").value.trim();
    if (!isValidEmail(email)) {
      showToast(msgEl, "请输入有效邮箱");
      return;
    }
    if (!code) {
      showToast(msgEl, "请输入验证码");
      return;
    }
    const btn = document.getElementById("btn-code-login");
    btn.disabled = true;
    try {
      const data = await AuthAPI.loginWithCode(email, code);
      await afterLoginSuccess(data);
    } catch (err) {
      showToast(msgEl, err.message);
    } finally {
      btn.disabled = false;
    }
  });

  if (AuthAPI.getToken()) {
    window.location.replace("/");
  }
})();
