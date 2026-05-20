# Terminal Setup（终端设置）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/terminal-setup) 的中文翻译。仅供学习参考。

Pi 使用 **Kitty keyboard protocol** 进行可靠的修饰键检测。大多数现代终端支持此协议，但某些需要配置更改。

## Kitty、iTerm2

**开箱即用。**

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

如果仅为 Claude Code 2.x+ 添加的该映射，可以删除。如果你希望在 tmux 中通过此重映射让 `Shift+Enter` 继续工作，请在 `~/.pi/agent/keybindings.json` 中将 `ctrl+j` 添加到 pi 的 `newLine` 快捷键中：

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
