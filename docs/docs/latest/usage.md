# 使用 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/usage) 的中文翻译。仅供学习参考。

## 交互模式

交互界面分为四个主要区域：

- **启动头部（Startup header）** —— 显示快捷键、已加载的上下文文件、Prompt 模板、Skills 和扩展
- **消息区域（Messages）** —— 用户消息、助手回复、工具调用、工具结果、通知、错误和扩展 UI
- **编辑器（Editor）** —— 输入区域，边框颜色反映当前 thinking level
- **底部栏（Footer）** —— 显示工作目录、会话名称、Token/缓存使用、成本、上下文使用量和当前模型

内置面板（如 `/settings`）或自定义扩展 UI 可以临时替换编辑器。

### 编辑器功能

| 功能 | 操作 |
|---|---|
| 文件引用 | 输入 `@` 来模糊搜索项目文件 |
| 路径补全 | 按 Tab 补全路径 |
| 多行输入 | Shift+Enter（Windows Terminal 上为 Ctrl+Enter） |
| 图像 | Ctrl+V 粘贴（Windows 为 Alt+V），或拖入终端 |
| Shell 命令 | `!command` 执行命令，输出发送给模型 |
| 隐藏 Shell 命令 | `!!command` 执行命令但不发送输出给模型 |
| 外部编辑器 | Ctrl+G 打开 `$VISUAL` 或 `$EDITOR` |

## 斜杠命令（Slash Commands）

在编辑器中输入 `/` 会打开命令补全。扩展可以注册自定义命令，Skills 以 `/skill:name` 形式出现，Prompt 模板以 `/templatename` 展开。

可用命令：

- `/login`、`/logout` —— 管理 OAuth 或 API Key 凭证
- `/model` —— 切换模型
- `/scoped-models` —— 启用/禁用 Ctrl+P 循环的模型
- `/settings` —— thinking level、主题、消息传递、传输
- `/resume` —— 从历史会话中选择
- `/new` —— 开始新会话
- `/name <name>` —— 设置会话显示名称
- `/session` —— 显示会话文件、ID、消息数、Token 和费用
- `/tree` —— 跳转到会话中的任意点并继续
- `/fork` —— 从先前的用户消息创建新会话
- `/clone` —— 将当前活跃分支复制到新会话
- `/compact [prompt]` —— 手动压缩上下文，可选自定义指令
- `/copy` —— 复制最后一条助手消息到剪贴板
- `/export [file]` —— 导出会话为 HTML
- `/share` —— 上传为私有 GitHub Gist，附带可分享的 HTML 链接
- `/reload` —— 重新加载快捷键、扩展、Skills、Prompt 和上下文文件
- `/hotkeys` —— 显示所有键盘快捷键
- `/changelog` —— 显示版本历史
- `/quit` —— 退出 Pi

## 消息队列

在 Agent 仍在工作时可以提交消息：

- **Enter** 将 steering 消息加入队列，在当前助手回合完成工具调用后投递
- **Alt+Enter** 将 follow-up 消息加入队列，在 Agent 完成所有工作后投递
- **Escape** 中断并将队列消息恢复到编辑器
- **Alt+Up** 将队列消息取回编辑器

在 Windows Terminal 上，Alt+Enter 默认为全屏，可在 Terminal 设置中重新映射。投递行为可通过 Settings 中的 `steeringMode` 和 `followUpMode` 配置。

## 会话（Sessions）

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择会话
pi --no-session        # 临时模式，不保存
pi --session <path|id> # 使用特定会话文件或会话 ID
pi --fork <path|id>    # 从会话分叉到新会话文件
```

## 上下文文件

Pi 在启动时加载 `AGENTS.md` 或 `CLAUDE.md`：

- `~/.pi/agent/AGENTS.md` —— 全局指令
- 从当前工作目录向上遍历的父目录
- 当前目录

使用 `--no-context-files` 或 `-nc` 禁用加载。

### 系统 Prompt 文件

使用 `.pi/SYSTEM.md` 替换项目默认系统 Prompt，或 `~/.pi/agent/SYSTEM.md` 全局替换。使用 `APPEND_SYSTEM.md` 在相同位置追加而不替换。

## 导出和分享会话

`/export [file]` 将会话写入 HTML 文件。`/share` 上传为私有 GitHub Gist 并附带可分享链接。

## CLI 参考

```
pi [options] [@files...] [messages...]
```

### 模式

| 标志 | 说明 |
|---|---|
| 默认 | 交互模式 |
| `-p`、`--print` | 打印响应并退出 |
| `--mode json` | 将所有事件输出为 JSON 行 |
| `--mode rpc` | stdin/stdout RPC 模式 |
| `--export <in> [out]` | 导出会话为 HTML |

### 模型选项

- `--provider <name>` —— Provider，如 `anthropic`、`openai`、`google`
- `--model <pattern>` —— 模型模式或 ID，支持 `provider/id` 和可选的 `:<thinking>`
- `--api-key <key>` —— API Key，覆盖环境变量
- `--thinking <level>` —— `off`、`minimal`、`low`、`medium`、`high`、`xhigh`
- `--models <patterns>` —— 逗号分隔的 Ctrl+P 循环模型
- `--list-models [search]` —— 列出可用模型

### 会话选项

- `-c`、`--continue` —— 继续最近会话
- `-r`、`--resume` —— 浏览并选择会话
- `--session <path|id>` —— 使用特定会话
- `--fork <path|id>` —— 从会话分叉
- `--no-session` —— 临时模式，不保存

### 工具选项

- `--tools <list>`、`-t <list>` —— 白名单指定工具
- `--no-builtin-tools`、`-nbt` —— 禁用内置工具
- `--no-tools`、`-nt` —— 禁用所有工具

内置工具：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`。

### 资源选项

- `-e`、`--extension <source>` —— 加载扩展
- `--no-extensions` —— 禁用扩展发现
- `--skill <path>` —— 加载 Skill
- `--no-skills` —— 禁用 Skill 发现
- `--prompt-template <path>` —— 加载 Prompt 模板
- `--no-prompt-templates` —— 禁用 Prompt 模板发现
- `--theme <path>` —— 加载主题
- `--no-themes` —— 禁用主题发现
- `--no-context-files`、`-nc` —— 禁用上下文文件

### 环境变量

| 变量 | 说明 |
|---|---|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录（默认 `~/.pi/agent`） |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储目录 |
| `PI_PACKAGE_DIR` | 覆盖包目录 |
| `PI_OFFLINE` | 禁用启动时的网络操作 |
| `PI_SKIP_VERSION_CHECK` | 跳过版本更新检查 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测 |
| `PI_CACHE_RETENTION` | 设置为 `long` 以启用扩展缓存 |
| `VISUAL`、`EDITOR` | Ctrl+G 使用的外部编辑器 |

## 设计原则

Pi 将核心保持小巧，将工作流相关的行为推到扩展、Skills、Prompt 模板和包中。它有意省略了内置的 MCP、子 Agent、权限弹窗、Plan 模式、待办事项和后台 Bash。用户可以将这些作为扩展或包来构建或安装。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
