# 智慧学习中心 · 比赛版设计规范（UI/UX Pro Max + Impeccable）

> **定位**：高等教育个性化学习多智能体系统 · 专业 / 清爽 / 学术科技风  
> **实现**：`src/styles/scholar-design-system.css` + `src/lib/designTokens.ts` + `src/components/scholar/*`

---

## 1. 设计原则（Impeccable）

| 必须 | 禁止 |
|------|------|
| 1px 细边框 + 轻阴影卡片 | 3px 厚「玩具感」Clay 边框 |
| Plus Jakarta Sans + 思源黑体系 | Comic Neue / 幼稚圆体 |
| Mesh 轻背景，无书海透视 | BookSea 漂浮装饰 |
| 流式输出 + 骨架屏 + 进度条 | 全屏白屏等待 |
| Lucide 图标 | Emoji 当图标 |
| `cursor-pointer` + 200ms 过渡 | 无反馈可点击区 |
| 卡片式多模态资源 | 纯文本墙 |

---

## 2. Token

| Token | 浅色 | 用途 |
|-------|------|------|
| `--scholar-primary` | `#4F46E5` | 主色、链接、选中 |
| `--scholar-accent` | `#0D9488` | 进度、成功、CTA 辅色 |
| `--scholar-surface` | `#F8FAFC` | 页面底 |
| `--scholar-card` | `#FFFFFF` | 卡片底 |
| `--scholar-text` | `#0F172A` | 标题正文 |
| `--scholar-text-secondary` | `#475569` | 副文案 |
| `--scholar-text-muted` | `#94A3B8` | 辅助 |
| `--scholar-border` | `#E2E8F0` | 分割线 |
| `--scholar-radius-md` | `12px` | 卡片 |
| `--scholar-shadow-card` | `0 1px 3px rgb(15 23 42 / 6%)` | 卡片 |

---

## 3. 信息架构

```
/                 门户 Landing
/login · /register  认证
/home               工作台（能力入口 + 对话引导）
/chat               学习对话（流式 + 资源卡片）
/profile            6 维学习画像
/path               学习路径 + 5 类资源
/resource/:id       资源详情
/analytics          效果评估（加分）
/account            个人中心
```

**主导航**：首页 · 学习对话 · 学习画像 · 学习路径 · 效果评估

---

## 4. 比赛能力映射

| 评分能力 | 页面 | UI 表现 |
|----------|------|---------|
| 对话式画像 | Home + Chat + Profile | 对话引导 + 6 维雷达 |
| 多智能体资源 | Chat + Path | 资源类型卡片 ×5 |
| 学习路径 | Path | 阶段时间轴 + 推送状态 |
| 智能辅导 | Chat | 流式答疑 + 快捷指令 |
| 效果评估 | Analytics | 图表 + 薄弱点 + 建议 |

---

## 5. 组件清单

- `ScholarPageHeader` — 统一页头
- `ScholarCard` — 标准卡片
- `CapabilityGrid` — 首页/门户能力矩阵
- `StreamProgress` — 生成进度
- `ResourceTypeBadge` — 五类资源标签
