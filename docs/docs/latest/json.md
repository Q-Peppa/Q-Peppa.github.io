# JSON Event Stream Mode（JSON 事件流模式）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/json) 的中文翻译。仅供学习参考。

## 命令

```bash
pi --mode json "Your prompt"
```

该模式将所有会话事件作为 JSON 行输出到 stdout。适用于将 Pi 集成到其他工具或自定义 UI。

## 事件类型

事件定义在 [`AgentSessionEvent`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/agent-session.ts#L102) 中：

```typescript
type AgentSessionEvent =
  | AgentEvent
  | {
      type: 'queue_update';
      steering: readonly string[];
      followUp: readonly string[];
    }
  | {
      type: 'compaction_start';
      reason: 'manual' | 'threshold' | 'overflow';
    }
  | {
      type: 'compaction_end';
      reason: 'manual' | 'threshold' | 'overflow';
      result: CompactionResult | undefined;
      aborted: boolean;
      willRetry: boolean;
      errorMessage?: string;
    }
  | {
      type: 'auto_retry_start';
      attempt: number;
      maxAttempts: number;
      delayMs: number;
      errorMessage: string;
    }
  | {
      type: 'auto_retry_end';
      success: boolean;
      attempt: number;
      finalError?: string;
    };
```

- `queue_update` —— 每当待处理的 steering 和 follow-up 队列发生变化时发出，包含完整队列。
- `compaction_start` / `compaction_end` —— 覆盖手动和自动压缩，包含原因、结果、是否中止、是否重试等信息。
- `auto_retry_start` / `auto_retry_end` —— 自动重试事件，含尝试次数、最大次数、延迟和错误信息。

基础事件来自 [`AgentEvent`](https://github.com/earendil-works/pi-mono/blob/main/packages/agent/src/types.ts#L179)：

```typescript
type AgentEvent =
  // Agent 生命周期
  | { type: 'agent_start' }
  | { type: 'agent_end'; messages: AgentMessage[] }

  // Turn 生命周期
  | { type: 'turn_start' }
  | {
      type: 'turn_end';
      message: AgentMessage;
      toolResults: ToolResultMessage[];
    }

  // 消息生命周期
  | { type: 'message_start'; message: AgentMessage }
  | {
      type: 'message_update';
      message: AgentMessage;
      assistantMessageEvent: AssistantMessageEvent;
    }
  | { type: 'message_end'; message: AgentMessage }

  // 工具执行
  | {
      type: 'tool_execution_start';
      toolCallId: string;
      toolName: string;
      args: any;
    }
  | {
      type: 'tool_execution_update';
      toolCallId: string;
      toolName: string;
      args: any;
      partialResult: any;
    }
  | {
      type: 'tool_execution_end';
      toolCallId: string;
      toolName: string;
      result: any;
      isError: boolean;
    };
```

### 事件说明

| 事件                                                                    | 说明                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| `agent_start` / `agent_end`                                             | Agent 生命周期，`agent_end` 包含最终消息列表    |
| `turn_start` / `turn_end`                                               | 回合生命周期，`turn_end` 包含该轮消息和工具结果 |
| `message_start` / `message_update` / `message_end`                      | 消息生命周期，`message_update` 流式传输增量     |
| `tool_execution_start` / `tool_execution_update` / `tool_execution_end` | 工具执行，支持流式部分结果                      |
| `queue_update`                                                          | 队列更新（steering + follow-up 队列）           |
| `compaction_start` / `compaction_end`                                   | 上下文压缩事件                                  |
| `auto_retry_start` / `auto_retry_end`                                   | 自动重试事件                                    |

## 消息类型

基础消息定义在 [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/types.ts#L134)：

- `UserMessage`（第 134 行）—— 用户消息
- `AssistantMessage`（第 140 行）—— 助手消息，包含 `content` 数组、`usage`、`stopReason` 等
- `ToolResultMessage`（第 152 行）—— 工具结果消息

扩展消息定义在 [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/messages.ts#L29)：

- `BashExecutionMessage`（第 29 行）—— Bash 命令执行消息
- `CustomMessage`（第 46 行）—— 自定义消息
- `BranchSummaryMessage`（第 55 行）—— 分支摘要
- `CompactionSummaryMessage`（第 62 行）—— 压缩摘要

## 输出格式

每行是一个 JSON 对象。第一行是会话头：

```json
{ "type": "session", "version": 3, "id": "uuid", "timestamp": "...", "cwd": "/path" }
```

随后是事件流，按发生顺序输出：

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"assistant","content":[],...}}
{"type":"message_update","message":{...},"assistantMessageEvent":{"type":"text_delta","delta":"Hello",...}}
{"type":"message_end","message":{...}}
{"type":"turn_end","message":{...},"toolResults":[]}
{"type":"agent_end","messages":[...]}
```

## 示例

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
