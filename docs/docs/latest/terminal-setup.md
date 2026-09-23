# 配置终端

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/terminal-setup) 的中文翻译。仅供学习参考。

大多数现代终端无需额外设置就能配合 Pi 工作。当修饰键、滚动、链接、图片、颜色或输入法（IME）候选框位置表现不符合预期时，请使用本页。

Pi 使用扩展键协议，让终端能把 `Shift+Enter`、`Alt+Enter` 这类组合与普通的 `Enter` 区分开。终端代理、多路复用器和 IDE 内置终端可能改变或丢弃这些信息。

## 排查问题

| 症状                                 | 从这里开始                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `Shift+Enter` 变为提交而不是插入换行 | 下面你所用终端的小节；tmux 请见[在 tmux 中运行 Pi](tmux.md)                           |
| `Alt+Enter` 不排队 follow-up         | [WezTerm](#wezterm)、[Alacritty](#alacritty) 或 [Windows Terminal](#windows-terminal) |
| 全屏滚动异常缓慢                     | [iTerm2](#iterm2)                                                                     |
| 链接可点但没有悬停预览               | [Ghostty](#ghostty)                                                                   |
| 未检测到内联图片或颜色               | [覆盖检测到的能力](#override-detected-capabilities)                                   |
| IME 候选框出现在错误位置             | [WezTerm](#wezterm) 或 [IntelliJ IDEA](#intellij-idea-integrated-terminal)            |
| 修饰键只在 tmux 内失效               | [在 tmux 中运行 Pi](tmux.md)                                                          |

用 `/hotkeys` 查看 Pi 当前生效的快捷键。修改它们见[快捷键](keybindings.md)。

## Kitty

Kitty 无需额外配置就支持所需的键盘协议。

## iTerm2

常规终端模式无需额外配置即可工作。

### 修复全屏滚动缓慢

在全屏模式下，视口由 Pi 接管，因此 iTerm2 发送的是鼠标滚轮事件，而不是滚动终端原生历史。快速触控板手势因此每次大约只能移动一行。

要改变这种行为：

1. 打开 **iTerm2 > Settings > Advanced**。
2. 搜索 **Trackpad scrolls fast?**。
3. 把它设为 **No**。

这是 iTerm2 的全局设置，也可能改变原生触控板滚动。底层行为记录在 [iTerm2 issue 9619](https://gitlab.com/gnachman/iterm2/-/work_items/9619)。

## Apple Terminal

可用时 Pi 会启用增强键报告。如果 Terminal.app 对 `Shift+Enter` 仍然发送普通的 Return，Pi 会使用本地 macOS 修饰键回退，并把它当作 `Shift+Enter`。

该回退仅在 Pi 与 Terminal.app 运行在同一台 Mac 上时有效。Pi 通过 SSH 运行在另一台机器上时，它无法读取本地修饰键状态。

## Ghostty

如果 `Alt+Backspace` 不工作，把下面的映射加入 Ghostty 配置：

```text
keybind = alt+backspace=text:\x1b\x7f
```

配置文件在 macOS 上是 `~/Library/Application Support/com.mitchellh.ghostty/config`，在 Linux 上是 `~/.config/ghostty/config`。

旧的 Claude Code 配置里可能包含：

```text
keybind = shift+enter=text:\n
```

这会发送一个原始换行符，Pi 无法把它与 `Ctrl+J` 区分开。如果添加该映射只是因为旧的 Claude Code 安装，请删除它。Pi 已经把 `Ctrl+J` 绑定为换行替代键，所以该映射可能看起来有效，实际上却阻止 Pi 和 tmux 收到真正的 `Shift+Enter` 事件。

### 在全屏模式下打开链接

链接在全屏模式下仍可点击，但 Pi 接管鼠标输入时，Ghostty 不会显示它平常的悬停下划线或 URL 预览。在 macOS 上按住 `Shift+Command`，在 Linux 上按住 `Shift+Ctrl`，即可使用 Ghostty 原生的链接处理。

## WezTerm

WezTerm 通常通过 xterm 扩展键报告 `Shift+Enter`。要显式启用 Kitty 键盘协议，请创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

### 在 macOS 上转发 Alt+Enter

在 macOS 上 WezTerm 默认把 `Option+Enter` 绑定到全屏。要把它用于 Pi 的 follow-up 队列，请把下面的条目加入你的 `config.keys` 表：

```lua
{
  key = 'Enter',
  mods = 'ALT',
  action = wezterm.action.SendString('\x1b[13;3u'),
}
```

完整的最小配置是：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.keys = {
  {
    key = 'Enter',
    mods = 'ALT',
    action = wezterm.action.SendString('\x1b[13;3u'),
  },
}
return config
```

### 在 WSL 中定位 IME 候选框

如果 CJK 输入法候选框在 WSL 中不跟随 Pi 的文本光标，请显示硬件光标：

```bash
export PI_HARDWARE_CURSOR=1
pi
```

也可以在 Pi 设置中把 `showHardwareCursor` 设为 `true`。

## Alacritty

Alacritty 通常能报告 `Shift+Enter`。在 macOS 上，`Option+Enter` 可能以普通 `Enter` 到达。把下面的内容加入 `~/.config/alacritty/alacritty.toml`，把它转发给 Pi：

```toml
[[keyboard.bindings]]
key = "Enter"
mods = "Alt"
chars = "\u001b[13;3u"
```

修改文件后重启 Alacritty。

## VS Code 内置终端

VS Code 1.109.5 及更新版本默认在内置终端中启用 Kitty 键盘协议。

对于更旧的版本，把 `Shift+Enter` 终端绑定加入 `keybindings.json`：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

用户的 `keybindings.json` 文件通常位于：

- macOS：`~/Library/Application Support/Code/User/keybindings.json`
- Linux：`~/.config/Code/User/keybindings.json`
- Windows：`%APPDATA%\\Code\\User\\keybindings.json`

## Zed 内置终端

把这些绑定加入 Zed 的 `keymap.json`：

```json
{
  "context": "Terminal",
  "bindings": {
    "shift-enter": ["terminal::SendText", "\u001b[13;2u"],
    "ctrl--": ["terminal::SendText", "\u001b[45;5u"],
    "ctrl-alt-]": ["terminal::SendText", "\u001b[93;7u"]
  }
}
```

## Windows Terminal

Windows Terminal 使用 Pi 在 Windows 和 WSL 上的默认快捷键。完整列表见[快捷键](keybindings.md)。

### 转发 Shift+Enter

用 `Ctrl+Shift+,` 或 **Settings > Open JSON file** 打开 Windows Terminal 的 `settings.json`。把下面的对象加入它的 `actions` 数组：

```json
{
  "command": { "action": "sendInput", "input": "\u001b[13;2u" },
  "keys": "shift+enter"
}
```

完全关闭并重新打开 Windows Terminal，然后验证 `Shift+Enter` 在 Pi 中插入新行。

### 用 Alt+Enter 处理 follow-up

Windows Terminal 默认把 `Alt+Enter` 绑定到全屏。因此 Pi 在 Windows 和 WSL 上使用 `Ctrl+Q` 处理 follow-up。

要改用 `Alt+Enter`，请配置 Windows Terminal 转发该键，并在 Pi 的 `keybindings.json` 中把 `app.message.followUp` 绑定到 `alt+enter`。见[快捷键](keybindings.md#assign-keybindings)。

## xfce4-terminal 和 Terminator

这些终端无法可靠地区分带修饰键的 Enter 和普通 `Enter`。因此 `Ctrl+Enter`、`Shift+Enter` 等自定义绑定可能不工作。

需要这些快捷键时，请使用支持现代扩展键的终端，例如 Kitty、Ghostty、WezTerm、iTerm2、Windows Terminal，或兼容的 Alacritty 构建。

## IntelliJ IDEA 内置终端

IntelliJ IDEA 的内置终端无法可靠地区分 `Shift+Enter` 和普通 `Enter`。请用 `Ctrl+J` 换行，或在支持现代扩展键的终端中运行 Pi。

如果 IME 候选框不跟随文本光标，请显示硬件光标：

```bash
export PI_HARDWARE_CURSOR=1
pi
```

## 覆盖检测到的能力

Pi 会自动检测 OSC 8 超链接、内联图片协议和 truecolor 支持。终端代理或多路复用器可能让该检测不准确。

| 能力      | 环境变量                                      | 设置                                                |
| --------- | --------------------------------------------- | --------------------------------------------------- |
| 超链接    | `PI_HYPERLINKS=1\|0\|auto`                    | `terminal.hyperlinks: true\|false\|"auto"`          |
| 内联图片  | `PI_IMAGE_PROTOCOL=kitty\|iterm2\|none\|auto` | `terminal.images: "kitty"\|"iterm2"\|false\|"auto"` |
| Truecolor | `PI_TRUE_COLOR=1\|0\|auto`                    | `terminal.trueColor: true\|false\|"auto"`           |

设置优先于环境变量。未设置的值或 `auto` 保留自动检测。

只强制启用整条终端链路都支持的能力。不受支持的转义序列会破坏渲染。规范的取值定义见[环境变量](environment-variables.md#pi-process-configuration)和[设置](settings.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
