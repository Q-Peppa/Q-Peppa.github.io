# 会话文件格式

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/session-format) 的中文翻译。仅供学习参考。

会话以 JSONL（JSON Lines）文件存储。每一行都是一个带 `type` 字段的 JSON 对象。会话条目通过 `id`/`parentId` 字段构成树结构，因此可以就地分支而不创建新文件。

以编程方式创建、持久化和导航树，见 [`SessionManager` API](sdk.md#sessionmanager-api)。

## 文件位置

```
~/.pi/agent/sessions/--<path>--/<timestamp>_<session-id>.jsonl
```

默认情况下 `<session-id>` 是一个 UUID。调用方可以通过 SDK 或 `--session-id` 提供自定义 ID。对于 `<path>`，Pi 去掉开头的路径分隔符，并把 `/`、`\` 和 `:` 替换为 `-`。

## 删除会话

删除 `~/.pi/agent/sessions/` 下对应的 `.jsonl` 文件即可移除会话。

Pi 也支持在 `/resume` 中交互式删除会话（选择一个会话并按 `Ctrl+D`，然后确认）。可用时 Pi 会使用 `trash` CLI，以避免永久删除。

## 会话版本

会话在 header 中有版本字段：

- **版本 1**：线性条目序列（旧格式，加载时自动迁移）
- **版本 2**：通过 `id`/`parentId` 关联的树结构
- **版本 3**：把 `hookMessage` 角色重命名为 `custom`（扩展统一）

已有会话在加载时会自动迁移到当前版本（v3）。

## 源文件

GitHub 上的源码（[pi](https://github.com/earendil-works/pi)）：

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts) - 会话条目类型和 SessionManager
- [消息类型](message-types.md) - 共享的消息和内容块参考
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/messages.ts) - 扩展消息类型
- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/ai/src/types.ts) - 基础消息和内容块类型
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/agent/src/types.ts) - 可扩展的 `AgentMessage` 联合类型

项目中的 TypeScript 定义请查看 `node_modules/@earendil-works/pi-coding-agent/dist/` 和 `node_modules/@earendil-works/pi-ai/dist/`。

## 消息

`message` 条目存储一个 [`AgentMessage`](message-types.md)。消息内容块、角色、用量和消息时间戳定义在[消息类型](message-types.md)中。

会话条目时间戳是 ISO 8601 字符串。嵌套的消息时间戳是 Unix 毫秒时间戳。

## 条目基类

所有条目（`SessionHeader` 除外）都扩展 `SessionEntryBase`：

```typescript
interface SessionEntryBase {
  type: string;
  id: string; // 通常是 8 字符十六进制 ID；也可能回退为完整 UUID
  parentId: string | null; // 父条目 ID（根条目为 null）
  timestamp: string; // ISO 时间戳
}
```

## 条目类型

### SessionHeader

文件的第一行。仅含元数据，不属于树（没有 `id`/`parentId`）。

```json
{ "type": "session", "version": 3, "id": "uuid", "timestamp": "2024-12-03T14:00:00.000Z", "cwd": "/path/to/project" }
```

有父会话的会话（通过 `/fork`、`/clone` 或 `newSession({ parentSession })` 创建）：

```json
{
  "type": "session",
  "version": 3,
  "id": "uuid",
  "timestamp": "2024-12-03T14:00:00.000Z",
  "cwd": "/path/to/project",
  "parentSession": "/path/to/original/session.jsonl"
}
```

### SessionMessageEntry

对话中的一条消息。`message` 字段包含一个 `AgentMessage`。系统消息携带 Prompt 和工具配置：会话的第一次请求会持久化一条包含所有 Prompt 分段和工具声明的系统消息，之后的改动会持久化为系统消息，按名称修补 `sections`（`null` 表示移除一项），并列出 `toolsAdded`/`toolsRemoved`。按顺序回放它们即可得到当前的 Prompt 和工具；不存在单独的 Prompt 状态条目。

```json
{"type":"message","id":"a0b1c2d3","parentId":null,"timestamp":"2024-12-03T14:00:00.000Z","message":{"role":"system","content":"","sections":{"preamble":"You are an expert coding assistant...","tools":"<tools>\n- read: ...\n</tools>","cwd":"/project"},"toolsAdded":[{"name":"read","description":"...","parameters":{}}],"timestamp":1733234400000}}
{"type":"message","id":"d4e5f6g7","parentId":"c3d4e5f6","timestamp":"2024-12-03T14:04:00.000Z","message":{"role":"system","content":"","sections":{"skills":"<skills>...</skills>"},"toolsRemoved":[{"name":"write"}],"timestamp":1733234640000}}
```

在系统消息出现之前创建的会话没有开头的系统消息；第一次请求会把当前 Prompt 声明为之后的系统消息，回放方式相同。

```json
{"type":"message","id":"a1b2c3d4","parentId":"prev1234","timestamp":"2024-12-03T14:00:01.000Z","message":{"role":"user","content":"Hello","timestamp":1733234401000}}
{"type":"message","id":"b2c3d4e5","parentId":"a1b2c3d4","timestamp":"2024-12-03T14:00:02.000Z","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}],"api":"anthropic-messages","provider":"anthropic","model":"claude-sonnet-4-5","usage":{...},"stopReason":"stop","timestamp":1733234402000}}
{"type":"message","id":"c3d4e5f6","parentId":"b2c3d4e5","timestamp":"2024-12-03T14:00:03.000Z","message":{"role":"toolResult","toolCallId":"call_123","toolName":"bash","content":[{"type":"text","text":"output"}],"isError":false,"timestamp":1733234403000}}
```

### ModelChangeEntry

用户在会话中途切换模型时发出。

```json
{
  "type": "model_change",
  "id": "d4e5f6g7",
  "parentId": "c3d4e5f6",
  "timestamp": "2024-12-03T14:05:00.000Z",
  "provider": "openai",
  "modelId": "gpt-4o"
}
```

### ThinkingLevelChangeEntry

用户改变 thinking/reasoning level 时发出。

```json
{
  "type": "thinking_level_change",
  "id": "e5f6g7h8",
  "parentId": "d4e5f6g7",
  "timestamp": "2024-12-03T14:06:00.000Z",
  "thinkingLevel": "high"
}
```

### UsageEntry

记录归属于模型、但不是 assistant 消息且不参与 LLM 上下文的用量。`kind` 是标识该操作的任意字符串；例如缓存预热使用 `"cache_warm"`。

```json
{
  "type": "usage",
  "id": "f6g7h8i9",
  "parentId": "e5f6g7h8",
  "timestamp": "2024-12-03T14:08:00.000Z",
  "kind": "cache_warm",
  "provider": "anthropic",
  "model": "claude-sonnet-4-5",
  "usage": {
    "input": 0,
    "output": 0,
    "cacheRead": 50000,
    "cacheWrite": 0,
    "totalTokens": 50000,
    "cost": { "input": 0, "output": 0, "cacheRead": 0.015, "cacheWrite": 0, "total": 0.015 }
  }
}
```

用量条目会计入会话的 Token 和成本总量。Pi 会把它们从对话树中隐藏。使用方应当把未知的 `kind` 值当作普通用量处理，而不是拒绝它们。

### CompactionEntry

上下文被压缩时创建。存储较早消息的摘要和一份完整的系统提示/工具检查点。

```json
{
  "type": "compaction",
  "id": "f6g7h8i9",
  "parentId": "e5f6g7h8",
  "timestamp": "2024-12-03T14:10:00.000Z",
  "summary": "User discussed X, Y, Z...",
  "firstKeptEntryId": "c3d4e5f6",
  "tokensBefore": 50000,
  "systemMessage": {
    "role": "system",
    "content": "You are a coding assistant.",
    "toolsAdded": [],
    "timestamp": 1733235000000
  }
}
```

`firstKeptEntryId` 是必填项。它标识从压缩条目之前保留下来的第一个条目。重建上下文时，Pi 用压缩摘要替换较早的被摘要条目，并保留从该条目开始的范围。不保留任何内容的压缩会把自己的 ID 存在该字段中，因此不会保留之前的任何条目。

可选字段：

- `systemMessage`：压缩边界处回放的 Prompt 分段和工具声明；它成为压缩后上下文的开头系统消息，保留范围内的系统消息会因它而被丢弃。较旧的会话条目中没有该字段。
- `usage`：生成摘要产生的 LLM 用量；计入会话 Token 和成本总量
- `details`：实现特定的数据（例如默认实现为 `{ readFiles: string[], modifiedFiles: string[] }`，扩展可为自定义数据）
- `fromHook`：由扩展生成时为 `true`，由 pi 生成时为 `false`/`undefined`（旧字段名）

### ContextEditEntry

对某一个较早的、会产生上下文的条目的仅追加编辑。它只改变未来的模型上下文；目标条目及其元数据在原始历史、UI、导出和会话统计中保持不变。

```json
{
  "type": "context_edit",
  "id": "g6h7i8j9",
  "parentId": "f6g7h8i9",
  "timestamp": "2024-12-03T14:11:00.000Z",
  "targetId": "c3d4e5f6",
  "replacement": null
}
```

目标可以是 user、assistant、tool-result 或 custom-message 条目。`replacement: null` 会在模型上下文中省略该目标。非 null 的 `replacement` 只替换目标消息的内容。assistant 和 tool-result 条目的字符串替换会被规范化为一个文本块，因为这些角色要求内容是数组。如果有多个编辑指向同一条目，活动分支上最新的编辑胜出。编辑是相对于分支的：导航到编辑之前的某个点时，目标的原始贡献会重新出现。

### BranchSummaryEntry

通过 `/tree` 切换分支时创建，包含由 LLM 生成的、从被离开分支到共同祖先的摘要。它捕获被放弃路径中的上下文。

```json
{
  "type": "branch_summary",
  "id": "g7h8i9j0",
  "parentId": "a1b2c3d4",
  "timestamp": "2024-12-03T14:15:00.000Z",
  "fromId": "f6g7h8i9",
  "summary": "Branch explored approach A..."
}
```

`parentId` 是新分支继续的条目。`fromId` 是其被放弃路径被摘要的前一个叶子。

可选字段：

- `usage`：生成摘要产生的 LLM 用量；计入会话 Token 和成本总量
- `details`：默认实现为文件跟踪数据（`{ readFiles: string[], modifiedFiles: string[] }`），扩展可为自定义数据
- `fromHook`：由扩展生成时为 `true`，由 pi 生成时为 `false`/`undefined`（旧字段名）

### CustomEntry

扩展状态持久化。**不**参与 LLM 上下文。

```json
{
  "type": "custom",
  "id": "h8i9j0k1",
  "parentId": "g7h8i9j0",
  "timestamp": "2024-12-03T14:20:00.000Z",
  "customType": "my-extension",
  "data": { "count": 42 }
}
```

用 `customType` 在重新加载时标识你的扩展条目。交互模式可以通过 `pi.registerEntryRenderer(customType, renderer)` 渲染自定义条目，但它们仍然不参与 LLM 上下文。

### CustomMessageEntry

扩展注入的、**会**参与 LLM 上下文的消息。

```json
{
  "type": "custom_message",
  "id": "i9j0k1l2",
  "parentId": "h8i9j0k1",
  "timestamp": "2024-12-03T14:25:00.000Z",
  "customType": "my-extension",
  "content": "Injected context...",
  "display": true
}
```

字段：

- `content`：字符串或 `(TextContent | ImageContent)[]`（与 UserMessage 相同）
- `display`：`true` = 在 TUI 中以独特样式显示，`false` = 隐藏
- `details`：可选的扩展特定元数据（不发送给 LLM）

### LabelEntry

用户定义的、某个条目上的书签/标记。

```json
{
  "type": "label",
  "id": "j0k1l2m3",
  "parentId": "i9j0k1l2",
  "timestamp": "2024-12-03T14:30:00.000Z",
  "targetId": "a1b2c3d4",
  "label": "checkpoint-1"
}
```

把 `label` 设为 `undefined` 可以清除标签。

### SessionInfoEntry

会话元数据（例如用户定义的显示名）。通过 `/name`、`--name` / `-n` 或扩展中的 `pi.setSessionName()` 设置。

```json
{
  "type": "session_info",
  "id": "k1l2m3n4",
  "parentId": "j0k1l2m3",
  "timestamp": "2024-12-03T14:35:00.000Z",
  "name": "Refactor auth module"
}
```

设置之后，会话名会代替第一条消息显示在会话选择器（`/resume`）中。

## 树结构

条目通常构成一棵树，但导航 API 可以创建多个根：

- 根条目的 `parentId: null`；第一个条目最初是根
- 每个非根条目通过 `parentId` 指向它的父条目
- 分支会从较早的条目产生新的子条目
- “叶子”是树中的当前位置
- 调用 `resetLeaf()` 或 `branchWithSummary(null, ...)` 可以让之后的条目成为另一个根

```
[user msg] ─── [assistant] ─── [user msg] ─── [assistant] ─┬─ [user msg] ← current leaf
                                                            │
                                                            └─ [branch_summary] ─── [user msg] ← alternate branch
```

## 上下文构建

`buildContextEntries()` 从当前叶子遍历到根，在遵守压缩规则的同时生成活动条目列表：

1. 收集路径上的所有条目
2. 如果路径上有一个或多个 `CompactionEntry`，使用最新的那个：
   - 先包含压缩条目
   - 包含从 `firstKeptEntryId` 开始、到压缩条目之前（不含）的非系统条目
   - 包含压缩条目之后的条目
3. 保留所选范围内的非消息条目，以便交互模式能够渲染它们

`buildSessionProjection()` 随后为每个选中的目标应用最新的 `context_edit`。它返回模型可见的消息及其来源条目。被省略的目标不产生消息；替换会保留来源条目的角色和元数据，只改变内容。原始选中的条目不会被修改。

`buildSessionContext()` 在该投影之上构建给 LLM 的消息列表：

1. 从完整路径中提取当前的模型和 thinking level 设置
2. 把选中的条目转换为消息：
   - `message` -> 已存的 `AgentMessage`
   - `compaction` -> 完整的系统检查点，后跟 `compactionSummary`
   - `branch_summary` -> `branchSummary`
   - `custom_message` -> `CustomMessage`
   - `context_edit` -> 自身不产生上下文消息
   - `usage` 和 `custom` -> 不产生上下文消息

压缩摘要会替换 `firstKeptEntryId` 之前的条目。压缩前的系统消息会被折叠进完整的检查点，而不是从保留范围中回放。保留的非系统条目和压缩之后的所有条目仍可供 LLM 使用。

## 解析示例

```typescript
import { readFileSync } from 'fs';

const lines = readFileSync('session.jsonl', 'utf8').trim().split('\n');

for (const line of lines) {
  const entry = JSON.parse(line);

  switch (entry.type) {
    case 'session':
      console.log(`Session v${entry.version ?? 1}: ${entry.id}`);
      break;
    case 'message':
      console.log(`[${entry.id}] ${entry.message.role}: ${JSON.stringify(entry.message.content)}`);
      break;
    case 'compaction':
      console.log(`[${entry.id}] Compaction: ${entry.tokensBefore} tokens summarized`);
      break;
    case 'branch_summary':
      console.log(`[${entry.id}] Branch from ${entry.fromId}`);
      break;
    case 'usage':
      console.log(`[${entry.id}] Usage (${entry.kind}): ${entry.usage.totalTokens} tokens`);
      break;
    case 'custom':
      console.log(`[${entry.id}] Custom (${entry.customType}): ${JSON.stringify(entry.data)}`);
      break;
    case 'custom_message':
      console.log(`[${entry.id}] Extension message (${entry.customType}): ${entry.content}`);
      break;
    case 'label':
      console.log(`[${entry.id}] Label "${entry.label}" on ${entry.targetId}`);
      break;
    case 'model_change':
      console.log(`[${entry.id}] Model: ${entry.provider}/${entry.modelId}`);
      break;
    case 'thinking_level_change':
      console.log(`[${entry.id}] Thinking: ${entry.thinkingLevel}`);
      break;
  }
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
