# JSON 事件流

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/json) 的中文翻译。仅供学习参考。

JSON 模式为单次调用输出结构化进度：

```bash
pi --mode json "Review this repository"
```

Pi 先写一条会话 header，随后写会话事件，在指定的 Prompt 完成后退出。RPC 模式输出相同形态的会话事件，但没有会话 header，因为它是一个双向、长期运行的协议。见 [RPC 模式](rpc.md)。

本页是 JSON 和 RPC 模式共享事件的权威参考。消息取值使用[共享的消息类型](message-types.md)。

## 分帧与进程 I/O

该流使用严格的 JSONL 分帧。每条记录是一个以 LF（`\n`）结尾的 JSON 对象。只在 LF 处分割记录，并去掉可选的前置回车符。Unicode 的行分隔符和段分隔符在 JSON 字符串内是合法内容，不是记录边界。

Node.js 的 `readline` 不适合这种流，因为它也识别这些 Unicode 分隔符。请使用字节或 UTF-8 流解码器并在 LF 处分割。

请持续读取 stdout。停止消费记录的读取方在管道缓冲区填满时会让 Pi 停滞。stdout 保留给 JSONL；诊断和应用日志写到 stderr。

## 会话 header

JSON 模式的第一条记录是当前的[会话 header](session-format.md#sessionheader)：

```json
{ "type": "session", "version": 3, "id": "uuid", "timestamp": "2024-12-03T14:00:00.000Z", "cwd": "/path" }
```

RPC 模式不输出这条记录。它的当前会话 ID 和文件请用 [`get_state`](rpc-commands.md#get_state)。

## 事件序列

一次基本运行会产生类似下面的记录：

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_end","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_start","message":{"role":"assistant","content":[],"stopReason":"pending","...":"..."}}
{"type":"message_update","usage":{"...":"..."},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello"}}
{"type":"message_end","message":{"role":"assistant","...":"..."}}
{"type":"turn_end","message":{"role":"assistant","...":"..."},"toolResults":[]}
{"type":"agent_end","messages":[{"...":"..."}],"willRetry":false}
{"type":"agent_settled"}
```

`agent_end` 结束一次底层 Agent 运行。自动重试、溢出恢复、压缩重试、steering 或 follow-up 工作仍可能继续。`agent_settled` 表示 Pi 在该会话级运行中已没有剩余的自动工作。

## Agent 与 turn 事件

| 事件            | 字段                     | 含义                                                |
| --------------- | ------------------------ | --------------------------------------------------- |
| `agent_start`   | 无                       | 一次底层 Agent 运行开始。                           |
| `agent_end`     | `messages`、`willRetry`  | 该底层运行结束。`messages` 包含该次运行生成的消息。 |
| `agent_settled` | 无                       | Pi 不会通过重试、压缩恢复或排队消息自动继续。       |
| `turn_start`    | 无                       | 一个 assistant turn 开始。                          |
| `turn_end`      | `message`、`toolResults` | 一条 assistant 响应及其产生的 tool call 完成。      |

一个 turn 是一条 assistant 响应加上该响应产生的所有 tool call 和工具结果。

## 消息事件

| 事件             | 字段                             | 含义                                  |
| ---------------- | -------------------------------- | ------------------------------------- |
| `message_start`  | `message`                        | 一条消息开始。                        |
| `message_update` | `usage`、`assistantMessageEvent` | 一条 assistant 消息发出了内容块更新。 |
| `message_end`    | `message`                        | 一条消息完成。这是权威的最终消息。    |

### 重建流式消息

线上传输的 `message_update` 记录只包含增量。它们省略 SDK 事件中累积的 `message` 字段和每个 `assistantMessageEvent.partial` 快照，以使流大小保持线性。

嵌套事件是以下之一：

| 类型             | 除 `type` 之外的字段             | 含义                                                   |
| ---------------- | -------------------------------- | ------------------------------------------------------ |
| `start`          | 无                               | Provider 流开始；其累积的 `partial` 字段在线上被移除。 |
| `text_start`     | `contentIndex`                   | 一个文本块开始。                                       |
| `text_delta`     | `contentIndex`、`delta`          | 把文本追加到该块。                                     |
| `text_end`       | `contentIndex`、`content`        | 该文本块以权威内容结束。                               |
| `thinking_start` | `contentIndex`                   | 一个 thinking 块开始。                                 |
| `thinking_delta` | `contentIndex`、`delta`          | 把 thinking 文本追加到该块。                           |
| `thinking_end`   | `contentIndex`、`content`        | 该 thinking 块以权威内容结束。                         |
| `toolcall_start` | `contentIndex`、`id`、`toolName` | 一个 tool-call 块开始。                                |
| `toolcall_delta` | `contentIndex`、`delta`          | 追加序列化后的参数数据。                               |
| `toolcall_end`   | `contentIndex`、`toolCall`       | 该 tool call 以完整的 `ToolCall` 结束。                |
| `done`           | `reason`、`message`              | Provider 流成功完成。                                  |
| `error`          | `reason`、`error`                | Provider 流以错误或中止消息结束。                      |

常规 Agent 循环会把 Provider 级的 `start`、`done` 和 `error` 转换成 `message_start` 和 `message_end` 会话事件，而不是把它们作为 `message_update` 发出。对于构造匹配会话事件的调用方，导出的 `JsonAgentSessionEvent` 转换仍接受它们。

用 `contentIndex` 标识内容块。为实时显示缓冲 `delta` 字段，但在 `text_end`、`thinking_end` 或 `toolcall_end` 中用已完成的内容替换重建的数据。`message_end.message` 到达时，用整条消息替换部分消息。

顶层的 `usage` 是 Provider 为该 assistant 响应报告的最新累积用量。当 Provider 不在流式过程中报告用量时，它可能一直为零直到结束。

```json
{
  "type": "message_update",
  "usage": {
    "input": 100,
    "output": 1,
    "cacheRead": 0,
    "cacheWrite": 0,
    "totalTokens": 101,
    "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0, "total": 0 }
  },
  "assistantMessageEvent": { "type": "text_delta", "contentIndex": 0, "delta": "Hello " }
}
```

## 工具执行事件

| 事件                    | 字段                                              | 含义                 |
| ----------------------- | ------------------------------------------------- | -------------------- |
| `tool_execution_start`  | `toolCallId`、`toolName`、`args`                  | 工具执行开始。       |
| `tool_execution_update` | `toolCallId`、`toolName`、`args`、`partialResult` | 工具报告了部分结果。 |
| `tool_execution_end`    | `toolCallId`、`toolName`、`result`、`isError`     | 工具执行结束。       |

用 `toolCallId` 关联整个生命周期。`partialResult` 是工具提供的最新部分结果。它替换还是扩展先前的更新取决于该工具的结果契约。

```json
{"type":"tool_execution_start","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"}}
{"type":"tool_execution_update","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"},"partialResult":{"content":[{"type":"text","text":"partial output"}],"details":{}}}
{"type":"tool_execution_end","toolCallId":"call_abc123","toolName":"bash","result":{"content":[{"type":"text","text":"complete output"}],"details":{}},"isError":false}
```

## 队列与状态事件

| 事件                     | 字段                   | 含义                                                                        |
| ------------------------ | ---------------------- | --------------------------------------------------------------------------- |
| `queue_update`           | `steering`、`followUp` | 待处理的 steering 或 follow-up 队列发生变化。两个字段都包含完整的当前队列。 |
| `entry_appended`         | `entry`                | 扩展通过 `pi.appendEntry()` 追加了一条自定义会话条目。                      |
| `session_info_changed`   | `name`                 | 会话显示名发生变化。`name` 缺失表示它被清空。                               |
| `thinking_level_changed` | `level`                | 活动 thinking level 发生变化。                                              |

`entry` 取值使用持久化的[会话条目类型](session-format.md#entry-types)。

## 压缩事件

`compaction_start` 报告压缩开始的原因：

```json
{ "type": "compaction_start", "reason": "threshold" }
```

`reason` 是 `"manual"`、`"threshold"` 或 `"overflow"`。

压缩成功时 `compaction_end` 包含结果：

```json
{
  "type": "compaction_end",
  "reason": "threshold",
  "result": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": { "...": "..." },
    "details": {}
  },
  "aborted": false,
  "willRetry": false
}
```

如果压缩被中止，`result` 缺失且 `aborted` 为 true。如果它失败，`result` 缺失、`aborted` 为 false，且有 `errorMessage` 描述失败原因。成功的溢出恢复会在 Pi 重试 Prompt 之前把 `willRetry` 设为 true。

结果语义见[压缩与分支摘要](compaction.md)。

## 重试事件

Assistant turn 重试会发出：

```json
{"type":"auto_retry_start","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"529 overloaded"}
{"type":"auto_retry_end","success":true,"attempt":2}
```

最终失败时，`auto_retry_end` 带有 `success: false` 和一个 `finalError` 字符串。

压缩和分支摘要重试会发出：

```json
{"type":"summarization_retry_scheduled","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"terminated"}
{"type":"summarization_retry_attempt_start","source":"compaction","reason":"threshold"}
{"type":"summarization_retry_finished"}
```

对于分支摘要，`source` 是 `"branchSummary"`，且没有 `reason`。压缩重试的 `reason` 是 `"manual"`、`"threshold"` 或 `"overflow"`。

## 仅 RPC 事件

直接的 RPC [`bash`](rpc-commands.md#bash) 命令会为每个输出块发出一次 `bash_execution_update`。它可选的 `id` 与命令 ID 匹配。最终命令响应可能包含被截断的输出，但这些事件会流式输出全部输出：

```json
{ "type": "bash_execution_update", "id": "req-1", "delta": "total 48\n" }
```

扩展处理器抛出异常时，RPC 还会添加 `extension_error`：

```json
{ "type": "extension_error", "extensionPath": "/path/to/extension.ts", "event": "tool_call", "error": "Error message" }
```

扩展 UI 记录是单独的 RPC 子协议，不是 `AgentSessionEvent` 取值。见 [RPC 扩展 UI](rpc-extension-ui.md)。

## TypeScript 类型

SDK 的 `AgentSessionEvent` 为进程内使用方包含累积的流式快照。JSON 和 RPC 只转换 `message_update`：

```typescript
type WithoutPartial<T> = T extends { partial: unknown } ? Omit<T, 'partial'> : T;

type JsonAssistantMessageEvent<T> = T extends { type: 'toolcall_start'; partial: unknown }
  ? WithoutPartial<T> & { id: string; toolName: string }
  : WithoutPartial<T>;

type JsonAgentSessionEvent =
  | Exclude<AgentSessionEvent, { type: 'message_update' }>
  | {
      type: 'message_update';
      usage: Usage;
      assistantMessageEvent: JsonAssistantMessageEvent<AssistantMessageEvent>;
    };
```

请使用 `@earendil-works/pi-coding-agent` 导出的 `JsonAgentSessionEvent` 类型。它的实现在 [`json-event.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/json-event.ts)。

## 示例

打印一次性运行中已完成的消息：

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
