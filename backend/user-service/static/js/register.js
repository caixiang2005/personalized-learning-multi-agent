(function () {
  const msgEl = document.getElementById("register-message");

  document.getElementById("btn-send-register-code").addEventListener("click", async () => {
    hideToast(msgEl);
    const email = document.getElementById("reg-email").value.trim();
    if (!isValidEmail(email)) {
      showToast(msgEl, "请先填写有效邮箱");
      return;
    }
    const btn = document.getElementById("btn-send-register-code");
    try {
      await AuthAPI.registerSendCode(email);
      showToast(msgEl, "注册验证码已发送，请查收邮箱", "success");
      startCooldown(btn);
    } catch (err) {
      showToast(msgEl, err.message);
    }
  });

  document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideToast(msgEl);

    const email = document.getElementById("reg-email").value.trim();
    const code = document.getElementById("reg-code").value.trim();
    const password = document.getElementById("reg-password").value;
    const password2 = document.getElementById("reg-password2").value;

    if (!isValidEmail(email)) {
      showToast(msgEl, "请输入有效邮箱");
      return;
    }
    if (!code) {
      showToast(msgEl, "请输入验证码");
      return;
    }
    if (password.length < 8) {
      showToast(msgEl, "密码至少 8 位");
      return;
    }
    if (password !== password2) {
      showToast(msgEl, "两次密码不一致");
      return;
    }

    const btn = document.getElementById("btn-register");
    btn.disabled = true;
    try {
      await AuthAPI.register({ email, code, password });
      showToast(msgEl, "注册成功，即将跳转登录…", "success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
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
