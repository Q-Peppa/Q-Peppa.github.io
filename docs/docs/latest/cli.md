<a id="cli-and-modes-reference"></a>

# 命令行

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/cli) 的中文翻译。仅供学习参考。

本页记录 Pi 内置的命令行命令和选项。运行 `pi --help`，或给某个命令加上 `--help`，可以查看你已安装版本的确切接口。顶层帮助还会包含已加载扩展注册的选项。

```sh
pi [options] [--] [@files...] [messages...]
pi install <source> [options]
pi remove <source> [options]
pi uninstall <source> [options]
pi update [target] [options]
pi list
pi config [options]
pi auth <check|print-api-key|print-bearer-token> [options]
pi mcp <list|login|logout> [options]
```

<a id="modes"></a>

## 调用与输出

```sh
pi
pi --print "Summarize this repository"
git diff | pi --print "Review this change"
pi --mode json "Inspect this repository" > events.jsonl
```

当 stdin 和 stdout 都是终端时，Pi 会打开终端 UI，除非 `--print`、`--mode json` 或 `--mode rpc` 选择了其他接口。当任一数据流被重定向且未选择 JSON 或 RPC 模式时，Pi 使用 print 模式。交互、print、JSON、RPC 和 SDK 集成之间的选择见 [CLI 集成](cli-integration.md)。

| 输入       | 行为                                    |
| ---------- | --------------------------------------- |
| `message`  | 提供初始 Prompt                         |
| `@path`    | 在第一个 Prompt 中包含文本文件或图片    |
| 管道 stdin | 把其内容前置到第一个 Prompt             |
| `--`       | 停止选项解析，使 Prompt 可以以 `-` 开头 |

Pi 从当前工作目录解析 `@path`。工作目录还控制项目配置、资源发现和会话分组。

`--print` 控制 Pi 是否运行一次后退出。`--mode` 选择输出接口。当 stdin 和 stdout 都是终端时，`--mode text` 不强制一次性执行；要这种行为请使用 `--print`。

| 选项                        | 行为                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `-p`、`--print`             | 运行指定的 Prompt，把最终 assistant 文本写到 stdout，然后退出 |
| `--mode text`               | 选择文本输出；当 stdin 和 stdout 都是终端时仍打开终端 UI      |
| `--mode json`               | 运行指定的 Prompt，把 JSONL 事件写到 stdout，然后退出         |
| `--mode rpc`                | 从 stdin 读取 JSONL 命令，并把响应和事件写到 stdout，直到关闭 |
| `--export <input> [output]` | 把会话文件导出为 HTML 后退出；省略 `output` 时推导目标路径    |

RPC 模式拒绝 `@file` 参数。JSON 和 RPC 模式把 stdout 保留给协议记录。见 [JSON 事件流](json.md)和 [RPC 协议](rpc.md)。

<a id="model-options"></a>

## 模型

```sh
pi --model sonnet:high
```

模型选择见[选择模型](models.md)，凭证见 [Provider 认证](providers.md)。

- `--provider <name>`<br>
  把 `--model` 的查找限制在一个 Provider 内。
- `--model <pattern>`<br>
  通过精确 ID 或模糊的 ID/名称匹配选择。它接受 `provider/id` 和可选的 `:<thinking>` 后缀。
- `--api-key <key>`<br>
  使用非持久的 API Key 覆盖。它需要通过 `--model` 或 `--models` 选择一个模型。
- `--thinking <level>`<br>
  设置 `off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max`。它覆盖 `--model` 的后缀，并会被限制到模型的能力范围内。
- `--models <patterns>`<br>
  为启动和循环设置逗号分隔的范围。它接受精确 ID、模糊匹配、大小写不敏感的 glob 和可选的 `:<thinking>` 后缀。
- `--list-models [search]`<br>
  列出可用模型，可选地按模糊搜索过滤，然后退出。

<a id="session-options"></a>

## 会话

```sh
pi --continue
```

恢复、fork、命名和存储会话见[会话与上下文](sessions.md)。

- `-c`、`--continue`<br>
  继续当前项目最近的会话。
- `-r`、`--resume`<br>
  打开会话选择器。
- `--session <path|id>`<br>
  按文件路径、精确 ID 或部分 ID 打开。Pi 先搜索当前项目，并为跨项目匹配提供 fork。
- `--session-id <id>`<br>
  打开精确的项目会话 ID，若不存在则创建它。ID 接受字母、数字、`.`、`_` 和 `-`。
- `--fork <path|id>`<br>
  把已有会话 fork 成当前项目的新会话。
- `--session-dir <dir>`<br>
  覆盖存储和查找位置。它的优先级高于 `PI_CODING_AGENT_SESSION_DIR` 和 `sessionDir` 设置。
- `--no-session`<br>
  使用不持久化的内存会话。
- `-n`、`--name <name>`<br>
  设置会话显示名。

约束：

- 会话 ID 必须由字母或数字开头和结尾。
- `--fork` 不能与 `--session`、`--continue`、`--resume` 或 `--no-session` 组合。
- `--session-id` 不能与 `--session`、`--continue` 或 `--resume` 组合。与 `--fork` 组合可以用它选择新的 ID。

<a id="tool-options"></a>
<a id="tools"></a>

## 工具

```sh
pi --tools read,grep,find,ls --print "Review this project"
```

配置默认工具选择见[设置](settings.md#tools)。

- `-t`、`--tools <list>`<br>
  用逗号分隔的内置、扩展或自定义工具允许列表替换默认选择。
- `-xt`、`--exclude-tools <list>`<br>
  在所有其他选择选项之后禁用逗号分隔的工具名。
- `-nbt`、`--no-builtin-tools`<br>
  禁用默认内置工具，同时保留扩展和自定义工具。
- `-nt`、`--no-tools`<br>
  启动时禁用所有内置、扩展和自定义工具。

默认启用的工具是 `read`、`bash`、`edit` 和 `write`，除非 `defaultTools` 改变了它们。`--tools` 会替换整个选择，所以要写出你想要的每个工具；`defaultTools` 还接受 `+name` 和 `-name` 来改动默认列表，而不是替换。

| 内置工具     | 作用                              |
| ------------ | --------------------------------- |
| `read`       | 读取文本文件和受支持的图片        |
| `bash`       | 运行 Shell 命令                   |
| `powershell` | 在 Windows 上运行 PowerShell 命令 |
| `edit`       | 对已有文件应用精确的文本替换      |
| `write`      | 创建或覆盖文件                    |
| `grep`       | 搜索文件内容                      |
| `find`       | 用 glob 模式查找路径              |
| `ls`         | 列出目录内容                      |

内置扩展再提供两个工具。它们默认关闭；MCP 扩展在 MCP 服务器需要它们时会打开（见 [MCP](mcp.md#exposure)）。要自己启用，在 `--tools` 或 `defaultTools` 中写出它们。

| 内置扩展      | 作用                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `codemode`    | 运行调用其他工具的 JavaScript，例如用 `Promise.allSettled` 并行调用；只有脚本的输出会到达模型          |
| `tool_search` | 搜索未向模型声明的工具（`codemode` 和 `deferred` exposure，例如 MCP 工具），并把匹配项声明给下一次调用 |

<a id="enable-codemode"></a>

### 启用 codemode

要为每个会话打开 `codemode`，把它加到 `~/.pi/agent/settings.json` 或项目 `.pi/settings.json` 的默认工具中：

```json
{
  "defaultTools": ["+codemode"]
}
```

这会保留 `read`、`bash`、`edit` 和 `write`，并加上 `codemode`。单次调用要列出每个工具，因为 `--tools` 会替换选择：

```sh
pi --tools read,bash,edit,write,codemode
```

没有 MCP 时，codemode 仍然有用：脚本可以并行运行多个 tool call、在输出到达模型前过滤大量输出，并通过 `models.classify()` 调用 TypeSafe 的 Jev 等分类器模型（见[分类器模型](models.md#use-classifier-models)）。

<a id="how-codemode-works"></a>

### codemode 如何工作

codemode 脚本在 QuickJS 沙箱中运行，只能通过 `tools.<name>(args)` 到达其他工具；`ALL_TOOLS` 列出它们。输出通过 `text(value)`、`image(dataUrlOrImageContent)`、`console.*` 以及顶层 `return value` 产生；`exit()` 提前结束脚本。结果以 `Script completed` 或 `Script failed` 开头，然后是墙钟时间和输出；失败的脚本保留部分输出，后面是 `Script error:` 和错误。

脚本可以以选项行开头，例如 `// @options: {"max_output_tokens": 2000, "timeout_ms": 60000}`。`max_output_tokens`（默认 10000）限制输出：更长的输出保留首尾，完整文本写入临时文件，路径包含在结果中。`timeout_ms` 是硬截止时间，默认未设置。

`codemode` 激活时，[设置](settings.md#tools)中的 `codemode.mode` 决定其他工具如何呈现。`on`（默认）时，已声明的工具继续声明，描述中说明如何从脚本调用它们。`only` 时，它们对模型隐藏，改列在 `codemode` 描述中，因此模型通过脚本调用它们。

`codemode` 描述用 TypeScript 声明列出可调用的工具，按 namespace 分组（例如一个 MCP 服务器）。声明共享 3000 估计 Token 的预算（[设置](settings.md#tools)中的 `codemode.inlineBudget`）；每个 namespace 仍会列出名称和工具数量，描述会说明列表是否完整。脚本用 `await searchTools(query, { limit, namespace })`（用 BM25 给工具排序）和 `await describeTool(name)` 查找其余工具，或过滤 `ALL_TOOLS`。

带 output schema 的工具解析为结构化值：`bash` 为 `{ output, truncated, full_output_path?, exit_code, wall_time_seconds }`（非零退出码也如此），MCP 工具为它们的 `CallToolResult`。其他工具解析为文本输出。`bash` 的 `output` 不受模型看到的 2000 行或 50KB 限制：最多保留 1 MiB，更长的输出在省略标记两侧保留首尾各 512 KiB，并设置 `truncated`，完整输出在 `full_output_path`。

`store(key, value)` 和 `load(key)` 在 `codemode` 调用之间保存 JSON 值：每个成功存储值的脚本会向会话追加一条 `codemode-store` 自定义条目，因此恢复的会话保留这些值，每个分支只看到自己路径上写入的值。脚本也可以使用 `models`：`getModelsOfType`、`getAvailableOfType` 和 `getModelOfType` 列出模型目录，`classify(model, context)` 用会话凭证运行分类器模型，每个脚本最多同时四个。

### 工具搜索

`tool_search` 默认关闭；用 `"defaultTools": ["+tool_search"]` 或 `--tools` 启用。它用与 `searchTools()` 相同的排序，覆盖尚未声明的工具，并把匹配项声明给下一次模型调用。已加载的工具像其他工具变更一样记入会话，因此在该分支上保持声明。

<a id="resource-options"></a>

## 资源

```sh
pi --extension ./review.ts
```

约定目录和项目信任见[配置](configuration.md)，已配置的路径见[设置](settings.md#resources)，包来源见 [Pi 包](packages.md)。

- `-e`、`--extension <path>`<br>
  加载一个扩展文件或目录，或内置扩展（例如 `builtin:mcp`），可重复。
- `-ne`、`--no-extensions`<br>
  禁用已发现、已配置和内置的扩展。显式的 `-e` 路径仍会加载，所以 `pi -ne -e builtin:mcp` 只保留内置 MCP 支持。
- `--skill <path>`<br>
  加载一个 Skill 文件或目录，可重复。
- `-ns`、`--no-skills`<br>
  禁用已发现和已配置的 Skill。显式的 `--skill` 路径仍会加载。
- `--prompt-template <path>`<br>
  加载一个 Prompt 模板文件或目录，可重复。
- `-np`、`--no-prompt-templates`<br>
  禁用已发现和已配置的模板。显式的 `--prompt-template` 路径仍会加载。
- `--theme <path>`<br>
  加载一个主题文件或目录，可重复。
- `--use-theme <name[/name]>`<br>
  为本次运行选择初始交互主题。
- `--no-themes`<br>
  禁用已发现和已配置的主题。显式的 `--theme` 路径仍会加载。
- `-nc`、`--no-context-files`<br>
  禁用 `AGENTS.md` 和 `CLAUDE.md` 的发现。

资源路径只作用于当前进程。相对路径从当前工作目录解析。

<a id="prompt-and-display-options"></a>

## Prompt 与进程

```sh
pi --append-system-prompt ./instructions.md
```

已保存的配置见[配置](configuration.md)，项目信任见[安全](security.md#understand-project-trust)，进程控制见[环境变量](environment-variables.md)。

- `--system-prompt <text|path>`<br>
  用文本或已有文件的内容替换默认系统提示。
- `--append-system-prompt <text|path>`<br>
  把文本或已有文件追加到系统提示，可重复。
- `--tui-mode <mode>`<br>
  使用 `regular` 或 `fullscreen` 终端模式。
- `--verbose`<br>
  显示详细的交互式启动信息，覆盖 `quietStartup`。
- `-a`、`--approve`<br>
  为本进程信任项目本地配置和资源。
- `-na`、`--no-approve`<br>
  为本进程忽略受信任门控的项目本地配置和资源。
- `--offline`<br>
  禁用自动网络活动，包括模型目录刷新。等价于 `PI_OFFLINE=1`。
- `-h`、`--help`<br>
  显示帮助（包括已加载扩展注册的标志），然后退出。
- `-v`、`--version`<br>
  显示 Pi 版本，然后退出。

扩展可以注册额外的长格式选项。未知的短选项会被拒绝。

## 包命令

```sh
pi install npm:@scope/package
```

来源格式、过滤、安装和项目作用域见 [Pi 包](packages.md)。

### 常见任务

| 任务               | 命令                  |
| ------------------ | --------------------- |
| 安装包             | `pi install <source>` |
| 列出已配置的包     | `pi list`             |
| 移除包及其设置条目 | `pi remove <source>`  |
| 配置加载哪些包资源 | `pi config`           |

给 `install`、`remove`、`uninstall` 或 `config` 加上 `--local` 或 `-l`，可以使用项目设置而不是全局设置。

### 更新 Pi 或包

不带目标运行 `pi update` 会更新 Pi 自身。

| 任务                     | 命令                     |
| ------------------------ | ------------------------ |
| 更新 Pi                  | `pi update`              |
| 更新所有已安装的包       | `pi update --extensions` |
| 更新一个已安装的包       | `pi update <source>`     |
| 刷新模型目录             | `pi update --models`     |
| 更新 Pi 和所有已安装的包 | `pi update --all`        |

当所选的更新包含 Pi 时，加上 `--force` 可以重新安装 Pi。

### 别名和命令选项

- `pi uninstall <source>` 是 `pi remove <source>` 的别名。
- `pi update --self`、`pi update self` 和 `pi update pi` 是 `pi update` 的别名。
- `pi update --extension <source>` 是 `pi update <source>` 的别名。
- `-a`、`--approve` 为一个命令信任项目本地文件。`-na`、`--no-approve` 忽略受信任门控的项目本地文件。
- 给命令追加 `-h` 或 `--help` 可以查看它的确切用法和选项约束。

## 凭证命令

```sh
pi auth check --provider openai --json
```

认证命令需要 `--provider <provider>` 或 `--model <model>`。受支持的方式见 [Provider 认证](providers.md)。

| 命令                         | 说明                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `pi auth check`              | 输出 `ready`、`not_ready` 或 `invalid`；分别以状态 `0`、`1` 或 `2` 退出 |
| `pi auth print-api-key`      | 输出解析出的 API Key                                                    |
| `pi auth print-bearer-token` | 输出解析出的 OAuth bearer token                                         |

| 选项                      | 适用于               | 说明                                                        |
| ------------------------- | -------------------- | ----------------------------------------------------------- |
| `--provider <provider>`   | 全部                 | 为某个 Provider 解析凭证                                    |
| `--model <model>`         | 全部                 | 从模型解析凭证；可以与 `--provider` 组合                    |
| `--json`                  | `auth check`         | 把结构化结果写成 JSON                                       |
| `--credentials`           | `auth check`         | 就绪时输出解析出的凭证                                      |
| `--no-refresh`            | `auth check`         | 不刷新已过期的 OAuth 凭证；默认会刷新                       |
| `--min-expiry <duration>` | `print-bearer-token` | 要求 Token 剩余有效期，使用 `ms`、`s`、`m` 或 `h`，如 `30m` |

输出凭证的命令会把 secret 写到 stdout。

<a id="mcp-commands"></a>

## MCP 命令

这些命令在会话之外工作，因此 agent 可以通过 `bash` 运行它们。见 [MCP 服务器](mcp.md)。

| 命令                                                   | 说明                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pi mcp add <server> [options] -- <command> [args...]` | 在 `mcp.json` 中添加或替换 stdio 服务器；`--env KEY=VALUE`（可重复）和 `--cwd <dir>` 设置环境和工作目录。命令之后的参数会传给它                                                                                              |
| `pi mcp add <server> [options] --url <url>`            | 添加或替换 streamable HTTP 服务器；`--header KEY=VALUE`（可重复）、`--bearer-token-env-var <NAME>`（发送 `Authorization: Bearer ${NAME}`）、`--oauth-client-id`、`--oauth-client-secret` 和 `--oauth-callback-port` 配置认证 |
| `pi mcp remove <server>`                               | 从 `mcp.json` 移除服务器；已存储的 OAuth 凭证会保留                                                                                                                                                                          |
| `pi mcp list [--json]`                                 | 连接每个已启用的服务器并打印状态、工具和错误；配置条目无效或已启用服务器未连接时以 `1` 退出                                                                                                                                  |
| `pi mcp login <server> [--timeout <seconds>]`          | 登录 OAuth 服务器：打开授权页并等待浏览器（默认 300 秒）；终端也可以接受粘贴的重定向 URL                                                                                                                                     |
| `pi mcp logout <server>`                               | 删除服务器已存储的 OAuth 凭证                                                                                                                                                                                                |

`add` 和 `remove` 修改 `~/.pi/agent/mcp.json`，加上 `--local`（`-l`）则修改当前目录的 `.pi/mcp.json`。`add` 还接受 `--exposure <mode>`（见 [Exposure](mcp.md#exposure)），并且不会连接；运行 `pi mcp list` 检查服务器。

项目 `.pi/mcp.json` 文件只对已经受信任的项目读取。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
