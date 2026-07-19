# 从输入到 LLM 循环：智能体的心脏

本文档带你追踪用户输入文本后的**完整数据流**，从 TUI 编辑器到 LLM 调用，再到工具执行的循环。以 **Pi v0.80.10** 源码为基准。

## 全景图

```
用户在编辑器中输入 "帮我重构这个函数" 并按 Enter
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 阶段 A：TUI → AgentSession                               │
│ InteractiveMode.run()                                    │
│   getUserInput() → "帮我重构这个函数"                     │
│   session.prompt(userInput)                              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 阶段 B：消息预处理 (AgentSession.prompt)                  │
│   1. 检查是否斜杠命令 → 否                                │
│   2. 扩展事件触发（扩展可拦截/修改输入）                   │
│   3. 展开 skill / prompt template                         │
│   4. 通过 ModelRuntime 准备模型和认证                     │
│   5. 检查是否需要压缩（compaction）                       │
│   6. 构建 AgentMessage[]                                  │
│   7. _runAgentPrompt(messages)                            │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 阶段 C：Agent 启动 (Agent.prompt)                         │
│   normalizePromptInput() → AgentMessage[]                │
│   runPromptMessages(messages)                            │
│     → runWithLifecycle() → runAgentLoop()                │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 阶段 D：★ Agent Loop（核心循环）                           │
│                                                          │
│   while (true) { // 外层：follow-up 循环                  │
│     while (hasMoreToolCalls || pendingMessages) {        │
│                                                  │
│       ① 注入 pending messages（steer/follow-up）         │
│       ② streamAssistantResponse()                        │
│          → 通过 Models 运行时调用 LLM                    │
│       ③ 检查 stopReason                                  │
│          → error/aborted → 退出                          │
│       ④ 提取 tool calls                                  │
│          → 有 → executeToolCalls()                       │
│          → 无 → hasMoreToolCalls = false                 │
│     }                                                    │
│                                                          │
│     检查 follow-up messages                              │
│     → 有 → 设为 pending → continue 外层循环              │
│     → 无 → break，退出                                   │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
```

## 阶段 A：TUI 传递输入

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`

```typescript
async run(): Promise<void> {
  await this.init();

  // 主循环
  while (true) {
    const userInput = await this.getUserInput(); // ← 挂起等待输入
    try {
      await this.session.prompt(userInput);      // ← 输入到达
    } catch (error) {
      this.showError(errorMessage);
    }
  }
}
```

`getUserInput()` 用 Promise 挂起，编辑器提交时 resolve。

## 阶段 B：消息预处理

**文件**：`packages/coding-agent/src/core/agent-session.ts`

这是**输入到 LLM 之间最重要的关卡**。`prompt()` 方法对输入做多层处理：

### B1. 斜杠命令

```typescript
if (expandPromptTemplates && text.startsWith('/')) {
  const handled = await this._tryExecuteExtensionCommand(text);
  if (handled) return;
}
```

以 `/` 开头的输入先尝试执行扩展命令；若未被处理，再作为普通消息发送。

### B2. 扩展事件拦截

```typescript
if (this._extensionRunner.hasHandlers('input')) {
  const inputResult = await this._extensionRunner.emitInput(
    currentText,
    currentImages,
    options?.source ?? 'interactive',
    this.isStreaming ? options?.streamingBehavior : undefined,
  );
  if (inputResult.action === 'handled') return;
  if (inputResult.action === 'transform') {
    currentText = inputResult.text;
    currentImages = inputResult.images ?? currentImages;
  }
}
```

扩展可返回三种动作：

| 动作        | 效果                           |
| ----------- | ------------------------------ |
| `pass`      | 跳过，继续下一个扩展或默认流程 |
| `handled`   | 扩展已处理，不再发送给 LLM     |
| `transform` | 修改输入后继续处理             |

### B3. Skill 和 Prompt Template 展开

```typescript
if (expandPromptTemplates) {
  expandedText = this._expandSkillCommand(expandedText);
  expandedText = expandPromptTemplate(expandedText, [...this.promptTemplates]);
}
```

### B4. 流式处理检查

```typescript
if (this.isStreaming) {
  if (options.streamingBehavior === 'followUp') {
    await this._queueFollowUp(expandedText, currentImages);
  } else {
    await this._queueSteer(expandedText, currentImages);
  }
  return;
}
```

**Steer** 与 **Follow-up** 的区别：

| 行为          | 触发条件             | 效果                                          |
| ------------- | -------------------- | --------------------------------------------- |
| **Steer**     | Agent 正在工作中输入 | 当前工具执行完成后、下一次 LLM 调用前注入消息 |
| **Follow-up** | Agent 正在工作中输入 | Agent 完全完成后作为新问题排队                |

### B5. 验证模型与认证

```typescript
// 当前 coding-agent 由 ModelRuntime 统一提供模型和认证能力。
const model = this.modelRuntime.getModel(provider, modelId);
if (!model) throw new Error(`Unknown model: ${provider}/${modelId}`);
```

`ModelRuntime` 会把运行时凭证、持久化凭证、Provider 配置和 pi-ai 的认证策略组合起来：

1. runtime 覆盖（`--api-key`）
2. `auth.json` 中保存的 API key / OAuth token
3. Provider 配置中的 `apiKey`（如 `auth.json` 的 `env` 覆盖）
4. 环境变量（通过 pi-ai `envApiKeyAuth`）

详见 [项目信任与认证体系](trust-and-auth.md)。

### B6. 检查是否需要压缩

```typescript
const lastAssistant = this._findLastAssistantMessage();
if (lastAssistant && (await this._checkCompaction(lastAssistant, false))) {
  await this.agent.continue();
  while (await this._handlePostAgentRun()) {
    await this.agent.continue();
  }
}
```

压缩的触发时机包括：

- **手动**：用户输入 `/compact`
- **阈值**：上下文 token 数超过设置阈值
- **溢出**：LLM 返回 context overflow 错误

压缩事件还会携带 `reason`（`manual` / `threshold` / `overflow`）和 `willRetry`，让扩展区分手动压缩、阈值压缩与溢出重试。详见 [上下文压缩与会话分支](compaction-and-branches.md)。

### B7. 构建消息并发送

```typescript
messages = [
  {
    role: 'user',
    content: [{ type: 'text', text: expandedText }, ...(currentImages ?? [])],
    timestamp: Date.now(),
  },
];

await this._runAgentPrompt(messages);
```

## 阶段 C：Agent 启动

**文件**：`packages/coding-agent/src/core/agent-session.ts` `_runAgentPrompt` → `packages/agent/src/agent.ts` → `packages/agent/src/agent-loop.ts`

```typescript
private async _runAgentPrompt(messages: AgentMessage[]): Promise<void> {
  try {
    await this.agent.prompt(messages);
    while (await this._handlePostAgentRun()) {
      await this.agent.continue();
    }
  } finally {
    this._flushPendingBashMessages();
  }
}
```

`Agent.prompt()` 将输入归一化为 `AgentMessage[]`，然后调用 `runPromptMessages()`：

```typescript
private async runPromptMessages(messages: AgentMessage[]): Promise<void> {
  await this.runWithLifecycle(async (signal) => {
    await runAgentLoop(
      messages,
      this.createContextSnapshot(),
      this.createLoopConfig(),
      (event) => this.processEvents(event),
      signal,
      this.streamFn,
    );
  });
}
```

关键：`createLoopConfig()` 中配置的 `streamFn` 是调用 pi-ai 的入口。在 coding-agent 中，它通常闭包捕获 `ModelRuntime`，再调用 `modelRuntime.streamSimple()`；Agent Loop 不需要知道凭证存在哪里。

## 阶段 D：Agent Loop 核心循环

**文件**：`packages/agent/src/agent-loop.ts`

```typescript
async function runLoop(
  initialContext: AgentContext,
  newMessages: AgentMessage[],
  initialConfig: AgentLoopConfig,
  signal: AbortSignal | undefined,
  emit: AgentEventSink,
  streamFn?: StreamFn,
): Promise<void> {
  let currentContext = initialContext;
  let pendingMessages: AgentMessage[] = (await config.getSteeringMessages?.()) || [];

  while (true) {
    let hasMoreToolCalls = true;

    while (hasMoreToolCalls || pendingMessages.length > 0) {
      if (!firstTurn) await emit({ type: 'turn_start' });

      // 注入 pending messages
      if (pendingMessages.length > 0) {
        for (const message of pendingMessages) {
          currentContext.messages.push(message);
          newMessages.push(message);
        }
        pendingMessages = [];
      }

      // ① 调用 LLM
      const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
      newMessages.push(message);

      if (message.stopReason === 'error' || message.stopReason === 'aborted') {
        await emit({ type: 'turn_end', message, toolResults: [] });
        await emit({ type: 'agent_end', messages: newMessages });
        return;
      }

      // ② 提取 tool calls
      const toolCalls = message.content.filter((c) => c.type === 'toolCall');
      hasMoreToolCalls = false;

      if (toolCalls.length > 0) {
        const executedToolBatch = await executeToolCalls(currentContext, message, config, signal, emit);
        hasMoreToolCalls = !executedToolBatch.terminate;
        for (const result of executedToolBatch.messages) {
          currentContext.messages.push(result);
          newMessages.push(result);
        }
      }

      await emit({ type: 'turn_end', message, toolResults: executedToolBatch.messages });
    }

    // ③ 检查 follow-up
    const followUpMessages = (await config.getFollowUpMessages?.()) || [];
    if (followUpMessages.length > 0) {
      pendingMessages = followUpMessages;
      continue;
    }

    break;
  }

  await emit({ type: 'agent_end', messages: newMessages });
}
```

### streamAssistantResponse 详解

```typescript
async function streamAssistantResponse(
  context: AgentContext,
  config: AgentLoopConfig,
  signal: AbortSignal | undefined,
  emit: AgentEventSink,
  streamFn?: StreamFn,
): Promise<AssistantMessage> {
  const llmMessages = await config.convertToLlm(messages);
  const llmContext: Context = {
    systemPrompt: context.systemPrompt,
    messages: llmMessages,
    tools: context.tools,
  };

  // v0.80：streamFn 闭包通过 ModelRuntime 解析认证并调用 Provider
  const response = await streamFunction(config.model, llmContext, { signal });

  for await (const event of response) {
    switch (event.type) {
      case 'start':
      case 'text_delta':
      case 'thinking_delta':
      case 'toolcall_delta':
        partialMessage = event.partial;
        context.messages[context.messages.length - 1] = partialMessage;
        await emit({ type: 'message_update', assistantMessageEvent: event, message: { ...partialMessage } });
        break;
      case 'done':
      case 'error':
      // ...
    }
  }

  return partialMessage!;
}
```

`streamFn` 不负责设计认证优先级。它接收模型、上下文和请求选项，应用层闭包再把请求交给 `ModelRuntime`；ModelRuntime 最终调用 pi-ai Provider 的 `streamSimple()`。

### executeToolCalls 详解

```typescript
LLM 返回 ToolCall { name: "read", arguments: { path: "package.json" } }
  │
  ▼
executeToolCalls()
  │
  ├─ 1. 查找工具定义
  ├─ 2. validateToolArguments() — TypeBox schema 校验
  ├─ 3. 发出 tool_call_start 事件
  ├─ 4. 执行工具（handler）
  │     read 工具：fs.readFileSync(path, 'utf8')
  ├─ 5. 发出 tool_result 事件
  └─ 6. 返回 ToolResultMessage
```

## 循环终止条件

| 条件               | stopReason  | 行为         |
| ------------------ | ----------- | ------------ |
| LLM 正常回复完成   | `"stop"`    | 内层循环退出 |
| LLM 调用工具       | `"toolUse"` | 继续内层循环 |
| 输出超过最大 token | `"length"`  | 内层循环退出 |
| 发生错误           | `"error"`   | 直接 return  |
| 用户中断（Ctrl+C） | `"aborted"` | 直接 return  |
| 用户输入 steer     | —           | 注入后继续   |
| 用户输入 follow-up | —           | 外层循环继续 |

## 关键概念总结

| 概念                        | 解释                                     | 代码位置           |
| --------------------------- | ---------------------------------------- | ------------------ |
| **AgentSession**            | 业务逻辑中枢，处理消息预处理             | `agent-session.ts` |
| **Agent**                   | 智能体运行时，管理状态和生命周期         | `agent.ts`         |
| **runAgentLoop**            | ★ 核心循环，LLM → 工具 → 循环            | `agent-loop.ts`    |
| **streamAssistantResponse** | LLM 调用入口，处理流式事件               | `agent-loop.ts`    |
| **executeToolCalls**        | 工具执行，验证 → 执行 → 返回结果         | `agent-loop.ts`    |
| **Steer**                   | Agent 工作中注入消息，当前工具完成后生效 | `agent-session.ts` |
| **Follow-up**               | Agent 完成后排队的新消息                 | `agent-session.ts` |
| **ModelRuntime**            | 模型、Provider 与认证协调                | `model-runtime.ts` |
| **事件驱动**                | 所有状态变化通过事件通知 TUI             | `emit()` 调用      |

## 下一步

→ [核心架构与设计哲学](architecture.md) — Provider 抽象、事件流、TUI 差分渲染、扩展系统
