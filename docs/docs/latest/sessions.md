# Sessions（会话）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/sessions) 的中文翻译。仅供学习参考。

Pi 将会话保存为会话文件，**使你可以继续工作、从之前的回合分支和回访之前的路径**。

## 会话存储

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。每个会话是一个 JSONL 文件，具有树状结构。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择历史会话
pi --no-session        # 临时模式，不保存
pi --name "my task"    # 启动时设置会话显示名称
pi --session <path|id> # 使用特定会话文件或部分会话 ID
pi --fork <path|id>    # 将会话文件或部分会话 ID 分叉为新会话
```

交互模式下使用 `/session` 可查看当前会话文件、会话 ID、消息数、Token 和费用。

JSONL 文件格式和 SessionManager API 详见 [Session Format](session-format.md)。

## 会话命令

| 命令                 | 说明                                                         |
| -------------------- | ------------------------------------------------------------ |
| `/resume`            | 浏览并选择历史会话                                           |
| `/new`               | 开始新会话                                                   |
| `/name <name>`       | 设置当前会话显示名称                                         |
| `/session`           | 显示会话信息                                                 |
| `/tree`              | 导航当前会话树                                               |
| `/fork`              | 从之前的用户消息创建新会话                                   |
| `/clone`             | 复制当前活跃分支到新会话                                     |
| `/compact [prompt]`  | 总结较早的上下文；参阅 [Compaction](compaction.md)           |
| `/export [file]`     | 导出会话为 HTML                                              |
| `/share`             | 上传为私有 GitHub Gist 并生成可分享的 HTML 链接              |
| `/bug [description]` | 向 Pi 开发者上报 bug；参阅 [Reporting Bugs](#reporting-bugs) |

## 恢复和删除会话

`/resume` 打开当前项目的交互式会话选择器，`pi -r` 在启动时打开。在选择器中：

- 搜索：直接输入
- Ctrl+P：切换路径显示
- Ctrl+S：切换排序模式
- Ctrl+N：过滤已命名会话
- Ctrl+R：重命名
- Ctrl+D：删除并确认

Pi 在可用时会使用 `trash` CLI 进行删除，而非永久移除文件。

## 命名会话

使用 `/name <name>` 设置可读的会话名称：

```text
/name Refactor auth module
```

启动时使用 `--name` 或 `-n` 设置名称：

```bash
pi --name "Refactor auth module"
pi --name "CI audit" -p "Review this build failure"
```

命名后的会话在 `/resume` 和 `pi -r` 中更容易找到。

## 使用 `/tree` 分支

会话以树状结构存储。每个条目有 `id` 和 `parentId`，当前位置是活跃的叶节点。`/tree` 让你跳转到任意之前的节点并从那里继续，而无需创建新文件。

<p align="center"><img src="/images/tree-view.png" alt="树形视图" width="600"></p>

示例结构：

```text
├─ user: "Hello, can you help..."
│  └─ assistant: "Of course! I can..."
│     ├─ user: "Let's try approach A..."
│     │  └─ assistant: "For approach A..."
│     │     └─ user: "That worked..."  ← 当前活跃
│     └─ user: "Actually, approach B..."
│        └─ assistant: "For approach B..."
```

### 树操作键

| 按键                         | 操作                       |
| ---------------------------- | -------------------------- |
| ↑/↓                          | 导航可见条目               |
| ←/→                          | 翻页                       |
| Ctrl+←/Ctrl+→ 或 Alt+←/Alt+→ | 折叠/展开或跳转分支段      |
| Shift+L                      | 设置或清除选中条目上的标签 |
| Shift+T                      | 切换标签时间戳显示         |
| Enter                        | 选择条目                   |
| Escape/Ctrl+C                | 取消                       |
| Ctrl+O                       | 循环过滤模式               |

过滤模式包括：default、no-tools、user-only、labeled-only 和 all。可通过 [Settings](settings.md) 中的 `treeFilterMode` 配置默认值。

### 选择行为

选择用户消息或自定义消息：

1. 将叶节点移到所选消息的父节点。
2. 将所选消息文本放入编辑器。
3. 允许编辑并重新提交，创建新分支。

选择助手、工具、压缩或其他非用户条目：

1. 将叶节点移到该条目。
2. 编辑器保持清空。
3. 从该点继续。

选择根用户消息会将叶节点重置为空对话，并将原始 Prompt 放入编辑器。

## `/tree`、`/fork` 和 `/clone` 对比

| 功能     | `/tree`          | `/fork`                    | `/clone`             |
| -------- | ---------------- | -------------------------- | -------------------- |
| 输出     | 同一会话文件     | 新会话文件                 | 新会话文件           |
| 视图     | 完整树           | 用户消息选择器             | 当前活跃分支         |
| 典型用途 | 原地探索替代方案 | 从之前的 Prompt 开始新会话 | 在继续前复制当前工作 |
| 摘要     | 可选分支摘要     | 无                         | 无                   |

当你希望将替代方案保存在一起时使用 `/tree`；当你希望创建单独的会话文件时使用 `/fork` 或 `/clone`。

## 分支摘要

当 `/tree` 从一个分支切换到另一个分支时，Pi 可以总结被放弃的分支，并在新位置附加该摘要。这保留了离开路径时的重要上下文，而无需重放整个分支。

提示时会让你选择：

1. 不总结
2. 使用默认提示总结
3. 使用自定义焦点指令总结

分支总结的内部机制和扩展钩子请参阅 [Compaction](compaction.md)。

## Reporting Bugs

`/bug [description]` 会为 Pi 开发者收集一份 bug 报告。报告不会公开分享。对话框会询问可选的描述，以及是否包含会话转录。如果你不包含转录，pi 会提议让当前模型代写一份问题摘要；转录会带着你的凭据发送给你的 Provider，只有摘要会被附上。

最后一步选择报告的发送方式：

- **Upload Report** 通过 `radius.pi.dev` 发送给 Pi 开发者。无需登录；如果你已登录 Radius，报告会归属到你的账号，方便开发者跟进。上传失败时，pi 会提议改为导出 zip。
- **Export as Zip** 把 zip 归档写入当前目录。你可以把它附到 issue 里，或自行发给开发者。

两者包含相同的文件：

| 文件               | 内容                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `report.json`      | pi 版本、运行时、操作系统、终端、当前模型和 Provider 配置、已加载的扩展和设置。API Key、请求头的值、URL 凭据和分析跟踪 id 永远不会包含在内。 |
| `diagnostics.json` | 整个会话中附加到助手消息的 Provider 和运行时错误诊断（失败或中止的轮次、重试、错误消息），以及记录到的崩溃。始终包含；不包含消息内容。       |
| `session.jsonl`    | 当前会话分支，仅在你选择包含时才有。它包含会话期间读取的文件内容和命令输出。                                                                 |
| `summary.md`       | 模型撰写的摘要，仅在你选择生成时才有。                                                                                                       |

每份报告都有一个 UUID。pi 在上传或导出后显示它，并把它作为 `pi.bug-report` 条目记入会话，方便你之后引用。

设置 `PI_RADIUS_GATEWAY` 可上传到其他 Radius 部署。

### Crashes

当 pi 因未捕获的异常或致命的运行时错误退出时，它会把错误消息和堆栈跟踪存到 `~/.pi/agent/crashes.json`（最新五条）。下次交互式启动会提示一次；运行 `/bug` 会把存储的崩溃附加到 `diagnostics.json`，并在报告上传或导出后删除该文件。如果你希望报告里包含转录，先用 `pi -r` 恢复崩溃的会话。

## 会话格式

会话文件是 JSONL 格式，包含消息条目、模型更改、thinking level 更改、标签、压缩记录、分支摘要和扩展条目。

关于解析器、扩展、SDK 用法和完整的 SessionManager API，请参阅 [Session Format](session-format.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
