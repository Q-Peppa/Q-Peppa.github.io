# 环境搭建与调试

本文档带你从零开始搭建 Pi 的本地开发环境，并学会使用断点调试追踪代码执行。

## 第一步：克隆与安装

```bash
# 1. 克隆仓库
git clone https://github.com/earendil-works/pi-mono.git
cd pi-mono

# 2. 安装依赖（--ignore-scripts 不执行依赖的生命周期脚本，安全）
npm install --ignore-scripts

# 3. 验证安装
npm run check
```

`npm run check` 执行完整的质量检查（TypeScript 类型检查 + Biome lint），**不会运行测试**。这是每次修改代码后的标准验证命令。

## 第二步：理解目录结构

```
pi-mono/
├── packages/
│   ├── ai/                    # pi-ai：统一 LLM API
│   │   ├── src/
│   │   │   ├── types.ts       # 核心类型定义（Model, Context, Tool）
│   │   │   ├── stream.ts      # 流式调用入口
│   │   │   ├── complete.ts    # 非流式调用入口
│   │   │   ├── providers/     # 各 LLM 提供商实现
│   │   │   ├── api-registry.ts# 提供商注册表
│   │   │   └── utils/         # 事件流、工具校验等工具
│   │   └── scripts/
│   │       └── generate-models.ts  # 模型元数据生成
│   │
│   ├── agent/                 # pi-agent-core：智能体运行时
│   │   └── src/
│   │       ├── agent.ts       # Agent 类
│   │       ├── agent-loop.ts  # ★ 核心循环 runAgentLoop
│   │       ├── types.ts       # Agent 类型
│   │       └── proxy.ts       # 工具代理层
│   │
│   ├── coding-agent/          # pi-coding-agent：CLI 应用层
│   │   └── src/
│   │       ├── cli.ts         # ★ CLI 入口（第 17 行调用 main）
│   │       ├── main.ts        # ★ 主流程：参数解析 → 模式选择 → 启动
│   │       ├── config.ts      # 配置系统
│   │       ├── core/
│   │       │   ├── agent-session.ts       # AgentSession：业务逻辑中枢
│   │       │   ├── agent-session-runtime.ts  # 服务组装
│   │       │   ├── session-manager.ts     # 会话持久化
│   │       │   ├── extensions/            # 扩展系统
│   │       │   └── tools/                 # 内置工具
│   │       └── modes/
│   │           ├── interactive/           # ★ 交互模式
│   │           │   └── interactive-mode.ts # TUI 主循环
│   │           ├── print-mode.ts          # 非交互输出
│   │           └── rpc/                   # RPC 模式
│   │
│   └── tui/                   # pi-tui：终端 UI 库
│       └── src/
│           ├── tui.ts         # TUI 主类（差分渲染）
│           ├── terminal.ts    # 终端抽象层
│           ├── components/    # UI 组件
│           │   ├── editor.ts  # 编辑器组件
│           │   └── markdown.ts# Markdown 渲染
│           ├── keys.ts        # 按键解码（43K 行，最大的文件）
│           └── autocomplete.ts# 模糊搜索/补全
│
├── tsconfig.json              # TypeScript 配置
├── package.json               # Monorepo 根配置
└── AGENTS.md                  # 开发规则
```

## 第三步：直接运行源码（无需构建）

Pi 的源码使用 TypeScript，但**不需要先编译**。使用 `tsx` 直接运行：

```bash
# 方法一：使用 npx tsx
npx tsx packages/coding-agent/src/cli.ts --help

# 方法二：如果安装了 tsx 全局
tsx packages/coding-agent/src/cli.ts -p "Say hello"
```

不要运行 `npm run build`。Pi 的设计是开发时直接运行 `.ts` 源码，发布时通过打包脚本处理。

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

| 断点位置 | 文件 | 行号 | 观察什么 |
|----------|------|------|---------|
| CLI 入口 | `packages/coding-agent/src/cli.ts` | 第 17 行 | `process.argv` 参数 |
| 主流程开始 | `packages/coding-agent/src/main.ts` | `main()` 函数 | 参数解析结果、appMode 选择 |
| TUI 创建 | `packages/coding-agent/src/modes/interactive/interactive-mode.ts` | 构造函数 | TUI 初始化参数 |
| TUI 启动 | 同上 | `init()` 方法中 `ui.start()` | UI 布局构建 |
| 主循环 | 同上 | `run()` 方法中 `while(true)` | `getUserInput()` 等待输入 |
| 消息发送 | `packages/coding-agent/src/core/agent-session.ts` | `prompt()` 方法 | 消息预处理、skill 展开 |
| Agent 循环 | `packages/agent/src/agent-loop.ts` | `runLoop()` 函数 | ★ 核心循环入口 |
| LLM 调用 | 同上 | `streamAssistantResponse()` | LLM 请求参数和流式响应 |

### 调试技巧

```typescript
// 在任意位置添加临时日志（调试完后删除）
console.log('[DEBUG]', JSON.stringify(obj, null, 2));

// 使用 Node.js 内置 util 查看大对象
import { inspect } from 'node:util';
console.log('[DEBUG]', inspect(obj, { depth: 3, colors: true }));
```

## 第五步：理解 TypeScript 执行方式

Pi 使用 **Node.js strip-only 模式**（通过 `tsx`），这意味着：

1. **TypeScript 类型注解被直接擦除**，不生成 JS
2. 不能使用该模式的 TS 特性（如 `enum`、`namespace`、参数属性）
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
  constructor(private width: number, private title: string) {}
}
```

## 第六步：运行测试

```bash
# 运行非 E2E 测试套件
./test.sh

# 运行单个测试
node ../../node_modules/vitest/dist/cli.js --run test/specific.test.ts
```

不要直接运行 `npm test`。完整套件包含 E2E 测试，需要 API key 且会消耗 token。

## 下一步

→ [从终端到 TUI](cli-to-tui.md) — 理解输入 `pi` 后发生了什么
