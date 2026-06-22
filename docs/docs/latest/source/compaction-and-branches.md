# 上下文压缩与会话分支

在长会话中，LLM 的上下文窗口有限。Pi 通过 **上下文压缩（compaction）** 将历史消息摘要化，从而释放 token 空间。同时，Pi 支持会话分支（fork），每个分支可以独立演化，分支摘要则帮助用户理解被放弃的路径。本文基于 **Pi v0.79.10**。

## 什么是上下文压缩？

当会话越来越长时，Pi 会把较早的消息交给一个" summarizer 模型"，生成一段摘要，然后用摘要替换掉原始消息。这样：

- 保留关键上下文
- 释放大量 token
- 让长会话能继续推进

压缩并不是把所有历史都丢掉，而是保留一个**后缀（suffix）**：最近的几轮对话保持完整，只有更早的部分被摘要替换。

## 压缩触发时机

有三种情况会触发压缩：

| 触发方式              | 原因                           | 是否自动重试           |
| --------------------- | ------------------------------ | ---------------------- |
| **手动**              | 用户输入 `/compact`            | 否                     |
| **阈值（threshold）** | 上下文 token 数超过设置阈值    | 否                     |
| **溢出（overflow）**  | LLM 返回 context overflow 错误 | 是（willRetry = true） |

v0.79.10 在 compaction 相关事件中新增了 `reason` 和 `willRetry` 字段，扩展可以通过这两个字段区分不同场景。

## 核心数据流

```
触发压缩
  │
  ▼
prepareCompaction(pathEntries, settings)
  │
  ▼
找到 cut point（切割点）
  │
  ▼
生成 CompactionPreparation
  ├── messagesToSummarize — 需要被摘要的消息
  ├── turnPrefixMessages  — 若切割点在一轮中间，需要单独摘要的前缀
  ├── firstKeptEntryId    — 保留后缀的起始条目 ID
  ├── tokensBefore        — 压缩前的 token 数
  └── previousSummary     — 上一次的摘要
  │
  ▼
触发 session_before_compact 扩展事件（可取消或提供自定义摘要）
  │
  ▼
compact(preparation, models, model, customInstructions, signal)
  │
  ▼
将摘要写入 session（JSONL 中的 compaction entry）
  │
  ▼
触发 session_compact 扩展事件
  │
  ▼
触发 compaction_end 事件
```

## prepareCompaction：找到切割点

**文件**：`packages/coding-agent/src/core/compaction/compaction.ts`

```typescript
export function prepareCompaction(
  pathEntries: SessionEntry[],
  settings: CompactionSettings,
): CompactionPreparation | undefined {
  // 1. 如果最后一条已经是 compaction，无需再压缩
  if (pathEntries.length > 0 && pathEntries[pathEntries.length - 1].type === 'compaction') {
    return undefined;
  }

  // 2. 找到上一次 compaction 的位置
  let prevCompactionIndex = -1;
  for (let i = pathEntries.length - 1; i >= 0; i--) {
    if (pathEntries[i].type === 'compaction') {
      prevCompactionIndex = i;
      break;
    }
  }

  // 3. 计算 cut point
  const cutPoint = findCutPoint(pathEntries, settings, prevCompactionIndex);

  // 4. 提取需要摘要的消息和保留后缀
  const messagesToSummarize: AgentMessage[] = [];
  for (let i = boundaryStart; i < historyEnd; i++) {
    const msg = getMessageFromEntryForCompaction(pathEntries[i]);
    if (msg) messagesToSummarize.push(msg);
  }

  // 5. 若切割点在一轮中间，提取 turn prefix
  const turnPrefixMessages: AgentMessage[] = [];
  if (cutPoint.isSplitTurn) {
    for (let i = cutPoint.turnStartIndex; i < cutPoint.firstKeptEntryId; i++) {
      const msg = getMessageFromEntryForCompaction(pathEntries[i]);
      if (msg) turnPrefixMessages.push(msg);
    }
  }

  // 6. 提取文件操作记录
  const fileOps = extractFileOperations(messagesToSummarize, pathEntries, prevCompactionIndex);

  return {
    firstKeptEntryId,
    messagesToSummarize,
    turnPrefixMessages,
    isSplitTurn: cutPoint.isSplitTurn,
    tokensBefore,
    previousSummary,
    fileOps,
    settings,
  };
}
```

### CompactionPreparation 字段

| 字段                  | 含义                               |
| --------------------- | ---------------------------------- |
| `messagesToSummarize` | 需要被摘要的历史消息               |
| `turnPrefixMessages`  | 当一轮被切分时，该轮前缀单独摘要   |
| `firstKeptEntryId`    | 保留后缀的第一条条目 ID            |
| `isSplitTurn`         | 是否切割在一轮中间                 |
| `tokensBefore`        | 压缩前的上下文 token 数            |
| `previousSummary`     | 上一次的摘要（用于增量摘要）       |
| `fileOps`             | 从消息中提取的文件操作记录         |
| `settings`            | 压缩配置（保留 token、摘要模型等） |

## compact：生成摘要

**文件**：`packages/agent/src/harness/compaction/compaction.ts`

```typescript
export async function compact(
  preparation: CompactionPreparation,
  models: Models,
  model: Model<any>,
  customInstructions?: string,
  signal?: AbortSignal,
  thinkingLevel?: ThinkingLevel,
): Promise<Result<CompactionResult, CompactionError>> {
  const {
    firstKeptEntryId,
    messagesToSummarize,
    turnPrefixMessages,
    isSplitTurn,
    tokensBefore,
    previousSummary,
    fileOps,
    settings,
  } = preparation;

  let summary: string;

  if (isSplitTurn && turnPrefixMessages.length > 0) {
    // 同时生成历史摘要和 turn prefix 摘要
    const [historyResult, turnPrefixResult] = await Promise.all([
      generateSummary(
        messagesToSummarize,
        models,
        model,
        settings.reserveTokens,
        signal,
        customInstructions,
        previousSummary,
        thinkingLevel,
      ),
      generateTurnPrefixSummary(turnPrefixMessages, models, model, settings.reserveTokens, signal, thinkingLevel),
    ]);
    summary = combineSummaries(historyResult.value, turnPrefixResult.value);
  } else {
    const result = await generateSummary(
      messagesToSummarize,
      models,
      model,
      settings.reserveTokens,
      signal,
      customInstructions,
      previousSummary,
      thinkingLevel,
    );
    summary = result.value;
  }

  return ok({
    summary,
    firstKeptEntryId,
    tokensBefore,
    estimatedTokensAfter: estimateTokens(summary),
    details: { fileOps },
  });
}
```

`generateSummary()` 会把 `messagesToSummarize` 序列化成文本，然后调用 summarizer 模型生成摘要。

## AgentSession 中的压缩事件

**文件**：`packages/coding-agent/src/core/agent-session.ts`

### 手动压缩

```typescript
async compact(customInstructions?: string): Promise<CompactionResult> {
  this._disconnectFromAgent();
  await this.abort();
  this._compactionAbortController = new AbortController();
  this._emit({ type: "compaction_start", reason: "manual" });

  // ...
  const result: CompactionResult = {
    summary,
    firstKeptEntryId,
    tokensBefore,
    estimatedTokensAfter,
    details,
  };
  this._emit({ type: "compaction_end", reason: "manual", result, aborted: false, willRetry: false });
  return result;
}
```

### 自动压缩

```typescript
private async _checkCompaction(assistantMessage: AssistantMessage, willRetry: boolean): Promise<boolean> {
  // Case 1: Overflow — LLM 返回 context overflow
  if (assistantMessage.stopReason === "error" && isContextOverflowError(assistantMessage)) {
    // 移除导致 overflow 的 assistant 消息，然后压缩并自动重试
    const messages = this.agent.state.messages;
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      this.agent.state.messages = messages.slice(0, -1);
    }
    return await this._runAutoCompaction("overflow", willRetry);
  }

  // Case 2: Threshold — 上下文超过阈值
  const contextTokens = calculateContextTokens(assistantMessage.usage);
  if (shouldCompact(contextTokens, contextWindow, settings)) {
    return await this._runAutoCompaction("threshold", false);
  }

  return false;
}
```

### 事件字段

```typescript
// compaction_start
{ type: "compaction_start", reason: "manual" | "threshold" | "overflow" }

// compaction_end
{
  type: "compaction_end",
  reason: "manual" | "threshold" | "overflow",
  result?: CompactionResult,
  aborted: boolean,
  willRetry: boolean,
  errorMessage?: string,
}
```

## 扩展钩子：session_before_compact / session_compact

扩展可以监听压缩事件，提供自定义摘要或执行额外逻辑。

### session_before_compact

```typescript
pi.on('session_before_compact', async (event, ctx) => {
  const { preparation, branchEntries, customInstructions, reason, willRetry, signal } = event;

  // reason: "manual" | "threshold" | "overflow"
  // willRetry: 压缩后是否自动重试（overflow 时为 true）

  // 取消压缩
  return { cancel: true };

  // 或提供自定义摘要
  return {
    compaction: {
      summary: '自定义摘要...',
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      details: {},
    },
  };
});
```

### session_compact

```typescript
pi.on('session_compact', async (event, ctx) => {
  // event.compactionEntry — 保存的 compaction 条目
  // event.fromExtension — 是否由扩展提供摘要
  // event.reason — 触发原因
  // event.willRetry — 是否自动重试
});
```

v0.79.10 新增 `reason` 和 `willRetry` 后，扩展可以：

- 对 `overflow` 做更激进的摘要策略
- 对 `manual` 展示不同的 UI 反馈
- 在 `willRetry = true` 时保存临时状态

## 会话分支与分支摘要

Pi 的会话是树形结构，每次用户回复都会形成新的节点。`/fork` 可以从历史任意消息创建新分支。

### 分支结构

```
session.jsonl
├── message (user)
├── message (assistant)
├── message (user)
│   └── fork A
│       ├── message (assistant)
│       └── message (user)
└── message (assistant) [当前分支]
```

### 分支摘要

当一个分支被放弃（例如 fork 出去但不再访问），Pi 可以为其生成摘要，帮助用户理解这条分支上发生了什么。

**文件**：`packages/agent/src/harness/compaction/branch-summarization.ts`

```typescript
export async function generateBranchSummary(
  entries: SessionTreeEntry[],
  options: GenerateBranchSummaryOptions,
): Promise<Result<BranchSummaryResult, BranchSummaryError>> {
  const { models, model, signal, customInstructions, reserveTokens = 16384 } = options;

  const contextWindow = model.contextWindow || 128000;
  const tokenBudget = contextWindow - reserveTokens;

  // 准备分支条目，截断到 token 预算内
  const { messages, fileOps } = prepareBranchEntries(entries, tokenBudget);

  // 序列化对话
  const conversationText = serializeConversation(convertToLlm(messages));

  // 调用 summarizer 模型
  const response = await models.completeSimple(model, context, options);

  return ok({
    summary: response.contentText,
    readFiles: fileOps.readFiles,
    modifiedFiles: fileOps.modifiedFiles,
  });
}
```

分支摘要的结果会包含：

- `summary`：分支内容的文字摘要
- `readFiles`：分支中读取过的文件
- `modifiedFiles`：分支中修改过的文件

## 会话格式：JSONL

**文件**：`packages/coding-agent/src/core/session-manager.ts`

Pi 的会话是每行一条 JSON 的格式（JSONL）：

```jsonl
{"type":"session_start","id":"abc123","cwd":"/path/to/project","timestamp":1234567890}
{"type":"message","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}
{"type":"message","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}]}}
{"type":"compaction","summary":"...","firstKeptEntryId":"...","tokensBefore":10000}
{"type":"session_end","timestamp":1234567893}
```

用 JSONL 的好处：

1. **流式写入**：不需要等会话结束才写文件
2. **崩溃恢复**：即使进程崩溃，已写入的行仍然有效
3. **增量读取**：可以继续附加，不需要重写整个文件
4. **大文件友好**：不需要一次性加载到内存

## 设计要点

1. **压缩不是删除历史**：原始消息仍保存在 session 文件中，只是从 LLM 上下文中移除。
2. **保留后缀**：最近的几轮对话保持完整，避免丢失当前工作上下文。
3. **overflow 自动重试**：遇到上下文溢出时，Pi 会移除错误消息、压缩、然后自动继续。
4. **threshold 不自动重试**：仅提示用户上下文已压缩，由用户决定是否继续。
5. **扩展可自定义摘要**：通过 `session_before_compact` 提供自己的摘要逻辑。

## 下一步

- [核心架构与设计哲学](architecture.md) — 回到高层设计模式
- [pi-ai：Models 运行时与 Provider 架构](models-runtime.md) — 压缩调用的 summarizer 模型如何被调用
