# 从输入到 LLM 循环：智能体的心脏

本文档带你追踪用户输入文本后的**完整数据流**，从 TUI 编辑器到 LLM 调用，再到工具执行的循环。

## 全景图

```
用户在编辑器中输入 "帮我重构这个函数" 并按 Enter
  │
  ▼
┌──────────────────────────────────────────────────┐
│ 阶段 A：TUI → AgentSession                        │
│ interactive-mode.ts:run()                         │
│   getUserInput() → "帮我重构这个函数"              │
│   session.prompt(userInput)                       │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│ 阶段 B：消息预处理 (AgentSession.prompt)           │
│ agent-session.ts:983                              │
│   1. 检查是否斜杠命令 → 否                         │
│   2. 扩展事件触发（扩展可拦截/修改输入）            │
│   3. 展开 skill / prompt template                  │
│   4. 验证模型和 API key                           │
│   5. 检查是否需要压缩（compaction）                │
│   6. 构建 AgentMessage[]                          │
│   7. _runAgentPrompt(messages)                    │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│ 阶段 C：Agent 启动 (Agent.prompt)                 │
│ agent.ts:327                                      │
│   normalizePromptInput() → AgentMessage[]         │
│   runPromptMessages(messages)                     │
│     → runWithLifecycle() → runAgentLoop()        │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│ 阶段 D：★ Agent Loop（核心循环）                    │
│ agent-loop.ts:155                                 │
│                                                  │
│   while (true) { // 外层：follow-up 循环           │
│     while (hasMoreToolCalls || pendingMessages) { │
│                                                  │
│       ① streamAssistantResponse()                │
│          → LLM 调用，stream 回复                  │
│                                                  │
│       ② 检查 stopReason                          │
│          → error/aborted → 退出                   │
│                                                  │
│       ③ 提取 tool calls                          │
│          → 有 → executeToolCalls()               │
│          → 无 → hasMoreToolCalls = false          │
│     }                                             │
│                                                  │
│     检查 follow-up messages                       │
│     → 有 → 设为 pending → continue 外层循环        │
│     → 无 → break，退出                            │
│   }                                              │
└──────────────────────────────────────────────────┘
```

## 阶段 A：TUI 传递输入

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`
**关键方法**：`run()`（约第 1000 行）、`getUserInput()`（第 3233 行）

```typescript
// interactive-mode.ts:1025-1035
async run(): Promise<void> {
  await this.init();

  // ... 异步后台任务、初始消息处理 ...

  // ★ 主循环
  while (true) {
    const userInput = await this.getUserInput();  // ← 挂起在这里等输入
    try {
      await this.session.prompt(userInput);        // ← 输入到达
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.showError(errorMessage);
    }
  }
}
```

`getUserInput()` 的实现（第 3233 行）是一个简单的 Promise 挂起模式：

```typescript
async getUserInput(): Promise<string> {
  return new Promise((resolve) => {
    this.onInputCallback = (text: string) => {
      this.onInputCallback = undefined;
      resolve(text);
    };
  });
}
```

当编辑器检测到 Enter 键时，调用这个回调。在此之前，编辑器一直在积累用户的按键输入。

## 阶段 B：消息预处理

**文件**：`packages/coding-agent/src/core/agent-session.ts`
**关键方法**：`prompt()`（第 983 行）

这是**输入到 LLM 之间最重要的关卡**。`prompt()` 方法对用户的输入做了多层处理：

### B1. 斜杠命令（第 989-996 行）

```typescript
// agent-session.ts:989
if (expandPromptTemplates && text.startsWith('/')) {
  const handled = await this._tryExecuteExtensionCommand(text);
  if (handled) {
    return; // 扩展命令已处理，不再发送 LLM
  }
}
```

以 `/` 开头的输入是**斜杠命令**：`/model`、`/login`、`/settings`、`/clear` 等。
这些命令在发送给 LLM 之前被拦截并本地执行。

### B2. 扩展事件拦截（第 998-1010 行）

```typescript
// agent-session.ts:998
if (this._extensionRunner.hasHandlers('input')) {
  const inputResult = await this._extensionRunner.emitInput(
    currentText,
    currentImages,
    options?.source ?? 'interactive',
    this.isStreaming ? options?.streamingBehavior : undefined,
  );
  if (inputResult.action === 'handled') return; // 扩展处理了
  if (inputResult.action === 'transform') {
    // 扩展修改了输入
    currentText = inputResult.text;
    currentImages = inputResult.images ?? currentImages;
  }
}
```

扩展可以在输入到达 LLM 之前**拦截、修改、或完全处理**它。

### B3. Skill 和 Prompt Template 展开（第 1013-1017 行）

```typescript
// agent-session.ts:1013
if (expandPromptTemplates) {
  expandedText = this._expandSkillCommand(expandedText);
  expandedText = expandPromptTemplate(expandedText, [...this.promptTemplates]);
}
```

**Skill 展开**示例：

```
用户输入：/skill:react-best-practices 如何优化这个组件？

展开后：
<skill name="react-best-practices" location="/path/to/skill.md">
References are relative to /path/to.

# React Best Practices
... (skill 的完整内容) ...
</skill>

如何优化这个组件？
```

**Prompt Template 展开**示例：

```
用户输入：/review @src/index.ts

展开后：
You are a code reviewer. Review the following code:
... (@src/index.ts 的内容) ...
```

### B4. 流式处理检查（第 1019-1030 行）

```typescript
// agent-session.ts:1019
if (this.isStreaming) {
  // Agent 正在工作中，输入作为 steer 或 follow-up 排队
  if (options.streamingBehavior === 'followUp') {
    await this._queueFollowUp(expandedText, currentImages);
  } else {
    await this._queueSteer(expandedText, currentImages);
  }
  return;
}
```

**关键概念：steer vs follow-up**

| 行为          | 触发条件             | 效果                                                |
| ------------- | -------------------- | --------------------------------------------------- |
| **Steer**     | Agent 正在工作中输入 | 在**当前工具执行完成后、下一次 LLM 调用前**注入消息 |
| **Follow-up** | Agent 正在工作中输入 | 在 Agent 完全完成后作为**新问题**排队               |

这允许用户在 LLM 工作时输入新消息（"引导"或"追问"）。

### B5. 验证与 Compaction（第 1032-1054 行）

```typescript
// agent-session.ts:1045
// 检查是否需要压缩上下文
const lastAssistant = this._findLastAssistantMessage();
if (lastAssistant && (await this._checkCompaction(lastAssistant, false))) {
  await this.agent.continue();
  while (await this._handlePostAgentRun()) {
    await this.agent.continue();
  }
}
```

**Compaction**（上下文压缩）是长会话的关键机制。当上下文接近 LLM 的 token 限制时：

1. 将历史消息发送给一个快模型进行摘要
2. 用摘要替换详细消息
3. 释放 token 空间

### B6. 构建消息并发送（第 1056-1140 行）

```typescript
// agent-session.ts:1056
messages = [];

// 添加用户消息
const userContent: (TextContent | ImageContent)[] = [{ type: 'text', text: expandedText }];
if (currentImages) {
  userContent.push(...currentImages);
}
messages.push({
  role: 'user',
  content: userContent,
  timestamp: Date.now(),
});

// ... 扩展事件、自定义消息 ...

// 最终发送
await this._runAgentPrompt(messages);
```

## 阶段 C：Agent 启动

**文件**：`packages/coding-agent/src/core/agent-session.ts`（`_runAgentPrompt`，约 933 行）
→ `packages/agent/src/agent.ts`（`prompt()`，第 327 行）
→ `packages/agent/src/agent-loop.ts`（`runAgentLoop()`，第 95 行）

```typescript
// agent-session.ts:933-941
private async _runAgentPrompt(messages: AgentMessage[]): Promise<void> {
  try {
    await this.agent.prompt(messages);          // → Agent.prompt()
    while (await this._handlePostAgentRun()) {  // 后处理
      await this.agent.continue();
    }
  } finally {
    this._flushPendingBashMessages();
  }
}
```

```typescript
// agent.ts:327-334
async prompt(input: string | AgentMessage | AgentMessage[], images?: ImageContent[]): Promise<void> {
  if (this.activeRun) {
    throw new Error("Agent is already processing...");
  }
  const messages = this.normalizePromptInput(input, images);
  await this.runPromptMessages(messages);
}
```

```typescript
// agent.ts:386-400
private async runPromptMessages(
  messages: AgentMessage[],
  options: { skipInitialSteeringPoll?: boolean } = {},
): Promise<void> {
  await this.runWithLifecycle(async (signal) => {
    await runAgentLoop(
      messages,                    // 新消息
      this.createContextSnapshot(),// 当前上下文（历史消息 + 系统提示 + 工具）
      this.createLoopConfig(),     // 循环配置（API key、模型、工具执行器等）
      (event) => this.processEvents(event), // 事件回调（用于 TUI 更新）
      signal,                      // 中止信号
      this.streamFn,              // LLM 流式函数
    );
  });
}
```

**关键**：`runPromptMessages()` 将 Agent 的状态快照和配置传递给 `runAgentLoop()`。这是 Agent 层与 LLM 层的边界。

## 阶段 D：★ Agent Loop 核心循环

**文件**：`packages/agent/src/agent-loop.ts`
**关键函数**：`runLoop()`（第 155 行起）

这是整个智能体的**心脏**。理解了它，你就理解了所有编码智能体的运作原理。

### 双层循环结构

```typescript
// agent-loop.ts:155-250（核心结构）
async function runLoop(
  initialContext: AgentContext,
  newMessages: AgentMessage[],
  initialConfig: AgentLoopConfig,
  signal: AbortSignal | undefined,
  emit: AgentEventSink,
  streamFn?: StreamFn,
): Promise<void> {
  let currentContext = initialContext;
  let config = initialConfig;
  let firstTurn = true;

  // 启动时检查是否有转向消息（用户可能在等待时输入了）
  let pendingMessages: AgentMessage[] = (await config.getSteeringMessages?.()) || [];

  // ★ 外层循环：有新 follow-up 消息时继续
  while (true) {
    let hasMoreToolCalls = true;

    // ★ 内层循环：处理工具调用
    while (hasMoreToolCalls || pendingMessages.length > 0) {
      if (!firstTurn) {
        await emit({ type: 'turn_start' });
      } else {
        firstTurn = false;
      }

      // ① 注入 pending messages（steer/follow-up）
      if (pendingMessages.length > 0) {
        for (const message of pendingMessages) {
          currentContext.messages.push(message);
          newMessages.push(message);
        }
        pendingMessages = [];
      }

      // ② 调用 LLM，stream 回复
      const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
      newMessages.push(message);

      // ③ 检查是否出错
      if (message.stopReason === 'error' || message.stopReason === 'aborted') {
        return;
      }

      // ④ 提取 tool calls
      const toolCalls = message.content.filter((c) => c.type === 'toolCall');
      hasMoreToolCalls = false;

      if (toolCalls.length > 0) {
        // ⑤ 执行工具
        const executedToolBatch = await executeToolCalls(currentContext, message, config, signal, emit);
        hasMoreToolCalls = !executedToolBatch.terminate;

        // 工具结果写入上下文
        for (const result of executedToolBatch.messages) {
          currentContext.messages.push(result);
          newMessages.push(result);
        }
      }

      await emit({ type: 'turn_end', message, toolResults: executedToolBatch.messages });
    }

    // ⑥ 检查 follow-up 消息
    const followUpMessages = (await config.getFollowUpMessages?.()) || [];
    if (followUpMessages.length > 0) {
      pendingMessages = followUpMessages;
      continue; // 继续外层循环
    }

    break; // 所有完成，退出
  }

  await emit({ type: 'agent_end', messages: newMessages });
}
```

### 单轮执行的时序图

以用户输入 `"读取 package.json 并告诉我有哪些依赖"` 为例：

```
┌─ Turn 1 ─────────────────────────────────────────┐
│                                                   │
│  streamAssistantResponse()                        │
│    ↓                                              │
│    LLM 收到：                                     │
│      System: "你是一个编码助手..."                  │
│      User: "读取 package.json 并告诉我有哪些依赖"    │
│      Tools: [read, bash, grep, find, ls, edit...] │
│                                                   │
│    LLM 回复（streaming）:                          │
│      [toolCall_start]                             │
│        name: "read"                               │
│        arguments: {"path": "package.json"}        │
│      [toolCall_end]                               │
│      [text_start]                                 │
│        好的，让我先读取 package.json...            │
│      [text_end]                                   │
│      [done] stopReason: "toolUse"                 │
│                                                   │
│  executeToolCalls()                               │
│    ↓                                              │
│    执行 read("package.json")                      │
│      ↓                                            │
│      读取文件内容，返回 ToolResult                  │
│                                                   │
│    工具结果写入 context:                           │
│      { role: "toolResult",                        │
│        toolName: "read",                           │
│        content: [{type: "text", text: "..."}] }   │
│                                                   │
│  hasMoreToolCalls = true → 继续内层循环            │
└───────────────────────────────────────────────────┘

┌─ Turn 2 ─────────────────────────────────────────┐
│                                                   │
│  streamAssistantResponse()                        │
│    ↓                                              │
│    LLM 收到：                                     │
│      System: "你是一个编码助手..."                  │
│      User: "读取 package.json 并告诉我有哪些依赖"    │
│      Assistant: [toolCall: read] + text           │
│      ToolResult: {文件内容}                        │
│                                                   │
│    LLM 回复（streaming）:                          │
│      [text_start]                                 │
│        根据 package.json，项目有以下依赖：          │
│        - typescript: ^5.0.0                       │
│        - chalk: ^4.1.2                            │
│        - ...                                      │
│      [text_end]                                   │
│      [done] stopReason: "stop"                    │
│                                                   │
│  toolCalls = [] (没有工具调用)                     │
│  hasMoreToolCalls = false → 内层循环退出            │
│  followUpMessages = [] → 外层循环退出               │
│                                                   │
│  agent_end 事件触发 → TUI 更新完成                  │
└───────────────────────────────────────────────────┘
```

### streamAssistantResponse 详解

**文件**：`packages/agent/src/agent-loop.ts`
**关键函数**：`streamAssistantResponse()`（约第 260 行）

```typescript
// agent-loop.ts: 核心逻辑
async function streamAssistantResponse(
  context: AgentContext,
  config: AgentLoopConfig,
  signal: AbortSignal | undefined,
  emit: AgentEventSink,
  streamFn?: StreamFn,
): Promise<AssistantMessage> {
  // ① AgentMessage → LLM Message（格式转换）
  const llmMessages = await config.convertToLlm(messages);

  // ② 构建 LLM Context
  const llmContext: Context = {
    systemPrompt: context.systemPrompt,
    messages: llmMessages,
    tools: context.tools,
  };

  // ③ 解析 API key（处理过期 token）
  const resolvedApiKey =
    (config.getApiKey ? await config.getApiKey(config.model.provider) : undefined) || config.apiKey;

  // ④ 调用 LLM（streaming）
  const response = await streamFunction(config.model, llmContext, {
    ...config,
    apiKey: resolvedApiKey,
    signal,
  });

  // ⑤ 处理流式事件
  for await (const event of response) {
    switch (event.type) {
      case 'start':
        partialMessage = event.partial;
        context.messages.push(partialMessage);
        break;

      case 'text_delta':
      case 'thinking_delta':
      case 'toolcall_delta':
        partialMessage = event.partial;
        context.messages[context.messages.length - 1] = partialMessage;
        await emit({ type: 'message_update', assistantMessageEvent: event, message: { ...partialMessage } });
        break;

      case 'done':
        // 流结束
        break;

      case 'error':
        // 错误处理
        break;
    }
  }

  return partialMessage!;
}
```

**关键设计**：LLM 的回复是**流式的**（SSE，Server-Sent Events）。每个 delta 事件都会：

1. 更新 `partialMessage`（累积的助手消息）
2. 更新 `context.messages` 中的最后一条消息
3. 发出 `message_update` 事件 → TUI 收到后实时更新显示

这就是为什么你能看到 LLM 的输出**逐字出现**，而不是等全部生成完才显示。

### executeToolCalls 详解

**文件**：`packages/agent/src/agent-loop.ts`
**关键函数**：`executeToolCalls()`（约第 350 行）

工具执行的流程：

```
LLM 返回 ToolCall { name: "read", arguments: { path: "package.json" } }
  │
  ▼
executeToolCalls()
  │
  ├─ 1. 查找工具定义
  │     const tool = config.tools.find(t => t.name === "read")
  │
  ├─ 2. 验证参数（TypeBox schema 校验）
  │     validateToolArguments(tools, toolCall)
  │     → 如果校验失败，返回错误作为 toolResult
  │
  ├─ 3. 发出 tool_call_start 事件（TUI 显示 "📖 读取文件"）
  │
  ├─ 4. 执行工具
  │     const handler = config.getToolHandler(toolCall.name)
  │     const result = await handler(toolCall.arguments, signal)
  │
  │     read 工具的实现:
  │       const content = fs.readFileSync(path, 'utf8')
  │       return { type: "text", text: content }
  │
  ├─ 5. 发出 tool_result 事件（TUI 显示输出）
  │
  └─ 6. 返回 ToolResultMessage
        { role: "toolResult", content: [{type: "text", text: "..."}] }
```

**内置工具列表**（`packages/coding-agent/src/core/tools/`）：

| 工具        | 文件           | 功能                 |
| ----------- | -------------- | -------------------- |
| `read`      | `read.ts`      | 读取文件内容         |
| `write`     | `write.ts`     | 创建或覆盖文件       |
| `edit`      | `edit.ts`      | 精确文本替换         |
| `edit-diff` | `edit-diff.ts` | 基于 diff 的补丁应用 |
| `bash`      | `bash.ts`      | 执行 Shell 命令      |
| `grep`      | `grep.ts`      | 文件内容搜索         |
| `find`      | `find.ts`      | 文件名搜索           |
| `ls`        | `ls.ts`        | 列出目录             |

## 循环终止条件

Agent Loop 在以下情况下退出：

| 条件               | stopReason  | 退出层级         |
| ------------------ | ----------- | ---------------- |
| LLM 正常回复完成   | `"stop"`    | 内层循环退出     |
| LLM 调用工具       | `"toolUse"` | 继续内层循环     |
| 输出超过最大 token | `"length"`  | 内层循环退出     |
| 发生错误           | `"error"`   | 直接 return      |
| 用户中断（Ctrl+C） | `"aborted"` | 直接 return      |
| 用户输入 steer     | —           | steer 注入后继续 |
| 用户输入 follow-up | —           | 外层循环继续     |

## 关键概念总结

| 概念                        | 解释                                     | 代码位置                              |
| --------------------------- | ---------------------------------------- | ------------------------------------- |
| **AgentSession**            | 业务逻辑中枢，处理消息预处理             | `agent-session.ts`                    |
| **Agent**                   | 智能体运行时，管理状态和生命周期         | `agent.ts`                            |
| **runAgentLoop**            | ★ 核心循环，LLM → 工具 → 循环            | `agent-loop.ts:155`                   |
| **streamAssistantResponse** | LLM 调用入口，处理流式事件               | `agent-loop.ts:260`                   |
| **executeToolCalls**        | 工具执行，验证 → 执行 → 返回结果         | `agent-loop.ts:350`                   |
| **Steer**                   | Agent 工作中注入消息，当前工具完成后生效 | `agent-session.ts:steer()`            |
| **Follow-up**               | Agent 完成后排队的新消息                 | `agent-session.ts:followUp()`         |
| **Compaction**              | 上下文压缩，释放 token 空间              | `agent-session.ts:_checkCompaction()` |
| **事件驱动**                | 所有状态变化通过事件通知 TUI             | `emit()` 调用                         |

## 下一步

→ [核心架构与设计哲学](architecture.md) — Provider 抽象、差分渲染、扩展系统
