# 环境搭建与调试

本文档带你从零开始搭建 Pi 的本地开发环境，并学会用断点追踪一次输入。内容基于 **Pi v0.85.1**。

## 第一步：克隆与安装

上游是 npm workspaces。安装时不要跑依赖的生命周期脚本：

```bash
git clone https://github.com/earendil-works/pi.git
cd pi
npm install --ignore-scripts
npm run check
```

`npm run check` 做 lint、类型检查和依赖/导入检查，**不会跑 E2E 测试**。这是改完代码后的标准验证。

Node.js 要求 `>= 22.19.0`。官方开发文档还会用 `npm run build` 和 `./pi-test.sh` 从源码启动；读码阶段直接 `tsx` 也够用。

## 第二步：先建立一张地图

仓库比四个核心包更大，但读 `pi` 命令本身时，先盯这些目录：

```
pi/
├── packages/
│   ├── ai/                         # pi-ai：统一 LLM API 与 Models 运行时
│   │   └── src/
│   │       ├── api/                # 协议实现：anthropic-messages、openai-completions...
│   │       ├── providers/          # Provider factory + 按 Provider 拆分的模型目录
│   │       ├── auth/               # CredentialStore、AuthContext、OAuth
│   │       ├── models.ts           # createModels() / createProvider()
│   │       ├── models.generated.ts # 各 *.models.ts 的汇总，由脚本生成
│   │       └── compat.ts           # 旧全局 API（stream / api-registry）的兼容入口
│   │
│   ├── agent/                      # pi-agent-core：智能体运行时
│   │   └── src/
│   │       ├── agent.ts            # Agent 类
│   │       ├── agent-loop.ts       # ★ runAgentLoop
│   │       ├── types.ts            # Agent 类型与 AgentEvent
│   │       └── harness/            # AgentHarness（通用/实验路径，先跳过）
│   │
│   ├── coding-agent/               # pi-coding-agent：CLI 应用层
│   │   └── src/
│   │       ├── cli.ts              # 入口：setupCli() + main()
│   │       ├── cli/                # 参数、登录命令、首次启动 UI
│   │       ├── main.ts             # 参数解析 → 模式 → 信任 → Runtime
│   │       └── core/
│   │           ├── sdk.ts                      # 组装 Agent 与 streamFn
│   │           ├── agent-session.ts            # 业务逻辑中枢
│   │           ├── agent-session-runtime.ts    # /new /resume /fork 复用的工厂
│   │           ├── agent-session-services.ts   # ModelRuntime、Settings、资源加载
│   │           ├── model-runtime.ts            # 模型/认证门面
│   │           ├── project-trust.ts            # 项目信任入口
│   │           ├── trust-manager.ts            # trust.json
│   │           └── compaction/                 # coding-agent 会话压缩
│   │
│   └── tui/                        # pi-tui：终端 UI 库
│       └── src/
│           ├── tui.ts              # 差分渲染
│           ├── tui-main-screen.ts  # 普通模式
│           ├── tui-alt-screen.ts   # fullscreen
│           └── terminal.ts         # raw mode、备用屏幕
│
├── AGENTS.md
└── pi-test.sh
```

同一仓库里还有 `chord`、`telemetry`、`protocol`/`client`/`server`、`session-backends`、`evals`。它们服务插件、遥测、实验性远程 harness 和评估，**不是读 `pi hello` 的起点**。

## 第三步：直接运行源码

日常调试不必先编译。两种常见方式：

```bash
# 官方推荐：从任意目录启动，保留调用者的 cwd
./pi-test.sh

# 给 CLI 入口打断点
npx tsx packages/coding-agent/src/cli.ts --help
npx tsx packages/coding-agent/src/cli.ts -p "Say hello"
```

发布构建使用 `tsgo`：

```bash
npm run build
```

## 第四步：VS Code 断点调试

在仓库根目录创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Pi Interactive",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "tsx",
      "program": "${workspaceFolder}/packages/coding-agent/src/cli.ts",
      "args": [],
      "console": "integratedTerminal",
      "sourceMaps": true
    },
    {
      "name": "Debug Pi Print Mode",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "tsx",
      "program": "${workspaceFolder}/packages/coding-agent/src/cli.ts",
      "args": ["-p", "Summarize this repo"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 关键断点

| 观察什么   | 文件                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 进程启动   | `packages/coding-agent/src/cli/setup.ts`                                  |
| 参数与模式 | `packages/coding-agent/src/main.ts`、`cli/args.ts`                        |
| 服务组装   | `packages/coding-agent/src/core/agent-session-services.ts`                |
| TUI 创建   | `packages/coding-agent/src/modes/interactive/tui-renderer.ts`             |
| 用户输入   | `packages/coding-agent/src/modes/interactive/interactive-mode.ts` `run()` |
| 消息预处理 | `packages/coding-agent/src/core/agent-session.ts` `prompt()`              |
| Agent 循环 | `packages/agent/src/agent-loop.ts`                                        |
| 模型调用   | `packages/coding-agent/src/core/sdk.ts` 里的 `streamFn`                   |
| 认证       | `packages/coding-agent/src/core/model-runtime.ts`                         |

## 第五步：理解 TypeScript 执行方式

Pi 使用 Node.js strip-only 模式（`tsx` 或 `tsgo`）：

1. 类型注解被擦除，不生成额外 JS emit。
2. 不能使用需要 emit 的语法：`enum`、`namespace`、参数属性。
3. 类必须用显式字段 + 构造函数赋值。

```typescript
// 正确
class MyComponent {
  private width: number;
  private title: string;

  constructor(width: number, title: string) {
    this.width = width;
    this.title = title;
  }
}

// 错误：参数属性需要 JS emit
class MyComponent {
  constructor(
    private width: number,
    private title: string,
  ) {}
}
```

## 第六步：运行测试

```bash
./test.sh
```

不要直接跑根目录 `npm test`。完整套件包含 E2E，需要 API key，也会消耗 token。单个文件用 vitest：

```bash
npx vitest --run packages/agent/test/agent.test.ts
```

## 下一步

→ [从终端到 TUI](cli-to-tui.md) — 理解输入 `pi` 后发生了什么
