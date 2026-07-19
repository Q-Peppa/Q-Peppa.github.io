# 从一个最小 Agent 开始

如果只把 Agent 理解成“调用一次大模型”，很快就会迷路。我们先做一个足够小、但已经具备 Agent 核心特征的例子：它可以查看天气；如果用户没有提供城市，就先调用工具，再根据工具结果回答。

这篇文章不追求马上做出一个生产级产品。目标是建立一张可靠的心智模型：**模型负责决定下一步，程序负责提供能力并执行，循环负责把两者接起来。**

## 1. 先看普通聊天

普通聊天只有一条直线：

```text
用户问题 → LLM → 文本回答
```

```typescript
const answer = await llm.chat([{ role: 'user', content: '北京今天冷吗？' }]);
```

它能回答模型训练时知道的内容，但不能可靠地读取实时天气，也不能访问你的文件。Agent 的变化不是“模型突然会做事”，而是程序给了模型一组可以调用的工具。

## 2. 给模型一把工具

工具通常包含三部分：名字、参数规则、真正执行的函数。

```typescript
type Tool = {
  name: string;
  description: string;
  execute: (args: unknown) => Promise<string>;
};

const getWeather: Tool = {
  name: 'get_weather',
  description: '查询一个城市当前的天气',
  async execute(args) {
    const city = (args as { city: string }).city;
    return `${city}：晴，22°C`;
  },
};
```

真实项目还需要参数校验、超时、权限和错误处理。这里先把重点放在职责上：模型不能直接执行 `execute`，它只能提出一个结构化的工具请求；程序检查请求后才真正执行。

## 3. Agent 的最小循环

我们假设 LLM 返回两种结果：普通文本，或者工具调用。于是最小 Agent 只有一个循环：

```typescript
async function runAgent(question: string, tools: Tool[]) {
  const messages = [{ role: 'user', content: question }];

  while (true) {
    const response = await llm.chat(messages, {
      tools: tools.map(({ name, description }) => ({ name, description })),
    });

    if (response.type === 'text') {
      return response.text;
    }

    const tool = tools.find((item) => item.name === response.toolCall.name);
    if (!tool) throw new Error(`未知工具：${response.toolCall.name}`);

    const result = await tool.execute(response.toolCall.arguments);
    messages.push({ role: 'assistant', content: response.toolCall });
    messages.push({
      role: 'tool',
      name: tool.name,
      content: result,
    });
  }
}
```

运行过程是：

```text
用户：北京今天冷吗？
  ↓
模型：请调用 get_weather({ city: "北京" })
  ↓
程序：执行工具，得到“晴，22°C”
  ↓
模型：北京今天晴，22°C，不算冷。
```

这就是 Agent 的骨架。它并不神秘，也不等于“让模型自由执行代码”。模型提出计划，程序控制边界；每次工具执行结果都重新放回上下文，下一轮模型才能继续判断。

## 4. 为什么需要循环，而不是两次请求？

因为下一步往往取决于上一步的结果。比如“打开项目，找出登录失败的原因并修复”可能需要：

1. 读取目录和配置；
2. 搜索相关代码；
3. 读取错误处理逻辑；
4. 修改文件；
5. 运行测试；
6. 根据测试结果继续修改。

程序不知道每个项目应该先读哪个文件，也不知道测试失败后要不要改哪一行。模型可以根据上下文提出下一步，但每一步仍然要经过工具定义、参数校验和执行结果这几个程序边界。

## 5. 加上真实 Agent 必须面对的细节

最小循环能说明原理，却还不能成为一个好用的 Coding Agent。沿着下面的顺序加能力，会比一开始阅读所有源码更容易：

### 5.1 流式输出

LLM 的回答通常不是一次性返回。`text_delta`、`toolcall_delta` 等事件让界面可以边生成边显示；完整消息结束后，Agent 再决定是否执行工具。

### 5.2 多轮输入

用户可能在 Agent 工作时继续输入。输入可以成为 steer（尽快插入当前工作）或 follow-up（当前任务完成后再处理），而不是简单地丢弃。

### 5.3 工具安全

读取文件、写文件和执行命令的风险不同。一个实际的 Agent 需要确认机制、工作目录边界、参数 schema、取消信号和错误结果，而不是把任意字符串交给 shell。

### 5.4 长上下文

历史消息会超过模型窗口。Agent 需要保留最近工作的细节，把更早的部分压缩成摘要；这就是 Pi 中 compaction 存在的原因。

## 6. 对照 Pi 源码

在 Pi 中，上面的几个角色大致对应：

| 最小例子         | Pi 中的实现                      | 先看什么                                          |
| ---------------- | -------------------------------- | ------------------------------------------------- |
| `messages`       | `AgentContext` 与会话消息        | `packages/agent/src/types.ts`                     |
| `while (true)`   | `runAgentLoop()`                 | `packages/agent/src/agent-loop.ts`                |
| `tool.execute()` | `executeToolCalls()` 与工具定义  | `packages/agent/src/agent-loop.ts`                |
| `llm.chat()`     | 注入的 `streamFn`                | `packages/coding-agent/src/core/agent-session.ts` |
| 工具结果回填     | `tool_result` / Agent message    | `packages/agent/src/agent-loop.ts`                |
| 压缩历史         | compaction preparation / summary | [上下文压缩与分支](compaction-and-branches.md)    |

Pi 的重要取舍是：`Agent Loop` 不直接知道 API key，也不把具体 Provider 写死。它只需要一个能流式调用模型的 `streamFn`。coding-agent 再用 `ModelRuntime` 把模型、认证、Provider 配置和扩展接到这个接口上。

## 7. 读完后试着自己解释

如果你能回答下面三个问题，就已经掌握了 Agent 的核心：

- 为什么工具结果必须回到上下文，而不是直接显示给用户？
- 为什么模型可以提出工具调用，但程序必须负责执行和校验？
- 为什么 Agent Loop 应该通过 `streamFn` 依赖模型，而不是直接依赖某一家 API？

接下来再读 [从输入到 LLM 循环](input-to-llm.md)，你会看到这个小循环如何变成 Pi 的完整会话；再读 [核心架构与设计哲学](architecture.md)，理解 Pi 为什么把能力拆成这些边界。
