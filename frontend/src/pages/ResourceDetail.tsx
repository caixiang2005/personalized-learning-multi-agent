/**
 * @file ResourceDetail.tsx
 * @description 资源详情 — 后端优先，降级 AI 生成内容 + 打字机流式输出
 * @route /resource/:id
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2, AlertCircle, Sparkles, Brain, Video, FileText, Code2, BookOpen } from "lucide-react";
import ScholarDashboardLayout from "../components/dashboard/ScholarDashboardLayout";
import MarkdownContent from "../components/ui/MarkdownContent";
import MultiAgentPipeline, { type AgentStage } from "../components/chat/MultiAgentPipeline";
import { fetchResourceDetail } from "../lib/api/learn";
import { useStreamText } from "../hooks/useStreamText";
import { findResourceById, findTopicNameByResourceId } from "../lib/resources";
import { useAppStore } from "../store/useAppStore";

const typeLabel: Record<string, string> = {
  document: "文档笔记",
  mindmap: "思维导图",
  exercise: "练习题",
  video: "视频讲解",
  practice: "实操案例",
};

const CONTENT_TEMPLATES: Record<string, (title: string, topic?: string) => string> = {
  practice: (title, topic) => `## ${title}

### 实操目标
通过动手实践掌握 ${topic || "当前知识点"} 的核心概念与常见操作。

### 前置准备
- 开发环境：支持 ${title} 的运行环境
- 基础要求：了解基本语法与概念

### 步骤详解

#### 第一步：环境初始化
\`\`\`python
# 导入必要库
import os
import sys

# 初始化配置
def setup_environment():
    """初始化工作环境"""
    print("环境初始化中...")
    # 检查依赖
    return True
\`\`\`

#### 第二步：核心实现
\`\`\`python
def implement_core():
    """实现核心功能"""
    # 1. 数据准备
    # 2. 业务逻辑
    # 3. 结果返回
    pass

if __name__ == "__main__":
    setup_environment()
    implement_core()
\`\`\`

### 练习与拓展
1. 修改参数观察输出变化
2. 添加错误处理机制
3. 优化性能瓶颈

> 完成后可回到学习路径继续下一章节`,
  document: (title) => `## ${title}

### 概述
本文档是 "${title}" 的学习资料，涵盖核心概念、原理讲解与实践应用。

### 核心要点
1. **基本概念**：理解 ${title} 的定义与作用
2. **工作原理**：掌握其底层机制与运行流程
3. **应用场景**：了解在实际项目中的使用方式

### 详细讲解

#### 1. 基础理论
在开始实践之前，需要先理解相关的理论基础。

#### 2. 关键知识点
每个知识点都配有详细的说明与示例。

#### 3. 常见问题
- 问题一：...
- 解决方案：...

### 总结
通过本文档的学习，你应该能够掌握 ${title} 的核心内容。`,
  mindmap: (title) => `## ${title} - 思维导图

### 中心主题
${title}

#### 一级分支
- **分支 1**：核心概念
  - 子概念 1.1
  - 子概念 1.2
  - 子概念 1.3
- **分支 2**：关键技能
  - 技能 2.1
  - 技能 2.2
- **分支 3**：实践应用
  - 案例 3.1
  - 案例 3.2

#### 关联知识点
- 前置知识：...
- 后续进阶：...

> 💡 建议结合文档笔记一起学习`,
  video: (title) => `## ${title} - 视频讲解

### 视频概要
本节视频讲解 "${title}" 的核心内容。

### 章节导航
1. **开场引入**（0:00）- 问题背景与学习目标
2. **核心讲解**（2:00）- 知识点详细拆解
3. **案例分析**（10:00）- 实际应用演示
4. **总结回顾**（15:00）- 重点内容梳理

### 配套资源
- 📄 讲义文档
- 🧠 思维导图
- 💻 练习代码`,
};

function renderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathStages = useAppStore((s) => s.pathStages);
  const profile = useAppStore((s) => s.profile);

  const [remoteData, setRemoteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentStages, setAgentStages] = useState<AgentStage[]>([]);

  // 流式输出
  const { displayText, isStreaming, start: startStream, complete: completeStream, reset: resetStream } = useStreamText({ speed: 20 });
  const [generated, setGenerated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 先获取后端，失败则 fallback 到本地
  const localResource = id ? findResourceById(pathStages, id) : null;
  const topicName = id ? findTopicNameByResourceId(pathStages, id) : "";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResourceDetail(id);
      if (res.code === 200 && res.data?.content) {
        setRemoteData(res.data);
        return;
      }
    } catch {
      // 静默降级
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // 合并数据
  const resource = remoteData ?? localResource;

  // AI 生成内容
  const generateContent = useCallback(async () => {
    if (!resource?.type || !resource?.title) return;
    const template = CONTENT_TEMPLATES[resource.type];
    if (!template) return;

    const content = template(resource.title, topicName || profile.major);

    // 启动多 Agent 流水线
    setAgentStages([
      { id: "profile", name: "画像分析", icon: Brain, status: "processing" as const, detail: "分析学习特征" },
      { id: "document", name: "内容生成", icon: FileText, status: "idle" as const },
    ]);

    await new Promise(r => setTimeout(r, 500));
    setAgentStages(prev => prev.map(s => s.id === "profile" ? { ...s, status: "done" as const } : s));
    setAgentStages(prev => prev.map(s => s.id === "document" ? { ...s, status: "processing" as const, detail: "生成学习内容" } : s));

    await new Promise(r => setTimeout(r, 400));
    setAgentStages(prev => prev.map(s => s.id === "document" ? { ...s, status: "done" as const } : s));

    // 开始流式输出
    setGenerated(true);
    startStream(content);

    setTimeout(() => {
      setAgentStages([]);
    }, 2000);
  }, [resource, topicName, profile.major, startStream]);

  // 滚动到底部
  useEffect(() => {
    if (generated && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [displayText, generated]);

  if (loading) {
    return (
      <ScholarDashboardLayout badge="资源" title="加载中…" subtitle="">
        {renderSkeleton()}
      </ScholarDashboardLayout>
    );
  }

  if (!resource) {
    return (
      <div className="page-container text-center py-20">
        <AlertCircle size={32} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">未找到该资源</p>
        <button type="button" className="btn-primary mt-4" onClick={() => navigate("/path")}>
          返回学习路径
        </button>
      </div>
    );
  }

  // exercise 类型跳转到答题页
  if (resource.type === "exercise") {
    navigate(`/exercise/${resource.id}`, { replace: true });
    return null;
  }

  // 已有远程内容或本地内容
  const hasContent = remoteData?.content || localResource?.content;

  return (
    <ScholarDashboardLayout
      badge={typeLabel[resource.type] ?? "资源"}
      title={resource.title}
      subtitle={
        remoteData
          ? `${typeLabel[resource.type] ?? "资源"} · 来自后端`
          : `${(topicName || typeLabel[resource.type]) ?? "资源"} · ${hasContent ? "本地内容" : "AI 生成内容"}`
      }
      aside={
        <div className="flex flex-wrap gap-2 justify-end">
          {!hasContent && !generated && (
            <button type="button" className="btn-primary text-sm" onClick={generateContent}>
              <Sparkles size={15} /> AI 生成内容
            </button>
          )}
          <button type="button" className="btn-secondary text-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> 返回
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ {error} · 显示本地内容
        </div>
      )}

      {!remoteData && !hasContent && !generated && (
        <div className="section-card dash-panel flex flex-col items-center justify-center py-12 text-center">
          <BookOpen size={40} className="text-[var(--scholar-text-muted)] mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-[var(--scholar-text)] mb-2">暂无内容</h3>
          <p className="text-sm text-[var(--scholar-text-muted)] mb-6 max-w-md">
            该资源尚未加载内容，点击下方按钮由 AI 根据你的学习画像智能生成
          </p>
          <button type="button" className="btn-primary" onClick={generateContent}>
            <Sparkles size={16} /> AI 生成 {typeLabel[resource.type] ?? "内容"}
          </button>
        </div>
      )}

      {agentStages.length > 0 && (
        <div className="section-card dash-panel mb-4">
          <MultiAgentPipeline stages={agentStages} title="多智能体协同生成" />
        </div>
      )}

      {/* 多模态资源标签 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--scholar-primary)]/10 text-[var(--scholar-primary)]">
          {typeLabel[resource.type] ?? "资源"}
        </span>
        {remoteData ? (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            后端数据
          </span>
        ) : generated ? (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            AI 生成
          </span>
        ) : hasContent ? (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            本地预览
          </span>
        ) : null}
      </div>

      {/* 视频类型 */}
      {resource.type === "video" && (
        <div className="section-card mb-6 aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-gray-400 text-sm">
          <div className="text-center">
            <Video size={32} className="mx-auto mb-2 opacity-50" />
            <p>视频播放器</p>
            {remoteData && <p className="text-xs mt-1 opacity-70">远程视频资源</p>}
          </div>
        </div>
      )}

      {/* 内容渲染 - 流式输出或静态内容 */}
      {(hasContent || generated) && (
        <div ref={containerRef} className="section-card">
          {generated ? (
            <div className="prose dark:prose-invert max-w-none">
              <MarkdownContent content={displayText} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--scholar-primary)] animate-pulse" />
              )}
            </div>
          ) : (
            <MarkdownContent
              content={resource.content ?? `## ${resource.title}\n\n${resource.description || ""}`}
            />
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/chat" className="btn-primary">
          在对话中继续提问
        </Link>
        {!hasContent && generated && !isStreaming && (
          <button type="button" className="btn-secondary" onClick={generateContent}>
            <Sparkles size={15} /> 重新生成
          </button>
        )}
        <Link to="/path" className="btn-secondary no-underline">
          回到学习路径
        </Link>
      </div>
    </ScholarDashboardLayout>
  );
}
