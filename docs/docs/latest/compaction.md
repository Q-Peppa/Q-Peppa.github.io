# 压缩参考

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/compaction) 的中文翻译。仅供学习参考。

本参考描述自动压缩、分支摘要、持久化条目和扩展钩子。用户工作流见[会话与上下文](sessions.md#manage-conversation-context)。

**源文件**（[pi](https://github.com/earendil-works/pi)）：

- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) - 自动压缩逻辑
- [`packages/coding-agent/src/core/compaction/branch-summarization.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) - 分支摘要
- [`packages/coding-agent/src/core/compaction/utils.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/utils.ts) - 共享工具（文件跟踪、序列化）
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts) - 条目类型（`CompactionEntry`、`BranchSummaryEntry`）
- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts) - 扩展事件类型

项目中的 TypeScript 定义请查看 `node_modules/@earendil-works/pi-coding-agent/dist/`。

## 概览

Pi 有两种摘要机制：

| 机制     | 触发条件                      | 目的                       |
| -------- | ----------------------------- | -------------------------- |
| 压缩     | 上下文超过阈值，或 `/compact` | 摘要较早的消息以释放上下文 |
| 分支摘要 | `/tree` 导航                  | 切换分支时保留上下文       |

两者使用密切相关的结构化格式，并累积跟踪文件操作。摘要请求会禁用 Prompt 缓存写入，因为这些一次性 Prompt 不太可能被复用。

## 压缩

### 何时触发

自动压缩在以下条件成立时触发：

```
contextTokens > contextWindow - reserveTokens
```

默认情况下 `reserveTokens` 是 16384 个 Token（可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）。这为 LLM 的响应留出空间。

在多 turn 的 Agent 运行中，工具结束且其结果被追加之后、开始下一次 assistant 响应之前，Pi 会检查规范投影后的上下文。如果越过阈值，Pi 在 `prepareNextTurn` 中压缩，然后在 `turn_start` 之前执行已有的追赶 steering 轮询。当已完成的工具批次终止该次运行、且没有排队消息需要另一次响应时，Pi 会跳过这次 turn 之间的检查。Pi 也会在新用户 Prompt 之前检查，并在底层运行结束之后做最终尝试的溢出恢复。

Provider 的上下文溢出错误，或过早的最终 `stopReason: "length"`，可以触发一次压缩并重试的恢复尝试。带 tool call 的 length 响应会保留其合成的失败工具结果，并遵循常规的工具/队列调度，而不是强制结束该次运行。

你也可以用 `/compact [instructions]` 手动触发，其中可选的指令用于聚焦摘要。

### 工作原理

1. **找到切点**：在已定稿的会话投影上向后遍历，累积 Token 估算，直到达到 `keepRecentTokens`（默认 20k，可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）
2. **提取消息**：收集从上一个保留边界（或会话开始）到切点的投影消息
3. **生成摘要**：调用 LLM 以结构化格式摘要，存在上一个摘要时把它作为迭代上下文传入
4. **追加条目**：保存带摘要和 `firstKeptEntryId` 的 `CompactionEntry`
5. **重建上下文**：会话为下一次请求重建上下文，使用摘要加上从 `firstKeptEntryId` 开始的消息

```
压缩之前：

  entry:  0     1     2     3      4     5     6      7      8     9
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┘
                └────────┬───────┘ └──────────────┬──────────────┘
               messagesToSummarize            kept messages
                                   ↑
                          firstKeptEntryId (entry 4)

压缩之后（追加了新条目）：

  entry:  0     1     2     3      4     5     6      7      8     9     10
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┬─────┐
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

重复压缩时，被摘要的区间从上一个压缩的保留边界（`firstKeptEntryId`）开始，而不是从压缩条目本身开始；如果该保留条目在路径中找不到，则回退到上一个压缩之后的条目。不保留任何内容的压缩会把自己的 ID 记为 `firstKeptEntryId`；重复压缩从该条目之后开始。这样把在上一次压缩中幸存的消息也纳入下一轮摘要，从而保留它们。Pi 还会在写入新的 `CompactionEntry` 之前，从重建且应用了上下文编辑的会话投影重新计算 `tokensBefore`，因此 Token 数反映的是实际被替换的压缩前上下文。被省略的原始条目仍然存储，但不影响切点选择、摘要、检查点或 Token 估算。

### 溢出与长度恢复的顺序

恢复保留已有的生命周期和队列顺序。已完成的那次尝试对 `turn_end` 和 `agent_end` 仍然可见；之后由运行后恢复修复已持久化的模型上下文，再进行新的重试：

```
持久化最终的 assistant 响应
→ 扩展/公开的 turn_end
→ 扩展/公开的 agent_end
→ 为所选尝试追加 context_edit 省略
→ 对于溢出/长度：运行 session_before_compact，并在成功时追加压缩
→ 作为一次新的运行开始重试
```

如果恢复压缩失败或被取消，Pi 保留省略编辑、不追加压缩，也不调度内部重试。已有的排队工作仍遵循常规的 steering 和 follow-up 规则。`agent_before_settle` 在恢复处理之后看到修复后的投影。原始转录历史、导出、计费总量和历史搜索扩展仍可检查被省略的尝试。

### 拆分的用户消息区间

一个用户消息区间从一条用户消息开始，包含所有 turn，直到下一条用户消息。通常压缩在用户消息边界处切分。

当某个用户消息区间超过 `keepRecentTokens` 时，切点落在该区间内的某条 assistant 消息上。这就是拆分的用户消息区间：

```
拆分的用户消息区间（一个区间超过预算）：

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
  messagesToSummarize = []  (没有更早的用户消息区间)
  turnPrefixMessages = [usr, ass, tool, ass, tool, tool]
```

对于拆分的用户消息区间，Pi 生成两份摘要并合并它们：

1. **历史摘要**：先前的上下文（如果有）
2. **用户消息区间前缀摘要**：拆分出的用户消息区间的较早部分

### 切点规则

合法的切点是：

- 用户消息
- assistant 消息
- BashExecution 消息
- 自定义消息（custom_message、branch_summary）

绝不在工具结果处切分（它们必须与对应的 tool call 留在一起）。

准备阶段只会在上下文不可见的后缀包含被省略的 assistant 尝试、且没有未省略的会产生上下文的条目时，才把保留边界推进到该后缀中。恢复时的 `context_edit` 省略满足这条规则；本质上上下文不可见的元数据可以与它们共存。仅有元数据和新追加的自定义消息不会移动切点。影响候选输入或被摘要前缀的替换编辑也会阻止推进，因为被省略的 assistant 是对编辑前输入的回答；最终被省略的后缀条目的替换仍然是安全的。这使超出预算的已恢复输入可以被摘要，同时保留让被放弃尝试保持省略的编辑，而不会让记账行为改变新模型输入是否被逐字保留。

### CompactionEntry 结构

定义在 [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts)：

```typescript
interface CompactionEntry<T = unknown> {
  type: 'compaction';
  id: string;
  parentId: string | null;
  timestamp: string;
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  usage?: Usage; // 生成摘要的 LLM 用量
  fromHook?: boolean; // 由扩展提供时为 true（旧字段名）
  details?: T; // 实现特定的数据
}

// 默认压缩把它用于 details（来自 compaction.ts）：
interface CompactionDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

扩展可以在 `details` 中存储任何可 JSON 序列化的数据。默认压缩跟踪文件操作，但自定义扩展实现可以使用自己的结构。生成的和扩展提供的摘要会在可用时存储它们的 LLM `usage`，以便会话总量包含摘要工作。

实现见 [`prepareCompaction()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) 和 [`compact()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts)。直接以编程方式摘要时，`generateSummary()` 返回摘要文本，`generateSummaryWithUsage()` 返回 `{ text, usage }`。

## 分支摘要

### 何时触发

当你用 `/tree` 导航到另一个分支时，Pi 会提供摘要你正在离开的工作。这会把被离开分支中的上下文注入新分支。

### 工作原理

1. **找到共同祖先**：新旧位置共享的最深节点
2. **收集条目**：从旧叶子回退到共同祖先
3. **按预算准备**：在 Token 预算内包含消息（最新的优先）
4. **生成摘要**：用结构化格式调用 LLM
5. **追加条目**：在导航点保存 `BranchSummaryEntry`

```
导航之前的树：

         ┌─ B ─ C ─ D (old leaf, being abandoned)
    A ───┤
         └─ E ─ F (target)

共同祖先：A
要摘要的条目：B, C, D

带摘要导航之后：

         ┌─ B ─ C ─ D
    A ───┤
         └─ E ─ F ─ [summary of B,C,D] (new leaf)
```

### 累积文件跟踪

默认压缩和分支摘要累积跟踪文件。两者都从被摘要消息的 tool call 中提取文件操作。压缩还会携带上一个由 Pi 生成的压缩中的文件列表。分支摘要会携带它摘要的条目中由 Pi 生成的分支摘要的文件列表。

因此文件跟踪会跨默认压缩和嵌套的默认分支摘要累积。Pi 不会自动携带 `fromHook` 字段为 `true` 的扩展生成摘要的文件列表；扩展自行管理它们的 `details` 格式。

### BranchSummaryEntry 结构

定义在 [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts)：

```typescript
interface BranchSummaryEntry<T = unknown> {
  type: 'branch_summary';
  id: string;
  parentId: string | null;
  timestamp: string;
  summary: string;
  fromId: string; // 我们从哪个条目导航过来
  usage?: Usage; // 生成摘要的 LLM 用量
  fromHook?: boolean; // 由扩展提供时为 true（旧字段名）
  details?: T; // 实现特定的数据
}

// 默认分支摘要把它用于 details（来自 branch-summarization.ts）：
interface BranchSummaryDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

与压缩相同，扩展可以在 `details` 中存储自定义数据。

实现见 [`collectEntriesForBranchSummary()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)、[`prepareBranchEntries()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) 和 [`generateBranchSummary()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)。

## 摘要格式

两种格式都包含 Goal、Constraints & Preferences、Progress、Key Decisions 和 Next Steps。压缩摘要还包含 Critical Context。分支摘要到 Next Steps 就结束。相关时 Pi 会把文件列表追加到任一格式。

压缩摘要使用以下格式：

```markdown
## Goal

[What the user is trying to accomplish]

## Constraints & Preferences

- [Requirements mentioned by user]

## Progress

### Done

- [x] [Completed tasks]

### In Progress

- [ ] [Current work]

### Blocked

- [Issues, if any]

## Key Decisions

- **[Decision]**: [Rationale]

## Next Steps

1. [What should happen next]

## Critical Context

- [Data needed to continue]

<read-files>
path/to/file1.ts
path/to/file2.ts
</read-files>

<modified-files>
path/to/changed.ts
</modified-files>
```

### 消息序列化

摘要之前，消息会通过 [`serializeConversation()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/utils.ts) 序列化为文本：

```
[User]: What they said
[Assistant thinking]: Internal reasoning
[Assistant]: Response text
[Assistant tool calls]: read(path="foo.ts"); edit(path="bar.ts", ...)
[Tool result]: Output from tool
```

这防止模型把它当作一段需要继续的对话。

序列化期间工具结果会被截断到 2000 个字符。超出该限制的内容会被替换为一个标记，说明截断了多少字符。这让摘要请求保持在合理的 Token 预算内，因为工具结果（尤其是来自 `read` 和 `bash` 的）通常是上下文大小的最大贡献者。

## 通过扩展自定义摘要

扩展可以拦截并自定义压缩和分支摘要。事件类型定义见 [`extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts)。

### session_before_compact

在自动压缩或 `/compact` 之前触发。可以取消或提供自定义摘要。见类型文件中的 `SessionBeforeCompactEvent` 和 `CompactionPreparation`。

```typescript
pi.on('session_before_compact', async (event, ctx) => {
  const { preparation, branchEntries, customInstructions, reason, willRetry, signal } = event;

  // preparation.messagesToSummarize - 要摘要的消息
  // preparation.turnPrefixMessages - 用户消息区间前缀（如果 isSplitTurn）
  // preparation.previousSummary - 上一个压缩摘要
  // preparation.fileOps - 提取出的文件操作
  // preparation.tokensBefore - 压缩前的上下文 Token 数
  // preparation.firstKeptEntryId - 保留消息的起点
  // preparation.settings - 应用模型覆盖后的有效设置

  // branchEntries - 当前分支上的所有条目（用于自定义状态）
  // reason - "manual" (/compact)、"threshold" 或 "overflow"
  // willRetry - 被中止的 turn 在压缩后是否重试（溢出恢复）
  // signal - AbortSignal（传给 LLM 调用）

  // 取消：
  return { cancel: true };

  // 自定义摘要：
  return {
    compaction: {
      summary: 'Your summary...',
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      // usage: summaryResponse.usage, // 可选；计入会话总量
      details: {/* custom data */},
    },
  };
});
```

#### 把消息转换为文本

要用你自己的模型生成摘要，请用 `serializeConversation` 把消息转换为文本：

```typescript
import { convertToLlm, serializeConversation } from '@earendil-works/pi-coding-agent';

pi.on('session_before_compact', async (event, ctx) => {
  const { preparation } = event;

  // 把 AgentMessage[] 转换为 Message[]，再序列化为文本
  const conversationText = serializeConversation(convertToLlm(preparation.messagesToSummarize));
  // 返回：
  // [User]: message text
  // [Assistant thinking]: thinking content
  // [Assistant]: response text
  // [Assistant tool calls]: read(path="..."); bash(command="...")
  // [Tool result]: output text

  // 现在发送给你的模型做摘要
  const { summary, usage } = await myModel.summarize(conversationText);

  return {
    compaction: {
      summary,
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      usage,
    },
  };
});
```

使用不同模型的完整示例见 [custom-compaction.ts](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/custom-compaction.ts)。

### session_compact_failed

在手动或自动压缩失败或被中止时触发。这对需要把 `session_before_compact` 尝试与最终结果配对的遥测扩展很有用。

```typescript
pi.on('session_compact_failed', async (event, ctx) => {
  const { reason, errorMessage, aborted, willRetry, fromExtension } = event;
  // reason - "manual" (/compact)、"threshold" 或 "overflow"
  // errorMessage - 非中止失败时存在
  // aborted - 被取消/中止的压缩为 true
  // willRetry - 被中止的 turn 是否会在压缩后重试
  // fromExtension - 是否正在使用扩展提供的压缩内容
});
```

### session_before_tree

在 `/tree` 导航之前触发。无论用户是否选择摘要都会触发。可以取消导航或提供自定义摘要。

```typescript
pi.on('session_before_tree', async (event, ctx) => {
  const { preparation, signal } = event;

  // preparation.targetId - 我们要导航到的位置
  // preparation.oldLeafId - 当前位置（正在被放弃）
  // preparation.commonAncestorId - 共同祖先
  // preparation.entriesToSummarize - 会被摘要的条目
  // preparation.userWantsSummary - 用户是否选择了摘要

  // 完全取消导航：
  return { cancel: true };

  // 提供自定义摘要（仅当 userWantsSummary 为 true 时使用）：
  if (preparation.userWantsSummary) {
    return {
      summary: {
        summary: 'Your summary...',
        // usage: summaryResponse.usage, // 可选；计入会话总量
        details: {/* custom data */},
      },
    };
  }
});
```

见类型文件中的 `SessionBeforeTreeEvent` 和 `TreePreparation`。

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

| 设置               | 默认值  | 说明                       |
| ------------------ | ------- | -------------------------- |
| `enabled`          | `true`  | 启用自动压缩               |
| `reserveTokens`    | `16384` | 为 LLM 响应保留的 Token    |
| `keepRecentTokens` | `20000` | 保留（不摘要）的近期 Token |

用 `"enabled": false` 禁用自动压缩。你仍然可以用 `/compact` 手动压缩。

### 按模型覆盖

用 `compaction.modelOverrides` 为不同模型调整 Token 预算：

```json
{
  "compaction": {
    "reserveTokens": 16384,
    "keepRecentTokens": 20000,
    "modelOverrides": {
      "some-provider/big-model": {
        "reserveTokens": 400000
      }
    }
  }
}
```

对于拥有 1M 上下文窗口的模型，这个覆盖会在超过 600K Token 时触发压缩，并保留普通的 20000 个近期 Token。其他模型保持普通的 16384 Token 保留量。`reserveTokens` 也会影响摘要的输出上限，并会被模型的最大输出 Token 封顶；它不只是一个触发阈值。

键是精确、区分大小写的 `provider/modelId` 值，包括模型 ID 内的任何斜杠。每个 `reserveTokens` 和 `keepRecentTokens` 值独立回退：从模型覆盖到普通设置，再到内置默认值。值必须是非负安全整数。匹配的模型覆盖中的无效值在读取时会报错；只有省略的字段才回退到普通设置。模型覆盖条目必须是对象。即使当前模型有有效的覆盖，无效的普通 Token 设置在读取时也会报错。只有被省略的普通值才使用内置默认值。`enabled` 仍然是全局的，不按模型区分。

这些解析出的值用于手动压缩、所有自动阈值检查、溢出恢复和扩展可见的 `preparation.settings`。模型切换会影响后续的检查和压缩，但不会改变普通设置。已经进行中的压缩使用为该操作捕获的模型和设置。分支摘要设置不受影响。

覆盖在全局和项目设置中都有效。查找之前文件会递归合并，所以全局的按模型值会胜过项目级的回退；项目必须覆盖那个模型条目才能改变它。细节见[设置](settings.md#per-model-compaction-overrides)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
