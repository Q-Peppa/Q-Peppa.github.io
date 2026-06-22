# 核心架构与设计哲学

本文档深入分析 Pi 的架构设计模式。理解这些模式不仅能读懂 Pi 的代码，还能举一反三到其他 LLM Agent 项目。基于 **Pi v0.79.10**。

## 一、关注点分离：四个核心包

Pi 被拆成四个包，每层都有清晰边界：

```
┌─────────────────────────────────────────────────────────────┐
│  pi-tui                                                     │
│  终端 UI 库：差分渲染、组件、编辑器、事件分发                 │
├─────────────────────────────────────────────────────────────┤
│  pi-ai                                                      │
│  LLM 通信层：Models 运行时、Provider factory、API 实现、认证  │
├─────────────────────────────────────────────────────────────┤
│  pi-agent-core                                              │
│  智能体运行时：Agent Loop、工具调用、事件流、状态管理         │
├─────────────────────────────────────────────────────────────┤
│  pi-coding-agent                                            │
│  应用层：CLI、项目信任、扩展、会话、TUI 集成、工具实现        │
└─────────────────────────────────────────────────────────────┘
```

| 包                | 职责                                           | 不做什么                   |
| ----------------- | ---------------------------------------------- | -------------------------- |
| `pi-ai`           | 统一调用各家 LLM，管理 Provider 认证与模型目录 | 不处理工具循环、不保存会话 |
| `pi-agent-core`   | 实现 Agent Loop、事件流、工具执行协议          | 不处理 CLI、不直接读终端   |
| `pi-coding-agent` | 组装服务、处理用户输入、管理项目信任、加载扩展 | 不自己实现 LLM 协议        |
| `pi-tui`          | 渲染终端 UI、处理按键                          | 不了解 Agent 业务          |

这种分层让每一层都可以独立测试、替换或复用。例如你可以用 `pi-agent-core` + `pi-ai` 写一个没有 TUI 的脚本，也可以用 `pi-tui` 做其他终端应用。

## 二、Models 运行时与 Provider 抽象（v0.79 新架构）

v0.79 对 `pi-ai` 做了一次重大重构：从旧的全局 API registry 模式，转向 **Models 运行时** 模式。

### 旧架构（v0.78 及以前）

```
调用者
  → stream(model, context, opts)   // 全局函数
      → api-registry 根据 model.api 查找 ApiProvider
      → ApiProvider.stream(model, context, opts)
```

问题：

- 全局注册表有副作用，tree-shaking 困难
- 认证在调用侧临时注入，难以管理 OAuth 刷新
- 所有模型元数据塞在一个巨型 `models.generated.ts` 中

### 新架构（v0.79.10）

```
调用者
  → models = createModels({ credentials, authContext })
  → models.setProvider(anthropicProvider())
  → models.setProvider(openAIProvider())
  → models.stream(model, context, opts)
      → Models 运行时根据 model.provider 找到 Provider
      → Provider 自己解析 auth（CredentialStore + AuthContext）
      → Provider.api.stream(model, context, opts)
```

核心抽象：

| 概念                | 职责                                                              | 示例                                 |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| **Provider**        | 一个 LLM 提供商的完整配置：id、名称、baseUrl、auth、模型列表、api | `anthropicProvider()`                |
| **API**             | 一种 LLM 协议实现：只负责 `stream` / `streamSimple`               | `anthropicMessagesApi()`             |
| **Models**          | 管理一组 Provider，提供统一的 `stream` / `complete` / `getModel`  | `createModels()`                     |
| **CredentialStore** | 凭证存储：读写 API key / OAuth token                              | `InMemoryCredentialStore` / 文件存储 |
| **AuthContext**     | 认证上下文：UI 回调、环境变量解析                                 | `defaultAuthContext()`               |

详细实现见 [pi-ai：Models 运行时与 Provider 架构](models-runtime.md)。

### 事件流抽象依然不变

无论底层是 OpenAI SSE、Anthropic SSE、Google 流式还是其他协议，pi-ai 都把它们统一成同一组事件：

```typescript
type AssistantMessageEvent =
  | { type: 'start'; partial: AssistantMessage }
  | { type: 'text_start'; contentIndex: number }
  | { type: 'text_delta'; delta: string; contentIndex: number }
  | { type: 'text_end'; content: string; contentIndex: number }
  | { type: 'thinking_start'; contentIndex: number }
  | { type: 'thinking_delta'; delta: string }
  | { type: 'thinking_end'; content: string }
  | { type: 'toolcall_start'; contentIndex: number }
  | { type: 'toolcall_delta'; delta: string; partial: AssistantMessage }
  | { type: 'toolcall_end'; toolCall: ToolCall }
  | { type: 'done'; reason: StopReason; message: AssistantMessage }
  | { type: 'error'; reason: 'error' | 'aborted'; error: AssistantMessage };
```

Agent Loop 代码**完全不需要关心是哪个提供商**。它只处理这些标准事件。

## 三、事件驱动架构

Pi 的整个架构是**事件驱动**的。从 LLM 流式响应到 TUI 更新，从工具执行到扩展触发，全部通过事件传递。

### Agent 层事件

```
AgentEvent
├── agent_start        — Agent 开始处理
├── agent_end          — Agent 处理完成
├── turn_start         — 一轮 LLM+工具 开始
├── turn_end           — 一轮结束
├── message_start      — 消息开始
├── message_end        — 消息结束
├── message_update     — 消息更新（流式 delta）
│   └── assistantMessageEvent — 嵌套 LLM 原始事件
├── tool_call_start    — 工具调用开始
├── tool_call          — 工具调用
├── tool_result        — 工具结果
├── compaction_start   — 上下文压缩开始
├── compaction_end     — 上下文压缩结束
└── auto_retry_start / end — 自动重试
```

### 事件流示例

用户输入 `"解释这个文件"` 后的事件序列：

```
1. agent_start
2. turn_start
3. message_start { role: "user", content: "解释这个文件" }
4. message_end
5. message_start { role: "assistant" }
6. message_update { delta: "好的" }
7. message_update { delta: "，让" }
8. ...
9. tool_call_start { name: "read" }
10. tool_call { name: "read", args: { path: "..." } }
11. tool_result { content: "文件内容..." }
12. turn_end
13. turn_start
14. message_update { delta: "这个文件..." }
15. ...
16. agent_end
```

TUI 监听这些事件并实时更新界面。

### 扩展事件

扩展系统有自己的事件体系，扩展可以在多个环节拦截或增强行为：

```typescript
type ExtensionEvent =
  | 'input'
  | 'before_agent_start'
  | 'message_end'
  | 'tool_call'
  | 'tool_result'
  | 'before_provider_request'
  | 'after_provider_response'
  | 'agent_end'
  | 'session_shutdown'
  | 'project_trust' // v0.79 新增
  | 'session_before_compact' // v0.79.10 新增 reason/willRetry
  | 'session_compact';
```

## 四、TUI 差分渲染

**文件**：`packages/tui/src/tui.ts`

传统终端 UI 每帧清屏重绘会闪烁且性能差。Pi 的解决方案是**差分渲染**：

1. 保存上一帧的输出（`previousLines: string[]`）
2. 渲染当前帧
3. 逐行对比，**只输出变化的行**

```typescript
class TUI extends Container {
  private previousLines: string[] = [];
  private previousWidth = -1;
  private previousHeight = -1;
  private renderRequested = false;
  private lastRenderAt = 0;

  requestRender(force = false): void {
    if (force) {
      this.previousLines = [];
      this.previousWidth = -1;
      this.previousHeight = -1;
    }
    this.renderRequested = true;
    process.nextTick(() => this.scheduleRender());
  }

  private scheduleRender(): void {
    if (this.stopped || this.renderTimer || !this.renderRequested) return;
    const elapsed = performance.now() - this.lastRenderAt;
    const delay = Math.max(0, TUI.MIN_RENDER_INTERVAL_MS - elapsed);
    this.renderTimer = setTimeout(() => {
      this.renderTimer = undefined;
      this.renderRequested = false;
      this.lastRenderAt = performance.now();
      this.doRender();
    }, delay);
  }
}
```

### 组件接口

```typescript
interface Component {
  render(width: number): string[];
  handleInput?(data: string): void;
  invalidate(): void;
}
```

所有 UI 元素都是 `Component`：

- `Text` — 纯文本行
- `Container` — 子组件容器（递归渲染）
- `Editor` — 编辑器（含光标、选区）
- `Markdown` — Markdown 渲染
- `Loader` — 加载动画
- `SelectList` — 选择列表

### Overlay 系统

Pi TUI 支持模态覆盖层：

```typescript
ui.showOverlay(new ModelSelectorComponent(), {
  anchor: 'center',
  width: 60,
  height: 20,
});
```

Overlay 渲染时先渲染基础内容，再叠加 overlay；关闭时只更新被覆盖区域。

## 五、扩展系统

**文件**：`packages/coding-agent/src/core/extensions/runner.ts`

扩展是一个 TypeScript 模块，通过 `ExtensionFactory` 函数创建。扩展可以：

1. **注册自定义工具** — `pi.registerTool({ ... })`
2. **注册斜杠命令** — `pi.registerCommand({ ... })`
3. **监听事件** — `pi.on('tool_call', handler)`
4. **拦截输入** — `pi.on('input', handler)`
5. **修改系统提示** — 在 `before_agent_start` 中修改
6. **创建 UI 组件** — `ctx.ui.setWidget()` / `ctx.ui.setStatus()`
7. **注册快捷键** — 自定义按键绑定
8. **参与项目信任决策** — `pi.on('project_trust', handler)`（v0.79 新增）

### 扩展加载流程

```
1. discoverAndLoadExtensions()
   ├── 扫描 ~/.pi/agent/extensions/ (全局)
   ├── 扫描 .pi/extensions/ (项目，仅在项目被信任后加载)
   ├── 扫描已安装的 Pi Packages
   └── 加载 CLI --extensions 指定的路径

2. 对每个扩展：
   ├── import(filePath)
   ├── 调用 ExtensionFactory(cwd, agentDir)
   └── 注册工具、命令、事件监听

3. ExtensionRunner 汇总所有扩展
   ├── 工具注册到 ToolRegistry
   ├── 命令注册到 SlashCommands
   └── 事件监听注册到事件总线
```

### 输入拦截示例

```typescript
pi.on('input', (event) => {
  const match = event.text.match(/#(\d+)/);
  if (match) {
    const issueUrl = `https://github.com/${repo}/issues/${match[1]}`;
    return {
      action: 'transform',
      text: event.text.replace(/#\d+/, `[Issue #${match[1]}](${issueUrl})`),
    };
  }
  return { action: 'pass' };
});
```

## 六、项目信任与安全边界

v0.79 引入了**项目信任（project trust）**：Pi 在加载项目本地 `.pi` 目录、扩展、资源前，会先请求用户确认。

信任流程：

```
启动时
  → 检查 cwd 是否有需要信任的项目资源
  → 触发 project_trust 扩展事件
  → 若未决策，弹出 TUI 选择器
  → 用户选择：始终信任 / 仅本次 / 从不
  → 决策写入 trust store
  → 继续加载项目本地扩展和资源
```

这防止了恶意项目的 `.pi/extensions` 或 `AGENTS.md` 在不被察觉的情况下执行。

详见 [项目信任与认证体系](trust-and-auth.md)。

## 七、设计哲学总结

### 1. 关注点分离

```
pi-ai          → LLM 通信（怎么跟大模型说话）
pi-agent-core  → 智能体逻辑（怎么循环、怎么调用工具）
pi-coding-agent → 应用层（CLI、扩展、会话、TUI 集成、项目信任）
pi-tui         → 终端 UI（怎么在终端里显示和交互）
```

### 2. 事件驱动而非回调嵌套

```typescript
// ✅ 事件流（线性、可组合）
for await (const event of stream) {
  emit(event); // 所有监听者收到
}
```

### 3. 类型安全贯穿

```typescript
const model = getBuiltinModel('anthropic', 'claude-sonnet-4');
//     ^ Model<'anthropic-messages'>

models.stream(model, context, {
  // TypeScript 知道这里是 AnthropicMessagesStreamOptions
  maxTokens: 4096,
});
```

### 4. 无状态优于全局副作用

v0.79 的 Models 运行时、Provider factory 都是无状态的工厂函数，调用者自己持有 `Models` 实例。这让多个 Agent session 可以拥有独立的 Provider 配置和凭证，也便于测试。

### 5. 扩展优于修改

不鼓励修改核心代码。通过扩展系统：

- 添加自定义工具
- 注册斜杠命令
- 监听/修改事件
- 创建 UI 组件
- 参与项目信任决策

### 6. 渐进式复杂度

```
简单使用：pi "解释这个文件"
进阶使用：pi --model anthropic/claude-sonnet-4
高级使用：自定义扩展、自定义 Provider、修改 TUI
```

## 下一步

- [pi-ai：Models 运行时与 Provider 架构](models-runtime.md) — 深入新架构
- [项目信任与认证体系](trust-and-auth.md) — 安全与认证
- [上下文压缩与会话分支](compaction-and-branches.md) — 长会话管理
