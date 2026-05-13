# Compaction（压缩）与 Branch Summarization（分支摘要）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/compaction) 的中文翻译。仅供学习参考。

Pi 有两种摘要机制：

- **Compaction**（压缩）：当上下文超过阈值时触发，或通过 `/compact` 手动触发。总结旧消息以释放上下文空间。
- **Branch Summarization**（分支摘要）：由 `/tree` 导航触发。在切换分支时保留上下文。

两种机制使用相同的结构化摘要格式，并累积跟踪文件操作。

## Compaction（压缩）

### 触发时机

自动压缩在 `contextTokens > contextWindow - reserveTokens` 时触发。默认 `reserveTokens` 为 16384 Token。手动触发使用 `/compact [instructions]`。

### 工作原理

1. **找到切割点**：从最新消息向后遍历，累积 Token 估算，直到达到 `keepRecentTokens`（默认 20k）
2. **提取消息**：收集从上次保留边界（或会话开始）到切割点的消息
3. **生成摘要**：调用 LLM 使用结构化格式进行总结
4. **追加条目**：保存一个包含摘要和 `firstKeptEntryId` 的 `CompactionEntry`
5. **重新加载**：会话使用摘要加上从 `firstKeptEntryId` 开始的消息重新加载

### 切割点规则

有效切割点包括：用户消息、助手消息、BashExecution 消息和自定义消息。工具结果**永远不能**作为切割点——它们必须与工具调用保持在一起。

### CompactionEntry 结构

```typescript
interface CompactionEntry<T = unknown> {
  type: "compaction";
  id: string;
  parentId: string;
  timestamp: number;
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  fromHook?: boolean;
  details?: T;
}
```

## Branch Summarization（分支摘要）

### 触发时机

使用 `/tree` 导航到不同分支时，Pi 会提示总结当前工作，将上下文注入新分支。

### 工作原理

1. **找到公共祖先**：新旧位置之间最深的共享节点
2. **收集条目**：从旧叶节点回溯到公共祖先
3. **准备预算**：包含直到 Token 预算的消息
4. **生成摘要**：使用 LLM 生成结构化摘要
5. **追加条目**：在导航点保存 `BranchSummaryEntry`

### BranchSummaryEntry 结构

```typescript
interface BranchSummaryEntry<T = unknown> {
  type: "branch_summary";
  id: string;
  parentId: string;
  timestamp: number;
  summary: string;
  fromId: string;
  fromHook?: boolean;
  details?: T;
}
```

## 摘要格式

两种机制使用相同的结构化格式：

```
## Goal

## Constraints & Preferences
- 

## Progress
### Done
- [x] 
### In Progress
- [ ] 
### Blocked
- 

## Key Decisions
- **[Decision]**: [Rationale]

## Next Steps
1. 

## Critical Context
- 

<read-files>
path/to/file1.ts
</read-files>

<modified-files>
path/to/changed.ts
</modified-files>
```

## 通过扩展自定义摘要

### session_before_compact

在自动压缩或 `/compact` 之前触发。可以取消或提供自定义摘要。

### session_before_tree

在 `/tree` 导航前触发。可以取消导航或提供自定义摘要。

## 设置

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

| 设置项 | 默认值 | 说明 |
|---|---|---|
| `enabled` | `true` | 启用自动压缩 |
| `reserveTokens` | `16384` | LLM 响应保留的 Token |
| `keepRecentTokens` | `20000` | 保留的最近 Token（不压缩） |

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
