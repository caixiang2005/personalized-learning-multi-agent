/**
 * @file main.tsx
 * @description React 应用入口，挂载根组件并加载全局样式。
 * @backend 无
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
