# CLI 集成

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/cli-integration) 的中文翻译。仅供学习参考。

默认情况下，运行 `pi` 会打开交互式终端界面。当输入或输出被管道或重定向时，Pi 改用 print 模式。你也可以为脚本和应用程序显式选择 print、JSON 或 RPC 模式。

四种模式使用相同的 Agent、会话、资源和工具。模式决定输入如何进入 Pi、输出如何暴露，以及进程是否保持可用以接收更多命令。

SDK 不是一种 CLI 模式。它把 Agent 直接嵌入 Node.js 或 Bun 进程。当直接用 TypeScript 访问比进程边界更合适时，见 [SDK](sdk.md)。

## 选择模式

| 模式   | 接口                   | 生命周期     | 适用场景                      |
| ------ | ---------------------- | ------------ | ----------------------------- |
| 交互式 | 终端 UI                | 直到用户退出 | 由人直接与 Pi 协作            |
| Print  | stdout 上的最终文本    | 单次调用     | 脚本需要最终的 assistant 回复 |
| JSON   | stdout 上的 JSONL 事件 | 单次调用     | 进程需要某次运行的结构化进度  |
| RPC    | JSONL 命令、响应和事件 | 长期运行     | 进程需要双向控制              |

CLI 选项仍然独立于模式选择工作目录、模型、工具、资源和会话持久化。完整的启动选项见[命令行](cli.md)。

## 输出到 stdout

Print 模式运行指定的 Prompt，把最终的 assistant 文本写到 stdout，然后退出：

```bash
pi --print "Summarize the changes in this repository"
```

只在需要最终文本时使用 print 模式，包括命令替换、管道和一次性任务。中间事件不会暴露。

Print 模式把错误写到 stderr。最终 assistant 回复的 stop reason 为 `error` 或 `aborted` 时，会产生非零退出状态。

没有显式选择模式时，非 TTY 的 stdin 或 stdout 也会选择 print 模式。这样无需添加 `--print` 就能使用管道输入输出。

## 流式输出 JSON 事件

JSON 模式先写一条会话 header，然后以换行分隔的 JSON 写出 Agent 和会话事件：

```bash
pi --mode json "Review this repository" > events.jsonl
```

这是结构化事件输出，不是单个 JSON 结果，也不约束模型回复的格式。

所有 Prompt 在进程启动时提供。进程为该次运行流式输出事件，然后退出；它不接受后续命令。

失败或中止的 assistant 回复会出现在事件流中，但本身不会产生非零退出状态。成败重要时请检查事件。如果调用抛出错误，Pi 仍会以非零状态退出。

流式的 `message_update` 记录包含的是增量，而不是不断增长的消息快照。请用增量事件拼装实时输出，然后用来自 `message_end` 的权威消息替换它。

`agent_end` 之后可能还有自动恢复或排队工作。`agent_settled` 标记当前运行自动工作的结束。

stdout 保留给 JSONL。诊断和应用日志写到 stderr。分帧、事件结构和重建规则见 [JSON 事件流](json.md)。

## 用 RPC 控制 Pi

RPC 模式让 Pi 保持运行，同时另一个进程发送命令并接收响应和事件：

```bash
pi --mode rpc --no-session
```

命令是写入 stdin 的 JSON 对象。响应和事件是写到 stdout 的 JSON 对象。每条记录占一行。

需要关联的命令请加上 `id`。匹配的响应会重复该 ID。事件通常没有命令 ID，因为它们描述的是会话活动而不是某一次请求。

成功的 `prompt` 响应表示 Prompt 已被接受、排队或处理。它不表示该次运行完成。完成与否重要时，请继续消费事件直到 `agent_settled`。

RPC 命令可以更换模型、检查状态、管理会话、运行 Shell 命令，以及回应扩展 UI 请求。

扩展对话框构成一个请求-响应子协议。其他扩展 UI 更新是客户端可以显示或忽略的通知。仅 TUI 的扩展能力在交互模式之外不可用或会降级。

对于 Node.js 或 TypeScript 集成，优先使用 `@earendil-works/pi-coding-agent` 的 `RpcClient`。它会启动一个 Pi RPC 子进程、关联请求、暴露带类型的命令方法，并把会话事件投递给监听器。

[RPC 客户端示例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/rpc-client.ts)发送一个 Prompt，流式接收文本和工具活动，等待 `agent_settled`，然后关闭子进程。它包含在仓库的 TypeScript 检查中。

`RpcClient.promptAndWait()` 在发送 Prompt 之前安装它的事件监听器，避免与快速完成竞争。对于分开的操作，请在调用 `prompt()` 之前订阅，并只在运行处于活动状态时调用 `waitForIdle()`。

客户端需要一个可运行的 Pi CLI 路径。仓库示例指向 `dist/cli.js`，所以从检出目录运行该示例之前必须先构建该包。

如果你要在没有 `RpcClient` 的情况下构建客户端，请先从 [RPC 协议](rpc.md)入手，然后把 [RPC 命令](rpc-commands.md)和 [JSON 事件流](json.md)作为线上格式参考。

## Fork 并重命名 Pi

源码 fork 可以通过 `package.json` 改变 CLI 名称和配置目录：

```json
{
  "piConfig": {
    "name": "my-agent",
    "configDir": ".my-agent"
  }
}
```

修改顶层 `bin` 字段可以设置可执行文件名。这些设置会影响 CLI banner、配置路径和派生出的环境变量名。

## 示例与参考

- [RPC 客户端](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/rpc-client.ts)：带类型的 Node.js 集成
- [RPC 扩展 UI](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/rpc-extension-ui.ts)：带扩展对话框的自定义终端客户端
- [命令行](cli.md)：启动选项和模式选择
- [JSON 事件流](json.md)：JSON 事件参考
- [RPC 协议](rpc.md)：RPC 生命周期、分帧、错误和关闭
- [RPC 命令](rpc-commands.md)：命令和响应参考
- [RPC 扩展 UI](rpc-extension-ui.md)：扩展交互子协议
- [SDK 示例](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/)：进程内的 TypeScript 集成

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
