# 前置知识与学习路径

本系列面向**会写一点代码、但不一定了解 Agent 的读者**。你不需要先学会所有终端术语，也不需要把整个仓库读完。先理解一个小 Agent，再在遇到问题时补 TypeScript、异步和终端知识，会更容易坚持下去。

最重要的前置知识只有三个：

1. 能读懂基本的 TypeScript/JavaScript；
2. 知道 `async/await` 大概在做什么；
3. 愿意在本地运行代码，并观察一次输入是怎样流动的。

其余概念会在文章中边用边解释。

## 前置技能矩阵

| 技能                       | 重要程度   | 为什么需要                                         | 学习资源                                                          |
| -------------------------- | ---------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| **TypeScript**             | ⭐⭐⭐⭐⭐ | 整个项目是 TS，类型用来表达 Provider、消息和事件   | [TypeScript 手册](https://www.typescriptlang.org/docs/)           |
| **async/await 与 Promise** | ⭐⭐⭐⭐⭐ | Agent Loop 完全异步，流式处理基于 async iterator   | 同上                                                              |
| **Node.js 事件与 Stream**  | ⭐⭐⭐⭐   | TUI 读取 stdin，LLM 响应是流                       | [Node.js Stream 文档](https://nodejs.org/api/stream.html)         |
| **LLM API 概念**           | ⭐⭐⭐⭐   | streaming、tool calling、context window、reasoning | [OpenAI API 文档](https://platform.openai.com/docs)               |
| **Git**                    | ⭐⭐⭐     | 克隆仓库、查看 diff                                | [Pro Git](https://git-scm.com/book)                               |
| **npm / Monorepo**         | ⭐⭐       | 上游用 npm workspaces 管理多包                     | [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) |
| **终端基础**               | ⭐⭐       | ANSI 转义码、raw mode、stdin/stdout                | 文档中会解释                                                      |

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

## 仓库规模（v0.85.1）

| 指标           | 数据                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| 总体规模       | 持续变化；不要把行数当作阅读目标                                                |
| 核心包         | `ai`、`agent`、`coding-agent`、`tui`                                            |
| 另外还有       | `chord`、`telemetry`、`protocol`/`client`/`server`、`session-backends`、`evals` |
| 测试与生成文件 | 占比很高，初读时可先跳过                                                        |

**好消息**：你不需要读完所有代码。先沿着运行时边界阅读，核心逻辑会自然收敛到几组文件：

- `packages/agent/src/agent-loop.ts` — Agent 循环
- `packages/coding-agent/src/core/agent-session.ts` — 产品层会话中枢
- `packages/coding-agent/src/core/sdk.ts` — 把 `streamFn` 接到 `ModelRuntime`
- `packages/ai/src/models.ts` — Models 运行时
- `packages/tui/src/tui.ts` — 差分渲染

其余大量文件是按 Provider 生成的模型目录、各家 API 实现、工具渲染、测试和实验性代码。

## 阅读顺序（推荐）

```
先建立一个小图
  → 最小 Agent
  → 环境搭建，跑一次 `pi`，打断点

再沿着一次输入走
  → 从终端到 TUI
  → 从输入到 LLM 循环

然后按兴趣深入
  → 架构与设计哲学
  → Models / 认证 / 项目信任
  → 压缩与会话分支
```

目标问题可以一直问自己：

1. 我在终端输入 `pi hello`，发生了什么？
2. LLM 如何调用工具、循环处理、最终给出答案？
3. 认证、项目信任和压缩分别在哪一层拦住了什么？

## 不同背景的读者

### 如果你是前端开发者

最需要补的是 Node.js Stream、终端 raw mode，以及“LLM + 工具 + 循环”而不是“请求 → 响应”。优势是 TUI 的 `Component` 很像组件树。

### 如果你是后端开发者

最需要补的是 streaming、tool calling，以及终端 UI 不是 Web 渲染模型。优势是事件循环和 API 抽象会很熟悉。

### 如果你是 Python / 非 TS 开发者

先花一点时间看类型注解、接口、`async/await` 和 ES Module。Pi 的风格是显式类型、尽量避免 `any`、纯 async/await，读起来通常比看起来吓人。

## 调试工具

| 工具               | 用途                     |
| ------------------ | ------------------------ |
| **VS Code**        | 断点调试、代码导航       |
| **Node.js 22.19+** | 运行环境                 |
| **npm**            | 上游包管理               |
| **tsx**            | 直接运行 TypeScript 源码 |

不要只在 GitHub 网页上读。这个项目需要本地跑一次，才能看到输入如何变成事件。

## 下一步

→ [环境搭建与调试](setup-and-debug.md)
