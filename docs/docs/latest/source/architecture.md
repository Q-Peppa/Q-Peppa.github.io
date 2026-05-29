# 核心架构与设计哲学

本文档深入分析 Pi 的架构设计模式，理解这些模式不仅能读懂 Pi 的代码，还能举一反三到其他 LLM Agent 项目。

## 一、Provider 抽象层：用一套接口统一 30+ LLM 提供商

**文件**：`packages/ai/src/api-registry.ts`、`packages/ai/src/types.ts`、`packages/ai/src/providers/`

### 设计问题

LLM 提供商各有不同的 API：
- OpenAI 有 Chat Completions API 和 Responses API
- Anthropic 用 Messages API，消息格式完全不同
- Google 用 Generative AI API，结构又不一样
- 还有 Bedrock、Mistral、Groq...

如果不做抽象，每支持一个提供商就要写一套调用逻辑，编码智能体就无法跨提供商切换。

### 解决方案：三层抽象

```
┌─────────────────────────────────────────────────┐
│ 第一层：Model（模型元数据）                       │
│                                                 │
│ interface Model<TApi extends Api> {              │
│   id: string;          // "gpt-4o-mini"          │
│   name: string;        // "GPT-4o Mini"          │
│   api: TApi;           // "openai-completions"   │
│   provider: Provider;  // "openai"               │
│   contextWindow: number;  // 128000              │
│   reasoning: boolean;  // true/false             │
│   input: ('text'|'image')[];                     │
│   cost: CostInfo;      // token 价格             │
│   compat?: Compat;     // 兼容性标志             │
│ }                                               │
│                                                 │
│ ★ 类型参数化：Model<'openai-completions'>         │
│   确保模型与 API 的绑定在编译期检查               │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 第二层：ApiProvider（API 提供商）                 │
│                                                 │
│ interface ApiProvider<TApi extends Api> {         │
│   api: TApi;                                    │
│   stream: (model, context, options) => EventStream│
│   streamSimple: (...) => EventStream             │
│ }                                               │
│                                                 │
│ ★ 每种 API 类型一个 Provider 实现：               │
│   - openai-completions → 一个 Provider            │
│   - anthropic-messages → 一个 Provider           │
│   - google-generative-ai → 一个 Provider          │
│                                                 │
│ ★ Provider 在 api-registry 中注册：              │
│   registerApiProvider("openai-completions", {    │
│     stream: streamOpenAICompletions,             │
│     streamSimple: streamSimpleOpenAICompletions  │
│   })                                             │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 第三层：统一调用接口（stream / complete）          │
│                                                 │
│ // 调用者不需要知道底层是哪个 API                 │
│ const response = stream(model, context, opts);   │
│                                                 │
│ // 内部路由：                                    │
│ // 1. 根据 model.api 查找注册的 ApiProvider      │
│ // 2. 调用 provider.stream(model, context, opts) │
│ // 3. 返回统一的 AssistantMessageEventStream      │
└─────────────────────────────────────────────────┘
```

### 关键设计决策

#### 1. 事件流抽象

所有提供商的流式响应被统一为一组事件类型：

```typescript
// 无论底层是 OpenAI SSE、Anthropic SSE、还是 Google 流式
// 调用者看到的都是这些事件：
type Event =
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

这意味着 Agent Loop 代码**完全不需要关心是哪个提供商**。它只处理这 12 种事件。

#### 2. 模型元数据生成

模型列表不是手写的，而是通过脚本从各提供商的 API 自动生成：

```bash
packages/ai/scripts/generate-models.ts
  → 拉取各提供商的最新模型元数据
  → 生成 packages/ai/src/models.generated.ts
```

#### 3. 兼容性处理

不同 OpenAI 兼容的 API 有细微差异，通过 `compat` 字段处理：

```typescript
interface OpenAICompletionsCompat {
  supportsStore?: boolean;           // 是否支持 store 字段
  supportsDeveloperRole?: boolean;   // 是否支持 developer 角色
  supportsReasoningEffort?: boolean; // 是否支持 reasoning_effort
  maxTokensField?: 'max_completion_tokens' | 'max_tokens';
  requiresThinkingAsText?: boolean;  // 是否将 thinking 转为 text
  thinkingFormat?: 'openai' | 'deepseek' | 'qwen' | ...;
}
```

**30+ 提供商只需要维护这个 compat 配置，不需要修改 Agent Loop 代码。**

## 二、事件驱动架构

**文件**：`packages/ai/src/utils/event-stream.ts`、`packages/agent/src/types.ts`

Pi 的整个架构是**事件驱动**的。从 LLM 流式响应到 TUI 更新，从工具执行到扩展触发，全部通过事件传递。

### 事件类型层次

```
AgentEvent (agent-core 层的事件)
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
├── context_compact   — 上下文压缩
└── auto_retry_start / end — 自动重试
```

### 事件流示例

用户输入 `"解释这个文件"` 后的事件序列：

```
1. agent_start
2. turn_start
3. message_start { role: "user", content: "解释这个文件" }
4. message_end
5. message_start { role: "assistant" }  ← 空消息占位
6. message_update { delta: "好的" }     ← 流式文本
7. message_update { delta: "，让" }
8. message_update { delta: "我来" }
9. ... (更多 delta)
10. message_end                         ← 消息完成
11. tool_call_start { name: "read" }    ← 工具调用开始
12. tool_call { name: "read", args: ... }
13. tool_result { content: "文件内容..." }
14. turn_end
15. turn_start                          ← 第二轮
16. message_start { role: "assistant" }
17. message_update { delta: "这个文件..." }
18. ... (更多 delta)
19. message_end                         ← done, stopReason: "stop"
20. agent_end { messages: [...] }
```

TUI 监听这些事件并实时更新界面：
- `message_update` → 更新流式文本显示
- `tool_call` → 显示工具调用状态
- `tool_result` → 显示工具输出
- `agent_end` → 隐藏 Working 指示器，恢复编辑器

### 扩展事件

除了 Agent 内部事件，扩展系统有自己的事件体系：

```typescript
// 扩展可以监听的事件
type ExtensionEvent =
  | "input"                // 用户输入
  | "before_agent_start"   // Agent 调用前
  | "message_end"          // 消息结束
  | "tool_call"            // 工具调用
  | "tool_result"          // 工具结果
  | "before_provider_request"  // LLM 请求前
  | "after_provider_response"  // LLM 响应后
  | "agent_end"            // Agent 结束
  | "session_shutdown";    // 会话关闭
```

扩展可以在这些事件的任何一环**拦截、修改、或增强**行为。

## 三、TUI 差分渲染

**文件**：`packages/tui/src/tui.ts`
**核心类**：`TUI extends Container`

### 为什么需要差分渲染

传统终端 UI 每帧清除整个屏幕并重新渲染。这在终端环境中有两个问题：
1. **闪烁**：清屏 → 重绘，肉眼可见
2. **性能**：每次输出几百行 ANSI 转义码，终端处理慢

Pi 的解决方案是**差分渲染**：
1. 保存上一帧的输出（`previousLines: string[]`）
2. 渲染当前帧
3. 逐行对比，**只输出变化的行**

### 实现

```typescript
// tui.ts 核心字段
class TUI extends Container {
  private previousLines: string[] = [];  // 上一帧输出
  private renderTimer: NodeJS.Timeout | undefined;
  private static readonly MIN_RENDER_INTERVAL_MS = 16; // ~60fps

  start(): void {
    const loop = () => {
      this._render();                          // 渲染
      this.renderTimer = setTimeout(loop, TUI.MIN_RENDER_INTERVAL_MS);
    };
    loop();
  }

  private _render(): void {
    // 1. 收集所有组件的渲染输出
    const lines = this._collectAllLines();

    // 2. 与上一帧对比
    const diff = this._computeDiff(this.previousLines, lines);

    // 3. 只输出变化的部分
    for (const change of diff) {
      this.terminal.cursorTo(change.row, 0);
      this.terminal.clearLine();
      this.terminal.write(change.text);
    }

    // 4. 保存当前帧
    this.previousLines = lines;
  }
}
```

### 组件接口

```typescript
// tui.ts: Component 接口
interface Component {
  render(width: number): string[];    // 渲染为行数组
  handleInput?(data: string): void;    // 处理按键
  invalidate(): void;                  // 清除缓存，强制重绘
}
```

**所有 UI 元素都是 Component**：
- `Text` — 纯文本行
- `Container` — 子组件容器（递归渲染）
- `Editor` — 编辑器（含光标、选区）
- `Markdown` — Markdown 渲染
- `Loader` — 加载动画（"Working..."）
- `SelectList` — 选择列表（模型选择、设置等）

### Overlay 系统

Pi TUI 支持**模态覆盖层**：

```typescript
// 在现有内容上弹出选择器
ui.showOverlay(new ModelSelectorComponent(), {
  anchor: "center",
  width: 60,
  height: 20,
});
```

Overlay 渲染流程：
1. 渲染基础内容（header + chat + editor + footer）
2. 在基础内容上叠加 overlay
3. 差分对比时包含 overlay 区域
4. Overlay 关闭时只更新被覆盖的区域

## 四、扩展系统

**文件**：`packages/coding-agent/src/core/extensions/runner.ts`
**核心类**：`ExtensionRunner`

### 扩展是什么

Pi 的扩展是一个 TypeScript 模块，通过 `ExtensionFactory` 函数创建。扩展可以：

1. **注册自定义工具** — `pi.registerTool({ name: "deploy", ... })`
2. **注册斜杠命令** — `pi.registerCommand({ name: "deploy", ... })`
3. **监听事件** — `pi.on("tool_call", handler)`
4. **拦截输入** — `pi.on("input", handler)`
5. **修改系统提示** — 在 `before_agent_start` 中修改
6. **创建 UI 组件** — 在编辑器上下方渲染自定义组件
7. **注册快捷键** — 自定义按键绑定

### 扩展加载流程

```
1. discoverAndLoadExtensions()
   ├── 扫描 ~/.pi/agent/extensions/ (全局)
   ├── 扫描 .pi/extensions/ (项目)
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

### 扩展 API 示例

```typescript
// 一个简单的扩展
export default function extension(cwd: string) {
  return {
    name: "my-extension",
    setup(pi: ExtensionAPI) {
      // 注册工具
      pi.registerTool({
        name: "deploy",
        description: "Deploy the current project",
        parameters: Type.Object({
          environment: Type.Enum({ staging: "staging", production: "production" })
        }),
        execute: async (args) => {
          const result = await exec(`deploy --env ${args.environment}`);
          return { content: [{ type: "text", text: result.stdout }] };
        }
      });

      // 监听工具调用
      pi.on("tool_call", (event) => {
        console.log(`Tool called: ${event.toolName}`);
      });

      // 拦截用户输入
      pi.on("input", (event) => {
        if (event.text.startsWith("# ")) {
          // 将注释标记为特殊消息
          return { action: "transform", text: `[COMMENT] ${event.text}` };
        }
      });
    }
  };
}
```

## 五、工具系统

**文件**：`packages/coding-agent/src/core/tools/`

### 工具架构

```
LLM 请求 ToolCall { name: "read", arguments: { path: "package.json" } }
  │
  ▼
ToolRegistry.get("read")
  │
  ▼
ToolDefinitionWrapper.execute(args, context)
  │
  ├─ 1. validate(args)     ← TypeBox schema 校验
  ├─ 2. checkPermissions()  ← 检查工具权限
  ├─ 3. emit(tool_call)     ← 通知 TUI / 扩展
  ├─ 4. execute()           ← 实际执行
  │     fs.readFileSync("package.json")
  ├─ 5. truncate(result)    ← 截断过长输出
  └─ 6. emit(tool_result)   ← 返回结果
```

### 内置工具

| 工具 | 实现 | 关键特性 |
|------|------|---------|
| **read** | `read.ts` | 支持行范围、自动截断、token 计数 |
| **write** | `write.ts` | 创建/覆盖、目录自动创建 |
| **edit** | `edit.ts` | 精确文本替换、支持多次编辑 |
| **edit-diff** | `edit-diff.ts` | 统一 diff 格式补丁应用 |
| **bash** | `bash.ts` | 超时控制、输出截断、pty 支持 |
| **grep** | `grep.ts` | rg 封装、支持正则、行号输出 |
| **find** | `find.ts` | fd 封装、支持 glob |
| **ls** | `ls.ts` | 目录列表、隐藏文件、排序 |

### 工具输出的截断与累积

LLM 的上下文窗口有限，工具输出需要智能截断：

```typescript
// truncate.ts
const MAX_OUTPUT_TOKENS = 12000;

function truncateOutput(output: string, maxTokens: number): {
  text: string;
  wasTruncated: boolean;
  tokensUsed: number;
} {
  // 智能截：不截断在字符中间
  // 保留头部和尾部（让 LLM 看到开头和结尾）
  // 中间用 "... (output truncated)" 替代
}
```

## 六、会话格式（JSONL）

**文件**：`packages/coding-agent/src/core/session-manager.ts`

Pi 的会话是**每行一条 JSON** 的格式（JSONL）：

```jsonl
{"type":"session_start","id":"abc123","cwd":"/path/to/project","timestamp":1234567890}
{"type":"message","message":{"role":"user","content":[{"type":"text","text":"hello"}],"timestamp":1234567891}}
{"type":"message","message":{"role":"assistant","content":[{"type":"text","text":"Hi! How can I help?"}],"timestamp":1234567892}}
{"type":"session_end","timestamp":1234567893}
```

### 为什么用 JSONL 而非 JSON 数组？

1. **流式写入**：不需要等会话结束才写文件
2. **崩溃恢复**：即使进程崩溃，已写入的行仍然有效
3. **增量读取**：可以继续附加，不需要重写整个文件
4. **大文件友好**：不需要一次性加载到内存

## 七、设计哲学总结

### 1. 关注点分离

```
pi-ai          → LLM 通信（怎么跟大模型说话）
pi-agent-core  → 智能体逻辑（怎么循环、怎么调用工具）
pi-coding-agent → 应用层（CLI、扩展、会话、TUI 集成）
pi-tui         → 终端 UI（怎么在终端里显示和交互）
```

每个包都有清晰的边界和接口。

### 2. 事件驱动而非回调地狱

```
❌ 回调嵌套（难以追踪）
llmStream.on('text', (text) => {
  ui.update(text, () => {
    tool.execute(args, (result) => {
      llmStream.continue(result, () => {
        // ...
      });
    });
  });
});

✅ 事件流（线性、可组合）
for await (const event of stream) {
  emit(event); // 所有监听者收到
}
```

### 3. 类型安全贯穿

```typescript
// Model 类型参数化确保 API 匹配
const model = getModel('openai', 'gpt-4o-mini');
//         ^ Model<'openai-completions'>

// stream() 根据 model.api 推断 options 类型
stream(model, context, {
  // TypeScript 知道这里是 OpenAICompletionsOptions
  maxTokens: 4096,
});
```

### 4. 扩展优于修改

不鼓励修改核心代码。通过扩展系统：
- 添加自定义工具
- 注册斜杠命令
- 监听/修改事件
- 创建 UI 组件

### 5. 渐进式复杂度

```
简单使用：pi "解释这个文件"         → 自动选择模型、自动认证
进阶使用：pi --model anthropic/claude  → 指定模型
高级使用：自定义扩展、自定义工具       → 完整控制
```

## 下一步

回顾：
- [前置知识与学习路径](prerequisites.md)
- [环境搭建与调试](setup-and-debug.md)
- [从终端到 TUI](cli-to-tui.md)
- [从输入到 LLM 循环](input-to-llm.md)
