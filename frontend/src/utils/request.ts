import axios from 'axios';

const request = axios.create({
  baseURL: 'http://127.0.0.1:8001',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截
request.interceptors.request.use((config) => {
  return config;
});

// 响应拦截
request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || '请求失败';
    alert(msg);
    return Promise.reject(err);
  }
);

export default request;