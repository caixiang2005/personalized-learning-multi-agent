/**
 * @file Landing.tsx
 * @description 未登录门户首页：课程分类 + 推荐内容 + 访客 AI 助手（贴近真实学习平台）。
 * @route /
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ChevronRight,
  Search,
  BookOpen,
  Users,
  PlayCircle,
  MessageSquare,
  Bot,
  FileText,
  GitBranch,
  ClipboardList,
} from "lucide-react";
import GuestAssistantFab from "../components/guest/GuestAssistantFab";
import GuestChatDrawer from "../components/guest/GuestChatDrawer";
import { useAppStore } from "../store/useAppStore";

const categories = [
  { id: "ds", label: "数据结构", sub: "栈 · 树 · 图" },
  { id: "ai", label: "人工智能导论", sub: "搜索 · 推理 · NLP" },
  { id: "ml", label: "机器学习", sub: "监督 · 无监督" },
  { id: "os", label: "操作系统", sub: "进程 · 内存" },
  { id: "net", label: "计算机网络", sub: "TCP · HTTP" },
  { id: "db", label: "数据库系统", sub: "SQL · 索引" },
];

const courseDetail: Record<
  string,
  { title: string; desc: string; learners: string; chapters: number; instructor: string }
> = {
  ds: {
    title: "数据结构",
    desc: "面向计算机专业核心课，覆盖线性表、栈与队列、树与图、排序与查找。支持按薄弱点生成练习与路径。",
    learners: "1.2 万",
    chapters: 48,
    instructor: "王教授 · 计算机学院",
  },
  ai: {
    title: "人工智能导论",
    desc: "从搜索、知识表示到机器学习基础，适合作为 AI 方向入门课程。",
    learners: "8,600",
    chapters: 36,
    instructor: "李教授 · 人工智能学院",
  },
  ml: {
    title: "机器学习",
    desc: "回归、分类、聚类与模型评估，配套代码实操与可视化讲解。",
    learners: "6,400",
    chapters: 42,
    instructor: "张教授 · 数据科学学院",
  },
  os: {
    title: "操作系统",
    desc: "进程管理、内存分配、文件系统与并发控制，含实验案例推送。",
    learners: "5,100",
    chapters: 40,
    instructor: "陈教授 · 计算机学院",
  },
  net: {
    title: "计算机网络",
    desc: "OSI/TCP-IP、路由交换与应用层协议，适合考研与期末复习。",
    learners: "7,300",
    chapters: 38,
    instructor: "赵教授 · 网络工程系",
  },
  db: {
    title: "数据库系统",
    desc: "关系模型、SQL、事务与索引优化，含题库与 ER 图生成。",
    learners: "9,800",
    chapters: 44,
    instructor: "刘教授 · 软件学院",
  },
};

const recommendCards = [
  {
    icon: FileText,
    title: "栈与队列精讲笔记",
    type: "文档",
    meta: "AI 生成 · 15 分钟阅读",
    color: "text-sky-600 bg-sky-50",
  },
  {
    icon: GitBranch,
    title: "二叉树遍历思维导图",
    type: "导图",
    meta: "薄弱点专项 · 可导出",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: ClipboardList,
    title: "图算法专项练习",
    type: "题库",
    meta: "10 题 · 自动批改",
    color: "text-amber-600 bg-amber-50",
  },
  {
    icon: PlayCircle,
    title: "最短路算法讲解",
    type: "视频",
    meta: "12 分钟 · 配套字幕",
    color: "text-violet-600 bg-violet-50",
  },
];

const platformServices = [
  { label: "对话式画像", desc: "6 维动态特征" },
  { label: "多智能体生成", desc: "5+ 类学习资源" },
  { label: "学习路径", desc: "按进度推送" },
  { label: "效果评估", desc: "数据驱动调整" },
];

export default function Landing() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const [category, setCategory] = useState("ds");
  const [chatOpen, setChatOpen] = useState(false);
  const [search, setSearch] = useState("");

  const course = courseDetail[category];
  const enterTarget = isLoggedIn ? "/home" : "/login";
  const enterLabel = isLoggedIn ? "继续学习" : "登录 / 注册";

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <Link to="/" className="landing-brand">
          <span className="landing-brand__icon">
            <Sparkles size={18} />
          </span>
          <span>
            <span className="landing-brand__title">智慧学习中心</span>
            <span className="landing-brand__sub">个性化学习平台</span>
          </span>
        </Link>

        <div className="landing-search hidden md:flex">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索课程、知识点、资源…"
            className="landing-search__input"
          />
        </div>

        <div className="landing-header__actions">
          <button type="button" className="landing-link-btn hidden sm:inline-flex" onClick={() => setChatOpen(true)}>
            <MessageSquare size={16} />
            咨询助手
          </button>
          <Link to={enterTarget} className="btn-primary text-sm py-2">
            {enterLabel}
          </Link>
        </div>
      </header>

      <div className="landing-body">
        <aside className="landing-sidebar">
          <p className="landing-sidebar__title">课程分类</p>
          <nav>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`landing-category ${category === c.id ? "landing-category--active" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                <span className="landing-category__label">{c.label}</span>
                <span className="landing-category__sub">{c.sub}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="landing-main">
          <section className="landing-feature">
            <div className="landing-feature__content">
              <span className="landing-feature__tag">当前主推 · 计算机核心课</span>
              <h1 className="landing-feature__title">{course.title}</h1>
              <p className="landing-feature__desc">{course.desc}</p>
              <div className="landing-feature__meta">
                <span>
                  <Users size={14} /> {course.learners} 学习者
                </span>
                <span>
                  <BookOpen size={14} /> {course.chapters} 章节
                </span>
                <span>{course.instructor}</span>
              </div>
              <div className="landing-feature__actions">
                <Link to={enterTarget} className="btn-primary">
                  {isLoggedIn ? "继续学习" : "开始学习"}
                  <ChevronRight size={18} />
                </Link>
                <button type="button" className="btn-secondary" onClick={() => setChatOpen(true)}>
                  <Bot size={16} />
                  未登录咨询
                </button>
              </div>
            </div>
            <div className="landing-feature__panel">
              <p className="text-xs text-gray-500 mb-3">登录后将为你提供</p>
              <ul className="landing-feature__list">
                <li>根据对话构建个人学习画像</li>
                <li>多智能体生成文档 / 导图 / 题库</li>
                <li>动态学习路径与效果评估</li>
              </ul>
            </div>
          </section>

          <section className="landing-section">
            <div className="landing-section__head">
              <h2>为你推荐</h2>
              <span className="text-xs text-gray-400">
                {isLoggedIn
                  ? `基于「${course.title}」的学习资源`
                  : `「${course.title}」资源预览 · 登录后个性化推送`}
              </span>
            </div>
            <div className="landing-rec-grid">
              {recommendCards.map((card) =>
                isLoggedIn ? (
                  <Link key={card.title} to="/path" className="landing-rec-card card-hover">
                    <span className={`landing-rec-card__icon ${card.color}`}>
                      <card.icon size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{card.type}</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{card.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{card.meta}</p>
                    </div>
                  </Link>
                ) : (
                  <Link
                    key={card.title}
                    to="/login"
                    className="landing-rec-card landing-rec-card--preview card-hover"
                    title="登录后查看完整资源"
                  >
                    <span className={`landing-rec-card__icon ${card.color}`}>
                      <card.icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">{card.type}</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{card.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{card.meta}</p>
                    </div>
                    <span className="landing-rec-card__badge">登录后查看</span>
                  </Link>
                )
              )}
            </div>
          </section>

          <section className="landing-section">
            <div className="landing-section__head">
              <h2>平台能力</h2>
              <span className="text-xs text-gray-400">软件杯 A 组 · 多智能体学习系统</span>
            </div>
            <div className="landing-services">
              {platformServices.map((s) => (
                <div key={s.label} className="landing-service">
                  <p className="landing-service__label">{s.label}</p>
                  <p className="landing-service__desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="landing-footer">
            <p>演示课程：数据结构 · 登录密码/验证码均为 123456</p>
            <p className="text-gray-400 mt-1">第十五届中国软件杯 · 科大讯飞 A 组赛题</p>
          </footer>
        </main>
      </div>

      <aside className="landing-rail hidden lg:flex" aria-label="快捷服务">
        <button type="button" className="landing-rail__btn" onClick={() => setChatOpen(true)}>
          咨询
        </button>
        <Link to={enterTarget} className="landing-rail__btn">
          登录
        </Link>
        <span className="landing-rail__btn landing-rail__btn--muted">反馈</span>
      </aside>

      <GuestAssistantFab onClick={() => setChatOpen(true)} active={chatOpen} />
      <GuestChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
