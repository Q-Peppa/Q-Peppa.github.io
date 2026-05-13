# Settings

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/settings) 的中文翻译。仅供学习参考。

Pi 使用 JSON 设置文件，项目级配置优先于全局配置。

- **全局设置位置**：`~/.pi/agent/settings.json`
- **项目设置位置**：`.pi/settings.json`（当前目录）

可以直接编辑文件，或使用 `/settings` 进行常用选项配置。

## 所有设置项

### 模型和思维（Model & Thinking）

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultProvider` | string | - | 默认 Provider，如 `"anthropic"`、`"openai"` |
| `defaultModel` | string | - | 默认模型 ID |
| `defaultThinkingLevel` | string | - | `"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"` |
| `hideThinkingBlock` | boolean | `false` | 是否隐藏 thinking block |
| `thinkingBudgets` | object | - | 每个 thinking level 的自定义 Token 预算 |

```json
{
  "thinkingBudgets": {
    "minimal": 1024,
    "low": 4096,
    "medium": 10240,
    "high": 32768
  }
}
```

### UI 和显示

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `theme` | string | `"dark"` | `"dark"`、`"light"` 或自定义主题名 |
| `quietStartup` | boolean | `false` | 隐藏启动头部 |
| `collapseChangelog` | boolean | `false` | 更新的 changelog 折叠显示 |
| `enableInstallTelemetry` | boolean | `true` | 匿名安装/更新版本 ping |
| `doubleEscapeAction` | string | `"tree"` | 双击 Esc 行为：`"tree"`、`"fork"`、`"none"` |
| `treeFilterMode` | string | `"default"` | `/tree` 默认过滤器 |
| `editorPaddingX` | number | `0` | 编辑器水平内边距（0-3） |
| `autocompleteMaxVisible` | number | `5` | 自动补全下拉最大可见项（3-20） |
| `showHardwareCursor` | boolean | `false` | 显示终端硬件光标 |

### 遥测和更新检查

`enableInstallTelemetry` 仅控制发送到 `https://pi.dev/api/report-install` 的匿名安装 ping。退出遥测不会影响版本检查。禁用版本更新检查设置 `PI_SKIP_VERSION_CHECK=1`。禁用所有启动网络操作使用 `--offline` 或 `PI_OFFLINE=1`。

### Compaction（压缩）

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `compaction.enabled` | boolean | `true` | 启用自动压缩 |
| `compaction.reserveTokens` | number | `16384` | 为 LLM 响应保留的 Token |
| `compaction.keepRecentTokens` | number | `20000` | 保留的最近 Token（不总结） |

### Branch Summary（分支摘要）

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `branchSummary.reserveTokens` | number | `16384` | 分支摘要保留的 Token |
| `branchSummary.skipPrompt` | boolean | `false` | 跳过摘要提示 |

### Retry（重试）

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `retry.enabled` | boolean | `true` | 启用自动重试 |
| `retry.maxRetries` | number | `3` | 最大重试次数 |
| `retry.baseDelayMs` | number | `2000` | 指数退避基础延迟 |
| `retry.provider.timeoutMs` | number | SDK 默认 | Provider/SDK 请求超时 |
| `retry.provider.maxRetries` | number | SDK 默认 | Provider/SDK 重试次数 |
| `retry.provider.maxRetryDelayMs` | number | `60000` | 最大服务器请求延迟，超时则直接失败 |

### 消息传递

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `steeringMode` | string | `"one-at-a-time"` | Steering 消息投递方式 |
| `followUpMode` | string | `"one-at-a-time"` | Follow-up 消息投递方式 |
| `transport` | string | `"sse"` | 首选传输方式：`"sse"`、`"websocket"`、`"auto"` |

### 终端和图像

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `terminal.showImages` | boolean | `true` | 在终端显示图像 |
| `terminal.imageWidthCells` | number | `60` | 图像宽度（终端单元格） |
| `images.autoResize` | boolean | `true` | 自动调整图像大小 |
| `images.blockImages` | boolean | `false` | 阻止所有图像发送给 LLM |

### Shell

| 设置项 | 类型 | 说明 |
|---|---|---|
| `shellPath` | string | 自定义 shell 路径 |
| `shellCommandPrefix` | string | 每个 bash 命令前添加的前缀 |
| `npmCommand` | string[] | npm 操作的命令 argv |

### 会话

| 设置项 | 类型 | 说明 |
|---|---|---|
| `sessionDir` | string | 会话文件目录 |

优先级：`--session-dir` 标志 > `PI_CODING_AGENT_SESSION_DIR` 环境变量 > settings.json 中的 `sessionDir`。

### 模型循环

```json
{
  "enabledModels": ["claude-*", "gpt-4o", "gemini-2*"]
}
```

### 资源

- `packages` —— npm/git 包
- `extensions` —— 本地扩展路径
- `skills` —— 本地 Skill 路径
- `prompts` —— 本地 Prompt 模板路径
- `themes` —— 本地主题路径
- `enableSkillCommands` —— 将 Skills 注册为 `/skill:name` 命令

### 完整设置文件示例

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium",
  "theme": "dark",
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  },
  "retry": {
    "enabled": true,
    "maxRetries": 3
  },
  "enabledModels": ["claude-*", "gpt-4o"],
  "warnings": {
    "anthropicExtraUsage": true
  },
  "packages": ["pi-skills"]
}
```

### 项目覆盖

项目设置（`.pi/settings.json`）覆盖全局设置，嵌套对象会合并而非完全替换。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
