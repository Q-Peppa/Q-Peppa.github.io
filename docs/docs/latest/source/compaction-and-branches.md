# 上下文压缩与会话分支

长会话会把模型窗口填满。Pi 用 **compaction** 把较早的消息收成摘要，同时保留最近几轮原文。会话本身是树：`/fork` 可以从历史节点长出新分支。本文以 **Pi v0.85.1** 为基准。

## 先分清两套实现

仓库里有两份压缩代码，读的时候不要混：

|          | coding-agent（`pi` 主路径）                  | agent harness                            |
| -------- | -------------------------------------------- | ---------------------------------------- |
| 位置     | `packages/coding-agent/src/core/compaction/` | `packages/agent/src/harness/compaction/` |
| 切割标记 | `firstKeptEntryId`                           | `retainedTail`                           |
| 调用方   | `AgentSession`                               | `AgentHarness` / 实验路径                |
| 扩展钩子 | `session_before_compact` 等                  | harness 自己的事件                       |

下面默认讲 **coding-agent**。那是你运行 `pi` 时实际走的路径。

## 压缩在做什么？

不是删除历史。JSONL 里的原始消息还在。变的是送给 LLM 的上下文：较早的部分变成一段摘要，最近的后缀保持完整。

三种触发方式：

| 触发          | 原因                                   | 压缩后是否自动重试        |
| ------------- | -------------------------------------- | ------------------------- |
| **manual**    | 用户 `/compact`                        | 否                        |
| **threshold** | 上下文超过设置阈值                     | 否                        |
| **overflow**  | 模型报窗口溢出，或可恢复的 length stop | 通常会 `willRetry = true` |

扩展事件带 `reason` 和 `willRetry`，用来区分这三种情况。

## 它在循环的哪一步发生？

有三条时机，不要只记“发送前”：

```text
1. prompt() 发送新问题之前
     └─ 上一条 assistant 已经过大，或上次生成被中断

2. 一轮工具执行完、下一轮 LLM 之前
     └─ Agent.prepareNextTurn → AgentSession._compactBeforeNextAssistantResponse()
     └─ 避免超大 tool result 先被送给模型再溢出

3. agent_end 之后的 _handlePostAgentRun()
     └─ overflow 时去掉失败的 assistant 消息，压缩，再 agent.continue()
```

第 2 条是后来补上的重要边界。阈值压缩不一定要等整段任务结束。

## prepareCompaction：找到切割点

**文件**：`packages/coding-agent/src/core/compaction/compaction.ts`

```typescript
export interface CompactionPreparation {
  firstKeptEntryId: string;
  messagesToSummarize: AgentMessage[];
  turnPrefixMessages: AgentMessage[];
  isSplitTurn: boolean;
  tokensBefore: number;
  previousSummary?: string;
  fileOps: FileOperations;
  settings: CompactionSettings;
}
```

步骤可以记成：

1. 最后一条已经是 compaction → 不再压
2. 找到上一次 compaction，作为新的历史起点
3. `findCutPoint()` 按 `keepRecentTokens` 决定后缀从哪开始
4. 切割点落在一轮中间时，前缀单独摘要（`isSplitTurn`）
5. 抽出读过/改过的文件列表，写进摘要细节

`firstKeptEntryId` 是 JSONL 里第一条被保留的条目。扩展自定义摘要时也要带着它。

## compact：生成摘要

coding-agent 的 `compact()` 不接收 `Models` 实例。它拿当前 `model`、可选 `apiKey` / `streamFn`，去调 summarizer：

```typescript
export async function compact(
  preparation: CompactionPreparation,
  model: Model<any>,
  apiKey: string | undefined,
  headers?: Record<string, string>,
  customInstructions?: string,
  signal?: AbortSignal,
  thinkingLevel?: ThinkingLevel,
  streamFn?: StreamFn,
  // ...
): Promise<CompactionResult>;
```

如果一轮被切开，会并行生成“历史摘要”和“turn prefix 摘要”，再拼成一段。

Harness 那边的 `compact(preparation, models, model, ...)` 是另一份 API，给 `AgentHarness` 用。读 `pi` 交互模式时可以先不看。

## AgentSession 里的事件

手动压缩：

```text
compaction_start { reason: "manual" }
  → session_before_compact
  → compact() 或扩展提供的摘要
  → 写入 compaction 条目
  → session_compact 或 session_compact_failed
  → compaction_end
```

自动压缩同样带 `reason`。`overflow` 且 assistant 不是正常 `stop` 时，`willRetry` 为 true，随后 `agent.continue()`。

失败或取消会发 `session_compact_failed`，里面有 `aborted`、`errorMessage`、`fromExtension`。

## 扩展钩子

```typescript
pi.on('session_before_compact', async (event, ctx) => {
  // event.reason: "manual" | "threshold" | "overflow"
  // event.willRetry
  // event.preparation.firstKeptEntryId

  return { cancel: true };
  // 或
  return {
    compaction: {
      summary: '自定义摘要...',
      firstKeptEntryId: event.preparation.firstKeptEntryId,
      tokensBefore: event.preparation.tokensBefore,
      details: {},
    },
  };
});
```

`session_compact` 在写入成功后触发。扩展可以用 `reason` 做不同 UI，或在 `willRetry` 时保存临时状态。

## 会话分支

Pi 的会话是树。每次用户从历史某处回复，都会长出新节点。`/fork` 显式从某条消息分叉。

被放弃的分支可以生成摘要，帮助用户回忆“那条路做过什么”。coding-agent 的实现在：

`packages/coding-agent/src/core/compaction/branch-summarization.ts`

结果通常包括：

- `summary`：这段分支的文字摘要
- 读过/改过的文件列表

Harness 里也有同名函数，同样是另一套调用约定。

## 会话格式：JSONL

**文件**：`packages/coding-agent/src/core/session-manager.ts`

```jsonl
{"type":"session_start","id":"abc123","cwd":"/path/to/project","timestamp":"..."}
{"type":"message","id":"...","parentId":"...","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}
{"type":"message","id":"...","parentId":"...","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}]}}
{"type":"compaction","summary":"...","firstKeptEntryId":"...","tokensBefore":10000}
```

JSONL 的好处是流式追加、崩溃后已写入的行仍然有效。仓库里还有 sqlite 等 session backend，但默认交互模式仍然是文件 JSONL。

## 设计要点

1. **压缩不是删历史。** 原文留在 session 文件里，只是不再全部送给模型。
2. **保留后缀。** 最近工作必须完整，摘要只覆盖更早的部分。
3. **工具结果过大时，在下一轮 LLM 前压。** 不要等溢出之后再补救。
4. **overflow 才自动重试。** threshold 只腾地方，由用户或后续输入继续。
5. **扩展可以取消或替换摘要。** 失败会走 `session_compact_failed`。

## 下一步

- [核心架构](architecture.md)
- [从输入到 LLM 循环](input-to-llm.md)
