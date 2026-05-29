import { Callout } from '@rspress/core/theme';

# 前置知识与学习路径

本系列文档面向**有一定编程基础但对 LLM Agent 或终端 UI 不熟悉的开发者**。我们先明确你需要什么，再给出高效的学习路径。

## 前置技能矩阵

| 技能 | 重要程度 | 为什么需要 | 学习资源 |
|------|----------|-----------|---------|
| **TypeScript** | ⭐⭐⭐⭐⭐ | 整个项目 100% TS，大量使用泛型、类型守卫、接口 | [TypeScript 手册](https://www.typescriptlang.org/docs/) |
| **async/await 与 Promise** | ⭐⭐⭐⭐⭐ | Agent Loop 完全异步，流式处理基于 async iterator | 同上 |
| **Node.js 事件与 Stream** | ⭐⭐⭐⭐ | TUI 读取 stdin 流、LLM 响应是 SSE 流、EventEmitter | [Node.js Stream 文档](https://nodejs.org/api/stream.html) |
| **LLM API 概念** | ⭐⭐⭐⭐ | 理解 streaming、tool calling、context window | [OpenAI API 文档](https://platform.openai.com/docs) |
| **Git** | ⭐⭐⭐ | 克隆仓库、切换分支、查看 diff | [Pro Git](https://git-scm.com/book) |
| **npm / Monorepo** | ⭐⭐ | workspaces 管理多包依赖 | [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) |
| **终端基础** | ⭐⭐ | ANSI 转义码、raw mode、stdin/stdout | 文档中会解释 |

**不需要的前置**：React/Vue/Web 框架、数据库、Docker。本项目是纯 Node.js 终端应用。

## 仓库规模

| 指标 | 数据 |
|------|------|
| 总代码量 | ~29,874 行（仅 `*.ts` 源文件） |
| TypeScript 文件 | 约 630 个 |
| 包数量 | 4 个主包 |
| 测试文件 | 数百个 |

<Callout type="info">
**好消息**：你不需要读完所有代码。核心逻辑集中在约 5,000 行中。其余是边缘处理、测试、和独立模块。
</Callout>

## 阅读顺序（推荐）

### 第一周：建立全景图

```
Day 1-2  → 本文档（前置知识 + 学习路径）
Day 3-4  → 环境搭建与调试（实际运行代码，打断点）
Day 5-7  → 从终端到 TUI（理解 CLI 到界面的完整流程）
```

目标：能回答 **"我在终端输入 `pi hello`，发生了什么？"**

### 第二周：深入 Agent Loop

```
Day 8-10 → 从输入到 LLM 循环（核心业务逻辑）
Day 11-12 → 工具系统（read/write/bash/edit 如何实现）
Day 13-14 → Provider 抽象层（如何统一 30+ LLM 提供商）
```

目标：能回答 **"LLM 如何调用工具、循环处理、最终给出答案？"**

### 第三周及以后：架构与设计

```
持续学习 → 核心架构与设计哲学
           → TUI 实现细节（按需）
           → 扩展系统（按需）
```

目标：能**独立编写 Extension、自定义 Tool、修改 TUI 行为**。

## 不同背景的读者

### 如果你是前端开发者

你最需要补的课：
1. **Node.js Stream API** — TUI 和 LLM 通信都基于流
2. **终端概念** — raw mode、ANSI 转义、pty
3. **Agent 模式** — 思考 "LLM + 工具 + 循环" 而非 "请求 → 响应"

你的优势：理解组件化思维（TUI 的 Component 接口与 React 组件概念类似）。

### 如果你是后端开发者

你最需要补的课：
1. **LLM API** — streaming、tool calling 的概念
2. **终端 UI** — 不同于 Web UI 的渲染模型
3. **TypeScript 类型系统** — 项目重度使用泛型和条件类型

你的优势：理解事件循环、异步编程、API 抽象。

### 如果你是 Python/非 TS 开发者

建议先花 1-2 天学习 TypeScript 基础：
- 类型注解、接口、泛型
- `async/await` 语法
- ES Module 导入导出

Pi 的代码风格是**显式类型、无 `any`、纯 async/await**，对 Python 开发者来说相当易读。

## 调试工具准备

| 工具 | 用途 | 安装 |
|------|------|------|
| **VS Code** | 断点调试、代码导航 | 推荐 |
| **Node.js 18+** | 运行环境 | `nvm install 20` |
| **npm** | 包管理 | 随 Node.js 安装 |

<Callout type="warning">
**不要在浏览器中读代码**。这个项目需要本地调试才能理解数据流。GitHub 的代码浏览无法追踪运行时行为。
</Callout>

## 预期学习时间

| 目标 | 时间 | 产出 |
|------|------|------|
| 跑起来、会用 | 半天 | 能使用 Pi 完成日常编码任务 |
| 理解核心流程 | 1-2 周 | 能解释完整数据流，定位关键代码 |
| 能修改功能 | 1 个月 | 能添加 Tool、修改 Agent 行为 |
| 完全掌握 | 3-6 个月 | 能独立开发 Extension、贡献核心代码 |

## 下一步

→ [环境搭建与调试](setup-and-debug.md)
