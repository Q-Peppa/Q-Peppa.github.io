# tmux 设置

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/tmux) 的中文翻译。仅供学习参考。

Pi 可在 tmux 内工作，但 tmux 默认会剥离某些按键的修饰键信息。未配置时，`Shift+Enter` 和 `Ctrl+Enter` 通常与普通 `Enter` 无法区分。

## 推荐配置

添加到 `~/.tmux.conf`：

```text
set -g extended-keys on
set -g extended-keys-format csi-u
```

然后完全重启 tmux：

```bash
tmux kill-server
tmux
```

当 Kitty 键盘协议不可用时，Pi 会自动请求扩展按键报告。使用 `extended-keys-format csi-u` 时，tmux 以 CSI-u 格式转发修饰键，这是最可靠的配置。`extended-keys-format` 选项需要 tmux 3.5 或更高版本。

## 为什么推荐 `csi-u`

仅使用：

```text
set -g extended-keys on
```

时，tmux 默认使用 `extended-keys-format xterm`。当应用请求扩展按键报告时，修饰键以 xterm 的 `modifyOtherKeys` 格式转发，例如：

- `Ctrl+C` → `\x1b[27;5;99~`
- `Ctrl+D` → `\x1b[27;5;100~`
- `Ctrl+Enter` → `\x1b[27;5;13~`

使用 `extended-keys-format csi-u` 时，相同的按键以 CSI-u 格式转发：

- `Ctrl+C` → `\x1b[99;5u`
- `Ctrl+D` → `\x1b[100;5u`
- `Ctrl+Enter` → `\x1b[13;5u`

Pi 支持两种格式，但对于 tmux 推荐使用 `csi-u`。

## 这修复了什么

没有 tmux 扩展按键时，带修饰的 Enter 键会退化为旧版序列：

| 按键             | 无扩展按键 | 有 `csi-u`   |
| ---------------- | ---------- | ------------ |
| Enter            | `\r`       | `\r`         |
| Shift+Enter      | `\r`       | `\x1b[13;2u` |
| Ctrl+Enter       | `\r`       | `\x1b[13;5u` |
| Alt/Option+Enter | `\x1b\r`   | `\x1b[13;3u` |

这影响默认快捷键（`Enter` 提交，`Shift+Enter` 换行）和任何使用修饰 Enter 的自定义快捷键。

## 要求

- tmux 3.5 或更高版本支持 `extended-keys-format csi-u`（`tmux -V` 检查）
- 支持扩展按键的终端模拟器：Ghostty、Kitty、iTerm2、WezTerm、Windows Terminal

使用 tmux 3.2 至 3.4 时，省略 `extended-keys-format csi-u`；Pi 仍支持 tmux 默认的 xterm `modifyOtherKeys` 格式。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
