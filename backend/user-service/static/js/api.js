const AuthAPI = {
  url(path) {
    const base = AUTH_CONFIG.baseURL.replace(/\/$/, "");
    return `${base}${path}`;
  },

  getToken() {
    return localStorage.getItem(AUTH_CONFIG.tokenKey);
  },

  getRefreshToken() {
    return localStorage.getItem(AUTH_CONFIG.refreshKey);
  },

  saveTokens(data) {
    if (data?.access_token) {
      localStorage.setItem(AUTH_CONFIG.tokenKey, data.access_token);
    }
    if (data?.refresh_token) {
      localStorage.setItem(AUTH_CONFIG.refreshKey, data.refresh_token);
    }
  },

  clearTokens() {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.refreshKey);
  },

  async request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = this.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(this.url(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let payload = null;
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!res.ok) {
      const msg =
        payload?.detail ||
        payload?.message ||
        (typeof payload?.detail === "object"
          ? JSON.stringify(payload.detail)
          : null) ||
        `请求失败 (${res.status})`;
      throw new Error(msg);
    }
    return payload;
  },

  registerSendCode(email) {
    return this.request(AUTH_CONFIG.endpoints.registerSendCode, {
      method: "POST",
      body: { email },
    });
  },

  register(data) {
    return this.request(AUTH_CONFIG.endpoints.register, {
      method: "POST",
      body: data,
    });
  },

  loginSendCode(email) {
    return this.request(AUTH_CONFIG.endpoints.loginSendCode, {
      method: "POST",
      body: { email },
    });
  },

  loginWithPassword(email, password) {
    return this.request(AUTH_CONFIG.endpoints.loginPassword, {
      method: "POST",
      body: { email, password },
    });
  },

  loginWithCode(email, code) {
    return this.request(AUTH_CONFIG.endpoints.loginCode, {
      method: "POST",
      body: { email, code },
    });
  },

  async refreshToken() {
    const refresh = this.getRefreshToken();
    const headers = { "Content-Type": "application/json" };
    if (refresh) headers["X-Refresh-Token"] = refresh;

    const res = await fetch(this.url(AUTH_CONFIG.endpoints.refreshToken), {
      method: "POST",
      headers,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.message || "Token 续期失败");
    this.saveTokens(payload);
    return payload;
  },

  getMe() {
    return this.request(AUTH_CONFIG.endpoints.me, { auth: true });
  },
};

function showToast(el, message, type = "error") {
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.hidden = false;
}

function hideToast(el) {
  el.hidden = true;
}

function startCooldown(btn, seconds = AUTH_CONFIG.codeCooldownSec) {
  let left = seconds;
  btn.disabled = true;
  const original = btn.dataset.label || btn.textContent;
  btn.dataset.label = original;

  const tick = () => {
    btn.textContent = `${left}s 后重发`;
    if (left <= 0) {
      btn.disabled = false;
      btn.textContent = original;
      return;
    }
    left -= 1;
    setTimeout(tick, 1000);
  };
  tick();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
