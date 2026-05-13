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

注意：旧版 Claude Code 可能添加了 `keybind = shift+enter=text:\n` 映射，这会使 Pi 和 tmux 不再看到真正的 `shift+enter` 按键事件。如果仅为 Claude Code 2.x+ 添加的，可以删除。

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
  "args": { "text": "[13;2u" },
  "when": "terminalFocus"
}
```

## Windows Terminal

在 `settings.json` 中添加（通过 Ctrl+Shift+, 或设置 → 打开 JSON 文件）：

```json
{
  "actions": [
    {
      "command": { "action": "sendInput", "input": "[13;2u" },
      "keys": "shift+enter"
    },
    {
      "command": { "action": "sendInput", "input": "[13;3u" },
      "keys": "alt+enter"
    }
  ]
}
```

- `Shift+Enter` 插入新行
- `Alt+Enter` 原本绑定全屏，重新映射后转发给 Pi

## xfce4-terminal、terminator

这些终端对转义序列支持有限。带修饰的 Enter 键（Ctrl+Enter、Shift+Enter）无法与普通 Enter 区分。

## IntelliJ IDEA（集成终端）

内置终端对转义序列支持有限。Shift+Enter 无法与 Enter 区分。建议使用专用终端模拟器。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
