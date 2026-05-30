# Terminal Setup（终端设置）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/terminal-setup) 的中文翻译。仅供学习参考。

Pi 使用 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 进行可靠的修饰键检测。大多数现代终端支持此协议，但某些需要配置更改。

## Kitty、iTerm2

**开箱即用。**

## Apple Terminal

Pi 在可用时启用增强按键报告。如果 Terminal.app 仍然为 `Shift+Enter` 发送普通 Return，Pi 会使用本地 macOS 修饰键回退机制，将该 Return 视为 `Shift+Enter`。

此回退仅在 Pi 与 Terminal.app 运行在同一台 Mac 上时有效。它无法通过远程 SSH 检测本地键盘。

## Ghostty

在 Ghostty 配置中添加（macOS：`~/Library/Application Support/com.mitchellh.ghostty/config`，Linux：`~/.config/ghostty/config`）：

```
keybind = alt+backspace=text:\x1b\x7f
```

注意：旧版 Claude Code 可能添加了以下 Ghostty 映射：

```
keybind = shift+enter=text:\n
```

该映射发送原始的换行符字节。在 Pi 内部，这与 `Ctrl+J` 无法区分，因此 tmux 和 Pi 不再看到真正的 `shift+enter` 按键事件。

如果仅为 Claude Code 2.x+ 添加的该映射，可以删除，除非你想在 tmux 中使用 Claude Code，它仍然需要该 Ghostty 映射。如果你希望在 tmux 中通过此重映射让 `Shift+Enter` 继续工作，请在 `~/.pi/agent/keybindings.json` 中将 `ctrl+j` 添加到 pi 的 `newLine` 快捷键中：

```json
{
  "newLine": ["shift+enter", "ctrl+j"]
}
```

## WezTerm

创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

在 WSL 上，WezTerm 可能需要可见的硬件光标来定位 IME 候选窗口。如果中日韩 IME 候选不跟随文本光标，请在运行 Pi 前设置 `PI_HARDWARE_CURSOR=1` 或在设置中将 `showHardwareCursor` 设为 `true`。

## VS Code（集成终端）

`keybindings.json` 位置：

- **macOS**：`~/Library/Application Support/Code/User/keybindings.json`
- **Linux**：`~/.config/Code/User/keybindings.json`
- **Windows**：`%APPDATA%\Code\User\keybindings.json`

添加以启用 `Shift+Enter` 多行输入：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

## Windows Terminal

在 `settings.json` 中添加（通过 Ctrl+Shift+, 或设置 → 打开 JSON 文件），以转发 Pi 使用的修饰 Enter 键：

```json
{
  "actions": [
    {
      "command": { "action": "sendInput", "input": "\u001b[13;2u" },
      "keys": "shift+enter"
    },
    {
      "command": { "action": "sendInput", "input": "\u001b[13;3u" },
      "keys": "alt+enter"
    }
  ]
}
```

- `Shift+Enter` 插入新行
- Windows Terminal 默认将 `Alt+Enter` 绑定为全屏，这会阻止 Pi 接收 `Alt+Enter` 用于 follow-up 队列
- 将 `Alt+Enter` 重新映射为 `sendInput` 可将真实的按键组合转发给 Pi

如果你已有 `actions` 数组，将上述对象添加到其中。如果旧的全屏行为仍然存在，请完全关闭并重新打开 Windows Terminal。

## xfce4-terminal、terminator

这些终端对转义序列支持有限。带修饰的 Enter 键（Ctrl+Enter、Shift+Enter）无法与普通 Enter 区分，导致 `submit: ["ctrl+enter"]` 等自定义快捷键无法工作。

为获得最佳体验，请使用支持 Kitty 键盘协议的终端：

- [Kitty](https://sw.kovidgoyal.net/kitty/)
- [Ghostty](https://ghostty.org/)
- [WezTerm](https://wezfurlong.org/wezterm/)
- [iTerm2](https://iterm2.com/)
- [Alacritty](https://github.com/alacritty/alacritty)（需要使用 Kitty 协议支持编译）

## IntelliJ IDEA（集成终端）

内置终端对转义序列支持有限。在 IntelliJ 终端中，Shift+Enter 无法与 Enter 区分。

如果你需要显示硬件光标，在运行 pi 前设置 `PI_HARDWARE_CURSOR=1`（默认禁用以保证兼容性）。

建议使用专用终端模拟器以获得最佳体验。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
