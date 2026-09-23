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

| 能力                                | 主要 API                                       |
| ----------------------------------- | ---------------------------------------------- |
| 观察或修改生命周期行为              | `pi.on()`                                      |
| 添加模型可调用的操作                | `pi.registerTool()`                            |
| 添加 `/` 命令                       | `pi.registerCommand()`                         |
| 添加快捷键或 CLI 标志               | `pi.registerShortcut()` 或 `pi.registerFlag()` |
| 发送用户消息或自定义消息            | `pi.sendUserMessage()` 或 `pi.sendMessage()`   |
| 持久化非上下文会话数据              | `pi.appendEntry()`                             |
| 改变活动工具、模型或 thinking level | `pi` 上的会话控制方法                          |
| 添加模型 Provider                   | `pi.registerProvider()`                        |
| 添加终端渲染                        | 渲染器注册和 `ctx.ui`                          |
| 与其他扩展通信                      | `pi.events`                                    |

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

示例见 [`hello.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/hello.ts)、[`todo.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/todo.ts)、[`dynamic-tools.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/dynamic-tools.ts) 和 [`truncated-tool.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/truncated-tool.ts)。

### 动态激活工具

先注册所有工具，让可选工具保持不活动，再从某个加载器工具调用 `pi.setActiveTools()` 选择想要的活动工具。名称必须已经注册；未知名称会被忽略。

Pi 在转录的第一条系统消息中记录初始 Prompt 和工具集，然后在下次模型请求之前追加工具和 Prompt 的改动。无法表示这种转换的 Provider 会收到一份完整的转录检查点，这可能让缓存的 prefix 失效。

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
