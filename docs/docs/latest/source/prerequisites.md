# 前置知识与学习路径

本系列文档面向**会写一点代码、但不一定了解 Agent 的读者**。你不需要先学会所有终端术语，也不需要把整个仓库读完。先理解一个小 Agent，再在遇到问题时补 TypeScript、异步和终端知识，会更容易坚持下去。

最重要的前置知识只有三个：

1. 能读懂基本的 TypeScript/JavaScript；
2. 知道 `async/await` 大概在做什么；
3. 愿意在本地运行代码，并观察一次输入是怎样流动的。

其余概念会在文章中边用边解释。

## 前置技能矩阵

| 技能                       | 重要程度   | 为什么需要                                               | 学习资源                                                          |
| -------------------------- | ---------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| **TypeScript**             | ⭐⭐⭐⭐⭐ | 整个项目 100% TS，大量使用泛型、类型守卫、接口、条件类型 | [TypeScript 手册](https://www.typescriptlang.org/docs/)           |
| **async/await 与 Promise** | ⭐⭐⭐⭐⭐ | Agent Loop 完全异步，流式处理基于 async iterator         | 同上                                                              |
| **Node.js 事件与 Stream**  | ⭐⭐⭐⭐   | TUI 读取 stdin 流、LLM 响应是 SSE 流、EventEmitter       | [Node.js Stream 文档](https://nodejs.org/api/stream.html)         |
| **LLM API 概念**           | ⭐⭐⭐⭐   | 理解 streaming、tool calling、context window、reasoning  | [OpenAI API 文档](https://platform.openai.com/docs)               |
| **Git**                    | ⭐⭐⭐     | 克隆仓库、切换分支、查看 diff                            | [Pro Git](https://git-scm.com/book)                               |
| **npm / Monorepo**         | ⭐⭐       | workspaces 管理多包依赖                                  | [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) |
| **终端基础**               | ⭐⭐       | ANSI 转义码、raw mode、stdin/stdout                      | 文档中会解释                                                      |

**不需要的前置**：React/Vue/Web 框架、数据库、Docker。本项目是纯 Node.js 终端应用。

## 读源码时只需要先记住的几个词

当前 Pi 的 LLM 层由两层组成。先理解 pi-ai 的通用能力，再理解 coding-agent 如何用 `ModelRuntime` 把它们组合起来：

| 概念             | 一句话解释                                  | 延伸阅读                                |
| ---------------- | ------------------------------------------- | --------------------------------------- |
| **Agent**        | 能调用工具、根据结果继续行动的模型应用      | [最小 Agent](minimal-agent.md)          |
| **Agent Loop**   | “请求模型 → 执行工具 → 回填结果”的循环      | [输入到 LLM](input-to-llm.md)           |
| **Provider**     | 一家模型服务的连接方式、模型目录和认证规则  | [Models 与 Provider](models-runtime.md) |
| **ModelRuntime** | coding-agent 用来组合模型、配置和凭证的门面 | [Models 与 Provider](models-runtime.md) |
| **项目信任**     | 加载项目扩展前，先确认是否允许它们运行      | [信任与认证](trust-and-auth.md)         |

## 仓库规模（v0.80.10）

| 指标            | 数据                                    |
| --------------- | --------------------------------------- |
| 总体规模        | 持续变化；不要把行数当作阅读目标        |
| TypeScript 文件 | 持续变化；以源码路径和导出 API 为准     |
| 核心包          | `ai`、`agent`、`coding-agent`、`tui` 等 |
| 测试与生成文件  | 占比很高，初读时可先跳过                |

**好消息**：你不需要读完所有代码。先沿着运行时边界阅读，核心逻辑会自然收敛到几组文件：

- `packages/agent/src/agent-loop.ts` ~750 行
- `packages/coding-agent/src/core/agent-session.ts` 约 1500+ 行
- `packages/ai/src/models.ts` 是 Models 运行时的核心
- `packages/tui/src/tui.ts` 是 TUI 差分渲染的核心

其余大量文件是：

- 按 Provider 生成的模型目录（`packages/ai/src/providers/*.models.ts`）
- 各 Provider 的 API 实现（`packages/ai/src/api/*.ts`）
- 工具实现与渲染辅助
- 测试与示例扩展

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
Day 11-12 → pi-ai Models、Provider 与 coding-agent ModelRuntime
Day 13-14 → 项目信任与认证体系
```

目标：能回答 **"LLM 如何调用工具、循环处理、最终给出答案？认证和模型解析怎么发生？"**

### 第三周及以后：架构与设计

```
持续学习 → 核心架构与设计哲学
           → 上下文压缩与会话分支
           → TUI 实现细节（按需）
           → 扩展系统（按需）
```

目标：能**独立编写 Extension、自定义 Tool、自定义 Provider、修改 TUI 行为**。

## 不同背景的读者

### 如果你是前端开发者

你最需要补的课：

1. **Node.js Stream API** — TUI 和 LLM 通信都基于流
2. **终端概念** — raw mode、ANSI 转义、pty
3. **Agent 模式** — 思考 "LLM + 工具 + 循环" 而非 "请求 → 响应"

你的优势：理解组件化思维（TUI 的 Component 接口与 React 组件概念类似）。

### 如果你是后端开发者

你最需要补的课：

1. **LLM API** — streaming、tool calling、reasoning 的概念
2. **终端 UI** — 不同于 Web UI 的渲染模型
3. **TypeScript 类型系统** — 项目重度使用泛型和条件类型

你的优势：理解事件循环、异步编程、API 抽象。

### 如果你是 Python/非 TS 开发者

建议先花 1-2 天学习 TypeScript 基础：

- 类型注解、接口、泛型
- `async/await` 语法
- ES Module 导入导出

Pi 的代码风格是**显式类型、尽量避免 `any`、纯 async/await**，对 Python 开发者来说相当易读。

## 调试工具准备

| 工具            | 用途                     | 安装                                  |
| --------------- | ------------------------ | ------------------------------------- |
| **VS Code**     | 断点调试、代码导航       | 推荐                                  |
| **Node.js 22+** | 运行环境                 | `nvm install 22`                      |
| **npm**         | 包管理                   | 随 Node.js 安装                       |
| **tsx**         | 直接运行 TypeScript 源码 | `npm install -g tsx` 或使用 `npx tsx` |

**不要在浏览器中读代码**。这个项目需要本地调试才能理解数据流。GitHub 的代码浏览无法追踪运行时行为。

## 预期学习时间

| 目标             | 时间     | 产出                                                  |
| ---------------- | -------- | ----------------------------------------------------- |
| 跑起来、会用     | 半天     | 能使用 Pi 完成日常编码任务                            |
| 理解核心流程     | 1-2 周   | 能解释完整数据流，定位关键代码                        |
| 理解 v0.80+ 架构 | 2-3 周   | 能解释 ModelRuntime、Provider factory、认证、项目信任 |
| 能修改功能       | 1 个月   | 能添加 Tool、自定义 Provider、修改 Agent 行为         |
| 完全掌握         | 3-6 个月 | 能独立开发 Extension、贡献核心代码                    |

## 下一步

→ [环境搭建与调试](setup-and-debug.md)
