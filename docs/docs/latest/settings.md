# Settings（设置）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/settings) 的中文翻译。仅供学习参考。

Pi 使用 JSON 设置文件，项目级配置优先于全局配置。

| 位置                        | 作用域           |
| --------------------------- | ---------------- |
| `~/.pi/agent/settings.json` | 全局（所有项目） |
| `.pi/settings.json`         | 项目（当前目录） |

可以直接编辑文件，或使用 `/settings` 进行常用选项配置。

## 项目信任

在交互式启动时，如果项目目录包含项目本地设置、资源或项目 `.agents/skills`，且在 `~/.pi/agent/trust.json` 中该目录或父目录没有已保存的决策，Pi 会询问是否信任该目录。信任项目后，Pi 可以加载 `.pi/settings.json` 和 `.pi` 资源、自动安装缺失的项目包，并执行项目扩展。

非交互模式（`-p`、`--mode json` 和 `--mode rpc`）不显示信任提示。在没有适用的已保存信任决策时，它们使用全局设置中的 `defaultProjectTrust`：`ask`（默认）和 `never` 忽略这些项目资源，而 `always` 则信任它们。传入 `--approve`/`-a` 或 `--no-approve`/`-na` 可在单次运行中覆盖项目信任。

如果没有扩展或已保存决策适用，则由 `defaultProjectTrust` 控制回退行为。可在 `~/.pi/agent/settings.json` 中将其设置为 `"ask"`、`"always"` 或 `"never"`，或通过 `/settings` 更改。

`pi config` 与包命令使用相同的项目信任流程，但 `pi update` 从不进行提示。传入 `--approve` 即可在单次命令中信任项目本地设置，或传入 `--no-approve` 忽略它们。

在交互模式中使用 `/trust` 保存项目的信任决策以供未来会话使用，包括对直接父目录的信任。该命令仅写入 `~/.pi/agent/trust.json`；当前会话不会重新加载，需要重启 Pi 才能使更改生效。

## 所有设置项

### 模型和思维（Model & Thinking）

| 设置项                 | 类型    | 默认值  | 说明                                                           |
| ---------------------- | ------- | ------- | -------------------------------------------------------------- |
| `defaultProvider`      | string  | -       | 默认 Provider，如 `"anthropic"`、`"openai"`                    |
| `defaultModel`         | string  | -       | 默认模型 ID                                                    |
| `defaultThinkingLevel` | string  | -       | `"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"` |
| `hideThinkingBlock`    | boolean | `false` | 是否隐藏 thinking block                                        |
| `thinkingBudgets`      | object  | -       | 每个 thinking level 的自定义 Token 预算                        |

#### thinkingBudgets

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

| 设置项                   | 类型    | 默认值                                                               | 说明                                                                                      |
| ------------------------ | ------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `theme`                  | string  | `"dark"`                                                             | 主题名称（`"dark"`、`"light"` 或自定义）                                                  |
| `externalEditor`         | string  | `$VISUAL`，然后是 `$EDITOR`，Windows 上为 Notepad，其他平台为 `nano` | Ctrl+G 外部编辑器命令；优先级高于环境变量                                                 |
| `quietStartup`           | boolean | `false`                                                              | 隐藏启动头部                                                                              |
| `defaultProjectTrust`    | string  | `"ask"`                                                              | 回退项目信任行为：`"ask"`、`"always"` 或 `"never"`。仅作为全局设置                        |
| `collapseChangelog`      | boolean | `false`                                                              | 更新后显示精简的 changelog                                                                |
| `enableInstallTelemetry` | boolean | `true`                                                               | 首次安装或 changelog 检测到更新时发送匿名安装/更新版本 ping。这不控制更新检查             |
| `enableAnalytics`        | boolean | `false`                                                              | 选择加入的数据分析共享。目前仅在实验性首次设置流程中询问（`PI_EXPERIMENTAL=1`）           |
| `trackingId`             | string  | -                                                                    | 数据分析追踪标识符，在开启 `enableAnalytics` 时自动生成                                   |
| `doubleEscapeAction`     | string  | `"tree"`                                                             | 双击 Esc 的行为：`"tree"`、`"fork"` 或 `"none"`                                           |
| `treeFilterMode`         | string  | `"default"`                                                          | `/tree` 的默认过滤器：`"default"`、`"no-tools"`、`"user-only"`、`"labeled-only"`、`"all"` |
| `editorPaddingX`         | number  | `0`                                                                  | 编辑器水平内边距（0-3）                                                                   |
| `outputPad`              | number  | `1`                                                                  | 用户消息、助手消息和 thinking 的水平内边距（0 或 1）                                      |
| `autocompleteMaxVisible` | number  | `5`                                                                  | 自动补全下拉框最大可见项（3-20）                                                          |
| `showHardwareCursor`     | boolean | `false`                                                              | TUI 为 IME 输入法定位时显示终端硬件光标                                                   |

对于 VS Code，请包含 `--wait` 以便编辑器退出后 Pi 恢复：

```json
{
  "externalEditor": "code --wait"
}
```

### 遥测和更新检查

`enableInstallTelemetry` 仅控制发送到 `https://pi.dev/api/report-install` 的匿名安装/更新 ping。退出遥测不会禁用更新检查；Pi 仍然可以获取 `https://pi.dev/api/latest-version` 以查找最新版本。

设置 `PI_SKIP_VERSION_CHECK=1` 以禁用 Pi 版本更新检查。使用 `--offline` 或 `PI_OFFLINE=1` 以禁用此处描述的所有启动时网络操作，包括更新检查、包更新检查和安装/更新遥测。

### 网络

| 设置项      | 类型   | 默认值 | 说明                                                                   |
| ----------- | ------ | ------ | ---------------------------------------------------------------------- |
| `httpProxy` | string | -      | HTTP 代理 URL，作为 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用。仅限全局设置。 |

```json
{
  "httpProxy": "http://127.0.0.1:7890"
}
```

### Warnings（警告）

| 设置项                         | 类型    | 默认值 | 说明                                                |
| ------------------------------ | ------- | ------ | --------------------------------------------------- |
| `warnings.anthropicExtraUsage` | boolean | `true` | 当 Anthropic 订阅认证可能使用付费额外使用时显示警告 |

```json
{
  "warnings": {
    "anthropicExtraUsage": false
  }
}
```

### Compaction（压缩）

| 设置项                        | 类型    | 默认值  | 说明                       |
| ----------------------------- | ------- | ------- | -------------------------- |
| `compaction.enabled`          | boolean | `true`  | 启用自动压缩               |
| `compaction.reserveTokens`    | number  | `16384` | 为 LLM 响应预留的 Token    |
| `compaction.keepRecentTokens` | number  | `20000` | 保留的最近 Token（不总结） |

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

### Branch Summary（分支摘要）

| 设置项                        | 类型    | 默认值  | 说明                                                    |
| ----------------------------- | ------- | ------- | ------------------------------------------------------- |
| `branchSummary.reserveTokens` | number  | `16384` | 分支摘要预留的 Token                                    |
| `branchSummary.skipPrompt`    | boolean | `false` | 跳过 `/tree` 导航时的"摘要分支？"提示（默认不生成摘要） |

### Retry（重试）

| 设置项                           | 类型    | 默认值   | 说明                                       |
| -------------------------------- | ------- | -------- | ------------------------------------------ |
| `retry.enabled`                  | boolean | `true`   | 启用自动 Agent 级别重试（针对瞬态错误）    |
| `retry.maxRetries`               | number  | `3`      | 最大 Agent 级别重试次数                    |
| `retry.baseDelayMs`              | number  | `2000`   | Agent 级别指数退避的基础延迟（2s、4s、8s） |
| `retry.provider.timeoutMs`       | number  | SDK 默认 | Provider/SDK 请求超时（毫秒）              |
| `retry.provider.maxRetries`      | number  | `0`      | Provider/SDK 重试次数                      |
| `retry.provider.maxRetryDelayMs` | number  | `60000`  | 最大服务器请求延迟，超时则直接失败（60s）  |

当 Provider 请求的重试延迟超过 `retry.provider.maxRetryDelayMs` 时（例如 Google 的"配额将在 5 小时后重置"），请求会立即失败并显示信息性错误，而不是静默等待。设为 `0` 可禁用此上限。

除非明确需要 Provider 级别重试，否则请保持 `retry.provider.maxRetries` 为 `0`。将其设为大于 `0` 可能导致 SDK/Provider 重试在 Pi 处理之前就处理了用量超限错误，在某些情况下可能会阻塞 Agent 直到 Provider 配额重置。

```json
{
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "baseDelayMs": 2000,
    "provider": {
      "timeoutMs": 3600000,
      "maxRetries": 0,
      "maxRetryDelayMs": 60000
    }
  }
}
```

### 消息传递

| 设置项                      | 类型   | 默认值            | 说明                                                                                             |
| --------------------------- | ------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `steeringMode`              | string | `"one-at-a-time"` | Steering 消息投递方式：`"all"` 或 `"one-at-a-time"`                                              |
| `followUpMode`              | string | `"one-at-a-time"` | Follow-up 消息投递方式：`"all"` 或 `"one-at-a-time"`                                             |
| `transport`                 | string | `"auto"`          | 支持多种传输的 Provider 的首选传输方式：`"sse"`、`"websocket"`、`"websocket-cached"` 或 `"auto"` |
| `httpIdleTimeoutMs`         | number | `300000`          | HTTP 头部/正文空闲超时（毫秒），也用于具有显式流空闲超时的 Provider。设为 0 禁用                 |
| `websocketConnectTimeoutMs` | number | `15000`           | WebSocket 连接/握手超时（毫秒），用于支持 WebSocket 传输的 Provider。设为 0 禁用                 |

### 终端和图像

| 设置项                     | 类型    | 默认值  | 说明                               |
| -------------------------- | ------- | ------- | ---------------------------------- |
| `terminal.showImages`      | boolean | `true`  | 在终端显示图像（如支持）           |
| `terminal.imageWidthCells` | number  | `60`    | 图像宽度（终端单元格）             |
| `terminal.clearOnShrink`   | boolean | `false` | 内容缩小时清除空行（可能导致闪烁） |
| `images.autoResize`        | boolean | `true`  | 自动调整图像大小至最大 2000x2000   |
| `images.blockImages`       | boolean | `false` | 阻止所有图像发送给 LLM             |

### Shell

| 设置项               | 类型     | 默认值 | 说明                                                                              |
| -------------------- | -------- | ------ | --------------------------------------------------------------------------------- |
| `shellPath`          | string   | -      | 自定义 shell 路径（例如 Windows 上的 Cygwin）                                     |
| `shellCommandPrefix` | string   | -      | 每个 bash 命令前添加的前缀（例如 `"shopt -s expand_aliases"`）                    |
| `npmCommand`         | string[] | -      | npm 包查找/安装操作的命令 argv（例如 `["mise", "exec", "node@20", "--", "npm"]`） |

```json
{
  "npmCommand": ["mise", "exec", "node@20", "--", "npm"]
}
```

`npmCommand` 用于所有 npm 包管理器操作，包括安装、卸载和 git 包内的依赖安装。用户范围的 npm 包安装在 `~/.pi/agent/npm/` 下；项目范围的 npm 包安装在 `.pi/npm/` 下。使用与进程实际启动一致的 argv 格式条目。配置 `npmCommand` 后，git 包依赖安装使用普通的 `install`，以避免包装器或替代包管理器中的 npm 特定标志。

### 会话

| 设置项       | 类型   | 默认值 | 说明                                           |
| ------------ | ------ | ------ | ---------------------------------------------- |
| `sessionDir` | string | -      | 会话文件存储目录。接受绝对或相对路径，以及 `~` |

```json
{ "sessionDir": ".pi/sessions" }
```

当多个来源指定会话目录时，优先级为：`--session-dir`、`PI_CODING_AGENT_SESSION_DIR`、settings.json 中的 `sessionDir`。

### 模型循环

| 设置项          | 类型     | 默认值 | 说明                                                    |
| --------------- | -------- | ------ | ------------------------------------------------------- |
| `enabledModels` | string[] | -      | Ctrl+P 循环的模型模式（与 `--models` CLI 标志格式相同） |

```json
{
  "enabledModels": ["claude-*", "gpt-4o", "gemini-2*"]
}
```

### Markdown

| 设置项                     | 类型   | 默认值 | 说明       |
| -------------------------- | ------ | ------ | ---------- |
| `markdown.codeBlockIndent` | string | `"  "` | 代码块缩进 |

### 资源

这些设置定义了扩展、Skills、Prompt 和主题的加载位置。

`~/.pi/agent/settings.json` 中的路径相对于 `~/.pi/agent` 解析。`.pi/settings.json` 中的路径相对于 `.pi` 解析。支持绝对路径和 `~`。

| 设置项                | 类型     | 默认值 | 说明                                |
| --------------------- | -------- | ------ | ----------------------------------- |
| `packages`            | array    | `[]`   | 要加载资源的 npm/git 包             |
| `extensions`          | string[] | `[]`   | 本地扩展文件路径或目录              |
| `skills`              | string[] | `[]`   | 本地 Skill 文件路径或目录           |
| `prompts`             | string[] | `[]`   | 本地 Prompt 模板路径或目录          |
| `themes`              | string[] | `[]`   | 本地主题文件路径或目录              |
| `enableSkillCommands` | boolean  | `true` | 将 Skills 注册为 `/skill:name` 命令 |

数组支持 glob 模式和排除。使用 `!pattern` 排除。使用 `+path` 强制包含精确路径，使用 `-path` 强制排除精确路径。

#### packages

字符串形式加载包的所有资源：

```json
{
  "packages": ["pi-skills", "@org/my-extension"]
}
```

对象形式过滤要加载的资源：

```json
{
  "packages": [
    {
      "source": "pi-skills",
      "skills": ["brave-search", "transcribe"],
      "extensions": []
    }
  ]
}
```

包管理详情请参阅 [packages.md](packages.md)。

## 示例

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

## 项目覆盖

项目设置（`.pi/settings.json`）覆盖全局设置。嵌套对象会合并：

```json
// ~/.pi/agent/settings.json (global)
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 16384 }
}

// .pi/settings.json (project)
{
  "compaction": { "reserveTokens": 8192 }
}

// Result
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 8192 }
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
