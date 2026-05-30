# Compaction（压缩）与 Branch Summarization（分支摘要）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/compaction) 的中文翻译。仅供学习参考。

LLM 的上下文窗口有限。当对话过长时，Pi 使用压缩（compaction）来总结较旧的内容，同时保留近期工作。本页面涵盖自动压缩和分支摘要。

**源文件**（[pi-mono](https://github.com/earendil-works/pi-mono)）:

- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) - 自动压缩逻辑
- [`packages/coding-agent/src/core/compaction/branch-summarization.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) - 分支摘要
- [`packages/coding-agent/src/core/compaction/utils.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/utils.ts) - 共享工具（文件追踪、序列化）
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts) - 条目类型（`CompactionEntry`、`BranchSummaryEntry`）
- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/extensions/types.ts) - 扩展事件类型

关于 TypeScript 类型定义，请查看项目中的 `node_modules/@earendil-works/pi-coding-agent/dist/`。

## 概述

Pi 有两种摘要机制：

| 机制                             | 触发                          | 目的                       |
| -------------------------------- | ----------------------------- | -------------------------- |
| Compaction（压缩）               | 上下文超过阈值，或 `/compact` | 总结旧消息以释放上下文空间 |
| Branch Summarization（分支摘要） | `/tree` 导航                  | 在切换分支时保留上下文     |

两种机制使用相同的结构化摘要格式，并累积跟踪文件操作。

## Compaction（压缩）

### 触发时机

自动压缩在以下条件时触发：

```
contextTokens > contextWindow - reserveTokens
```

默认情况下，`reserveTokens` 为 16384 Token（可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）。这为 LLM 的响应预留了空间。

你也可以使用 `/compact [instructions]` 手动触发，其中可选的 instructions 用于聚焦摘要内容。

### 工作原理

1. **找到切割点**：从最新消息向后遍历，累积 Token 估算，直到达到 `keepRecentTokens`（默认 20k，可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）
2. **提取消息**：收集从上次保留边界（或会话开始）到切割点的消息
3. **生成摘要**：调用 LLM 使用结构化格式进行总结，如果存在之前的摘要则将其作为迭代上下文传入
4. **追加条目**：保存一个包含摘要和 `firstKeptEntryId` 的 `CompactionEntry`
5. **重新加载**：会话重新加载，使用摘要加上从 `firstKeptEntryId` 开始的消息

```
压缩前：

  entry:  0     1     2     3      4     5     6      7      8     9
        ┌─────┬─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┘
                └────────┬───────┘ └──────────────┬──────────────┘
               messagesToSummarize            kept messages
                                   ↑
                          firstKeptEntryId (entry 4)

压缩后（追加了新条目）：

  entry:  0     1     2     3      4     5     6      7      8     9     10
        ┌─────┬─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│ cmp │
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┴─────┘
               └──────────┬──────┘ └──────────────────────┬───────────────────┘
                 not sent to LLM                    sent to LLM
                                                         ↑
                                              starts from firstKeptEntryId

LLM 看到的内容：

  ┌────────┬─────────┬─────┬─────┬──────┬──────┬─────┬──────┐
  │ system │ summary │ usr │ ass │ tool │ tool │ ass │ tool │
  └────────┴─────────┴─────┴─────┴──────┴──────┴─────┴──────┘
       ↑         ↑      └─────────────────┬────────────────┘
    prompt   from cmp          messages from firstKeptEntryId
```

在重复压缩时，摘要跨度从上次压缩的保留边界（`firstKeptEntryId`）开始，而不是从压缩条目本身开始；如果无法在路径中找到该保留条目，则回退到上次压缩之后的那一个条目。这样，那些在早期压缩中幸存下来的消息也会被纳入后续的摘要处理中。Pi 还会在写入新的 `CompactionEntry` 之前从重建的会话上下文中重新计算 `tokensBefore`，因此 Token 计数反映了被替换的实际压缩前上下文。

### Split Turns（拆分轮次）

一个"轮次"从用户消息开始，包含所有助手响应和工具调用，直到下一条用户消息为止。通常，压缩在轮次边界处切割。

当单个轮次超过 `keepRecentTokens` 时，切割点会落在轮次中间的一个助手消息处。这就是"拆分轮次"（split turn）：

```
拆分轮次（一个巨大轮次超出预算）：

  entry:  0     1     2      3     4      5      6     7      8
        ┌─────┬─────┬─────┬──────┬─────┬──────┬──────┬─────┬──────┐
        │ hdr │ usr │ ass │ tool │ ass │ tool │ tool │ ass │ tool │
        └─────┴─────┴─────┴──────┴─────┴──────┴──────┴─────┴──────┘
                ↑                                     ↑
         turnStartIndex = 1                  firstKeptEntryId = 7
                │                                     │
                └──── turnPrefixMessages (1-6) ───────┘
                                                      └── kept (7-8)

  isSplitTurn = true
  messagesToSummarize = []  (之前没有完整轮次)
  turnPrefixMessages = [usr, ass, tool, ass, tool, tool]
```

对于拆分轮次，Pi 会生成两个摘要并合并：

1. **历史摘要**：之前的上下文（如果有）
2. **轮次前缀摘要**：拆分轮次的前半部分

### 切割点规则

有效的切割点包括：

- 用户消息
- 助手消息
- BashExecution 消息
- 自定义消息（custom_message、branch_summary）

工具结果**永远不能**作为切割点——它们必须与工具调用保持在一起。

### CompactionEntry 结构

定义在 [`session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts) 中：

```typescript
interface CompactionEntry<T = unknown> {
  type: 'compaction';
  id: string;
  parentId: string;
  timestamp: number;
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  fromHook?: boolean; // 如果由扩展提供则为 true（旧字段名）
  details?: T; // 实现特定的数据
}

// 默认压缩使用此 details（来自 compaction.ts）：
interface CompactionDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

扩展可以在 `details` 中存储任何 JSON 可序列化的数据。默认压缩追踪文件操作，但自定义扩展实现可以使用自己的结构。

参考 [`prepareCompaction()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) 和 [`compact()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) 查看实现。

## Branch Summarization（分支摘要）

### 触发时机

使用 `/tree` 导航到不同分支时，Pi 会提示总结你即将离开的工作，将上下文注入新分支。

### 工作原理

1. **找到公共祖先**：新旧位置之间最深的共享节点
2. **收集条目**：从旧叶节点回溯到公共祖先
3. **预算准备**：包含直到 Token 预算的消息（从新到旧）
4. **生成摘要**：调用 LLM 使用结构化格式进行总结
5. **追加条目**：在导航点保存 `BranchSummaryEntry`

```
导航前的树：

         ┌─ B ─ C ─ D (旧叶节点，将被放弃)
    A ───┤
         └─ E ─ F (目标)

公共祖先：A
要总结的条目：B、C、D

带摘要导航后：

         ┌─ B ─ C ─ D ─ [B、C、D 的摘要]
    A ───┤
         └─ E ─ F (新叶节点)
```

### 累积文件追踪

压缩和分支摘要都会累积追踪文件。在生成摘要时，Pi 会从以下来源提取文件操作：

- 被摘要消息中的工具调用
- 之前的压缩或分支摘要 `details`（如果有）

这意味着文件追踪会跨多次压缩或嵌套的分支摘要累积，保留读取和修改文件的完整历史。

### BranchSummaryEntry 结构

定义在 [`session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts) 中：

```typescript
interface BranchSummaryEntry<T = unknown> {
  type: 'branch_summary';
  id: string;
  parentId: string;
  timestamp: number;
  summary: string;
  fromId: string; // 我们从此条目导航而来
  fromHook?: boolean; // 如果由扩展提供则为 true（旧字段名）
  details?: T; // 实现特定的数据
}

// 默认分支摘要使用此 details（来自 branch-summarization.ts）：
interface BranchSummaryDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

与压缩相同，扩展可以在 `details` 中存储自定义数据。

参考 [`collectEntriesForBranchSummary()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)、[`prepareBranchEntries()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) 和 [`generateBranchSummary()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) 查看实现。

## 摘要格式

压缩和分支摘要都使用相同的结构化格式：

```markdown
## Goal

[用户试图完成的目标]

## Constraints & Preferences

- [用户提到的要求]

## Progress

### Done

- [x] [已完成任务]

### In Progress

- [ ] [当前工作]

### Blocked

- [问题，如果有]

## Key Decisions

- **[决策]**：[理由]

## Next Steps

1. [接下来应该做的事情]

## Critical Context

- [继续工作所需的数据]

<read-files>
path/to/file1.ts
path/to/file2.ts
</read-files>

<modified-files>
path/to/changed.ts
</modified-files>
```

### 消息序列化

在摘要之前，消息通过 [`serializeConversation()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/utils.ts) 序列化为文本：

```
[User]: 他们说的内容
[Assistant thinking]: 内部推理
[Assistant]: 响应文本
[Assistant tool calls]: read(path="foo.ts"); edit(path="bar.ts", ...)
[Tool result]: 工具输出
```

这可以防止模型将其视为需要继续的对话。

工具结果在序列化期间被截断为 2000 个字符。超出部分被替换为一个标记，指示被截断的字符数。这使摘要请求保持在合理的 Token 预算内，因为工具结果（尤其是来自 `read` 和 `bash` 的结果）通常是上下文大小的最大贡献者。

## 通过扩展自定义摘要

扩展可以拦截并自定义压缩和分支摘要。关于事件类型定义，请参考 [`extensions/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/extensions/types.ts)。

### session_before_compact

在自动压缩或 `/compact` 之前触发。可以取消或提供自定义摘要。关于 `SessionBeforeCompactEvent` 和 `CompactionPreparation`，请参阅类型文件。

```typescript
pi.on('session_before_compact', async (event, ctx) => {
  const { preparation, branchEntries, customInstructions, signal } = event;

  // preparation.messagesToSummarize - 要总结的消息
  // preparation.turnPrefixMessages - 拆分轮次前缀（如果是 isSplitTurn）
  // preparation.previousSummary - 上次压缩摘要
  // preparation.fileOps - 提取的文件操作
  // preparation.tokensBefore - 压缩前的上下文 Token 数
  // preparation.firstKeptEntryId - 保留消息的起始位置
  // preparation.settings - 压缩设置

  // branchEntries - 当前分支上的所有条目（用于自定义状态）
  // signal - AbortSignal（传递给 LLM 调用）

  // 取消：
  return { cancel: true };

  // 自定义摘要：
  return {
    compaction: {
      summary: '你的摘要...',
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      details: {
        /* 自定义数据 */
      },
    },
  };
});
```

#### 将消息转换为文本

要使用自己的模型生成摘要，使用 `serializeConversation` 将消息转换为文本：

```typescript
import { convertToLlm, serializeConversation } from '@earendil-works/pi-coding-agent';

pi.on('session_before_compact', async (event, ctx) => {
  const { preparation } = event;

  // 将 AgentMessage[] 转换为 Message[]，然后序列化为文本
  const conversationText = serializeConversation(convertToLlm(preparation.messagesToSummarize));
  // 返回：
  // [User]: 消息文本
  // [Assistant thinking]: thinking 内容
  // [Assistant]: 响应文本
  // [Assistant tool calls]: read(path="..."); bash(command="...")
  // [Tool result]: 输出文本

  // 现在发送给你的模型进行摘要
  const summary = await myModel.summarize(conversationText);

  return {
    compaction: {
      summary,
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
    },
  };
});
```

参考 [custom-compaction.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/custom-compaction.ts) 查看使用不同模型的完整示例。

### session_before_tree

在 `/tree` 导航之前触发。无论用户是否选择摘要，都会触发。可以取消导航或提供自定义摘要。

```typescript
pi.on('session_before_tree', async (event, ctx) => {
  const { preparation, signal } = event;

  // preparation.targetId - 导航目标
  // preparation.oldLeafId - 当前位置（将被放弃）
  // preparation.commonAncestorId - 公共祖先
  // preparation.entriesToSummarize - 需要被总结的条目
  // preparation.userWantsSummary - 用户是否选择摘要

  // 完全取消导航：
  return { cancel: true };

  // 提供自定义摘要（仅当 userWantsSummary 为 true 时使用）：
  if (preparation.userWantsSummary) {
    return {
      summary: {
        summary: '你的摘要...',
        details: {
          /* 自定义数据 */
        },
      },
    };
  }
});
```

关于 `SessionBeforeTreeEvent` 和 `TreePreparation`，请参阅类型文件。

## 设置

在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置压缩：

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

| 设置项             | 默认值  | 说明                       |
| ------------------ | ------- | -------------------------- |
| `enabled`          | `true`  | 启用自动压缩               |
| `reserveTokens`    | `16384` | 为 LLM 响应预留的 Token    |
| `keepRecentTokens` | `20000` | 保留的最近 Token（不总结） |

使用 `"enabled": false` 禁用自动压缩。你仍可以使用 `/compact` 手动压缩。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
