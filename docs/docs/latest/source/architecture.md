# 核心架构与设计哲学

本文讨论 Pi 为什么这样设计。以 **Pi v0.85.1** 源码为基准。建议先读 [从一个最小 Agent 开始](minimal-agent.md)。

## 先从一个任务想起

用户说：“找到项目里的登录错误，修好它，并运行测试。”

一个只会聊天的程序只能给建议；一个 Agent 需要在模型和程序之间来回传递。Pi 的大部分架构，都在回答三个问题：

- 模型如何保持可替换？
- 工具和扩展如何不把核心循环变成一团耦合代码？
- 一个可能执行代码的 Agent，如何在陌生项目里保持可控？

后面的 `Models`、事件、扩展、项目信任和会话设计，都可以看作这三个问题的不同答案。

## 一、先读四个核心包

读 `pi` 命令，从这四层开始：

```
pi-tui            终端 UI：差分渲染、组件、编辑器
pi-ai             LLM：Models 运行时、Provider、API 实现、认证
pi-agent-core     Agent Loop、工具执行协议、事件
pi-coding-agent   CLI、项目信任、扩展、会话、TUI 集成
```

| 包                | 职责                  | 不做什么                 |
| ----------------- | --------------------- | ------------------------ |
| `pi-ai`           | 统一调用各家 LLM      | 不跑工具循环，不保存会话 |
| `pi-agent-core`   | Agent Loop 和工具协议 | 不解析 CLI，不直接读终端 |
| `pi-coding-agent` | 把上面两层组装成产品  | 不自己实现 LLM 协议      |
| `pi-tui`          | 渲染和按键            | 不了解 Agent 业务        |

主路径是 `AgentSession` → `Agent` → `runAgentLoop` → `streamFn` → `ModelRuntime`。

`packages/agent/src/harness/` 里的 `AgentHarness` 是更通用的会话运行时，实验性 remote/plugin 路径会用到它。它不是 `pi` 交互模式的入口。

## 二、仓库里还有什么（先跳过）

v0.85 的 monorepo 比四个包更大。这些目录存在，但不应该挡住第一次阅读：

| 目录                                      | 做什么               | 何时再看                                        |
| ----------------------------------------- | -------------------- | ----------------------------------------------- |
| `packages/chord`                          | 插件/facet 运行时    | 做插件宿主时                                    |
| `packages/telemetry`                      | 遥测                 | 看事件 schema 时                                |
| `packages/protocol` / `client` / `server` | 实验性远程 harness   | `PI_EXPERIMENTAL=1 ./pi-test.sh server\|client` |
| `packages/session-backends`               | 例如 sqlite 会话后端 | 不走默认 JSONL 时                               |
| `packages/evals`                          | 文档和运行时评估     | 做回归时                                        |
| `packages/coding-agent/src/experimental/` | 未进 npm 的开发代码  | 明确做实验功能时                                |

官方开发文档写得很清楚：`client` 和 `experimental/plugin` 子路径只在源码 checkout 里解析，不会进 npm 包和独立二进制。

## 三、Models 运行时：让模型可替换

旧的全局 `stream()` + `api-registry` 还在 `@earendil-works/pi-ai/compat`。新代码的方向是：

```
createModels()
  → setProvider(anthropicProvider())
  → models.stream(model, context, opts)
      → Provider 自己解析 auth
      → Provider.api.stream(...)
```

coding-agent 再包一层 `ModelRuntime`：加载 `models.json` / `auth.json`、叠加扩展 Provider、维护可用性快照。详细实现见 [Models 运行时与 Provider](models-runtime.md)。

无论底层是哪家 SSE，pi-ai 都收成同一组 assistant 事件：`start`、`text_delta`、`thinking_delta`、`toolcall_delta`、`done`、`error`。Agent Loop 不需要知道当前是 Anthropic 还是 OpenAI。

## 四、事件分三层看

不要把所有 `*_start` 都当成同一种事件。

### 1. Agent 循环事件

**文件**：`packages/agent/src/types.ts`

```text
agent_start / agent_end
turn_start / turn_end
message_start / message_update / message_end
tool_execution_start / tool_execution_update / tool_execution_end
```

这是 `runAgentLoop` 发出的最小集合。

### 2. AgentSession 事件

**文件**：`packages/coding-agent/src/core/agent-session.ts`

在 Agent 事件之上，会话层补了产品语义：

```text
agent_settled
queue_update
compaction_start / compaction_end
auto_retry_start / auto_retry_end
entry_appended
thinking_level_changed
...
```

TUI 监听的是这一层。压缩指示器和自动重试文案都不在 `agent-loop.ts`。

### 3. 扩展事件

扩展既能听到循环，也能介入产品边界。和读码最相关的是：

```text
input
before_agent_start / agent_start / agent_end / agent_settled
before_provider_request / before_provider_headers / after_provider_response
tool_call / tool_result
tool_execution_start / update / end
project_trust
session_before_compact / session_compact / session_compact_failed
session_start / session_shutdown
ui_prompt_start / ui_prompt_end
```

`tool_call` 仍然是扩展拦截工具的钩子；循环内部的进度事件则叫 `tool_execution_*`。两者同时存在，职责不同。

## 五、TUI：差分渲染 + 两种屏幕

**文件**：`packages/tui/src/tui.ts`

Pi 不每帧清屏。它保存上一帧的行，只输出变化的行。组件接口是：

```typescript
interface Component {
  render(width: number): string[];
  handleInput?(data: string): void;
  handleMouse?(event: TuiMouseEvent): TuiMouseEventResult | undefined;
  invalidate(): void;
}
```

输入监听的结果字段是 `consume`。

coding-agent 在这之上分两种屏幕：

- `TuiMainScreen`：普通交互
- `TuiAltScreen`：fullscreen，带搜索、跳到最新消息、选区复制

Overlay 还在：`ui.showOverlay(component, { anchor, width, height })`。模型选择器、信任选择器都走这条路。

## 六、扩展优于修改核心

**文件**：`packages/coding-agent/src/core/extensions/runner.ts`

扩展是 TypeScript 模块。它可以：

1. 注册工具和斜杠命令
2. 监听或改写事件
3. 改系统提示
4. 挂自定义 UI
5. 参与项目信任决策

加载顺序仍然是：用户/全局/CLI 扩展先到，项目本地扩展只有在项目被信任后才加载。

## 七、项目信任是安全边界，不是设置项

Pi 会加载 `.pi/`、`AGENTS.md`、项目扩展。这些东西能跑代码，所以启动时要先问。细节见 [项目信任与认证](trust-and-auth.md)。

可以先记一句：未信任的项目，本地扩展不会执行。

## 八、设计哲学

### 1. 关注点分离

循环不知道 API key。TUI 不知道 Provider。认证不知道工具。扩展不能在信任前加载项目代码。

### 2. 注入模型，而不是写死模型

`streamFn` 是循环和产品之间的合同。换 Provider、加请求头、做重试，都发生在合同外侧。

### 3. 无状态工厂，有状态门面

`anthropicProvider()` 是纯工厂。`createModels()` 得到一份可替换的运行时。coding-agent 的 `ModelRuntime` 再把文件、扩展和凭证变成产品门面。

### 4. 扩展优于改核心

能用事件和注册 API 做的事，不要去改 `agent-loop.ts`。

### 5. 渐进式复杂度

```
pi "解释这个文件"
pi --model anthropic/claude-sonnet-4-5
自定义扩展 / 自定义 Provider / 改 TUI
```

## 下一步

- [Models 运行时与 Provider](models-runtime.md)
- [项目信任与认证](trust-and-auth.md)
- [上下文压缩与会话分支](compaction-and-branches.md)
