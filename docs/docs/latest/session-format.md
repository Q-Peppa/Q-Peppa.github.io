# Session Format（会话格式）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/session-format) 的中文翻译。仅供学习参考。

会话使用 **JSONL**（JSON Lines）格式。每行是一个带有 `type` 字段的 JSON 对象。条目通过 `id`/`parentId` 字段形成树状结构，支持原地分支。

## 文件位置

路径模式：`~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl`

## 会话版本

- **Version 1**：线性条目序列（旧格式，加载时自动迁移）
- **Version 2**：带 `id`/`parentId` 链接的树状结构
- **Version 3**：将 `hookMessage` 角色重命名为 `custom`（扩展统一）

现有会话在加载时自动迁移到 v3。

## 消息类型

### 内容块类型

- **TextContent**：`type: "text"`，`text: string`
- **ImageContent**：`type: "image"`，`data: string`（base64），`mimeType: string`
- **ThinkingContent**：`type: "thinking"`，`thinking: string`
- **ToolCall**：`type: "toolCall"`，`id`，`name`，`arguments: Record<string, any>`

### 基础消息类型

**UserMessage** —— `role: "user"`，content 为字符串或 TextContent/ImageContent 数组。

**AssistantMessage** —— `role: "assistant"`，content 为 TextContent/ThinkingContent/ToolCall 数组，附带 `api`、`provider`、`model`、`usage`、`stopReason`。

**ToolResultMessage** —— `role: "toolResult"`，`toolCallId`、`toolName`、content 数组、`isError`。

### 扩展消息类型

- **BashExecutionMessage** —— `role: "bashExecution"`，`command`、`output`、`exitCode`
- **CustomMessage** —— `role: "custom"`，`customType`、content、`display`
- **BranchSummaryMessage** —— `role: "branchSummary"`，`summary`、`fromId`
- **CompactionSummaryMessage** —— `role: "compactionSummary"`，`summary`、`tokensBefore`

## 条目类型

### SessionHeader

文件的第一行。包含 `type: "session"`、`version`、`id`（UUID）、`timestamp`、`cwd`。

### SessionMessageEntry

类型为 `"message"`，包含 `message` 字段（AgentMessage）。

### ModelChangeEntry

类型为 `"model_change"`，包含 `provider` 和 `modelId`。

### ThinkingLevelChangeEntry

类型为 `"thinking_level_change"`，包含 `thinkingLevel`。

### CompactionEntry

类型为 `"compaction"`，包含 `summary`、`firstKeptEntryId`、`tokensBefore`。

### BranchSummaryEntry

类型为 `"branch_summary"`，包含 `fromId`、`summary`。

### CustomEntry

扩展状态持久化，类型为 `"custom"`，包含 `customType` 和 `data`。

### LabelEntry

用户定义的条目标签，类型为 `"label"`，包含 `targetId` 和 `label`。

## 树状结构

条目形成树。第一个条目的 `parentId: null`。每个后续条目指向其父条目。分叉从较早的条目创建新的子条目。

```
[user msg] → [assistant] → [user msg] → [assistant] → [user msg] (当前叶)
                                                         ↓
                                                  [branch_summary] → [user msg] (替代分支)
```

## SessionManager API

### 静态创建方法

- `SessionManager.create(cwd, sessionDir?)` —— 新会话
- `SessionManager.open(path, sessionDir?)` —— 打开现有文件
- `SessionManager.continueRecent(cwd, sessionDir?)` —— 继续最近会话
- `SessionManager.inMemory(cwd?)` —— 无文件持久化
- `SessionManager.forkFrom(sourcePath, targetCwd, sessionDir?)` —— 从其他项目分叉

### 静态列表方法

- `SessionManager.list(cwd, sessionDir?)` —— 列出目录的会话
- `SessionManager.listAll()` —— 列出所有项目所有会话

### 实例方法

- `appendMessage(message)` —— 追加消息
- `appendCompaction(summary, firstKeptEntryId, tokensBefore)` —— 追加压缩记录
- `appendCustomEntry(customType, data?)` —— 追加自定义条目
- `getLeafId()`、`getLeafEntry()`、`getEntry(id)`、`getBranch()`、`getTree()`、`getChildren(parentId)`
- `branch(entryId)`、`resetLeaf()`、`branchWithSummary(entryId, summary)`
- `buildSessionContext()` —— 返回 LLM 所需消息、thinkingLevel 和模型

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
