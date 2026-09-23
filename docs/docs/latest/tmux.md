# 在 tmux 中运行 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/tmux) 的中文翻译。仅供学习参考。

Pi 可以在 tmux 内工作，但 tmux 可能把 `Shift+Enter`、`Ctrl+Enter` 和普通的 `Enter` 报告为同一个键。请启用扩展键，让 Pi 能区分它们。

## 检查 tmux 版本

```bash
tmux -V
```

tmux 3.5 或更新版本请使用下面推荐的 CSI-u 配置。tmux 3.2 到 3.4 请使用旧版本配置。

## 在 tmux 3.5 或更新版本中启用扩展键

把下面几行加入 `~/.tmux.conf`：

```text
set -g extended-keys on
set -g extended-keys-format csi-u
```

当终端不直接提供 Kitty 键盘协议时，Pi 会请求扩展键报告。CSI-u 是通过 tmux 转发带修饰键最可靠的格式。

## 重启 tmux

该配置作用于 tmux 服务器。为确保它生效，请关闭你的 tmux 会话并启动新的服务器。

如果你选择从命令行停止服务器，请先保存工作。下面的命令会终止该服务器管理的每个会话：

```bash
tmux kill-server
tmux
```

## 验证修饰键

在新的 tmux 会话中启动 Pi，并检查：

1. `Shift+Enter` 在编辑器中插入新行。
2. `Enter` 提交 Prompt。
3. 在 macOS 和 Linux 上 `Alt+Enter` 排队一条 follow-up。Windows 和 WSL 默认使用 `Ctrl+Q`。

如果这些键仍然表现得像普通的 `Enter`，请确认 tmux 之外的终端能报告修饰键。见[配置终端](terminal-setup.md)。

## 使用 tmux 3.2 到 3.4

这些版本支持扩展键，但不支持 `extended-keys-format csi-u`。只添加：

```text
set -g extended-keys on
```

Pi 支持这些版本使用的 xterm `modifyOtherKeys` 格式。重启 tmux 并重复验证步骤。

对于更旧的版本，请升级 tmux，或在 tmux 之外使用 Pi，而不要依赖带修饰键的 Enter 快捷键。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
