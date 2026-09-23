# 在 Windows 上运行 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/windows) 的中文翻译。仅供学习参考。

Pi 可以原生运行在 Windows 进程中，也可以运行在 Windows Subsystem for Linux（WSL）中。原生 Windows 默认使用 Git Bash 执行 Bash 命令，也可以选择把 PowerShell 提供给模型。WSL 中的 Pi 使用 Linux 环境及其 Bash 安装。

安装和认证 Pi 请遵循主[快速开始](quickstart.md)。本页用于选择和配置它的命令环境。

## 选择原生 Windows 还是 WSL

| 环境                               | 命令环境                                                 | 适用场景                                    |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| 带 Git Bash 的原生 Windows         | 内置 `bash` 工具和 `!` 命令使用 Git Bash                 | 你的文件和开发工具主要在 Windows 上         |
| 带 `powershell` 工具的原生 Windows | 模型的 tool call 使用 PowerShell；Bash 仍可用于 `!` 命令 | 任务依赖 PowerShell 模块或 Windows 原生命令 |
| WSL                                | 所选 WSL 发行版中的 Linux Bash 和工具                    | 你的文件和工具链本来就位于 Linux 或 WSL 中  |

## 在原生 Windows 上使用 Git Bash

对大多数原生 Windows 用户来说，安装 [Git for Windows](https://git-scm.com/download/win) 就够了。

Pi 按以下顺序解析 Bash：

1. `~/.pi/agent/settings.json` 中的 `shellPath`
2. `Program Files` 或 `Program Files (x86)` 下的 Git Bash
3. `PATH` 上的 `bash.exe`，包括 Cygwin、MSYS2 或旧的 WSL Bash

启动 Pi 并输入下面的命令来验证 Shell：

```text
!printf 'Bash is working\n'
```

如果 Pi 找不到 Bash，它会报告检查过的位置。请安装 Git for Windows、把其他 Bash 可执行文件加入 `PATH`，或配置 `shellPath`。

## 让模型使用 PowerShell

可选的 `powershell` 工具在有 `pwsh.exe` 时通过它运行命令，否则回退到 Windows PowerShell。它以 `-NoProfile -NonInteractive -ExecutionPolicy Bypass` 启动 PowerShell。管理员强制执行的执行策略仍可能优先。

要把面向模型的 `bash` 工具替换为 `powershell`，把下面的内容加入 `~/.pi/agent/settings.json`：

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

重启 Pi，然后让它运行一条无害的 PowerShell 命令。`!` 和 `!!` 编辑器命令仍然使用 Bash。`powershell` 工具只在 Pi 作为原生 Windows 进程运行时可用。

其他工具组合见[设置](settings.md#tools)。

## 使用自定义 Bash 可执行文件

当 Bash 安装在 Pi 无法自动发现的位置时，设置 `shellPath`：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

JSON 用反斜杠表示转义序列。写带反斜杠的 Windows 路径时，每个反斜杠要写两遍，如上所示。

命令前缀、别名和完整的 Shell 解析行为见[配置 Shell 命令](shell-aliases.md)。

## 配置 Windows Terminal

Windows Terminal 会保留或重写一些修饰键。配置 `Shift+Enter` 和 `Alt+Enter` 见 [Windows Terminal](terminal-setup.md#windows-terminal)，Pi 在 Windows 和 WSL 上的默认快捷键见[快捷键](keybindings.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
