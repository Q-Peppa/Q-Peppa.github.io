# RPC 模式

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/rpc) 的中文翻译。仅供学习参考。

RPC 模式把 Pi 作为长期运行的子进程运行，通过 stdin 和 stdout 上的 JSON 记录控制。它适用于与语言无关的集成、进程隔离、IDE 和自定义用户界面。

进程内的 Node.js 或 Bun 集成请优先使用 [SDK](sdk.md)。基于子进程的 TypeScript 集成请优先使用导出的 `RpcClient`，它会启动 Pi、关联响应、暴露带类型的命令方法，并把事件投递给监听器。

| 接口          | 进程边界 | 控制模型                     | 最适合                                    |
| ------------- | -------- | ---------------------------- | ----------------------------------------- |
| [SDK](sdk.md) | 进程内   | 直接的 TypeScript 方法和事件 | 想要完整 API 访问的 Node.js 或 Bun 宿主机 |
| RPC           | 子进程   | JSONL 命令、响应和事件       | 其他语言、隔离进程、IDE 或自定义客户端    |

## 启动 RPC 模式

```bash
pi --mode rpc --no-session
```

常规 CLI 选项仍然选择工作文件夹、模型、工具、资源和会话行为。常见选择包括 `--provider`、`--model`、`--name`、`--no-session` 和 `--session-dir`。完整且与版本相关的接口见[命令行](cli.md)；`pi --help` 对已安装版本是权威来源。

RPC 模式拒绝 `@file` Prompt 参数。请改通过 [`prompt`](rpc-commands.md#prompt) 命令发送 Prompt。

## 协议记录

协议有四类记录：

| 方向   | 记录         | 作用                                            |
| ------ | ------------ | ----------------------------------------------- |
| stdin  | 命令         | 让 Pi 发送 Prompt、检查状态、改变配置或管理会话 |
| stdout | `response`   | 报告某条命令是否成功，并返回该命令的数据        |
| stdout | 会话事件     | 流式输出运行、消息、工具、队列、压缩和重试活动  |
| 双向   | 扩展 UI 记录 | 在 Pi 和客户端之间转发受支持的扩展交互          |

规范的记录定义见 [RPC 命令](rpc-commands.md)、[JSON 事件流](json.md)和 [RPC 扩展 UI](rpc-extension-ui.md)。

### 关联命令和响应

每条命令都接受一个可选的字符串 `id`。匹配的响应会重复它：

```json
{"id":"req-1","type":"get_state"}
{"id":"req-1","type":"response","command":"get_state","success":true,"data":{"...":"..."}}
```

当可能有多条命令尚未完成时，请使用唯一的 ID。命令处理是异步的，所以客户端应当按照 ID 关联，而不是按响应顺序。

会话事件通常没有命令 ID，因为它们描述的是会话活动。`bash_execution_update` 是例外：当发起它的 [`bash`](rpc-commands.md#bash) 命令带 ID 时，它的输出事件会重复该 ID。

`extension_ui_response` 使用它的 `extension_ui_request` 提供的 ID。它不产生普通的命令响应。

## 分帧

RPC 使用严格的 JSONL 分帧。每条记录写一个完整的 JSON 对象，并以 LF（`\n`）结尾。把 stdout 作为字节或 UTF-8 流读取，并只在 LF 处分割记录。去掉可选的前置回车符以接受 CRLF 输入。

不要使用把 Unicode 行或段分隔符当作记录边界的通用行读取器。特别是 Node.js 的 `readline` 也会按 `U+2028` 和 `U+2029` 分割，而它们在 JSON 字符串内是合法内容。

请持续读取 stdout。Pi 会响应 stdout 背压，但停止读取的客户端会让进程停滞。写命令时请响应 stdin 背压。stdout 保留给协议记录；诊断和应用日志写到 stderr。

## 运行生命周期

成功的 `prompt` 响应表示 Prompt 已被接受、排队或处理。它不表示模型工作已完成：

```json
{"id":"req-2","type":"prompt","message":"Review this repository"}
{"id":"req-2","type":"response","command":"prompt","success":true}
```

在该响应之后请继续消费[事件](json.md)。`agent_end` 标记一次底层 Agent 运行的结束，但重试、溢出恢复、压缩、steering 或 follow-up 工作仍可能随后进行。当客户端需要知道 Pi 不会自动继续时，等待 `agent_settled`。

请在发送 Prompt 之前订阅，以免错过快速完成。`RpcClient.promptAndWait()` 内部会这样做。如果分开调用 `RpcClient`，请在 `prompt()` 之前安装事件监听器，并只在运行处于活动状态时调用 `waitForIdle()`。

## 错误

失败的命令返回一个带 `success: false` 的响应：

```json
{
  "id": "req-3",
  "type": "response",
  "command": "set_model",
  "success": false,
  "error": "Model not found: invalid/model"
}
```

格式错误的 JSON 会产生一个没有请求 ID 的解析响应：

```json
{ "type": "response", "command": "parse", "success": false, "error": "Failed to parse command: Unexpected token..." }
```

成功响应只覆盖命令处理。Prompt 被接受之后的 Provider 故障和中止会出现在消息和事件流中。

客户端还必须处理子进程启动失败、意外退出、stderr 诊断、取消以及自己的超时。不要把 stderr 当作协议数据解析。

## 关闭

关闭子进程的 stdin 以请求有序关闭。Pi 在退出前释放活动的 runtime。客户端仍应处理进程信号和意外退出。

扩展也可以通过它的扩展 context 请求关闭。Pi 在当前命令完成之后，或活动运行发出 `agent_settled` 之后完成关闭。

## 最小客户端

下面的 Python 示例使用二进制管道读取器，它按 LF 分割，而不把 Unicode 分隔符当作协议边界：

```python
import json
import subprocess

process = subprocess.Popen(
    ["pi", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
)

assert process.stdin is not None
assert process.stdout is not None

command = {"id": "prompt-1", "type": "prompt", "message": "Hello"}
process.stdin.write(json.dumps(command).encode("utf-8") + b"\n")
process.stdin.flush()

while line := process.stdout.readline():
    record = json.loads(line)
    if record.get("type") == "message_update":
        update = record["assistantMessageEvent"]
        if update["type"] == "text_delta":
            print(update["delta"], end="", flush=True)
    elif record.get("type") == "agent_settled":
        print()
        break

process.stdin.close()
process.wait()
```

对于需要维护的 TypeScript 客户端，请使用已检入的 [RPC 客户端示例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/rpc-client.ts)。它需要一个已构建的 Pi CLI，因为仓库示例指向 `dist/cli.js`。

## 参考

- [RPC 命令](rpc-commands.md)：每条 stdin 命令和响应
- [JSON 事件流](json.md)：共享的 stdout 会话事件和流式重建
- [RPC 扩展 UI](rpc-extension-ui.md)：对话框、通知、响应和限制
- [消息类型](message-types.md)：响应和事件使用的消息与内容块
- [会话文件格式](session-format.md)：会话命令返回的条目
- [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts)：导出的 TypeScript 协议定义
- [`RpcClient`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-client.ts)：子进程客户端实现

## 迁移的参考锚点

原先位于本页的详细参考现在有了专门的页面。这些锚点用于保留已有链接。

<a id="prompt"></a>
<a id="steer"></a>
<a id="follow_up"></a>
<a id="abort"></a>
<a id="clear_queue"></a>
<a id="new_session"></a>
<a id="get_state"></a>
<a id="get_messages"></a>
<a id="set_model"></a>
<a id="cycle_model"></a>
<a id="get_available_models"></a>
<a id="set_thinking_level"></a>
<a id="cycle_thinking_level"></a>
<a id="get_available_thinking_levels"></a>
<a id="set_steering_mode"></a>
<a id="set_follow_up_mode"></a>
<a id="compact"></a>
<a id="set_auto_compaction"></a>
<a id="set_auto_retry"></a>
<a id="abort_retry"></a>
<a id="bash"></a>
<a id="abort_bash"></a>
<a id="get_session_stats"></a>
<a id="export_html"></a>
<a id="switch_session"></a>
<a id="fork"></a>
<a id="clone"></a>
<a id="get_fork_messages"></a>
<a id="get_entries"></a>
<a id="get_tree"></a>
<a id="get_last_assistant_text"></a>
<a id="set_session_name"></a>
<a id="get_commands"></a>

命令细节已移到 [RPC 命令](rpc-commands.md)。

<a id="message_update-streaming"></a>
<a id="bash_execution_update"></a>
<a id="compaction_start--compaction_end"></a>
<a id="summarization_retry_scheduled--summarization_retry_attempt_start--summarization_retry_finished"></a>

事件细节已移到 [JSON 事件流](json.md)。

<a id="extension-ui-protocol"></a>

扩展交互细节已移到 [RPC 扩展 UI](rpc-extension-ui.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
