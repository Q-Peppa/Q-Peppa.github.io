# 设置参考

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/settings) 的中文翻译。仅供学习参考。

本参考列出用户可配置的设置项、它们的类型、默认值和用途。项目设置覆盖 agent 目录设置。资源列表会合并。文件位置和信任行为见[配置](configuration.md)。

## 模型与 thinking

<a id="model-cycling"></a>

| 设置                   | 类型                                                                    | 默认值        | 说明                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `defaultProvider`      | string                                                                  | 自动          | 启动时的 AI Provider。                                                                                |
| `defaultModel`         | string                                                                  | 自动          | 启动时的模型 ID。                                                                                     |
| `defaultThinkingLevel` | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "max"` | `"medium"`    | 启动时的 thinking level。                                                                             |
| `modelThinkingLevels`  | object                                                                  | 无            | 按模型设置启动 thinking level，键为精确的 `provider/modelId`。                                        |
| `thinkingBudgets`      | object                                                                  | 内置预算      | `minimal`、`low`、`medium` 和 `high` thinking level 的 Token 预算。                                   |
| `enabledModels`        | `string[]`                                                              | 所有可用模型  | 用于启动选择和模型循环的模型匹配模式。格式与 `--models` 相同。                                        |
| `hideThinkingBlock`    | boolean                                                                 | `false`       | 在转录中隐藏 thinking 块。                                                                            |
| `showCacheMissNotices` | boolean                                                                 | `false`       | 显示明显缓存未命中、缓存预热成功、压缩用量和 Provider 恢复的通知。                                    |
| `cacheWarming`         | `"off" \| "streaming" \| "idle"`                                        | `"streaming"` | 在活动运行期间保持符合条件的 Provider Prompt 缓存温暖；设为 `"idle"` 时在运行之间保持。仅限全局设置。 |

缓存预热只在模型声明了缓存时长，且 Pi 估计可避免至少 $0.05 缓存未命中成本时运行。刷新用量计入会话总量，但不进入模型上下文。`/session` 显示下一次决策；扩展可以用 `cache_warming_decision` 覆盖它。见 [Prompt 缓存时长](models.md#prompt-cache-lifetimes)。

模型选择和 thinking 控制见[选择模型](models.md)。

## 交互

| 设置                  | 类型                                                                | 默认值                               | 说明                                                  |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `steeringMode`        | `"all" \| "one-at-a-time"`                                          | `"one-at-a-time"`                    | 排队 steering 消息的投递方式。                        |
| `followUpMode`        | `"all" \| "one-at-a-time"`                                          | `"one-at-a-time"`                    | 排队 follow-up 消息的投递方式。                       |
| `externalEditor`      | string                                                              | `$VISUAL`、`$EDITOR`，然后是平台默认 | 外部编辑器快捷键打开的命令。                          |
| `doubleEscapeAction`  | `"tree" \| "fork" \| "none"`                                        | `"tree"`                             | 编辑器为空时双击 Escape 的动作。                      |
| `treeFilterMode`      | `"default" \| "no-tools" \| "user-only" \| "labeled-only" \| "all"` | `"default"`                          | `/tree` 使用的初始过滤器。                            |
| `defaultProjectTrust` | `"ask" \| "always" \| "never"`                                      | `"ask"`                              | 回退的项目信任行为。**只能在 agent 目录设置中设置。** |

<a id="tools"></a>

## 工具

| 设置                    | 类型               | 默认值                          | 说明                                                                                                                                                                                                                                          |
| ----------------------- | ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTools`          | `string[]`         | `read`、`bash`、`edit`、`write` | 启动时启用的工具。普通名称会替换默认列表；`+name` 添加一个工具，`-name` 移除一个。空数组会禁用所有内置工具，但不会禁用扩展或 SDK 工具。                                                                                                       |
| `codemode.mode`         | `"on"` \| `"only"` | `"on"`                          | `codemode` 工具在激活时如何呈现工具。`on`：已声明的工具会把如何从脚本调用它们的说明追加到描述，`codemode` 只列出未声明的工具。`only`：`codemode` 列出脚本能调用的每个工具，活动的内置和扩展工具对模型隐藏，因此模型通过 `codemode` 到达它们。 |
| `codemode.inlineBudget` | number             | `3000`                          | `codemode` 工具描述可用于工具声明的估计 Token（字符数 / 4）。放不下的工具会被省略，用 `searchTools()` 查找。`0` 只列出 namespace。                                                                                                            |

可用的内置工具是 `read`、`bash`、`powershell`、`edit`、`write`、`grep`、`find` 和 `ls`。`defaultTools` 也可以写出 `codemode` 和 `tool_search`（内置扩展以未激活状态注册它们），以及其他以未激活状态注册的扩展工具。

只含 `+name` 和 `-name` 的列表会改动继承的选择，而不是替换它。例如，这样会在默认工具旁边启用 `codemode`：

```json
{
  "defaultTools": ["+codemode"]
}
```

这会把 `bash` 换成 `powershell` 并启用 `grep`：`["-bash", "+powershell", "+grep"]`。项目设置叠加在用户设置之上：只含 `+name` 和 `-name` 的项目列表会改动用户的选择；含普通名称的项目列表会替换它。在同一个列表中，普通名称构成选择，然后按顺序应用 `+name` 和 `-name`。

`/reload` 会启用 `defaultTools` 中新加入的工具。它不会禁用从中移除的工具，也不会重新启用你关掉且未改动的工具。`--tools`、`--no-tools` 和 `--no-builtin-tools` 覆盖 `defaultTools`，reload 时也是如此。

CLI 工具选项会为单次调用覆盖该设置；`--tools` 不接受 `+name` 或 `-name`。见[命令行](cli.md#tools)。

## 会话与上下文

| 设置         | 类型   | 默认值         | 说明                                                                                                |
| ------------ | ------ | -------------- | --------------------------------------------------------------------------------------------------- |
| `sessionDir` | string | agent 会话目录 | 会话存储目录。相对路径从工作目录解析。`PI_CODING_AGENT_SESSION_DIR` 和 `--session-dir` 覆盖该设置。 |

### 压缩

| 设置                          | 类型    | 默认值  | 说明                                                 |
| ----------------------------- | ------- | ------- | ---------------------------------------------------- |
| `compaction.enabled`          | boolean | `true`  | 启用自动压缩。                                       |
| `compaction.reserveTokens`    | number  | `16384` | 为模型响应保留的 Token。                             |
| `compaction.keepRecentTokens` | number  | `20000` | 不摘要而保留的近期 Token。                           |
| `compaction.modelOverrides`   | object  | 无      | 按模型设置 Token 值，键为精确的 `provider/modelId`。 |

<a id="per-model-compaction-overrides"></a>

压缩 Token 值必须是非负安全整数。每个值独立解析：先取匹配的模型覆盖，再取普通压缩设置，最后取内置默认值。项目和用户对象在查找模型之前合并。

触发、摘要和校验行为见[压缩参考](compaction.md)。

### 分支摘要

| 设置                          | 类型    | 默认值  | 说明                                  |
| ----------------------------- | ------- | ------- | ------------------------------------- |
| `branchSummary.reserveTokens` | number  | `16384` | 摘要分支历史时保留的 Token。          |
| `branchSummary.skipPrompt`    | boolean | `false` | 跳过分支摘要 Prompt，默认不生成摘要。 |

## 终端与显示

| 设置                            | 类型                                     | 默认值         | 说明                                                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`                         | string                                   | `"system"`     | 内置或自定义主题名。`system` 从终端主题派生颜色。                                                                                                                                                                     |
| `quietStartup`                  | boolean \| `"header"`                    | `false`        | `true` 隐藏启动头部和已加载资源列表。`"header"` 保留头部（版本和快捷键提示），但隐藏模型范围行和已加载资源列表。                                                                                                      |
| `tuiMode`                       | `"regular" \| "fullscreen"`              | `"fullscreen"` | 交互式终端 UI 模式。                                                                                                                                                                                                  |
| `fullscreenExitOutput`          | `"transcript" \| "resume-hint"`          | `"transcript"` | 全屏模式退出时打印的输出。                                                                                                                                                                                            |
| `fullscreenScrollbar`           | `"auto" \| "always" \| "hidden"`         | `"auto"`       | 全屏转录滚动条行为。                                                                                                                                                                                                  |
| `fullscreenCopyOnSelect`        | boolean                                  | `true`         | 全屏模式下自动复制选中的文本。                                                                                                                                                                                        |
| `fullscreenWheelScrollLines`    | `"auto"` \| number                       | `"auto"`       | 全屏模式下每次鼠标滚轮事件滚动的行数，从 1 到 100。`"auto"` 在本地 macOS 终端每次事件滚动一行（这些终端已经会加速滚轮和触控板输入）；其他地方以及 SSH 上，会把快速滚轮加速到每次事件最多 6 行。Alt+滚轮移动五倍距离。 |
| `editorPaddingX`                | number                                   | `0`            | 编辑器水平内边距，从 0 到 3 个单元格。                                                                                                                                                                                |
| `outputPad`                     | `0 \| 1`                                 | `1`            | 转录的水平内边距。                                                                                                                                                                                                    |
| `autocompleteMaxVisible`        | number                                   | `5`            | 可见的自动补全条目数，从 3 到 20。                                                                                                                                                                                    |
| `showHardwareCursor`            | boolean                                  | `false`        | Pi 为输入法定位光标时显示终端光标。                                                                                                                                                                                   |
| `terminal.showImages`           | boolean                                  | `true`         | 受支持时显示内联图片。                                                                                                                                                                                                |
| `terminal.imageWidthCells`      | number                                   | `60`           | 内联图片首选的宽度（终端单元格）。                                                                                                                                                                                    |
| `terminal.clearOnShrink`        | boolean                                  | `false`        | 渲染内容收缩时清空空行。                                                                                                                                                                                              |
| `terminal.showTerminalProgress` | boolean                                  | `false`        | 在终端标签页显示 OSC 9;4 进度。                                                                                                                                                                                       |
| `terminal.hyperlinks`           | `boolean \| "auto"`                      | `"auto"`       | 覆盖 OSC 8 超链接检测。                                                                                                                                                                                               |
| `terminal.images`               | `"kitty" \| "iterm2" \| "auto" \| false` | `"auto"`       | 覆盖内联图片协议检测。                                                                                                                                                                                                |
| `terminal.trueColor`            | `boolean \| "auto"`                      | `"auto"`       | 覆盖 true-color 检测。                                                                                                                                                                                                |
| `images.autoResize`             | boolean                                  | `true`         | 发送给模型之前把图片缩放到不超过 2000 × 2000 像素。                                                                                                                                                                   |
| `images.blockImages`            | boolean                                  | `false`        | 阻止图片发送给模型。                                                                                                                                                                                                  |
| `markdown.codeBlockIndent`      | string                                   | `"  "`         | 用于缩进渲染代码块的前缀。                                                                                                                                                                                            |
| `markdown.mermaid`              | `"off" \| "final" \| "streaming"`        | `"streaming"`  | Mermaid 渲染模式。                                                                                                                                                                                                    |

格式和平台细节见[主题](themes.md)和[终端设置](terminal-setup.md)。

## 网络与重试

| 设置                             | 类型                                                   | 默认值              | 说明                                                                                                         |
| -------------------------------- | ------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`                      | `"auto" \| "sse" \| "websocket" \| "websocket-cached"` | `"auto"`            | 支持多种传输的 AI Provider 的首选传输方式。                                                                  |
| `httpProxy`                      | string                                                 | 无                  | 作为 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用于 Pi 管理的 HTTP 客户端的代理 URL。**只能在 agent 目录设置中设置。** |
| `httpIdleTimeoutMs`              | number                                                 | `300000`            | HTTP header 和正文空闲超时（毫秒）。设为 `0` 禁用。                                                          |
| `websocketConnectTimeoutMs`      | number                                                 | `15000`             | WebSocket 连接超时（毫秒）。设为 `0` 禁用。                                                                  |
| `retry.enabled`                  | boolean                                                | `true`              | 对临时故障启用 Agent 级自动重试。                                                                            |
| `retry.maxRetries`               | number                                                 | `3`                 | Agent 级最大重试次数。                                                                                       |
| `retry.baseDelayMs`              | number                                                 | `2000`              | 初始指数退避延迟（毫秒）。                                                                                   |
| `retry.maxAgentDelayMs`          | number                                                 | `60000`             | Agent 级最大重试延迟（毫秒）。                                                                               |
| `retry.provider.timeoutMs`       | number                                                 | `httpIdleTimeoutMs` | Provider 请求超时（毫秒）。                                                                                  |
| `retry.provider.maxRetries`      | number                                                 | `0`                 | Provider 级重试次数。                                                                                        |
| `retry.provider.maxRetryDelayMs` | number                                                 | `60000`             | 服务器请求的最大延迟（毫秒）。设为 `0` 禁用该限制。                                                          |

除非确实需要 Provider 级重试，否则请让 `retry.provider.maxRetries` 保持为 `0`。Provider 重试会延迟 Pi 自行处理配额和用量限制错误。

## Shell

| 设置                 | 类型       | 默认值   | 说明                                          |
| -------------------- | ---------- | -------- | --------------------------------------------- |
| `shellPath`          | string     | 平台默认 | 自定义 Shell 可执行文件路径。支持开头的 `~`。 |
| `shellCommandPrefix` | string     | 无       | 前置到每条 Shell 命令的前缀。                 |
| `npmCommand`         | `string[]` | `npm`    | 用于 npm 包查找和安装的命令及参数。           |

Shell 设置见 [Shell 别名](shell-aliases.md)，包管理器行为见 [Pi 包](packages.md)。

<a id="resources"></a>

## 资源

用户设置中的资源路径从 agent 目录解析。项目设置中的路径从项目 `.pi` 目录解析。支持绝对路径和 `~`。

| 设置                  | 类型       | 默认值 | 说明                                                 |
| --------------------- | ---------- | ------ | ---------------------------------------------------- |
| `packages`            | array      | `[]`   | npm、git 或本地 Pi 包来源。见 [Pi 包](packages.md)。 |
| `extensions`          | `string[]` | `[]`   | 扩展文件或目录。                                     |
| `skills`              | `string[]` | `[]`   | Skill 文件或目录。                                   |
| `prompts`             | `string[]` | `[]`   | Prompt 模板文件或目录。                              |
| `themes`              | `string[]` | `[]`   | 主题文件或目录。                                     |
| `enableSkillCommands` | boolean    | `true` | 把 Skill 注册为 `/skill:name` 命令。                 |

资源数组支持用 `!pattern` 做 glob 排除，用 `+path` 精确包含，用 `-path` 精确排除。Pi 会加载用户级和项目设置中列出的资源。

内置扩展在 `extensions` 中名为 `builtin:mcp`、`builtin:llama.cpp`、`builtin:codemode` 和 `builtin:tool-search`。它们默认加载；`-builtin:mcp` 禁用其中一个。项目设置中的 `+builtin:<name>` 或 `-builtin:<name>` 条目会覆盖用户设置。`pi config` 把它们列在 Built-in 下。`--no-extensions` 也会禁用它们，`-e builtin:<name>` 显式加载其中一个。

## 更新、遥测与警告

| 设置                           | 类型    | 默认值  | 说明                                                                 |
| ------------------------------ | ------- | ------- | -------------------------------------------------------------------- |
| `collapseChangelog`            | boolean | `false` | 更新后显示精简的 changelog。                                         |
| `enableInstallTelemetry`       | boolean | `true`  | 启用匿名安装/更新上报和选定的 Provider 归属 header。不控制更新检查。 |
| `enableAnalytics`              | boolean | `false` | 选择加入分析数据共享。目前只由实验性的首次运行设置使用。             |
| `warnings.anthropicExtraUsage` | boolean | `true`  | 当 Anthropic 订阅认证可能使用付费额外用量时警告。                    |

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
