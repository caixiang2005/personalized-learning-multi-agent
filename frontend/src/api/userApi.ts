import axios from 'axios';

// 基础请求地址（修改为你的后端地址）
const request = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000
});

// 发送登录验证码
export const sendLoginCode = async (email: string) => {
  return request.post('/sendLoginCode', { email });
};

// 验证码登录
export const loginByCode = async (email: string, code: string) => {
  return request.post('/loginByCode', { email, code });
};

// 邮箱密码登录
export const loginByPwd = async (email: string, password: string) => {
  return request.post('/loginByPwd', { email, password });
};

// 用户名密码登录
export const loginByUsername = async (username: string, password: string) => {
  return request.post('/loginByUsername', { username, password });
};

// 发送重置密码验证码
export const sendResetCode = async (email: string) => {
  return request.post('/sendResetCode', { email });
};

// 重置密码
export const resetPassword = async (email: string, code: string, newPassword: string) => {
  return request.post('/resetPassword', { email, code, newPassword });
};