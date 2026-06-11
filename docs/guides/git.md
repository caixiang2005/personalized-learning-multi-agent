# 多人协作指南

欢迎加入「个性化学习多智能体系统」项目！为了高效、有序地协作，请遵循以下规范

## 1. 前期准备（每个成员必做）

### 1.1 安装 Git
- 前往git官网下载
- 安装后，在终端（或 Git Bash）执行以下命令，配置你的身份（**用你自己的 GitHub 信息**）：
```bash
  git config --global user.name "你的GitHub用户名"
  git config --global user.email "你的GitHub注册邮箱"
``` 
### 1.2 克隆仓库到本地
```bash
git clone https://github.com/caixiang2005/personalized-learning-multi-agent.git
cd personalized-learning-multi-agent

```

### 1.3 验证当前所处分支
``` bash
git branch
```

### 1.4 确保自己当前在main分支，并拉取最新代码（习惯养成）
``` bash
git checkout main   #切换当前工作目录的main分支
git pull    #拉取远程代码
```

### 1.5 创建属于自己功能的分支(不要直接改main)
``` bash
git checkout -b feat/你的任务名
# git checkout -b feat/add-login
# 创建并切换到feat/add-login分支内
```

### 1.6 开始写代码

### 1.7 完成提交并推送
``` bash
git add .
git commit -m "feat: 简短说明做了什么"
git push origin feat/你的任务名
```

### 1.8 去 GitHub 网页创建 Pull Request
浏览器打开仓库 → 点击绿色按钮 Compare & pull request → 填写标题 → 创建 → 等待管理员（蔡翔）审核合并。

## 提交信息格式规范

为了保持项目历史清晰、便于自动生成变更日志，所有提交信息请遵循 **Conventional Commits** 格式：


### 常用类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新增功能 | `feat: 添加资源推荐算法` |
| `fix` | 修复 bug | `fix: 修复登录 token 过期问题` |
| `docs` | 文档修改 | `docs: 更新 API 使用说明` |
| `style` | 代码格式（不影响运行） | `style: 统一缩进为2空格` |
| `refactor` | 重构（非新功能、非修复） | `refactor: 拆分智能体基类` |
| `test` | 添加或修改测试 | `test: 增加资源生成模块单元测试` |
| `chore` | 构建过程、辅助工具变动 | `chore: 更新依赖版本` |

### 范围（可选）

可以用括号注明影响的模块，例如：
- `feat(agent): 增加学习智能体`
- `fix(core): 修复大模型接口超时`

### 提交细则

如果提交关联某个 Issue，可以在提交信息末尾写：
