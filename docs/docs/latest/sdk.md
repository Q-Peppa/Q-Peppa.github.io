# SDK

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/sdk) 的中文翻译。仅供学习参考。

`@earendil-works/pi-coding-agent` 把 Pi 嵌入 Node.js 或 Bun 进程。它让 TypeScript 直接访问命令行应用使用的 Agent、会话、工具、模型和资源。

进程内的 TypeScript 集成请使用 SDK。需要与语言无关或隔离的子进程时，见 [CLI 集成](cli-integration.md)。

```typescript
import { createAgentSession } from '@earendil-works/pi-coding-agent';

const { session } = await createAgentSession();

try {
  await session.prompt('What files are in the current directory?');
  console.log(session.getLastAssistantText());
} finally {
  session.dispose();
}
```

这会使用工作目录、已发现的资源、已存的设置和已配置的凭证。运行结束时 `prompt()` 兑现。

[完整最小示例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/01-minimal.ts)还会流式接收文本事件。所有 [SDK 示例](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/)都会随仓库做类型检查。

<a id="session-management"></a>

## 会话生命周期

`createAgentSession()` 创建一个 `AgentSession`。该会话拥有一段对话、它的模型和工具、排队消息、压缩状态和扩展 runtime。

通过 `session.messages`、`session.model`、`session.thinkingLevel`、`session.systemPrompt` 和 `session.getActiveToolNames()` 读取当前状态。

`session.systemPrompt` 是只读的，返回当前生效的系统提示，包括尚未发送给模型的改动。工具改动会在下次请求之前向模型声明。

<a id="sessionmanager-api"></a>

### 会话存储

会话默认持久化。`SessionManager` 拥有已持久化或内存中的条目树，并跟踪它的活动叶子。分支会改变该叶子，而不删除被放弃的分支。Pi 重建模型上下文时，管理器选择活动分支并应用压缩。

`SessionManager` 是已定稿模型上下文的权威来源。要恢复外部历史，请用包含那些条目的管理器构建会话。给 `session.agent.state.messages` 赋值不会替换已持久化的上下文。

当宿主机不需要会话文件时，使用内存管理器：

```typescript
import { createAgentSession, SessionManager } from '@earendil-works/pi-coding-agent';

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
```

创建、打开、继续、列出和 fork 会话见已检入的[会话示例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/11-sessions.ts)。[会话文件格式](session-format.md)定义持久化的 JSONL 契约，[消息类型](message-types.md)定义转录取值。确切的方法和签名请使用导出的 TypeScript 声明或 [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts)。

`cwd` 选择用于项目资源发现、上下文文件、会话分组和内置工具路径的工作区。当目标与 `process.cwd()` 不同时请显式传入它。

`session.dispose()` 会中止活动工作、让扩展 context 失效、断开与 Agent 的连接，并移除事件监听器。会话不再需要时调用它。

`AgentSessionRuntime` 增加了 `newSession()`、`switchSession()`、`fork()` 和 `importFromJsonl()`。每个操作都会替换活动的 `AgentSession`，并为目标工作目录重新创建服务。

runtime 替换之后，订阅属于旧的 `AgentSession`，必须重新绑定。见[会话 runtime 示例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/13-session-runtime.ts)。

## 发送 Prompt

`prompt()` 会处理扩展命令，并在普通用户消息进入 Agent 之前展开基于文件的 Prompt 模板。对于被接受的 Agent 运行，它在运行结束（包括自动重试）后兑现。

在会话已经在流式输出时发送的 Prompt 必须指明它应当引导当前运行还是跟随其后。不带该选择调用 `prompt()` 会被拒绝，而不是猜测。

Steering 消息在当前 assistant turn 及其 tool call 之后进入。Follow-up 在当前运行完成待处理工作之后进入。`steer()` 和 `followUp()` 直接暴露这些行为。

`abort()` 停止活动操作并等待会话进入空闲。`waitForIdle()` 等待而不中止它。

## 订阅事件

宿主机需要流式输出时，请在发送 Prompt 之前订阅：

```typescript
const unsubscribe = session.subscribe((event) => {
  if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

try {
  await session.prompt('Explain this repository');
} finally {
  unsubscribe();
}
```

会话事件报告消息更新、工具执行、队列、压缩、重试和运行生命周期变化。

`message_end` 包含权威的已完成消息。`agent_end` 标记一次底层 Agent 运行的结束，但自动恢复或排队工作仍可能随后进行。

当宿主机需要知道 Pi 不会自动继续时，使用 `agent_settled`。

## 配置会话

没有覆盖项时，工厂函数会创建一个 `ModelRuntime`、基于文件的 `SettingsManager`、持久化的 `SessionManager`、`DefaultResourceLoader` 和已配置的默认工具。

每个边界都可以显式提供：

- `modelRuntime`、`model`、`thinkingLevel` 和 `scopedModels` 控制模型访问和选择。
- `settingsManager` 提供合并后的设置或内存中的配置。
- `sessionManager` 提供持久化或内存中的对话历史。
- `resourceLoader` 提供扩展、Skill、Prompt 模板、主题和上下文文件。
- `tools`、`noTools`、`excludeTools` 和 `customTools` 控制活动工具集。

当你想要标准发现流程并附带选定的覆盖项时，使用 `DefaultResourceLoader`。当宿主机完全拥有资源存储和发现时，提供自定义 `ResourceLoader`。

<a id="inlineextension"></a>

内联扩展工厂可以通过 `DefaultResourceLoader` 提供。只有当它在诊断和启动输出中需要稳定的名称时，才给它一个 `InlineExtension` 名称。

聚焦的示例见[模型](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/02-custom-model.ts)、[工具](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/05-tools.ts)、[扩展](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/06-extensions.ts)和[完全控制](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/12-full-control.ts)。

## 示例

| 示例                                                                                                                    | 用途                              |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [最小示例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/01-minimal.ts)             | 创建、发送 Prompt、观察并释放会话 |
| [自定义模型](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/02-custom-model.ts)      | 选择模型和 thinking level         |
| [系统提示](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/03-custom-prompt.ts)       | 替换或追加系统提示                |
| [Skill](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/04-skills.ts)                 | 发现、过滤和添加 Skill            |
| [工具](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/05-tools.ts)                   | 选择内置工具及其工作目录          |
| [扩展](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/06-extensions.ts)              | 加载基于文件和内联的扩展          |
| [上下文文件](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/07-context-files.ts)     | 添加或替换项目指令                |
| [Prompt 模板](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/08-prompt-templates.ts) | 添加文件式 Prompt 模板            |
| [凭证](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts)      | 配置凭证和模型存储                |
| [设置](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/10-settings.ts)                | 提供基于文件或内存中的设置        |
| [会话](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/11-sessions.ts)                | 控制会话持久化和恢复              |
| [完全控制](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/12-full-control.ts)        | 替换默认发现和状态服务            |
| [会话 runtime](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/13-session-runtime.ts) | 安全地替换活动会话                |

<a id="exports"></a>

## 资源

- [选择模型](models.md)覆盖模型选择和兼容端点；[Provider 认证](providers.md)覆盖凭证和云 Provider 设置。
- [配置](configuration.md)说明常规发现和设置；[设置](settings.md)列出每一项设置。
- [会话与上下文](sessions.md)说明会话行为；[会话格式](session-format.md)定义持久化条目；[消息类型](message-types.md)定义共享的转录取值。
- [扩展](extensions.md)、[Skill](skills.md)和 [Prompt 模板](prompt-templates.md)记录通过 `ResourceLoader` 提供的资源。
- [CLI 集成](cli-integration.md)覆盖进程内 SDK 集成的替代方案：print、JSON 和 RPC。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
