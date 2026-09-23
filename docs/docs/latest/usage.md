# 使用 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/usage) 的中文翻译。仅供学习参考。

在你想工作的文件夹中运行 `pi`。Pi 用该文件夹发现文件、指令和配置，并据此对保存的会话分组。如果你还没安装 Pi 或选择模型，请先看[快速开始](quickstart.md)。

在加载项目的资源之前，Pi 可能会询问你是否信任该工作文件夹。见[项目信任](security.md#understand-project-trust)。

<p align="center"><img src="/images/interactive-mode.png" alt="Pi 交互模式，显示对话、编辑器和状态信息" width="750" /></p>

转录显示你的 Prompt、Pi 的回复、tool call、结果和错误。你在编辑器中输入 Prompt 和命令。页脚显示当前文件夹、会话、模型、上下文用量，以及累计用量和成本。

## 输入 Prompt

输入请求并按 `Enter` 发送。用 `Shift+Enter` 换行，或按 `Ctrl+G` 在配置好的外部编辑器中编写更长的 Prompt。

要包含文件或图片：

- 输入 `@` 搜索文件并把它加入 Prompt。
- 按 `Tab` 补全路径。
- 粘贴图片或把它拖入兼容的终端。

## 跟踪 Pi 的工作

Pi 在工作时显示每次 tool call 和结果。按 `Ctrl+O` 展开或折叠工具输出。按 `Ctrl+T` 显示或隐藏 thinking 块。

启动头部列出 Pi 加载的指令和资源。编辑器边框指示当前的 thinking level。页脚随着模型使用上下文而更新，并报告用量。

Pi 不会在每次 tool call 之前都询问。请审阅命令和改动的文件，对不可信或无人值守的工作使用沙箱。见[安全](security.md)。

## 改变方向

Pi 工作时你可以继续输入：

| 你想做的事             | 操作                     |
| ---------------------- | ------------------------ |
| 调整当前任务           | 输入消息并按 `Enter`     |
| 在当前任务之后追加工作 | 输入消息并按 `Alt+Enter` |
| 把排队消息退回编辑器   | 按 `Alt+Up`              |
| 停止当前任务           | 按 `Escape`              |

用 `Enter` 发送的消息会等到当前回复及其 tool call 结束，然后引导下一次回复。用 `Alt+Enter` 发送的 follow-up 会等到 Pi 完成当前任务。中止会把排队消息退回编辑器。

Windows Terminal 保留了一些 Alt 快捷键。Windows 上的替代方案见[终端设置](terminal-setup.md)。

## 更换模型或设置

输入 `/` 搜索可用命令。最常用的命令有：

- `/model` 选择模型。按 `Ctrl+L` 打开同一个选择器。
- `/thinking` 选择当前模型使用多少推理。按 `Shift+Tab` 循环切换支持的级别。
- `/login` 和 `/logout` 管理 Provider 访问。
- `/settings` 修改常用偏好。

Prompt 模板、Skill 和扩展可以向同一个菜单添加更多命令。见[选择模型](models.md)、[配置](configuration.md)或完整的[斜杠命令参考](slash-commands.md)。

## 继续或重新开始

除非禁用了会话持久化，Pi 会自动保存会话。

- `/new` 开始新会话。
- `/resume` 打开另一个已保存的会话。
- `/name` 给当前会话起一个容易识别的名字。
- `/session` 显示它的文件、ID、消息数、Token 用量和成本。

当你想在不丢失现有工作的情况下探索另一种思路时，使用 `/tree`、`/fork` 或 `/clone`。用 `/compact` 减少发送给模型的对话历史。这些工作流见[会话与上下文](sessions.md)。

离开 Pi 之后，在同一文件夹运行 `pi --continue` 恢复它最近的会话。

## 运行终端命令

在命令前加 `!` 运行它，并把输出加入对话：

```text
!git status
```

如果你想让命令的输出不发送给模型，使用 `!!`。

## 复制、导出或分享结果

按 `Ctrl+X` 或运行 `/copy` 复制最后一条 assistant 回复。用 `/export` 把会话保存为 HTML 或 JSONL。

用 `/share` 上传会话并获得查看链接。使用 Radius 认证时，产物对你的 Radius 组织可见。否则 Pi 通过 GitHub CLI 创建一个私有 GitHub gist。请先审阅会话，因为它可能包含对话期间暴露的 Prompt、工具输出、文件内容和凭证。

## 调整终端

常规模式使用终端正常的回滚缓冲区。全屏模式让编辑器和状态区域保持固定，转录在终端窗口内滚动。通过 `/settings` 或 `--tui-mode` 选择模式。

终端对鼠标输入、键盘快捷键和内联图片的支持各有不同。平台相关配置见[终端设置](terminal-setup.md)，所有可配置的快捷键见[快捷键](keybindings.md)。运行 `/hotkeys` 可以查看当前会话中生效的快捷键。

## 收集诊断信息

排查终端渲染或对话状态问题时，运行 `/debug`。Pi 会把渲染后的终端行和当前会话消息写入你的 [agent 目录](configuration.md#agent-directory)中的 `pi-debug.log`。

分享该文件之前请先审阅。它可能包含 Prompt、模型响应、工具输出、文件内容和终端数据。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
