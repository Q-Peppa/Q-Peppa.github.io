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
2. `%ProgramFiles%\Git\bin\bash.exe` 处的 Git Bash
3. `%ProgramFiles(x86)%\Git\bin\bash.exe` 处的 Git Bash
4. `PATH` 上的 `bash.exe`，包括 Cygwin、MSYS2 或旧的 WSL Bash

启动 Pi 并输入下面的命令来验证 Shell：

```text
!printf 'Bash is working\n'
```

如果 Pi 找不到 Bash，它会报告检查过的位置。请安装 Git for Windows、把其他 Bash 可执行文件加入 `PATH`，或配置 `shellPath`。

## 让模型使用 PowerShell

可选的 `powershell` 工具在有 `pwsh.exe` 时通过它运行命令，否则回退到 Windows PowerShell。它以 `-NoProfile -NonInteractive -ExecutionPolicy Bypass` 启动 PowerShell。管理员强制执行的执行策略仍可能优先。

PowerShell 发现按以下顺序检查这些位置：

1. `PATH` 上的 `pwsh.exe`
2. `%ProgramFiles%\PowerShell\7\pwsh.exe`
3. `PATH` 上的 `powershell.exe`
4. `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`

要把面向模型的 `bash` 工具替换为 `powershell`，把下面的内容加入 `~/.pi/agent/settings.json`：

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

`["-bash", "+powershell"]` 效果相同，同时保留你配置的其他默认工具。

重启 Pi，然后让它运行一条无害的 PowerShell 命令。`!` 和 `!!` 编辑器命令仍然使用 Bash。`powershell` 工具只在 Pi 作为原生 Windows 进程运行时可用。

其他工具组合见[设置](settings.md#tools)。

<a id="wsl"></a>

## WSL

Windows 上的 WSL 路径转换，以及 WSL 中额外的 Git 分支轮询，识别的是 `/mnt/<drive>`，不是自定义挂载根。

从 Windows 使用旧版 WSL `bash.exe` 启动器时，Pi 通过 stdin 发送命令，以避免命令行引号问题。

## 使用自定义 Bash 可执行文件

当 Bash 安装在 Pi 无法自动发现的位置时，设置 `shellPath`：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

JSON 用反斜杠表示转义序列。写带反斜杠的 Windows 路径时，每个反斜杠要写两遍，如上所示。

命令前缀、别名和完整的 Shell 解析行为见[配置 Shell 命令](shell-aliases.md)。

<a id="choose-a-terminal"></a>

## 选择终端

Windows 终端通过控制台宿主（conhost）运行 Pi。有的捆绑了最新副本，有的使用 Windows 内置的较旧版本，后者有影响 Pi 的 bug。

推荐 [Windows Terminal](https://aka.ms/terminal)。它始终带最新的 conhost，Pi 也主要用它测试。

最后更新：2026 年 10 月。

| 终端                                                                                                                                          | Conhost                                                                                    | 状态                      |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------- |
| [Windows Terminal](https://aka.ms/terminal)                                                                                                   | 捆绑，当前版本                                                                             | 推荐                      |
| [VS Code](https://code.visualstudio.com)、[Tabby](https://tabby.sh)、[WezTerm](https://wezterm.org) nightly                                   | 捆绑，当前版本                                                                             | 可用                      |
| [Alacritty](https://alacritty.org)                                                                                                            | 内置，除非 Windows Terminal 的 `conpty.dll` 和 `OpenConsole.exe` 放在 `alacritty.exe` 旁边 | 只有放了这些文件才可用    |
| WezTerm 20240203 及更旧                                                                                                                       | 捆绑，旧版本                                                                               | [已知问题](#known-issues) |
| 经典控制台（没有 Windows Terminal 的 `cmd.exe` 或 PowerShell）、mintty（Git Bash）、ConEmu、Cmder、[Hyper](https://hyper.is)、Windows OpenSSH | 内置                                                                                       | [已知问题](#known-issues) |

## 配置 Windows Terminal

Windows Terminal 会保留或重写一些修饰键。配置 `Shift+Enter` 和 `Alt+Enter` 见 [Windows Terminal](terminal-setup.md#windows-terminal)，Pi 在 Windows 和 WSL 上的默认快捷键见[快捷键](keybindings.md)。

<a id="known-issues"></a>

## 已知问题

这些问题来自 conhost。Microsoft 已在源码中修复，但没有说明内置 conhost 何时会得到这些修复。

| 问题                                                                                                                                                                                             | 影响                                                  | 处理办法                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------ |
| 从全屏切到常规模式，或在全屏中按 `Ctrl+G`，会话崩溃（[#9186](https://github.com/earendil-works/pi/issues/9186)、[microsoft/terminal#17515](https://github.com/microsoft/terminal/issues/17515)） | 内置 conhost                                          | 使用带当前 conhost 的终端，或用 `--tui-mode regular` 启动 Pi |
| Prompt 里出现类似 `;0;rgb:0000/0000/0000` 的文本，BEL 会打开外部编辑器（[#10256](https://github.com/earendil-works/pi/issues/10256)）                                                            | 另一个终端后面的内置 conhost：mintty、Windows OpenSSH | 使用带当前 conhost 的终端                                    |
| Prompt 里出现 `79` 或 `55` 之类的片段（[#10717](https://github.com/earendil-works/pi/issues/10717)）                                                                                             | WezTerm 20240203                                      | 使用 WezTerm nightly                                         |
| 常规模式下，每次按键都把输入行重绘到新的一行（[#6300](https://github.com/earendil-works/pi/issues/6300)）                                                                                        | 内置 conhost、经典控制台                              | 使用全屏模式（默认），或使用带当前 conhost 的终端            |

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
