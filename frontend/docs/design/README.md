# 设计规范说明

## 选用思路（队长要求）

参考 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 的 **DESIGN.md** 机制：用一份 Markdown 约束 AI 与开发的视觉输出，避免「乱干活」。

本赛题已具备 **科技蓝 + 教育绿** 赛题配色，未整份照搬 Stripe/Apple 等外部品牌，而是：

1. 以 **Arco / 企业级教育产品** 气质为参照（清晰、可信、中等密度）
2. 锁定现有 token：`#165DFF`、`#36D399`、`Noto Sans SC`
3. 把门户已落地的毛玻璃、知识遨游、组件规则写入 **[DESIGN.md](../../DESIGN.md)**

## Cursor 如何「干活前读规范」

| 文件 | 作用 |
|------|------|
| [DESIGN.md](../../DESIGN.md) | 视觉规范（颜色、圆角、玻璃、背景） |
| [AGENTS.md](../../AGENTS.md) | 前端构建说明、必读顺序 |
| [../../../.cursor/rules/design-system.mdc](../../../.cursor/rules/design-system.mdc) | Cursor 每次对话默认加载设计约束 |

在 Cursor 中可直接说：「按 frontend/DESIGN.md 改 xxx」。

## 更新规范时

改 UI 后若新增 token 或组件类，请同步更新：

- [DESIGN.md](../../DESIGN.md) 对应章节
- `src/index.css` 的 `@theme` / `:root`
