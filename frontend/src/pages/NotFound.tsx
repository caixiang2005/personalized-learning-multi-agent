/**
 * @file NotFound.tsx
 * @description 404 页面，未匹配路由时展示（App.tsx 中可配置）。
 * @route 任意未定义路径
 * @backend 无
 */

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="app-page-scrim min-h-screen flex flex-col items-center justify-center px-gutter">
      <p className="text-6xl font-bold text-primary/30">404</p>
      <h1 className="text-xl font-semibold mt-4 text-gray-900 dark:text-white">页面不存在</h1>
      <p className="text-gray-500 mt-2 text-sm">请检查地址或返回首页</p>
      <Link to="/home" className="btn-primary mt-8">
        返回首页
      </Link>
    </div>
  );
}
