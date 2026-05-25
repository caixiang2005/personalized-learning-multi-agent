# personalized-learning-multi-agent

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.11.4-blue?style=flat" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.136.1-green?style=flat" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19.2.6-blue?style=flat" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-6.0.2-blue?style=flat" alt="TypeScript">
  <img src="https://img.shields.io/badge/Axios-1.16.1-purple?style=flat" alt="Axios">
  <img src="https://img.shields.io/badge/TailwindCSS-4.3.0-cyan?style=flat" alt="TailwindCSS">

**第十五届中国软件杯大赛 A组赛题作品**

基于大模型的个性化资源生成与学习多智能体系统开发
</div>

---


## 系统整体架构
本项目采用前后端分离的微服务架构，基于 Docker 容器化部署，实现高内聚、低耦合的系统设计，同时满足赛题对多智能体协同、个性化学习资源生成的核心要求。

![系统架构图](docs/architecture.png)
> 图：系统分层架构设计（前端层 → 后端微服务层 → 数据层 → 基础设施层）

### 架构分层说明
1.  **前端层（Frontend）**
    采用 **React 19 + TypeScript 6 + Tailwind CSS** 构建单页应用，通过 **Axios** 与后端进行 HTTP/REST 通信，为用户提供直观的学习交互界面，包括对话式画像构建、资源生成展示、学习路径可视化等功能。

2.  **后端微服务层（Backend）**
    基于 **FastAPI** 搭建微服务架构，通过 API 网关实现请求路由分发，各服务职责明确：
    - **Agent 服务**：多智能体核心调度，包含画像构建、资源生成、学习路径规划、智能辅导等子智能体
    - **Learn 服务**：学习业务逻辑处理，如课程管理、资源推送
    - **User 服务**：用户账号与权限管理
    系统采用统一的 LLM 调用层，所有智能体相关的 AI 能力（对话、资源生成、学习规划）均由 Agent 服务统一对接大模型服务，保证模型调用集中、易于维护与扩展。

3.  **数据层（Database）**
    - **Redis**：用于存储会话状态、对话历史缓存、邮箱验证码，提升响应速度
    - **PostgreSQL**：持久化存储用户画像、学习记录、资源数据等核心业务数据

4.  **基础设施层（Infrastructure）**
    基于云服务器 + Docker 实现容器化部署，使用 Docker Compose 完成多容器编排与一键启动，保障系统可扩展性与稳定性。
