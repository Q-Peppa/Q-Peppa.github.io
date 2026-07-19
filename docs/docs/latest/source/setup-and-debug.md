# 环境搭建与调试

本文档带你从零开始搭建 Pi 的本地开发环境，并学会使用断点调试追踪代码执行。内容基于 **Pi v0.80.10**。

## 第一步：克隆与安装

```bash
# 1. 克隆仓库（仓库已从 pi-mono 迁移到 pi）
git clone https://github.com/earendil-works/pi.git
cd pi

# 2. 安装依赖（--ignore-scripts 不执行依赖的生命周期脚本，安全）
pnpm install --ignore-scripts

# 3. 验证安装
pnpm run check
```

`pnpm run check` 执行完整的质量检查：Biome lint + 类型检查（`tsgo --noEmit`）+ 依赖/导入检查。**不会运行 E2E 测试**。这是每次修改代码后的标准验证命令。

> Node.js 版本要求 `>= 22.19.0`。如果本地版本不够，先用 `nvm install 22` 升级。

## 第二步：理解目录结构

```
pi/
├── packages/
│   ├── ai/                         # pi-ai：统一 LLM API 与 Models 运行时
│   │   ├── src/
│   │   │   ├── api/                # ★ API 协议实现：openai-completions、anthropic-messages...
│   │   │   │   ├── openai-completions.ts
│   │   │   │   ├── anthropic-messages.ts
│   │   │   │   └── ...
│   │   │   ├── providers/          # ★ Provider factory + 按 Provider 拆分的模型目录
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── anthropic.models.ts
│   │   │   │   ├── all.ts
│   │   │   │   └── ...
│   │   │   ├── auth/               # 认证基础设施：CredentialStore、AuthContext、OAuth
│   │   │   │   ├── credential-store.ts
│   │   │   │   ├── helpers.ts
│   │   │   │   └── resolve.ts
│   │   │   ├── models.ts           # ★ createModels() / createProvider() / Models 运行时
│   │   │   ├── compat.ts           # 旧全局 API（stream/complete/api-registry）的兼容入口
│   │   │   ├── api-registry.ts     # 旧的 API Provider 注册表（将被 Models 运行时替代）
│   │   │   └── types.ts            # 核心类型：Model、Context、Tool、Provider...
│   │   └── scripts/
│   │       └── generate-models.ts  # 生成各 Provider 模型目录的脚本
│   │
│   ├── agent/                      # pi-agent-core：智能体运行时
│   │   └── src/
│   │       ├── agent.ts            # Agent 类
│   │       ├── agent-loop.ts       # ★ 核心循环 runAgentLoop
│   │       ├── types.ts            # Agent 类型
│   │       ├── proxy.ts            # 工具代理层
│   │       └── harness/            # AgentHarness（供 SDK / 外部集成）
│   │       └── index.ts            # 公共导出
│   │
│   ├── coding-agent/               # pi-coding-agent：CLI 应用层
│   │   └── src/
│   │       ├── cli.ts              # ★ CLI 入口
│   │       ├── main.ts             # ★ 主流程：参数解析 → 模式选择 → 项目信任 → 启动
│   │       ├── config.ts           # 配置系统
│   │       ├── core/
│   │       │   ├── agent-session.ts            # AgentSession：业务逻辑中枢
│   │       │   ├── agent-session-runtime.ts    # AgentSessionRuntime 生命周期管理
│   │       │   ├── agent-session-services.ts   # 服务组装（createAgentSessionServices）
│   │       │   ├── auth-storage.ts             # auth.json 读写 + runtime API key
│   │       │   ├── auth-guidance.ts            # 无认证时的引导文案
│   │       │   ├── bash-executor.ts            # bash 工具执行封装
│   │       │   ├── compaction/                 # 上下文压缩相关逻辑
│   │       │   ├── event-bus.ts                # 轻量级事件总线
│   │       │   ├── extensions/                 # 扩展系统
│   │       │   ├── model-registry.ts           # 模型注册表 + 认证解析
│   │       │   ├── model-resolver.ts           # CLI / 选择器模型解析
│   │       │   ├── project-trust.ts            # 项目信任决策入口
│   │       │   ├── trust-manager.ts            # 项目信任存储与查询
│   │       │   ├── session-manager.ts          # 会话持久化（JSONL）
│   │       │   ├── settings-manager.ts         # 设置管理
│   │       │   ├── system-prompt.ts            # 系统 Prompt 组装
│   │       │   └── tools/                      # 内置工具
│   │       └── modes/
│   │           ├── interactive/                # ★ 交互模式
│   │           │   └── interactive-mode.ts     # TUI 主循环
│   │           ├── print-mode.ts               # 非交互输出
│   │           └── rpc/                        # RPC 模式
│   │
│   └── tui/                        # pi-tui：终端 UI 库
│       └── src/
│           ├── tui.ts              # TUI 主类（差分渲染）
│           ├── terminal.ts         # 终端抽象层
│           ├── components/         # UI 组件
│           │   ├── editor.ts       # 编辑器组件
│           │   └── markdown.ts     # Markdown 渲染
│           ├── keys.ts             # 按键解码（现在约 1.4K 行）
│           └── autocomplete.ts     # 模糊搜索 / 补全
│
├── tsconfig.json
├── package.json
├── AGENTS.md                       # 开发规则
└── README.md
```

### v0.80 目录变化速查

| 旧理解（v0.78 及以前）                       | 当前实现（v0.80.10）                             | 说明                                                  |
| -------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| `packages/ai/src/providers/*.ts` 是 API 实现 | `packages/ai/src/api/*.ts`                       | API 实现搬家                                          |
| `packages/ai/src/providers/`                 | `packages/ai/src/providers/*.ts` + `*.models.ts` | 现在放 Provider factory 和模型目录                    |
| `packages/ai/src/stream.ts` / `complete.ts`  | 已删除                                           | 旧全局入口移到 `compat.ts`，新入口是 `createModels()` |
| 单一 `models.generated.ts`                   | `providers/*.models.ts`                          | 按 Provider 拆分，便于 tree-shaking                   |
| 无 `auth/` 目录                              | `packages/ai/src/auth/`                          | 新增认证基础设施                                      |
| `packages/agent/src/proxy.ts`                | 仍存在                                           | Agent Loop 可通过 `streamFn` 注入模型调用             |

## 第三步：直接运行源码（无需构建）

Pi 的源码是 TypeScript，但开发时**不需要先编译**。使用 `tsx` 直接运行：

```bash
# 方法一：使用 npx tsx
npx tsx packages/coding-agent/src/cli.ts --help

# 方法二：如果全局安装了 tsx
tsx packages/coding-agent/src/cli.ts -p "Say hello"
```

发布构建使用 `tsgo`（TypeScript native 预览编译器）：

```bash
npm run build
```

日常调试不需要 `npm run build`，直接 `tsx` 即可。

## 第四步：VS Code 断点调试

### 配置 launch.json

在项目根目录创建 `.vscode/launch.json`：

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
      "sourceMaps": true,
      "env": {
        "ANTHROPIC_API_KEY": "你的key（可选）"
      }
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

### 关键断点位置

| 断点位置     | 文件                                                                      | 观察什么                                     |
| ------------ | ------------------------------------------------------------------------- | -------------------------------------------- |
| CLI 入口     | `packages/coding-agent/src/cli.ts`                                        | `process.argv` 参数                          |
| 主流程开始   | `packages/coding-agent/src/main.ts`                                       | 参数解析、appMode、项目信任                  |
| 服务组装     | `packages/coding-agent/src/core/agent-session-services.ts`                | ModelRuntime、Settings、ResourceLoader 组装  |
| Runtime 创建 | `packages/coding-agent/src/core/agent-session-runtime.ts`                 | `createAgentSessionRuntime`                  |
| TUI 创建     | `packages/coding-agent/src/modes/interactive/interactive-mode.ts`         | TUI 初始化参数                               |
| 主循环       | `packages/coding-agent/src/modes/interactive/interactive-mode.ts` `run()` | `getUserInput()` 等待输入                    |
| 消息发送     | `packages/coding-agent/src/core/agent-session.ts` `prompt()`              | 消息预处理、skill 展开、扩展拦截             |
| Agent 循环   | `packages/agent/src/agent-loop.ts`                                        | ★ 核心循环入口                               |
| LLM 调用     | `packages/agent/src/agent-loop.ts` `streamAssistantResponse()`            | LLM 请求参数和流式响应                       |
| 认证解析     | `packages/coding-agent/src/core/model-runtime.ts`                         | CredentialStore、Provider auth、runtime 覆盖 |

### 调试技巧

```typescript
// 在任意位置添加临时日志（调试完后删除）
console.log('[DEBUG]', JSON.stringify(obj, null, 2));

// 使用 Node.js 内置 util 查看大对象
import { inspect } from 'node:util';
console.log('[DEBUG]', inspect(obj, { depth: 3, colors: true }));
```

## 第五步：理解 TypeScript 执行方式

Pi 使用 **Node.js strip-only 模式**（通过 `tsx` 或 `tsgo`），这意味着：

1. **TypeScript 类型注解被直接擦除**，不生成 JS
2. 不能使用该模式需要 JS emit 的 TS 特性（如 `enum`、`namespace`、参数属性）
3. 所有类必须用**显式字段 + 构造函数赋值**，而非参数属性

示例（正确的写法）：

```typescript
// ✅ 正确：显式字段 + 构造函数赋值
class MyComponent {
  private width: number;
  private title: string;

  constructor(width: number, title: string) {
    this.width = width;
    this.title = title;
  }
}

// ❌ 错误：参数属性（需要 JS emit）
class MyComponent {
  constructor(
    private width: number,
    private title: string,
  ) {}
}
```

## 第六步：运行测试

```bash
# 运行非 E2E 测试套件
./test.sh

# 运行单个包的测试
npm run test --workspace=@earendil-works/pi-agent-core

# 运行单个测试文件
npx vitest --run packages/agent/test/agent.test.ts
```

不要直接运行根目录的 `npm test`。完整套件包含 E2E 测试，需要 API key 且会消耗 token。

## 下一步

→ [从终端到 TUI](cli-to-tui.md) — 理解输入 `pi` 后发生了什么
