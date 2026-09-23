# 配置 Shell 命令

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/shell-aliases) 的中文翻译。仅供学习参考。

Pi 为每条 Bash 命令启动一个单独的非交互 Shell 进程。非交互 Bash 默认不展开别名，通常也不会加载与交互终端相同的启动文件。

用 `shellPath` 选择 Bash 可执行文件，用 `shellCommandPrefix` 在每条命令之前运行设置。

## 了解 Pi 使用哪个 Shell

| 命令来源                         | Shell                                           |
| -------------------------------- | ----------------------------------------------- |
| 模型调用内置 `bash` 工具         | Pi 解析出的 Bash 可执行文件                     |
| 你输入 `!command` 或 `!!command` | 同一个解析出的 Bash 可执行文件                  |
| 模型调用可选的 `powershell` 工具 | PowerShell 7（`pwsh.exe`）或 Windows PowerShell |
| 扩展提供或替换 Shell 工具        | 该扩展实现的操作                                |

Pi 通常用 `bash -c` 调用 Bash。在 Unix 系统上，它先使用 `/bin/bash`，再使用 `PATH` 上的 `bash`，最后在 Bash 不可用时使用 `sh`。原生 Windows 先检查配置的路径，然后是 Git Bash，最后是 `PATH` 上的 `bash.exe`。

## 选择 Bash 可执行文件

当 Pi 应当使用特定可执行文件时，在 `~/.pi/agent/settings.json` 中设置 `shellPath`：

```json
{
  "shellPath": "~/.local/bin/bash"
}
```

在 Windows 上使用正斜杠或转义反斜杠：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

修改设置后运行 `/reload`。原生 Windows 的默认值见[在 Windows 上运行 Pi](windows.md)。

## 在每条 Bash 命令之前运行设置

设置 `shellCommandPrefix`，把 Shell 设置前置到内置 `bash` 工具和用户输入的 `!` 或 `!!` 命令：

```json
{
  "shellCommandPrefix": "export CI=1"
}
```

Pi 用换行连接前缀和请求的命令。前缀会为每条命令重新运行，所以请保持它快速且不含交互式提示。

## 启用 Bash 别名

把 Pi 需要的别名存放在 Bash 兼容文件中，而不要去解析整个交互式 Shell 配置。

创建 `~/.bash_aliases`：

```bash
alias ll='ls -la'
alias gs='git status --short'
```

然后配置 Pi 启用别名展开并加载该文件：

```json
{
  "shellCommandPrefix": "shopt -s expand_aliases\nsource ~/.bash_aliases"
}
```

运行 `/reload`，然后通过 Pi 验证别名：

```text
!ll
```

该命令应产生与 `ls -la` 相同的列表。

别名必须使用 Bash 兼容语法。不要把任意 `.zshrc` source 进 Bash，因为 zsh 的选项、函数和插件在其中可能无法解析或行为不正确。

## 排查问题

### 前缀对 `!` 生效，但对扩展工具不生效

`shellCommandPrefix` 配置的是 Pi 内置的 Bash 执行。替换 `bash` 工具或自行提供 Shell 操作的扩展控制自己的设置。请查阅该扩展的文档。

### 找不到 `shopt`

Pi 已回退到 `sh`，或 `shellPath` 指向非 Bash 的 Shell。使用 `shopt` 等 Bash 专有设置之前，请安装 Bash，或把 `shellPath` 设为 Bash 可执行文件。

### 某条设置命令等待输入

从 `shellCommandPrefix` 中移除交互式命令。前缀会在每条 Bash 命令之前，在非交互进程中运行。

完整的设置定义见 [Shell 设置](settings.md#shell)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
