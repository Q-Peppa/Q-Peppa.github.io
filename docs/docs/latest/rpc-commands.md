# RPC 命令

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/rpc-commands) 的中文翻译。仅供学习参考。

本参考列出 [RPC 模式](rpc.md)中 stdin 上可接受的命令。每条命令和响应都是一个 JSON 对象。共享的消息取值使用[消息类型](message-types.md)。

## 发送 Prompt

### prompt

向 Agent 发送用户 Prompt。命令响应在 Prompt 被接受、排队或处理之后发出。事件在接受之后会继续异步流式输出。

```json
{ "id": "req-1", "type": "prompt", "message": "Hello, world!" }
```

带图片：

```json
{
  "type": "prompt",
  "message": "What's in this image?",
  "images": [{ "type": "image", "data": "base64-encoded-data", "mimeType": "image/png" }]
}
```

**流式输出期间**：如果 Agent 已经在流式输出，你必须指定 `streamingBehavior` 来排队该消息：

```json
{ "type": "prompt", "message": "New instruction", "streamingBehavior": "steer" }
```

- `"steer"`：在 Agent 运行期间排队该消息。它在当前 assistant turn 执行完其 tool call 之后、下一次 LLM 调用之前投递。
- `"followUp"`：等到 Agent 结束。消息只在 Agent 停止时投递。

如果 Agent 正在流式输出且未指定 `streamingBehavior`，该命令返回错误。

**扩展命令**：如果消息是扩展命令（例如 `/mycommand`），即使在流式输出期间它也会立即执行。扩展命令通过 `pi.sendMessage()` 管理自己的 LLM 交互。

**输入展开**：Skill 命令（`/skill:name`）和 Prompt 模板（`/template`）在发送/排队之前会展开。

响应：

```json
{ "id": "req-1", "type": "response", "command": "prompt", "success": true }
```

`success: true` 表示 Prompt 已被接受、排队或立即处理。`success: false` 表示 Prompt 在接受之前被拒绝。接受之后的失败通过常规的事件和消息流报告，而不是对同一请求 id 再发一个 `response`。

`images` 字段是可选的。每张图片使用 `ImageContent` 格式：`{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}`。

### steer

在 Agent 运行期间排队一条 steering 消息。它在当前 assistant turn 执行完其 tool call 之后、下一次 LLM 调用之前投递。Skill 命令和 Prompt 模板会展开。不允许扩展命令（请改用 `prompt`）。

```json
{ "type": "steer", "message": "Stop and do this instead" }
```

带图片：

```json
{
  "type": "steer",
  "message": "Look at this instead",
  "images": [{ "type": "image", "data": "base64-encoded-data", "mimeType": "image/png" }]
}
```

`images` 字段是可选的。每张图片使用 `ImageContent` 格式（与 `prompt` 相同）。

响应：

```json
{ "type": "response", "command": "steer", "success": true }
```

控制 steering 消息处理方式见 [set_steering_mode](#set_steering_mode)。

### follow_up

排队一条 follow-up 消息，在 Agent 结束后处理。只在 Agent 没有更多 tool call 或 steering 消息时投递。Skill 命令和 Prompt 模板会展开。不允许扩展命令（请改用 `prompt`）。

```json
{ "type": "follow_up", "message": "After you're done, also do this" }
```

带图片：

```json
{
  "type": "follow_up",
  "message": "Also check this image",
  "images": [{ "type": "image", "data": "base64-encoded-data", "mimeType": "image/png" }]
}
```

`images` 字段是可选的。每张图片使用 `ImageContent` 格式（与 `prompt` 相同）。

响应：

```json
{ "type": "response", "command": "follow_up", "success": true }
```

控制 follow-up 消息处理方式见 [set_follow_up_mode](#set_follow_up_mode)。

### abort

中止当前操作，并在响应之前等待会话进入空闲。

```json
{ "type": "abort" }
```

响应：

```json
{ "type": "response", "command": "abort", "success": true }
```

### clear_queue

移除排队的 steering 和 follow-up 消息，并返回它们的文本。

```json
{ "type": "clear_queue" }
```

响应：

```json
{
  "type": "response",
  "command": "clear_queue",
  "success": true,
  "data": {
    "steering": ["Change direction"],
    "followUp": ["Summarize when finished"]
  }
}
```

要实现交互式的 Esc 行为，请先发送 `clear_queue` 再发送 `abort`，然后把返回的文本恢复到客户端编辑器中。当排队消息仍留在会话中时，`abort` 会继续处理它们。

### new_session

开始一个全新的会话。可以被 `session_before_switch` 扩展事件处理器取消。

```json
{ "type": "new_session" }
```

带可选的父会话跟踪：

```json
{ "type": "new_session", "parentSession": "/path/to/parent-session.jsonl" }
```

响应：

```json
{ "type": "response", "command": "new_session", "success": true, "data": { "cancelled": false } }
```

如果被扩展取消：

```json
{ "type": "response", "command": "new_session", "success": true, "data": { "cancelled": true } }
```

## 状态

### get_state

获取当前会话状态。

```json
{ "type": "get_state" }
```

响应：

```json
{
  "type": "response",
  "command": "get_state",
  "success": true,
  "data": {
    "model": {...},
    "thinkingLevel": "medium",
    "isStreaming": false,
    "isCompacting": false,
    "steeringMode": "all",
    "followUpMode": "one-at-a-time",
    "sessionFile": "/path/to/session.jsonl",
    "sessionId": "abc123",
    "sessionName": "my-feature-work",
    "autoCompactionEnabled": true,
    "messageCount": 5,
    "pendingMessageCount": 0
  }
}
```

`model` 字段是完整的 [Model](#model-object) 对象，未选择模型时省略。`sessionName` 字段是通过 `set_session_name` 设置的显示名，未设置时省略。

### get_messages

获取对话中的所有消息。

```json
{ "type": "get_messages" }
```

响应：

```json
{
  "type": "response",
  "command": "get_messages",
  "success": true,
  "data": {"messages": [...]}
}
```

消息是 `AgentMessage` 对象（见[消息类型](message-types.md)）。

## 模型

### set_model

切换到特定模型。

```json
{ "type": "set_model", "provider": "anthropic", "modelId": "claude-sonnet-4-20250514" }
```

响应包含完整的 [Model](#model-object) 对象：

```json
{
  "type": "response",
  "command": "set_model",
  "success": true,
  "data": {...}
}
```

### cycle_model

循环切换到下一个可用模型。只有一个可用模型时 `data` 返回 `null`。

```json
{ "type": "cycle_model" }
```

响应：

```json
{
  "type": "response",
  "command": "cycle_model",
  "success": true,
  "data": {
    "model": {...},
    "thinkingLevel": "medium",
    "isScoped": false
  }
}
```

`model` 字段是完整的 [Model](#model-object) 对象。

### get_available_models

列出所有已配置的模型。

```json
{ "type": "get_available_models" }
```

响应包含一个完整的 [Model](#model-object) 对象数组：

```json
{
  "type": "response",
  "command": "get_available_models",
  "success": true,
  "data": {
    "models": [...]
  }
}
```

## Thinking

### set_thinking_level

为支持该能力的模型设置 reasoning/thinking level。

```json
{ "type": "set_thinking_level", "level": "high" }
```

级别：`"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`、`"max"`

`"xhigh"` 和 `"max"` 只在所选模型支持时才暴露。包括 GPT-5.6 在内的一些模型两者都暴露。

响应：

```json
{ "type": "response", "command": "set_thinking_level", "success": true }
```

### cycle_thinking_level

循环切换可用的 thinking level。模型不支持 thinking 时 `data` 返回 `null`。

```json
{ "type": "cycle_thinking_level" }
```

响应：

```json
{
  "type": "response",
  "command": "cycle_thinking_level",
  "success": true,
  "data": { "level": "high" }
}
```

### get_available_thinking_levels

列出当前模型支持的 thinking level。不支持推理的模型返回 `["off"]`。

```json
{ "type": "get_available_thinking_levels" }
```

响应：

```json
{
  "type": "response",
  "command": "get_available_thinking_levels",
  "success": true,
  "data": {
    "levels": ["off", "minimal", "low", "medium", "high"]
  }
}
```

## 队列模式

### set_steering_mode

控制 steering 消息（来自 `steer`）的投递方式。

```json
{ "type": "set_steering_mode", "mode": "one-at-a-time" }
```

模式：

- `"all"`：在当前 assistant turn 执行完其 tool call 之后投递所有 steering 消息
- `"one-at-a-time"`：每完成一个 assistant turn 投递一条 steering 消息（默认）

响应：

```json
{ "type": "response", "command": "set_steering_mode", "success": true }
```

### set_follow_up_mode

控制 follow-up 消息（来自 `follow_up`）的投递方式。

```json
{ "type": "set_follow_up_mode", "mode": "one-at-a-time" }
```

模式：

- `"all"`：在 Agent 结束时投递所有 follow-up 消息
- `"one-at-a-time"`：每次 Agent 完成投递一条 follow-up 消息（默认）

响应：

```json
{ "type": "response", "command": "set_follow_up_mode", "success": true }
```

## 压缩

### compact

手动压缩对话上下文以减少 Token 用量。

```json
{ "type": "compact" }
```

带自定义指令：

```json
{ "type": "compact", "customInstructions": "Focus on code changes" }
```

响应：

```json
{
  "type": "response",
  "command": "compact",
  "success": true,
  "data": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": {
      "input": 32000,
      "output": 1200,
      "cacheRead": 0,
      "cacheWrite": 0,
      "totalTokens": 33200,
      "cost": { "input": 0.01, "output": 0.02, "cacheRead": 0, "cacheWrite": 0, "total": 0.03 }
    },
    "details": {}
  }
}
```

`estimatedTokensAfter` 是对压缩后立即重建的消息上下文的启发式估算，不是 Provider 精确的 Token 数。`usage` 报告生成摘要的那次或那些 LLM 调用，自定义压缩处理器可以省略它。

### set_auto_compaction

在上下文接近满时启用或禁用自动压缩。

```json
{ "type": "set_auto_compaction", "enabled": true }
```

响应：

```json
{ "type": "response", "command": "set_auto_compaction", "success": true }
```

## 重试

### set_auto_retry

对临时错误（过载、速率限制、5xx）启用或禁用自动重试。

```json
{ "type": "set_auto_retry", "enabled": true }
```

响应：

```json
{ "type": "response", "command": "set_auto_retry", "success": true }
```

### abort_retry

中止进行中的重试（取消延迟并停止重试）。

```json
{ "type": "abort_retry" }
```

响应：

```json
{ "type": "response", "command": "abort_retry", "success": true }
```

## Bash

### bash

执行一条 Shell 命令并把输出加入对话上下文。命令运行期间输出会以 `bash_execution_update` 事件流式输出；响应包含最终结果。

```json
{ "id": "req-1", "type": "bash", "command": "ls -la" }
```

当命令输出应当存进会话、但在下一次 Prompt 时从模型上下文中省略时，把 `excludeFromContext` 设为 `true`。

包含 `id` 可以把流式输出的 `bash_execution_update` 事件与该命令关联起来。

响应：

```json
{
  "id": "req-1",
  "type": "response",
  "command": "bash",
  "success": true,
  "data": {
    "output": "total 48\ndrwxr-xr-x ...",
    "exitCode": 0,
    "cancelled": false,
    "truncated": false
  }
}
```

如果输出被截断，会包含 `fullOutputPath`：

```json
{
  "type": "response",
  "command": "bash",
  "success": true,
  "data": {
    "output": "truncated output...",
    "exitCode": 0,
    "cancelled": false,
    "truncated": true,
    "fullOutputPath": "/tmp/pi-bash-abc123.log"
  }
}
```

**bash 结果如何到达 LLM：**

`bash` 命令立即执行并返回一个 `BashResult`。内部会创建一条 `BashExecutionMessage` 并存入 Agent 的消息状态。

当下一条 `prompt` 命令发送时，Pi 在发送给模型之前转换上下文消息。除非 `excludeFromContext` 为 true，`BashExecutionMessage` 会变成一条 `UserMessage`，格式如下：

````
Ran `ls -la`
```
total 48
drwxr-xr-x ...
```
````

这意味着：

1. 被包含的 bash 输出在**下一次 Prompt**时到达模型，而不是立即到达。
2. 在一次 Prompt 之前可以运行多条 bash 命令；Pi 会包含每段未设置 `excludeFromContext` 的输出。

### abort_bash

中止正在运行的 bash 命令。

```json
{ "type": "abort_bash" }
```

响应：

```json
{ "type": "response", "command": "abort_bash", "success": true }
```

## 会话

### get_session_stats

获取 Token 用量、成本统计和当前上下文窗口用量。

```json
{ "type": "get_session_stats" }
```

响应：

```json
{
  "type": "response",
  "command": "get_session_stats",
  "success": true,
  "data": {
    "sessionFile": "/path/to/session.jsonl",
    "sessionId": "abc123",
    "userMessages": 5,
    "assistantMessages": 5,
    "toolCalls": 12,
    "toolResults": 12,
    "totalMessages": 22,
    "tokens": {
      "input": 50000,
      "output": 10000,
      "cacheRead": 40000,
      "cacheWrite": 5000,
      "total": 105000
    },
    "cost": 0.45,
    "contextUsage": {
      "tokens": 60000,
      "contextWindow": 200000,
      "percent": 30
    }
  }
}
```

`tokens` 和 `cost` 包含整个会话中的 assistant 消息、工具报告的用量，以及压缩/分支摘要的生成。`contextUsage` 包含用于压缩和页脚显示的实际当前上下文窗口估算。

没有可用模型或上下文窗口时会省略 `contextUsage`。压缩之后、在有新的压缩后 assistant 响应提供有效用量数据之前，`contextUsage.tokens` 和 `contextUsage.percent` 为 `null`。

### export_html

把会话导出为 HTML 文件。

```json
{ "type": "export_html" }
```

带自定义路径：

```json
{ "type": "export_html", "outputPath": "/tmp/session.html" }
```

响应：

```json
{
  "type": "response",
  "command": "export_html",
  "success": true,
  "data": { "path": "/tmp/session.html" }
}
```

### switch_session

加载另一个会话文件。可以被 `session_before_switch` 扩展事件处理器取消。

```json
{ "type": "switch_session", "sessionPath": "/path/to/session.jsonl" }
```

响应：

```json
{ "type": "response", "command": "switch_session", "success": true, "data": { "cancelled": false } }
```

如果扩展取消了切换：

```json
{ "type": "response", "command": "switch_session", "success": true, "data": { "cancelled": true } }
```

### fork

从活动分支上更早的用户消息创建新的 fork。可以被 `session_before_fork` 扩展事件处理器取消。返回被 fork 的消息文本。

```json
{ "type": "fork", "entryId": "abc123" }
```

响应：

```json
{
  "type": "response",
  "command": "fork",
  "success": true,
  "data": { "text": "The original prompt text...", "cancelled": false }
}
```

如果扩展取消了 fork：

```json
{
  "type": "response",
  "command": "fork",
  "success": true,
  "data": { "cancelled": true }
}
```

### clone

在当前位置把当前活动分支复制到新会话。可以被 `session_before_fork` 扩展事件处理器取消。

```json
{ "type": "clone" }
```

响应：

```json
{
  "type": "response",
  "command": "clone",
  "success": true,
  "data": { "cancelled": false }
}
```

如果扩展取消了 clone：

```json
{
  "type": "response",
  "command": "clone",
  "success": true,
  "data": { "cancelled": true }
}
```

### get_fork_messages

获取可用于 fork 的用户消息。

```json
{ "type": "get_fork_messages" }
```

响应：

```json
{
  "type": "response",
  "command": "get_fork_messages",
  "success": true,
  "data": {
    "messages": [
      { "entryId": "abc123", "text": "First prompt..." },
      { "entryId": "def456", "text": "Second prompt..." }
    ]
  }
}
```

### get_entries

按追加顺序获取所有会话条目（不含会话 header）。会话是一棵追加式、条目 id 稳定的树，所以条目 id 可以作为持久游标：把你见过的最后一个条目 id 作为 `since` 传入，只获取严格位于它之后的条目，即使客户端重启也有效。与 `get_messages` 不同，这包含压缩前的历史和被放弃的分支。

```json
{ "type": "get_entries" }
```

带游标：

```json
{ "type": "get_entries", "since": "abc123" }
```

响应：

```json
{
  "type": "response",
  "command": "get_entries",
  "success": true,
  "data": {
    "entries": [
      {
        "type": "message",
        "id": "def456",
        "parentId": "abc123",
        "timestamp": "...",
        "message": { "role": "user", "...": "..." }
      }
    ],
    "leafId": "def456"
  }
}
```

`leafId` 是当前叶子条目的 id（空会话为 `null`），所以客户端一次往返就能判断活动分支是否移动。如果 `since` 不匹配任何条目 id，响应为 `success: false`。

### get_tree

把会话作为条目树获取。每个节点是 `{entry, children, label?, labelTimestamp?}`。结果是数组，因为导航 API 可以创建多个根；父链断裂的孤立条目也会作为根出现。

```json
{ "type": "get_tree" }
```

响应：

```json
{
  "type": "response",
  "command": "get_tree",
  "success": true,
  "data": {
    "tree": [
      {
        "entry": { "type": "message", "id": "abc123", "parentId": null, "...": "..." },
        "children": [
          { "entry": { "type": "message", "id": "def456", "parentId": "abc123", "...": "..." }, "children": [] }
        ]
      }
    ],
    "leafId": "def456"
  }
}
```

### get_last_assistant_text

获取最后一条 assistant 消息的文本内容。

```json
{ "type": "get_last_assistant_text" }
```

响应：

```json
{
  "type": "response",
  "command": "get_last_assistant_text",
  "success": true,
  "data": { "text": "The assistant's response..." }
}
```

不存在 assistant 文本时 `text` 值为 `null`。

### set_session_name

为当前会话设置显示名。该名称会出现在会话列表中，便于识别会话。

```json
{ "type": "set_session_name", "name": "my-feature-work" }
```

响应：

```json
{
  "type": "response",
  "command": "set_session_name",
  "success": true
}
```

当前会话名可以通过 `get_state` 的 `sessionName` 字段获取。要在启动 RPC 模式时设置初始名称，请给 `pi --mode rpc` 进程传入 `--name <name>` 或 `-n <name>`。

## 可发现的命令

### get_commands

获取可用命令（扩展命令、Prompt 模板和 Skill）。在 `prompt` 命令中给名称加上 `/` 前缀即可运行其中一个。

```json
{ "type": "get_commands" }
```

响应：

```json
{
  "type": "response",
  "command": "get_commands",
  "success": true,
  "data": {
    "commands": [
      {
        "name": "fix-tests",
        "description": "Fix failing tests",
        "source": "prompt",
        "sourceInfo": {
          "path": "/home/user/myproject/.pi/agent/prompts/fix-tests.md",
          "source": "local",
          "scope": "project",
          "origin": "top-level"
        }
      }
    ]
  }
}
```

每条命令包含：

- `name`：命令名（用 `/name`）
- `description`：人类可读的描述（扩展命令可选）
- `source`：命令的种类：
  - `"extension"`：由扩展中的 `pi.registerCommand()` 注册
  - `"prompt"`：从 Prompt 模板 `.md` 文件加载
  - `"skill"`：从 Skill 目录加载（名称带 `skill:` 前缀）
- `sourceInfo`：注册该命令的资源的元数据：
  - `path`：资源的绝对路径
  - `source`：Pi 如何发现它，例如 `"local"`、`"auto"` 或 `"cli"`
  - `scope`：`"user"`、`"project"` 或 `"temporary"`
  - `origin`：直接加载的资源为 `"top-level"`，包资源为 `"package"`
  - `baseDir`：适用时的包基础目录

**注意**：内置 TUI 命令（`/settings`、`/hotkeys` 等）不包含在内。它们只在交互模式下处理，通过 `prompt` 发送不会执行。

## Model 对象

模型命令返回完整的已配置模型定义。成本以每百万 Token 的美元计。

```json
{
  "id": "claude-sonnet-4-20250514",
  "name": "Claude Sonnet 4",
  "api": "anthropic-messages",
  "provider": "anthropic",
  "baseUrl": "https://api.anthropic.com",
  "reasoning": true,
  "input": ["text", "image"],
  "contextWindow": 200000,
  "maxTokens": 16384,
  "cost": {
    "input": 3.0,
    "output": 15.0,
    "cacheRead": 0.3,
    "cacheWrite": 3.75
  }
}
```

模型配置见[配置兼容端点](models.md#configure-a-compatible-endpoint)。TypeScript 请使用 `@earendil-works/pi-ai` 导出的 `Model` 类型。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
