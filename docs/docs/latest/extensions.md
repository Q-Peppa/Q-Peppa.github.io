# 扩展

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/extensions) 的中文翻译。仅供学习参考。

扩展是给 Pi 添加可执行行为的 TypeScript 模块。当工作流需要工具、命令、事件处理器、模型 Provider、会话状态或终端 UI，而不只是指令时，使用扩展。

扩展在 Pi 进程内运行，拥有相同的操作系统权限。它可以检查 Prompt、tool call、文件、凭证和会话历史，所以只从你信任的来源加载扩展。

典型的扩展会添加 agent 工具、保护路径、确认危险命令、响应会话事件、修改上下文、暴露命令，或显示常驻状态。

<a id="quick-start"></a>
<a id="writing-an-extension"></a>
<a id="create-an-extension"></a>

## 创建并加载扩展

扩展导出一个默认工厂函数，它接收 `ExtensionAPI`。工厂函数为当前扩展 runtime 注册能力。

创建 `~/.pi/agent/extensions/hello.ts`：

```typescript
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

export default function (pi: ExtensionAPI) {
  pi.registerCommand('hello', {
    description: 'Show a greeting',
    handler: async (name, ctx) => {
      ctx.ui.notify(`Hello, ${name || 'world'}!`, 'info');
    },
  });
}
```

启动 Pi 并运行 `/hello`。开发期间可以直接加载文件：

```bash
pi --extension ./hello.ts
```

Pi 使用 `jiti`，所以本地 TypeScript 扩展不需要单独的编译步骤。分发扩展和依赖请使用 [Pi 包](packages.md)。

<a id="extension-locations"></a>
<a id="available-imports"></a>
<a id="choose-where-it-loads"></a>

## 加入 Pi

把扩展放在你的用户或项目扩展目录中。Pi 加载直接的 TypeScript 或 JavaScript 文件，以及包含 `index.ts` 或 `index.js` 入口点的子目录。

小扩展用单个文件，多文件实现用目录。把 npm 依赖放在附近的 `package.json` 中。约定位置见[配置](configuration.md)，其他路径见[设置](settings.md#resources)。

重新加载会替换扩展 runtime，所以 `await ctx.reload()` 之后的代码不能复用旧 runtime 的状态。只有个人扩展和显式的命令行扩展可以参与 `project_trust` 事件，该事件在项目扩展加载之前运行。

<a id="understand-the-lifecycle"></a>

## 遵循 runtime 生命周期

工厂函数可以是同步或异步的。Pi 会等待异步工厂函数完成后再继续启动，这使它能够获取配置或注册启动期间需要的 Provider。

不要在工厂函数中启动进程、socket、watcher 或定时器，因为有些调用会在不启动会话的情况下加载扩展。

请从 `session_start` 启动长生命周期资源，或从需要它们的命令或工具中启动。

从幂等的 `session_shutdown` 处理器中关闭会话级资源。

一次运行的流程是：从输入和 `before_agent_start`，经过模型、消息和工具事件，到 `agent_end`。

自动重试、恢复、压缩或排队工作可能在此后继续。

<a id="agent_start--agent_end--agent_before_settle--agent_settled"></a>

`agent_before_settle` 是最后一个可操作的边界：它可以追加条目并请求一次继续。

`agent_settled` 是最终的、仅通知的边界；当某个集成需要知道 Pi 不会自动继续时使用它。

<a id="extensionapi-methods"></a>

## 选择集成点

| 能力                                | 主要 API                                         |
| ----------------------------------- | ------------------------------------------------ |
| 观察或修改生命周期行为              | `pi.on()`                                        |
| 添加模型可调用的操作                | `pi.registerTool()`                              |
| 添加 `/` 命令                       | `pi.registerCommand()`                           |
| 添加快捷键或 CLI 标志               | `pi.registerShortcut()` 或 `pi.registerFlag()`   |
| 发送用户消息或自定义消息            | `pi.sendUserMessage()` 或 `pi.sendMessage()`     |
| 持久化非上下文会话数据              | `pi.appendEntry()`                               |
| 改变活动工具、模型或 thinking level | `pi` 上的会话控制方法                            |
| 添加模型 Provider                   | `pi.registerProvider()`                          |
| 添加 MCP 服务器                     | `pi.registerMcpServer()`                         |
| 把每次请求路由到一个模型            | [`pi.registerVirtualModel()`](virtual-models.md) |
| 添加终端渲染                        | 渲染器注册和 `ctx.ui`                            |
| 与其他扩展通信                      | `pi.events`                                      |

确切的 event、context、tool 和 result 类型请参考 [`extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts) 中导出的声明。

## 遵循扩展契约

<a id="events"></a>
<a id="work-with-events"></a>

### 事件与并发

处理器按扩展加载和注册顺序运行。`pi.on()` 返回一个函数，用于取消该注册；改动不会影响已经在进行的分发。

有些事件只做通知；另一些会转换数据、替换结果或取消操作。

请使用每个事件声明的结果类型，不要假定任何返回值都有作用。

事件覆盖资源发现、会话、Agent 与消息生命周期、Provider、工具和原始输入。

`before_agent_start` 同时暴露当前 Prompt 和它的结构化 `systemPromptOptions`。请优先修改 Prompt 的分段、选中的工具或准则，让 Pi 能够追加转录增量。返回 `systemPrompt` 或设置 `forceSystemPrompt` 会为该次运行替换整个 Prompt，而转录会继续记录结构化分段。Provider 把强制的文本作为其开头的系统提示收到。

`message_end` 可以在保留角色不变的情况下替换已定稿的消息。`tool_call` 可以修改输入或阻止执行。`tool_result` 处理器会叠加，每个处理器都能看到之前的改动。

<a id="provider_stream_event"></a>

`provider_stream_event` 在 Pi 规范化之前，为每个已解析的 Provider 流事件触发。该事件标识 Provider、API 和模型；`event.data` 是 Pi 能拿到的最早结构化值，不一定是原始 HTTP 字节或 SSE 帧。把它当作只读，因为改动可能影响规范化。该事件仅通知，不会持久化。

处理器按流顺序 await，所以慢的处理器会延迟流消费。处理器错误会被报告，但不改变 Provider 响应。见 [`debug-provider.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/debug-provider.ts)，它是一个可选的查看器，按 assistant 消息分组原始事件。

<a id="context_with_system"></a>

`context` 转换对话消息，但不包括 Prompt 和工具的系统消息；Pi 之后会恢复该状态。只有当某次请求本地的转换必须接管完整转录时，才使用 `context_with_system`，并让索引零处保留一条系统消息。

`turn_end` 和 `agent_before_settle` 是可操作的边界。它们的处理器可以串联提议的 `custom`、`custom_message`、`context_edit` 或 `compaction` 条目，并返回 `continue: true` 以进行一次后续模型请求。请为继续条件加防护，因为无条件继续会形成循环。完整的校验和排序契约见导出的 event 声明。

<a id="cache_warming_decision"></a>

`cache_warming_decision` 可以用 `{ action: "warm" }` 或 `{ action: "stop" }` 覆盖空闲 Prompt 缓存刷新。最后一个返回动作的处理器胜出。

来自同一条 assistant 消息的 tool call 可以并行运行。

当另一个工具事件运行时，不要假定存在同批的调用或结果。

请用 `ctx.signal` 处理由活动 turn 拥有的嵌套工作；命令和空闲会话事件通常没有操作 signal。

返回 `undefined` 的 `user_bash` 处理器会把命令传给下一个处理器，如果没有处理器处理它，再交给本地执行。返回 `operations` 或 `result` 会停止传播。处理器失败会阻止该命令，而不会落到本地执行。

<a id="custom-tools"></a>
<a id="register-tools"></a>

### 工具

自定义工具定义名称、面向模型的描述、TypeBox 参数 schema 和 `execute()` 函数。

它的结果需要面向模型的 `content`，以及用于渲染或状态重建的 `details` 字段。

没有结构化 details 时使用 `details: undefined`。如果该工具发起嵌套模型调用，请把它们的 `usage` 包含在结果中，以便会话总量保持准确。

从 `execute()` 中抛出异常会生成失败的工具结果。

返回对象不会把它标记为错误。

只有当该批次中每个已完成的工具都同意终止、agent 应当跳过自动 follow-up 时，才返回 `terminate: true`。

当工具共享可变的内存状态时，使用顺序执行。

修改文件的工具应当用 `withFileMutationQueue()` 包住完整的读-改-写操作。

请截断过大的面向模型的结果，并告诉模型去哪里读取完整输出。

当结果是数据时，声明 `outputSchema` 并返回匹配的 `structuredContent`。模型仍会收到 `content`；codemode 脚本等程序化调用方收到 `structuredContent` 而不是文本。没有 `outputSchema` 的工具以文本内容传给脚本。要报告仍带数据的失败，返回带 `isError: true` 的结果而不是抛出：模型看到错误，脚本仍收到 `structuredContent`。

工具可以用 `ctx.executeTool(name, args, { signal, onUpdate })` 运行其他工具。嵌套调用会像模型发出的调用一样经过参数校验以及 `tool_call` 和 `tool_result` 处理器，并发出 `tool_execution_start`、`tool_execution_update` 和 `tool_execution_end`；这些事件都带 `parentToolCallId`，它们的 `toolCallId` 由 pi 赋为 `<parent id>/<n>`。这些 id 不会作为 tool call 或工具结果出现在转录中。嵌套调用不添加转录条目：结果只到达调用方工具，由它自己报告，例如通过 `onUpdate` 和 `details`。会话保留它们的有界记录（名称、参数、状态、时长、错误；从不包含结果）作为调用方工具结果消息上的 `nestedCalls`。它用于压缩文件列表，并显示在 HTML 导出中。每个调用超过 8 KiB 或每个工具结果超过 32 KiB 的参数会被省略，最多保留 256 次调用，`complete: false` 标记丢失了任何内容的记录。任意深度的嵌套结果 `usage` 会加到调用方工具的结果 `usage` 上，因此一个工具只报告自己的用量，不包括它调用的工具。`ctx.tools` 列出 `ctx.executeTool()` 能调用的工具。改写 `content` 的 `tool_result` 处理器也应替换 `structuredContent`；只替换 `content` 会丢掉它。

示例见 [`hello.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/hello.ts)、[`todo.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/todo.ts)、[`dynamic-tools.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/dynamic-tools.ts) 和 [`truncated-tool.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/truncated-tool.ts)。

<a id="tool-exposure"></a>

### 工具暴露

`exposure` 控制模型如何到达一个工具。"可调用"指可以通过 `ctx.executeTool()`（`ctx.tools`）从其他工具调用，`codemode` 工具的脚本就是这样做的：

- `direct`（默认）：激活时向模型声明，激活时可调用。
- `model-only`：激活时向模型声明，永不可调用。用于编排其他工具或询问用户的工具。
- `codemode`：只要已注册就可调用，并由 `codemode` 工具列出。除非显式激活，否则不向模型声明。
- `deferred`：类似 `codemode`，但 codemode 工具不列出它；`tool_search` 可以查找并激活它。
- `hidden`：已注册但不可达。用 `exposure: "hidden"` 重新注册一个工具来撤回它，因为工具无法注销。

`namespace: { name, description, instructions }` 把相关工具分组，MCP 服务器就是这样做的。codemode 工具把一个 namespace 列在同一个标题下，并带上它的 `description`。`instructions` 存放更长的用法说明；它不会列出，codemode 脚本用 `describeNamespace(name)` 读取。

注册 `direct` 或 `model-only` 工具会激活它；其他 exposure 在注册时不激活。活动集（`pi.getActiveTools()`、`pi.setActiveTools()`）是向模型声明的工具集。`pi.getAllTools()` 报告每个工具的 `exposure`、`namespace` 和 `annotations`。

`annotations` 是关于工具做什么的提示，含义与 MCP 工具 annotations 相同：`readOnlyHint`、`destructiveHint`、`idempotentHint` 和 `openWorldHint`。MCP 工具携带服务器声明的提示。缺失的提示取 MCP 默认值：工具不是只读的，可能有破坏性并到达开放世界。这些提示未经验证，但权限扩展可以用它们决定确认哪些调用。下面会确认 Codex 要求批准的调用：

```typescript
pi.on('tool_call', async (event, ctx) => {
  const hints = pi.getAllTools().find((tool) => tool.name === event.toolName)?.annotations;
  const needsApproval =
    hints?.destructiveHint === true ||
    (!hints?.readOnlyHint && ((hints?.destructiveHint ?? true) || (hints?.openWorldHint ?? true)));
  if (needsApproval && !(await ctx.ui.confirm('Allow tool call?', event.toolName))) {
    return { block: true, reason: `${event.toolName} was not approved` };
  }
});
```

编排其他工具的工具可以用 `prepareLoadout(loadout)` 在自己激活时调整模型看到的内容。它在活动工具变更时运行，收到已声明的工具、可调用的工具，以及每个已注册工具及其 exposure 和 namespace。它返回已声明工具（包括自己）的替换 `descriptions`，以及 `hiddenDeclarations`：请求中省略声明、但仍保持活动且可调用的活动工具。`codemode` 只用这个 hook、`exposure` 和 `ctx.executeTool()`，因此另一个工具可以用不同名称实现相同行为。

### 动态激活工具

先注册所有工具，让可选工具保持不活动，再从某个加载器工具调用 `pi.setActiveTools()` 选择想要的活动工具。名称必须已经注册；未知名称会被忽略。

Pi 在转录的第一条系统消息中记录初始 Prompt 和工具集，然后在下次模型请求之前追加工具和 Prompt 的改动。无法表示这种转换的 Provider 会收到一份完整的转录检查点，这可能让缓存的 prefix 失效。

<a id="tool-rendering"></a>

### 工具渲染

工具的 `renderCall` 和 `renderResult` 负责在交互式转录和 HTML 导出中绘制工具的调用。`pi.registerToolRenderer((toolName, next) => renderers)` 可以为任意工具的调用挑选渲染器，包括尚未注册的工具，例如恢复的会话中服务器还没连上的 MCP 工具。`next()` 返回其余解析器（按扩展加载顺序）以及已注册工具会用的结果，所以 `next() ?? mine` 只做补充。

<a id="mcp-servers"></a>

### MCP 服务器

`pi.registerMcpServer(name, config)` 为当前会话添加一个 MCP 服务器。`config` 的形状与 [`mcp.json`](mcp.md) 中的 `mcpServers` 条目相同：stdio 服务器用 `command`、`args`、`env` 和 `cwd`，HTTP 服务器用 `url`、`headers` 和 `oauth`，另外还有 `exposure`、`toolExposure`、`description`、`enabled` 和 `timeout`。

```typescript
pi.registerMcpServer('jira', { url: 'https://mcp.example.com/jira', exposure: 'codemode' });
pi.unregisterMcpServer('jira');
```

扩展加载时注册的服务器会在会话启动时与 `mcp.json` 中的服务器一起连接；之后注册的服务器立即连接，`pi.unregisterMcpServer()` 关闭连接并使该服务器的工具不可达。注册不会保存：每次加载都要重新注册，例如根据扩展自己的设置。`mcp.json` 中的同名服务器优先，`/mcp` 会显示覆盖。再次注册同一名称会替换该扩展先前的注册；其他扩展已注册的名称、无效名称和无效配置会抛出。

内置 MCP 支持会连接已注册的服务器。当没有东西连接时（因为另一个扩展替换了它，见 [MCP](mcp.md#other-mcp-extensions)），每次注册都会报告为扩展错误。其他 MCP 扩展也可以连接已注册的服务器：在 `session_start` 上用 `pi.getMcpServers()` 读取它们，并处理 `mcp_servers_change` 事件以应对后续变更。

<a id="extensioncontext"></a>
<a id="extensioncommandcontext"></a>
<a id="use-extension-context"></a>

### 上下文与会话变更

`ExtensionContext` 提供工作目录、模式、UI、会话管理器、模型 runtime、中止 signal、上下文用量，以及压缩和关闭的控制方法。

用 `ctx.modelRegistry.streamSimple()` 发起与 Provider 无关的嵌套模型调用。

命令处理器收到 `ExtensionCommandContext`，它增加了等待空闲、重新加载、树导航和会话替换的操作。

这些操作仅限命令使用，因为从生命周期处理器中调用它们会让 runtime 死锁。

会话替换会让旧 context 失效。切换之前只捕获普通数据，然后使用 `withSession` 提供的新 context 处理与会话绑定的工作。

<a id="state-management"></a>
<a id="persist-state"></a>

### 状态

根据状态如何参与对话来选择存储：

| 状态                           | 存储                 |
| ------------------------------ | -------------------- |
| 跟随活动分支的工具状态         | 工具结果的 `details` |
| 排除在模型上下文之外的持久数据 | `pi.appendEntry()`   |
| 存储并发送给模型的自定义内容   | `pi.sendMessage()`   |
| 单个会话之外的数据             | 外部存储             |

在 `session_start` 期间用 `ctx.sessionManager.getBranch()` 重建对分支敏感的状态。

不要从每个文件条目重建它，因为被放弃的分支代表的是另外的历史。

当自定义的已存内容应当出现在转录中时，注册条目或消息渲染器。

<a id="custom-ui"></a>
<a id="mode-behavior"></a>
<a id="interact-with-the-user"></a>
<a id="account-for-each-mode"></a>

### UI 与模式

`ctx.ui` 提供对话框、通知、状态文本、widget、标题、编辑器访问和自定义组件。

只有当交互需要自己的渲染和输入时，才使用 `ctx.ui.custom()`。

组件、焦点、overlay、主题和性能指引见[终端 UI](tui.md)。

扩展会在交互、RPC、JSON 和 print 模式下加载。

交互模式提供完整的终端 UI。

RPC 可以通过 [RPC 扩展 UI 协议](rpc-extension-ui.md)转发支持的对话框和通知，但不支持自定义终端组件；JSON 和 print 模式没有 UI。

用 `ctx.mode === "tui"` 守住仅终端的行为，用 `ctx.hasUI` 判断交互式和 RPC 客户端支持的交互。

请让工具和事件行为独立于渲染，使非交互模式仍然可用。

<a id="error-handling"></a>
<a id="handle-errors-and-shutdown"></a>

### 错误与清理

Pi 会报告处理器错误，并尽可能继续。`tool_call` 处理器失败会作为故障保护阻止该工具；工具执行失败会成为给模型的错误结果。

即使正常操作尝试过清理，也要在 `session_shutdown` 中释放资源。

请让清理保持幂等，因为取消、重新加载、会话替换和进程退出可能汇聚到同一条路径。

用 `ctx.shutdown()` 请求有序关闭进程。

<a id="examples-reference"></a>
<a id="use-examples-as-the-implementation-reference"></a>

## 示例与参考

已检入的[扩展示例](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/)覆盖工具、生命周期事件、命令、标志、快捷键、状态、渲染、Provider、OAuth、远程执行和终端组件。

请从与你的集成点匹配的最小示例开始。

模型服务集成见[自定义 Provider](custom-provider.md)，自定义组件见[终端 UI](tui.md)，安装或与其他资源一起分发扩展见 [Pi 包](packages.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
