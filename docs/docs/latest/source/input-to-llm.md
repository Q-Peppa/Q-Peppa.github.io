# 从输入到 LLM 循环：智能体的心脏

本文追踪用户按下 Enter 之后的完整数据流。以 **Pi v0.85.1** 源码为基准。

## 全景图

```
用户输入 "帮我重构这个函数"
  │
  ▼
InteractiveMode.run()
  getUserInput() → session.prompt(text)
  │
  ▼
AgentSession.prompt()
  1. 斜杠命令？扩展命令直接执行
  2. input 扩展事件（可拦截或改写）
  3. 展开 skill / prompt template
  4. 若正在流式输出 → steer 或 follow-up 排队
  5. ModelRuntime 检查模型和认证
  6. 必要时先 compaction
  7. 触发 before_agent_start
  8. _runAgentPrompt(messages)
  │
  ▼
Agent.prompt() → runAgentLoop()
  │
  ▼
while (true) {                  // 外层：follow-up
  while (工具或 steer 还在) {    // 内层：一轮 LLM + 工具
    prepareNextTurn?            // 例如工具结果过大，先压缩
    streamAssistantResponse()
    有 tool call → executeToolCalls()
  }
  有 follow-up → 继续
}
```

## 阶段 A：TUI 把输入交给会话

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`

```typescript
while (true) {
  const userInput = await this.getUserInput();
  await this.session.prompt(userInput);
}
```

业务逻辑不在 TUI 里。TUI 负责编辑器、渲染和快捷键；`AgentSession` 负责“这条输入到底该干什么”。

## 阶段 B：`AgentSession.prompt()`

**文件**：`packages/coding-agent/src/core/agent-session.ts`

### B1. 斜杠命令

以 `/` 开头的输入会先查扩展注册的命令。命中则立即执行，不再发给 LLM。扩展命令如果自己要调用模型，会走 `pi.sendMessage()`。

### B2. `input` 事件

```typescript
const processedInput = await this._runInputHandlers(text, images, source, streamingBehavior);
if (!processedInput) return; // action === "handled"
```

| 动作        | 效果                       |
| ----------- | -------------------------- |
| `pass`      | 继续默认流程               |
| `handled`   | 扩展已经处理，不再发给 LLM |
| `transform` | 改写 text/images 后继续    |

### B3. Skill 和模板

```typescript
expandedText = this._expandSkillCommand(expandedText);
expandedText = expandPromptTemplate(expandedText, [...this.promptTemplates]);
```

`/skill:name` 会把 skill 文件包进 `<skill>...</skill>` 再送给模型。

### B4. Steer 与 Follow-up

Agent 正在工作时，新输入不能直接再开一个 `prompt()`。必须声明排队方式：

| 行为          | 时机                              | 效果                   |
| ------------- | --------------------------------- | ---------------------- |
| **Steer**     | 当前工具执行完、下一次 LLM 调用前 | 插入到正在进行的工作里 |
| **Follow-up** | 整段 Agent 跑完之后               | 作为下一个问题         |

未指定 `streamingBehavior` 会抛错，避免悄悄丢消息。

### B5. 模型与认证

```typescript
const hasConfiguredAuth =
  this._modelRuntime.hasConfiguredAuth(this.model.provider) ||
  (await this._modelRuntime.checkAuth(this.model.provider)) !== undefined;
```

没有凭证时，OAuth Provider 会提示重新 `/login`；API key Provider 走 `auth-guidance.ts` 的说明。

### B6. 发送前压缩

如果上一条 assistant 消息已经把窗口撑满，或上次生成被中断，`prompt()` 会先 `_checkCompaction()`。这里**不会**立刻 `agent.continue()`，因为用户的新问题马上要发出去。

另外还有一条更晚的路径：工具执行完、下一轮 LLM 之前，`prepareNextTurn` 可能再次压缩。这样大工具结果不会先被送给模型再溢出。详见 [上下文压缩与分支](compaction-and-branches.md)。

### B7. `before_agent_start`

扩展可以在这里改系统提示、改工具集，或插入 custom 消息。然后 `_runAgentPrompt(messages)` 把控制权交给 `Agent`。

## 阶段 C：Agent 启动循环

**文件**：`packages/coding-agent/src/core/sdk.ts`、`packages/agent/src/agent.ts`

coding-agent 创建的是 `new Agent({ streamFn, convertToLlm, ... })`，不是 `AgentHarness`。

`streamFn` 闭包住 `ModelRuntime`：

```typescript
streamFn: async (model, context, options) => {
  return modelRuntime.streamSimple(model, context, {
    ...options,
    timeoutMs,
    transformHeaders: async (headers) => {
      return headerRunner?.emitBeforeProviderHeaders(headers) ?? headers;
    },
  });
};
```

超时、重试、请求头和扩展的 `before_provider_request` 都在这一层合并。Agent Loop 仍然只看到“给我一个 stream”。

`Agent.prompt()` 把输入归一成 `AgentMessage[]`，再调用 `runAgentLoop()`。

## 阶段 D：`runAgentLoop`

**文件**：`packages/agent/src/agent-loop.ts`

循环的骨架还是“LLM → 工具 → 再 LLM”，但现在多了几条真实边界：

```typescript
async function runLoop(...) {
  let pendingMessages = (await config.getSteeringMessages?.()) || [];

  while (true) {
    let hasMoreToolCalls = true;

    while (hasMoreToolCalls || pendingMessages.length > 0) {
      // 上一轮结束后：允许 prepareNextTurn（压缩、刷新系统提示/工具）
      // 再注入 steer
      const message = await streamAssistantResponse(...);

      if (message.stopReason === "error" || message.stopReason === "aborted") {
        return;
      }

      const toolCalls = message.content.filter((c) => c.type === "toolCall");
      if (toolCalls.length > 0) {
        const executed =
          message.stopReason === "length"
            ? await failToolCallsFromTruncatedMessage(toolCalls, emit)
            : await executeToolCalls(...);
        hasMoreToolCalls = !executed.terminate;
      }

      if (await config.shouldStopAfterTurn?.(...)) return;
      pendingMessages = (await config.getSteeringMessages?.()) || [];
    }

    const followUp = (await config.getFollowUpMessages?.()) || [];
    if (followUp.length > 0) {
      pendingMessages = followUp;
      continue;
    }
    break;
  }
}
```

几个容易漏掉的细节：

1. **`streamFn` 是必参。** 循环不再自己猜该调用哪家 API。
2. **`stopReason === "length"` 时不执行工具。** 参数可能被截断，全部失败并回填错误，而不是拿半截 JSON 去改文件。
3. **`prepareNextTurn` 发生在下一轮 LLM 之前。** coding-agent 用它做阈值压缩，并刷新当前工具清单。
4. **工具增减会写成 system 消息。** `declareToolChanges()` 让模型看到当前真正能调用的工具。

### 流式响应

`streamAssistantResponse()` 先 `convertToLlm()`，再 `normalizeContext()`，然后调用 `streamFn`。它处理的是统一事件：`start`、`text_delta`、`thinking_delta`、`toolcall_delta`、`done`、`error`。

Agent 层对外发出的事件是：

```text
agent_start / agent_end
turn_start / turn_end
message_start / message_update / message_end
tool_execution_start / tool_execution_update / tool_execution_end
```

`compaction_*`、`auto_retry_*`、`queue_update`、`agent_settled` 属于 **AgentSession 事件**，不要到 `agent-loop.ts` 里找它们。

## 循环何时结束

| 条件                  | 行为                     |
| --------------------- | ------------------------ |
| LLM 正常结束且无工具  | 内层循环退出             |
| LLM 调用工具          | 执行工具，继续内层循环   |
| 输出触达 token 上限   | 工具调用全部失败，不执行 |
| `error` / `aborted`   | 直接结束                 |
| steer                 | 插入后继续               |
| follow-up             | 外层循环再开一轮         |
| `shouldStopAfterTurn` | 强制结束                 |

`AgentSession` 在 `agent_end` 之后还会看：要不要自动重试、要不要溢出压缩、扩展有没有在 `agent_end` 里又塞了消息。这些走 `_handlePostAgentRun()` + `agent.continue()`。

## 关键概念

| 概念                  | 解释                           | 代码位置           |
| --------------------- | ------------------------------ | ------------------ |
| **AgentSession**      | 产品层：命令、扩展、压缩、会话 | `agent-session.ts` |
| **Agent**             | 运行时：状态、队列、生命周期   | `agent.ts`         |
| **runAgentLoop**      | LLM → 工具循环                 | `agent-loop.ts`    |
| **streamFn**          | 把循环接到 ModelRuntime        | `sdk.ts`           |
| **Steer / Follow-up** | 工作中插入 vs 完成后再问       | `agent-session.ts` |
| **prepareNextTurn**   | 下一轮 LLM 前的压缩和工具刷新  | `agent-session.ts` |

## 下一步

→ [核心架构与设计哲学](architecture.md) — 为什么这样拆，以及仓库里还有哪些先不要读的部分
