# 消息类型

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/message-types) 的中文翻译。仅供学习参考。

Pi 在 SDK 状态、生命周期事件、RPC 响应和持久化的会话消息条目中使用 `AgentMessage` 值。本页定义这些共享消息及其内容块。

消息时间戳是 Unix 毫秒时间戳。它们与[会话条目](session-format.md#entry-base)上的 ISO 8601 时间戳不同。

源定义：

- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/ai/src/types.ts) 定义面向 Provider 的消息和内容块。
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/agent/src/types.ts) 定义可扩展的 `AgentMessage` 联合类型。
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/messages.ts) 添加 coding-agent 的消息角色。

## 内容块

### TextContent

```typescript
interface TextContent {
  type: 'text';
  text: string;
  textSignature?: string;
}
```

`textSignature` 包含 Provider 特定的消息元数据。请把它当作不透明数据。

### ImageContent

```typescript
interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}
```

`data` 是 base64 编码的图片数据。`mimeType` 标识它的媒体类型，例如 `image/png` 或 `image/jpeg`。

### ThinkingContent

```typescript
interface ThinkingContent {
  type: 'thinking';
  thinking: string;
  thinkingSignature?: string;
  redacted?: boolean;
}
```

Thinking 签名包含 Provider 特定的回放数据。请把它们当作不透明数据。被涂黑（redacted）的块可以没有可见的 thinking 文本，但在 `thinkingSignature` 中保留加密载荷。

### ToolCall

```typescript
interface ToolCall {
  type: 'toolCall';
  id: string;
  name: string;
  arguments: Record<string, any>;
  thoughtSignature?: string;
  namespace?: string;
}
```

`thoughtSignature` 是 Provider 特定的。`namespace` 标识动态加载或带命名空间的工具所用的 OpenAI Responses namespace。

## 用量

Assistant 消息总是包含用量。工具执行了嵌套模型工作时，工具结果也可以包含用量。

```typescript
interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cacheWrite1h?: number;
  reasoning?: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}
```

存在时，`reasoning` 已经包含在 `output` 中；不要再次相加。`cacheWrite1h` 是 `cacheWrite` 中以一小时保留期写入的部分。

## 基础消息

### SystemMessage

```typescript
interface SystemMessage {
  role: 'system';
  content: string | TextContent[];
  sections?: Record<string, string | null>;
  toolsAdded?: Tool[];
  toolsRemoved?: ToolReference[];
  replace?: boolean;
  timestamp: number;
}
```

开头的系统消息声明初始 Prompt 和工具。之后的系统消息可以追加指令、替换或移除具名的 Prompt 分段，以及添加或移除工具。按顺序回放它们即可得到当前状态。带 `replace: true` 的消息会丢弃先前的状态并建立完整的新基线。

### UserMessage

```typescript
interface UserMessage {
  role: 'user';
  content: string | (TextContent | ImageContent)[];
  timestamp: number;
}
```

### AssistantMessage

```typescript
interface AssistantMessage {
  role: 'assistant';
  content: (TextContent | ThinkingContent | ToolCall)[];
  api: string;
  provider: string;
  model: string;
  responseModel?: string;
  responseId?: string;
  providerThinkingLevel?: string;
  diagnostics?: AssistantMessageDiagnostic[];
  usage: Usage;
  stopReason: 'pending' | 'stop' | 'length' | 'toolUse' | 'error' | 'aborted' | 'deferred';
  deferred?: DeferredHandle;
  errorMessage?: string;
  rawStopReason?: string;
  endTurn?: boolean;
  timestamp: number;
}
```

当具体的 Provider 响应模型与请求的模型不同时，`responseModel` 记录它。`responseId`、`providerThinkingLevel`、`diagnostics` 和 `rawStopReason` 保留 Provider 或 runtime 细节。

`"pending"` 用于流式过程中的部分 assistant 消息。`message_end` 中已完成的消息具有终止性的 stop reason，Pi 不会把 `"pending"` 的 assistant 消息持久化到会话 JSONL 中。

`"deferred"` 响应带有一个 `DeferredHandle`，包含取回它所需的 Provider 数据：

```typescript
interface DeferredHandle {
  provider: string;
  modelId: string;
  api: string;
  id: string;
  expiresAt?: number;
  pollAfterMs?: number;
  data?: JsonValue;
}
```

### ToolResultMessage

```typescript
interface ToolResultMessage<TDetails = any> {
  role: 'toolResult';
  toolCallId: string;
  toolName: string;
  content: (TextContent | ImageContent)[];
  details?: TDetails;
  usage?: Usage;
  isError: boolean;
  timestamp: number;
}
```

`details` 是工具特定的。可选的 `usage` 报告该工具执行的嵌套模型工作，并计入完整会话统计，但它不属于主模型调用的用量。

## Coding-agent 消息

coding-agent 包用四个角色扩展 `AgentMessage`。

### BashExecutionMessage

由直接的 Shell 命令创建，包括 RPC 的 [`bash`](rpc-commands.md#bash) 命令。它不是 LLM 工具结果。

```typescript
interface BashExecutionMessage {
  role: 'bashExecution';
  command: string;
  output: string;
  exitCode: number | undefined;
  cancelled: boolean;
  truncated: boolean;
  fullOutputPath?: string;
  excludeFromContext?: boolean;
  timestamp: number;
}
```

除非 `excludeFromContext` 为 true，Pi 会在下一次模型请求之前把该消息转换为 user 角色的文本。

### CustomMessage

扩展发送上下文消息时创建。

```typescript
interface CustomMessage<T = unknown> {
  role: 'custom';
  customType: string;
  content: string | (TextContent | ImageContent)[];
  display: boolean;
  details?: T;
  timestamp: number;
}
```

Pi 把它的内容转换为模型请求用的用户消息。`display` 控制终端渲染；`details` 不发送给模型。

### BranchSummaryMessage

```typescript
interface BranchSummaryMessage {
  role: 'branchSummary';
  summary: string;
  fromId: string | null;
  timestamp: number;
}
```

Pi 从持久化的 `branch_summary` 条目创建这条上下文消息。

### CompactionSummaryMessage

```typescript
interface CompactionSummaryMessage {
  role: 'compactionSummary';
  summary: string;
  tokensBefore: number;
  timestamp: number;
}
```

Pi 从持久化的 `compaction` 条目创建这条上下文消息。

## AgentMessage 联合类型

在 coding agent 中，该联合类型等价于：

```typescript
type AgentMessage =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolResultMessage
  | BashExecutionMessage
  | CustomMessage
  | BranchSummaryMessage
  | CompactionSummaryMessage;
```

在更低层的 agent 包中，`AgentMessage` 是 `Message | CustomAgentMessages[keyof CustomAgentMessages]`。应用程序可以通过 TypeScript 声明合并添加角色，所以使用方在从被增强的宿主机接收消息时应当容忍未知的自定义角色。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
