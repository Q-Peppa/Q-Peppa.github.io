# 使用 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/usage) 的中文翻译。仅供学习参考。

本页面汇集了不在快速入门页面中的日常使用细节。

## 交互模式

<p align="center"><img src="/images/interactive-mode.png" alt="交互模式" width="600"></p>

交互界面分为四个主要区域：

- **启动头部（Startup header）** —— 显示快捷键、已加载的上下文文件、Prompt 模板、Skills 和扩展
- **消息区域（Messages）** —— 用户消息、助手回复、工具调用、工具结果、通知、错误和扩展 UI
- **编辑器（Editor）** —— 输入区域，边框颜色反映当前 thinking level
- **底部栏（Footer）** —— 显示工作目录、会话名称、Token/缓存使用、成本、上下文使用量和当前模型

编辑器可以被内置面板（如 `/settings`）或自定义扩展 UI 临时替换。

### 编辑器功能

| 功能 | 操作 |
|------|------|
| 文件引用 | 输入 `@` 来模糊搜索项目文件 |
| 路径补全 | 按 Tab 补全路径 |
| 多行输入 | Shift+Enter（Windows Terminal 上为 Ctrl+Enter） |
| 图像 | Ctrl+V 粘贴（Windows 为 Alt+V），或拖入终端 |
| Shell 命令 | `!command` 执行命令，输出发送给模型 |
| 隐藏 Shell 命令 | `!!command` 执行命令但不发送输出给模型 |
| 外部编辑器 | Ctrl+G 打开 `$VISUAL` 或 `$EDITOR` |

有关所有快捷键和自定义设置，请参阅 [Keybindings](keybindings.md)。

## 斜杠命令（Slash Commands）

在编辑器中输入 `/` 会打开命令补全。扩展可以注册自定义命令，Skills 以 `/skill:name` 形式出现，Prompt 模板以 `/templatename` 展开。

| 命令 | 说明 |
|------|------|
| `/login`、`/logout` | 管理 OAuth 或 API Key 凭证 |
| `/model` | 切换模型 |
| `/scoped-models` | 启用/禁用 Ctrl+P 循环的模型 |
| `/settings` | thinking level、主题、消息传递、传输 |
| `/resume` | 从历史会话中选择 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置会话显示名称 |
| `/session` | 显示会话文件、ID、消息数、Token 和费用 |
| `/tree` | 跳转到会话中的任意点并继续 |
| `/fork` | 从先前的用户消息创建新会话 |
| `/clone` | 将当前活跃分支复制到新会话 |
| `/compact [prompt]` | 手动压缩上下文，可选自定义指令 |
| `/copy` | 复制最后一条助手消息到剪贴板 |
| `/export [file]` | 导出会话为 HTML |
| `/share` | 上传为私有 GitHub Gist，附带可分享的 HTML 链接 |
| `/reload` | 重新加载快捷键、扩展、Skills、Prompt 和上下文文件 |
| `/hotkeys` | 显示所有键盘快捷键 |
| `/changelog` | 显示版本历史 |
| `/quit` | 退出 Pi |

## 消息队列

在 Agent 仍在工作时可以提交消息：

- **Enter** 将 steering 消息加入队列，在当前助手回合完成工具调用后投递。
- **Alt+Enter** 将 follow-up 消息加入队列，在 Agent 完成所有工作后投递。
- **Escape** 中断并将队列消息恢复到编辑器。
- **Alt+Up** 将队列消息取回编辑器。

在 Windows Terminal 上，Alt+Enter 默认为全屏。如要使 Pi 接收到该快捷键，请按照 [Terminal 设置](terminal-setup.md) 中的描述重新映射。

投递行为可通过 [Settings](settings.md) 中的 `steeringMode` 和 `followUpMode` 配置。

## 会话（Sessions）

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择会话
pi --no-session        # 临时模式，不保存
pi --session <path|id> # 使用特定会话文件或会话 ID
pi --fork <path|id>    # 从会话分叉到新会话文件
```

有用的会话命令：

- `/session` 显示当前会话文件和 ID。
- `/tree` 导航会话内文件树，可以摘要被放弃的分支。
- `/fork` 从之前的用户消息创建新会话。
- `/clone` 将当前活跃分支复制到新会话文件。
- `/compact` 总结旧消息以释放上下文。

详见 [Sessions](sessions.md) 和 [Compaction](compaction.md)。

## 上下文文件

Pi 在启动时加载 `AGENTS.md` 或 `CLAUDE.md`：

- `~/.pi/agent/AGENTS.md` —— 全局指令
- 从当前工作目录向上遍历的父目录
- 当前目录

使用上下文文件来定义项目规范、命令、安全规则和偏好。使用 `--no-context-files` 或 `-nc` 禁用加载。

### 系统 Prompt 文件

使用 `.pi/SYSTEM.md` 替换项目默认系统 Prompt，或 `~/.pi/agent/SYSTEM.md` 全局替换。使用 `APPEND_SYSTEM.md` 在相同位置追加到默认 Prompt 之后，而不替换它。

## 导出和分享会话

使用 `/export [file]` 将会话写入 HTML 文件。

使用 `/share` 上传为私有 GitHub Gist 附带可分享的 HTML 链接。

如果你将 Pi 用于开源工作，并希望发布用于模型、Prompt、工具和评估研究的会话，请参考 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。它将会话发布到 Hugging Face 数据集。

## CLI 参考

```bash
pi [options] [@files...] [messages...]
```

### 包管理命令

```bash
pi install <source> [-l]     # 安装包，-l 为项目本地安装
pi remove <source> [-l]      # 移除包
pi uninstall <source> [-l]   # remove 的别名
pi update [source|self|pi]   # 更新 Pi 和包；协调固定的 git ref
pi update --extensions       # 仅更新包；协调固定的 git ref
pi update --self             # 仅更新 Pi
pi update --extension <src>  # 更新单个包
pi list                      # 列出已安装的包
pi config                    # 启用/禁用包资源
```

这些命令管理 Pi 包，而非 Pi CLI 安装本身。要卸载 Pi 本身，请参阅 [Quickstart](quickstart.mdx#卸载)。

包来源和安全说明请参阅 [Pi Packages](packages.md)。

### 模式

| 标志 | 说明 |
|------|------|
| 默认 | 交互模式 |
| `-p`、`--print` | 打印响应并退出 |
| `--mode json` | 将所有事件输出为 JSON 行；参见 [JSON mode](json.md) |
| `--mode rpc` | stdin/stdout RPC 模式；参见 [RPC mode](rpc.md) |
| `--export <in> [out]` | 导出会话为 HTML |

在 print 模式下，Pi 也会读取通过管道传来的 stdin 并将其合并到初始提示中：

```bash
cat README.md | pi -p "Summarize this text"
```

### 模型选项

| 选项 | 说明 |
|------|------|
| `--provider <name>` | Provider，如 `anthropic`、`openai`、`google` |
| `--model <pattern>` | 模型模式或 ID；支持 `provider/id` 和可选的 `:<thinking>` |
| `--api-key <key>` | API Key，覆盖环境变量 |
| `--thinking <level>` | `off`、`minimal`、`low`、`medium`、`high`、`xhigh` |
| `--models <patterns>` | 逗号分隔的 Ctrl+P 循环模式 |
| `--list-models [search]` | 列出可用模型 |

### 会话选项

| 选项 | 说明 |
|------|------|
| `-c`、`--continue` | 继续最近会话 |
| `-r`、`--resume` | 浏览并选择会话 |
| `--session <path\|id>` | 使用特定会话文件或部分 UUID |
| `--fork <path\|id>` | 从会话文件或部分 UUID 分叉到新会话 |
| `--session-dir <dir>` | 自定义会话存储目录 |
| `--no-session` | 临时模式，不保存 |

### 工具选项

| 选项 | 说明 |
|------|------|
| `--tools <list>`、`-t <list>` | 白名单指定内置、扩展和自定义工具 |
| `--no-builtin-tools`、`-nbt` | 禁用内置工具但保留扩展/自定义工具 |
| `--no-tools`、`-nt` | 禁用所有工具 |

内置工具：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`。

### 资源选项

| 选项 | 说明 |
|------|------|
| `-e`、`--extension <source>` | 从路径、npm 或 git 加载扩展；可重复 |
| `--no-extensions` | 禁用扩展发现 |
| `--skill <path>` | 加载 Skill；可重复 |
| `--no-skills` | 禁用 Skill 发现 |
| `--prompt-template <path>` | 加载 Prompt 模板；可重复 |
| `--no-prompt-templates` | 禁用 Prompt 模板发现 |
| `--theme <path>` | 加载主题；可重复 |
| `--no-themes` | 禁用主题发现 |
| `--no-context-files`、`-nc` | 禁用 `AGENTS.md` 和 `CLAUDE.md` 发现 |

将 `--no-*` 与显式标志结合使用，以精确加载所需内容，忽略设置。示例：

```bash
pi --no-extensions -e ./my-extension.ts
```

### 其他选项

| 选项 | 说明 |
|------|------|
| `--system-prompt <text>` | 替换默认 Prompt；上下文文件和 Skills 仍会被追加 |
| `--append-system-prompt <text>` | 追加到系统 Prompt |
| `--verbose` | 强制详细启动 |
| `-h`、`--help` | 显示帮助 |
| `-v`、`--version` | 显示版本 |

### 文件参数

文件前加 `@` 以包含到消息中：

```bash
pi @prompt.md "Answer this"
pi -p @screenshot.png "What's in this image?"
pi @code.ts @test.ts "Review these files"
```

### 示例

```bash
# 交互式初始提示
pi "List all .ts files in src/"

# 非交互式
pi -p "Summarize this codebase"

# 非交互式带管道传入
cat README.md | pi -p "Summarize this text"

# 不同模型
pi --provider openai --model gpt-4o "Help me refactor"

# 带 Provider 前缀的模型
pi --model openai/gpt-4o "Help me refactor"

# 带 thinking level 简写的模型
pi --model sonnet:high "Solve this complex problem"

# 限制模型循环
pi --models "claude-*,gpt-4o"

# 只读模式
pi --tools read,grep,find,ls -p "Review the code"
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录；默认 `~/.pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储目录；被 `--session-dir` 覆盖 |
| `PI_PACKAGE_DIR` | 覆盖包目录，适用于 Nix/Guix store 路径 |
| `PI_OFFLINE` | 禁用启动时网络操作，包括更新检查、包更新检查和安装/更新遥测 |
| `PI_SKIP_VERSION_CHECK` | 跳过启动时的 Pi 版本更新检查。阻止 `pi.dev` 最新版本请求 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测：`1`/`true`/`yes` 或 `0`/`false`/`no`。不影响更新检查 |
| `PI_CACHE_RETENTION` | 设为 `long` 以在支持的 Provider 上启用扩展提示缓存 |
| `VISUAL`、`EDITOR` | Ctrl+G 使用的外部编辑器 |

## 设计原则

Pi 将核心保持小巧，将工作流特定的行为推到扩展、Skills、Prompt 模板和包中。

它有意不包含内置的 MCP、子 Agent、权限弹窗、Plan 模式、待办事项或后台 Bash。你可以将工作流作为扩展或包来构建或安装，或使用外部工具如容器和 tmux。

如需完整理由，请阅读[博客文章](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
