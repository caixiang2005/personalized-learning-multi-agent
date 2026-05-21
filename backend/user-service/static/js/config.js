/** API 基础地址与路径（与后端文档对齐后可在此修改） */
const AUTH_CONFIG = {
  baseURL: "", // 同源留空；跨域时填如 http://localhost:8000
  endpoints: {
    registerSendCode: "/api/auth/register/send-code",
    register: "/api/auth/register",
    loginSendCode: "/api/auth/login/send-code",
    loginPassword: "/api/auth/login/password",
    loginCode: "/api/auth/login/code",
    refreshToken: "/api/auth/token/refresh",
    me: "/api/auth/me",
  },
  tokenKey: "access_token",
  refreshKey: "refresh_token",
  codeCooldownSec: 60,
};
