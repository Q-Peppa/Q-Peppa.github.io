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

默认启用的工具是 `read`、`bash`、`edit` 和 `write`，除非 `defaultTools` 改变了它们。

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

<a id="resource-options"></a>

## 资源

```sh
pi --extension ./review.ts
```

约定目录和项目信任见[配置](configuration.md)，已配置的路径见[设置](settings.md#resources)，包来源见 [Pi 包](packages.md)。

- `-e`、`--extension <path>`<br>
  加载一个扩展文件或目录，可重复。
- `-ne`、`--no-extensions`<br>
  禁用已发现和已配置的扩展。显式的 `-e` 路径仍会加载。
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

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
