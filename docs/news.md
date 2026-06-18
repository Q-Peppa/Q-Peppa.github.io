# 新闻

> Pi Coding Agent 及其子包的版本发布记录。

## v0.79.7（2026-06-18）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **自动主题模式** — `/settings` 现在可以选择独立的亮色和暗色主题，并跟随终端配色方案的变化。参见 [Selecting a Theme](/docs/latest/themes#selecting-a-theme)。
- **默认仅更新自身** — `pi update` 现在仅更新 pi，使用 `pi update --all` 可同时更新 pi 和扩展包。参见 [Install and Manage](/docs/latest/packages#install-and-manage)。
- **扩展 API 辅助工具** — 扩展可以使用 `CONFIG_DIR_NAME` 获取项目配置路径，并导入编辑差异辅助工具生成编辑式差异。参见 [`ctx.cwd`](/docs/latest/extensions#ctxcwd) 和 [SDK Exports](/docs/latest/sdk#exports)。
- **Warp 内联图片** — Warp 终端现在通过 Kitty 图形检测获得内联图片渲染。参见 [Image](/docs/latest/tui#image)。

新增

- 添加了自动主题模式，使 `/settings` 可以使用独立的亮色和暗色主题并跟随终端配色方案变化（[#5874](https://github.com/earendil-works/pi/pull/5874)）。
- 添加了继承的 Warp 终端图片能力检测，使内联图片通过 Warp 的 Kitty 图形支持渲染（[#5841](https://github.com/earendil-works/pi/pull/5841)，感谢 [@dodiego](https://github.com/dodiego)）。
- 从 coding-agent 公共 API 导出了 `CONFIG_DIR_NAME`，使扩展可以解析项目配置路径而无需硬编码 `.pi`（[#5869](https://github.com/earendil-works/pi/pull/5869)，感谢 [@xl0](https://github.com/xl0)）。
- 从公共 API 导出了编辑差异辅助工具（`generateDiffString`、`generateUnifiedPatch` 和 `EditDiffResult`），供需要编辑式差异的扩展使用（[#5756](https://github.com/earendil-works/pi/pull/5756)，感谢 [@xl0](https://github.com/xl0)）。

变更

- 将裸 `pi update` 改为仅更新 pi，添加 `pi update --all` 用于同时更新 pi 和扩展，并澄清了扩展更新提示。
- 在主题名称中保留 `/` 用于自动亮/暗主题设置。
- 更新了扩展文档、示例、运行时帮助、信任提示和配置标签，使用配置的项目配置目录而非硬编码 `.pi` 路径。

修复

- 修复了 RPC 未知命令错误，使其包含请求 id，避免客户端挂起等待响应（[#5868](https://github.com/earendil-works/pi/issues/5868)）。
- 修复了 `/model` 自动补全和模型选择搜索，无论先输入 Provider 还是模型 token 都能匹配 Provider/模型查询。
- 修复了树形导航器，对深层条目进行水平平移，使选中项保持可读（[#5830](https://github.com/earendil-works/pi/issues/5830)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 为 OpenCode Go 订阅模型目录添加了 GLM-5.2 模型（[#5860](https://github.com/earendil-works/pi/issues/5860)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

新增

- 添加了终端配色方案查询和通知支持，用于亮/暗外观检测（`TUI.queryTerminalColorScheme()`、`TUI.onTerminalColorSchemeChange()` 和 `TUI.setTerminalColorSchemeNotifications()`）（[#5874](https://github.com/earendil-works/pi/pull/5874)）。
- 添加了 Warp 终端检测以支持 Kitty 图形内联图片（[#5841](https://github.com/earendil-works/pi/pull/5841)，感谢 [@dodiego](https://github.com/dodiego)）。
- 导出了 `sliceByColumn`，用于感知 ANSI 的水平列切片。

</details>

## v0.79.6（2026-06-16）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复了 HTTP dispatcher 配置，保留调用者显式设置的 `fetch` 覆盖，而非在其上重新安装 undici 全局 fetch。
- 修复了继承的 OpenCode Go DeepSeek V4 关闭 thinking 的请求，发送 Provider 的 `thinking: { type: "disabled" }` 兼容参数。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 OpenCode Go DeepSeek V4 关闭 thinking 的请求，发送 Provider 的 `thinking: { type: "disabled" }` 兼容参数。

</details>

## v0.79.5（2026-06-16）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **Provider 级别的 API 密钥环境变量** — `auth.json` 的 API 密钥条目现在可以包含 `env` 覆盖，用于特定 Provider 的 Cloudflare、Azure OpenAI、Google Vertex、Amazon Bedrock、缓存保留和代理设置，无需修改项目 shell。参见 [Auth File](/docs/latest/providers#auth-file)。
- **全局 HTTP 代理设置** — 在全局设置中配置 `httpProxy` 即可将 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用于 Pi 管理的 HTTP 客户端。参见 [网络](/docs/latest/settings#network)。
- **Vercel AI Gateway 归属** — Vercel AI Gateway 请求现在默认包含 Pi 归属头部。参见 [API Keys](/docs/latest/providers#api-keys)。

新增

- 为 Vercel AI Gateway 模型添加了请求归属头部（`http-referer` 和 `x-title`）（[#5798](https://github.com/earendil-works/pi/pull/5798)，感谢 [@rwachtler](https://github.com/rwachtler)）。
- 在启用实验性功能时添加了 `xp` 页脚标记。
- 添加了全局 `httpProxy` 设置，作为 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用于 Pi 管理的 HTTP 客户端（[#5790](https://github.com/earendil-works/pi/issues/5790)）。
- 添加了 `auth.json` API 密钥 `env` 值，使特定 Provider 的环境覆盖可以限定在 Pi 范围内，并传播到继承的 Provider 配置（[#5728](https://github.com/earendil-works/pi/issues/5728)）。

变更

- 将 HTML 会话导出使用的 Markdown 解析器更新为 `marked` 18.0.5。

修复

- 修复了继承的 OpenAI Responses 流式响应，在工具调用前容忍 OpenAI 兼容服务器返回的 null 消息内容（[#5819](https://github.com/earendil-works/pi/issues/5819)）。
- 修复了继承的 OpenCode DeepSeek V4 thinking 请求，避免同时发送 `thinking` 和 `reasoning_effort`（[#5818](https://github.com/earendil-works/pi/issues/5818)）。
- 修复了设备码登录，不再自动打开浏览器。
- 修复了继承的编辑器 Cursor Up 处理，非空草稿在浏览输入历史前先跳转到行首（[#5789](https://github.com/earendil-works/pi/pull/5789)，感谢 [@4h9fbZ](https://github.com/4h9fbZ)）。
- 修复了继承的 Z.AI GLM-5.2 thinking 请求，发送 `reasoning_effort` 时使用 Provider 的 `high`/`max` 努力映射（[#5770](https://github.com/earendil-works/pi/issues/5770)）。
- 修复了 Windows 上 `pi update` 成功后的退出，改为自然退出而非调用 `process.exit(0)`，避免版本检查网络请求后的 Node.js/libuv 断言（[#5805](https://github.com/earendil-works/pi/issues/5805)）。
- 修复了继承的 Google 和 `google-vertex` Gemini 模型元数据，将 `latest` 别名映射到当前模型，为 Vertex 添加 Gemini 3.5 Flash，修正 Gemini 2.5 Flash Vertex 缓存定价，并移除已关闭的 Vertex 预览模型（[#5761](https://github.com/earendil-works/pi/issues/5761)）。
- 修复了会话选择器，在当前文件夹和全部范围会话列表均为空时保持打开并显示空状态（[#5747](https://github.com/earendil-works/pi/issues/5747)）。
- 修复了继承的 Moonshot AI China 模型元数据，包含 Kimi K2.7 Code，并针对 Kimi K2.7 Code 模型省略不支持的关闭 thinking 载荷（[#5760](https://github.com/earendil-works/pi/issues/5760)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 添加了 Provider 级别的 `StreamOptions.env` 覆盖，用于 Provider 配置，包括 Cloudflare 端点占位符、Azure OpenAI、Google Vertex、Amazon Bedrock、缓存保留和代理环境变量查找（[#5728](https://github.com/earendil-works/pi/issues/5728)）。

修复

- 修复了 OpenAI Responses 流式响应，在工具调用前容忍 OpenAI 兼容服务器返回的 null 消息内容（[#5819](https://github.com/earendil-works/pi/issues/5819)）。
- 修复了 OpenCode DeepSeek V4 thinking 请求，避免同时发送 `thinking` 和 `reasoning_effort`（[#5818](https://github.com/earendil-works/pi/issues/5818)）。
- 修复了 Z.AI GLM-5.2 thinking 请求，发送 `reasoning_effort` 时使用 Provider 的 `high`/`max` 努力映射（[#5770](https://github.com/earendil-works/pi/issues/5770)）。
- 修复了 Google 和 `google-vertex` Gemini 模型元数据，将 `latest` 别名映射到当前模型，为 Vertex 添加 Gemini 3.5 Flash，修正 Gemini 2.5 Flash Vertex 缓存定价，并移除已关闭的 Vertex 预览模型（[#5761](https://github.com/earendil-works/pi/issues/5761)）。
- 修复了 Moonshot AI China 模型元数据，包含 Kimi K2.7 Code，并针对 Kimi K2.7 Code 模型省略不支持的关闭 thinking 载荷（[#5760](https://github.com/earendil-works/pi/issues/5760)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- 将 Markdown 解析更新为 `marked` 18.0.5。

修复

- 修复了编辑器 Cursor Up 处理，非空草稿在浏览输入历史前先跳转到行首（[#5789](https://github.com/earendil-works/pi/pull/5789)，感谢 [@4h9fbZ](https://github.com/4h9fbZ)）。

</details>

## v0.79.4（2026-06-15）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **首次运行自动主题选择** — pi 在首次运行时会检测终端背景，并默认使用 `dark` 或 `light` 主题。参见 [选择主题](/docs/latest/themes#selecting-a-theme)。
- **独立二进制完整性校验** — GitHub 发布资源现在包含 `SHA256SUMS` 文件，用于校验独立二进制下载。参见 [快速开始安装](/docs/latest/quickstart#install)。

新增

- 为独立二进制 GitHub 发布资源添加了 `SHA256SUMS` 完整性文件（[#5739](https://github.com/earendil-works/pi/issues/5739)）。
- 添加了首次运行时通过终端背景检测进行交互式主题选择（[#5385](https://github.com/earendil-works/pi/pull/5385)，感谢 [@vegarsti](https://github.com/vegarsti)）。

修复

- 修复了 bash 工具输出收集，在子进程退出但后代仍在写入时继续排空 stdout/stderr，避免截断延迟输出（[#5753](https://github.com/earendil-works/pi/pull/5753)，感谢 [@Mearman](https://github.com/Mearman)）。
- 修复了 `/tree` 帮助渲染，在窄终端上显示紧凑的换行控件而非截断（[#5055](https://github.com/earendil-works/pi/issues/5055)）。
- 修复了 SIGTERM/SIGHUP 交互式关闭，在终端清理完成前保持信号处理程序安装，防止 `signal-exit` 重新发送信号并导致终端停留在 raw/Kitty 键盘模式（[#5724](https://github.com/earendil-works/pi/issues/5724)）。
- 修复了扩展文档，澄清 `pi.getActiveTools()` 返回活跃工具名称，而 `pi.getAllTools()` 返回工具元数据（[#5729](https://github.com/earendil-works/pi/issues/5729)）。
- 修复了 question 和 questionnaire 扩展示例，对长 Prompt、选项和帮助文本进行换行而非截断（[#5708](https://github.com/earendil-works/pi/pull/5708)，感谢 [@xl0](https://github.com/xl0)）。
- 修复了 `pi list`、`pi install` 和 `pi update` 等包命令，在完成后即使扩展留下后台句柄也能正常终止（[#5687](https://github.com/earendil-works/pi/issues/5687)）。
- 修复了 pnpm 全局安装的 `pi update`，当其配置的 `global-bin-dir` 与活动的 pnpm home 不匹配时（[#5689](https://github.com/earendil-works/pi/issues/5689)）。
- 修复了使用范围或标签（如 `@^1.2.7`）的 npm 包规范，使已安装的包资源仍能加载，而不会被视为不匹配的确切固定版本（[#5695](https://github.com/earendil-works/pi/issues/5695)）。
- 修复了继承的 Anthropic 1 小时 Prompt 缓存写入成本计算，将 1 小时缓存写入定价为 2 倍输入，而非 5 分钟缓存写入费率（[#5738](https://github.com/earendil-works/pi/pull/5738)，感谢 [@theBucky](https://github.com/theBucky)）。
- 修复了继承的 GitHub Copilot Claude adaptive thinking 元数据，以匹配手动检查的 Copilot 模型能力（[#4637](https://github.com/earendil-works/pi/issues/4637)）。
- 修复了继承的 OpenCode/OpenCode Go 补全模型元数据，对拒绝 `prompt_cache_retention` 的路由省略长保留缓存字段（[#5702](https://github.com/earendil-works/pi/issues/5702)）。
- 修复了继承的 overlay 在 CJK 宽字符上的合成，使 overlay 在全宽单元格内开始时边框保持对齐（[#5297](https://github.com/earendil-works/pi/issues/5297)）。
- 修复了继承的 WezTerm 内联 Kitty 图片在全量重绘回退期间的渲染，在绘制之前预留图片填充行，且不回归高图放置（[#5618](https://github.com/earendil-works/pi/issues/5618)、[#4415](https://github.com/earendil-works/pi/issues/4415)）。
- 修复了自定义 Provider 配置，使纯大写 API key 和 header 值保持为字面量而非被视为旧版环境变量引用；使用显式的 `$ENV_VAR` 语法表示环境变量（[#5661](https://github.com/earendil-works/pi/issues/5661)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 Anthropic 1 小时 Prompt 缓存写入成本计算，将 1 小时缓存写入定价为 2 倍输入，而非 5 分钟缓存写入费率（[#5738](https://github.com/earendil-works/pi/pull/5738)，感谢 [@theBucky](https://github.com/theBucky)）。
- 修复了 GitHub Copilot Claude adaptive thinking 元数据，以匹配手动检查的 Copilot 模型能力（[#4637](https://github.com/earendil-works/pi/issues/4637)）。
- 修复了拒绝 `prompt_cache_retention` 的 OpenCode/OpenCode Go 补全模型，在 `cacheRetention` 为 `long` 时省略长保留缓存字段（[#5702](https://github.com/earendil-works/pi/issues/5702)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

新增

- 添加了终端背景色查询支持，用于 OSC 11 回复（[#5385](https://github.com/earendil-works/pi/pull/5385)，感谢 [@vegarsti](https://github.com/vegarsti)）。

修复

- 修复了 overlay 在 CJK 宽字符上的合成，使 overlay 在全宽单元格内开始时边框保持对齐（[#5297](https://github.com/earendil-works/pi/issues/5297)）。
- 修复了 WezTerm 内联 Kitty 图片在全量重绘回退期间的渲染，在绘制之前预留图片填充行，且不回归高图放置（[#5618](https://github.com/earendil-works/pi/issues/5618)、[#4415](https://github.com/earendil-works/pi/issues/4415)）。

</details>

## v0.79.3（2026-06-13）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复了压缩摘要系统 Prompt，对非编码 Agent 使用中性 AI 助手措辞（[#5401](https://github.com/earendil-works/pi/issues/5401)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 将 OpenAI GPT-5.4/GPT-5.5 和 OpenAI Codex GPT-5.4/GPT-5.4 mini/GPT-5.5 上下文窗口元数据恢复至实际观测的 272k Token Codex 后端限制，避免发送超出 Codex 接受限制的 Prompt 产生计费风险（感谢 [@trethore](https://github.com/trethore) 反馈）。

</details>

## v0.79.2（2026-06-12）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **更清晰的 Bedrock 验证指引** — Amazon Bedrock 数据保留验证错误现在会链接到 AWS 数据保留文档。参见 [Amazon Bedrock](/docs/latest/providers#amazon-bedrock)。

新增

- 在 `PI_EXPERIMENTAL=1` 下添加了实验性首次设置流程，询问深浅色主题选择（预选检测到的外观）以及首次启动时选择加入的数据分析共享；选择加入会在 `settings.json` 中存储 `trackingId`（[#5587](https://github.com/earendil-works/pi/pull/5587)，感谢 [@vegarsti](https://github.com/vegarsti)）。
- 为继承的 Amazon Bedrock 不支持的数据保留模式验证错误添加了 AWS 数据保留文档链接（[#5561](https://github.com/earendil-works/pi/pull/5561)，感谢 [@unexge](https://github.com/unexge)）。

修复

- 修复了项目信任检测，当从 `$HOME` 运行时忽略全局 `~/.pi/agent` 状态，并让 `pi update` 仅使用已保存或显式的项目信任而不进行提示（[#5619](https://github.com/earendil-works/pi/issues/5619)）。
- 修复了实验性首次设置，使其跳过已分叉的会话而非重新运行设置提示（[#5627](https://github.com/earendil-works/pi/pull/5627)，感谢 [@vegarsti](https://github.com/vegarsti)）。
- 修复了继承的 OpenAI 兼容上下文溢出检测，支持带括号的 `maximum context length (N)` 错误（[#5677](https://github.com/earendil-works/pi/issues/5677)）。
- 修复了继承的 OpenAI GPT-5.4/GPT-5.5 和 OpenAI Codex GPT-5.4/GPT-5.4 mini/GPT-5.5 上下文窗口元数据，以匹配当前 OpenAI 限制（[#5644](https://github.com/earendil-works/pi/issues/5644)）。
- 修复了继承的 Anthropic 拒绝终止行为，在错误消息中保留了 Provider 的 `stop_details` 说明（[#5666](https://github.com/earendil-works/pi/pull/5666)，感谢 [@rwachtler](https://github.com/rwachtler)）。
- 将继承的 OpenAI Codex Responses SSE 响应头超时增加到 20 秒，以减少误报暂停，同时保留为零事件挂起引入的有界等待（[#4945](https://github.com/earendil-works/pi/issues/4945)）。
- 修复了继承的 Claude Fable 5 关闭 thinking 请求，省略了 Anthropic 不支持的 `thinking.type: "disabled"` 负载（[#5567](https://github.com/earendil-works/pi/pull/5567)，感谢 [@tmustier](https://github.com/tmustier)）。
- 修复了工具结算后延迟到达的 tool progress 回调被正确忽略的问题（而非发出陈旧的 `tool_execution_update` 事件）（[#5573](https://github.com/earendil-works/pi/issues/5573)）。
- 修复了继承的用户消息转录渲染，使独立的 `+` 消息不再渲染为 `-`（[#5657](https://github.com/earendil-works/pi/issues/5657)）。
- 修复了继承的斜杠分隔模糊查询，使 Provider/模型补全在插入后仍可匹配。
- 修复了继承的 WezTerm 内联 Kitty 图片渲染，使保留行清除不再擦除除顶部条带之外的所有工具图片预览（[#5618](https://github.com/earendil-works/pi/issues/5618)）。
- 修复了继承的 CJK 编辑器换行，使其在字符边界处断行而非留下较大的尾部空白（[#5585](https://github.com/earendil-works/pi/pull/5585)，感谢 [@haoqixu](https://github.com/haoqixu)）。
- 修复了继承的宽松 Markdown 列表渲染，保留了列表项之间的空行分隔（[#5562](https://github.com/earendil-works/pi/pull/5562)，感谢 [@Perlence](https://github.com/Perlence)）。
- 修复了 `--model` 解析，对于斜杠前缀与未认证的内置 Provider 匹配的已认证自定义模型 ID（[#5643](https://github.com/earendil-works/pi/issues/5643)）。
- 修复了 `/fork` 在分叉路径包含标签时保持会话父链的连接（[#5669](https://github.com/earendil-works/pi/issues/5669)）。
- 修复了 `/share` 和 `/export` HTML 导出在配置的自定义主题不再存在时使用活动的回退主题（[#5596](https://github.com/earendil-works/pi/issues/5596)）。
- 修复了带有 `:<thinking>` 后缀的自定义回退模型 ID，在 Provider 模板模型未声明推理能力时保留请求的 thinking 级别（[#5560](https://github.com/earendil-works/pi/pull/5560)，感谢 [@haoqixu](https://github.com/haoqixu)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 为 Amazon Bedrock 不支持的数据保留模式验证错误添加了 AWS 数据保留文档链接（[#5561](https://github.com/earendil-works/pi/pull/5561)，感谢 [@unexge](https://github.com/unexge)）。

修复

- 修复了 OpenAI 兼容上下文溢出检测，支持带括号的 `maximum context length (N)` 错误（[#5677](https://github.com/earendil-works/pi/issues/5677)）。
- 修复了 OpenAI GPT-5.4/GPT-5.5 和 OpenAI Codex GPT-5.4/GPT-5.4 mini/GPT-5.5 上下文窗口元数据，以匹配当前 OpenAI 限制（[#5644](https://github.com/earendil-works/pi/issues/5644)）。
- 将 OpenAI Codex Responses SSE 响应头超时增加到 20 秒，以减少误报暂停，同时保留为零事件挂起引入的有界等待（[#4945](https://github.com/earendil-works/pi/issues/4945)）。
- 修复了 Anthropic 拒绝终止行为，在错误消息中保留了 Provider 的 `stop_details` 说明（[#5666](https://github.com/earendil-works/pi/pull/5666)，感谢 [@rwachtler](https://github.com/rwachtler)）。
- 修复了 Claude Fable 5 关闭 thinking 请求，省略了 Anthropic 不支持的 `thinking.type: "disabled"` 负载（[#5567](https://github.com/earendil-works/pi/pull/5567)，感谢 [@tmustier](https://github.com/tmustier)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

修复

- 修复了工具结算后延迟到达的 tool progress 回调被正确忽略的问题（而非发出陈旧的 `tool_execution_update` 事件）（[#5573](https://github.com/earendil-works/pi/issues/5573)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了 Markdown 源码列表标记保留，使无序标记也能被保留，这样独立的 `+` 用户消息不再渲染为 `-`（[#5657](https://github.com/earendil-works/pi/issues/5657)）。
- 修复了斜杠分隔的模糊查询，使 Provider/模型补全在插入后仍可匹配。
- 修复了 WezTerm 内联 Kitty 图片渲染，使保留行清除不再擦除除顶部条带之外的所有工具图片预览（[#5618](https://github.com/earendil-works/pi/issues/5618)）。
- 修复了 CJK 编辑器换行，使其在字符边界处断行而非留下较大的尾部空白（[#5585](https://github.com/earendil-works/pi/pull/5585)，感谢 [@haoqixu](https://github.com/haoqixu)）。
- 修复了宽松 Markdown 列表渲染，保留了列表项之间的空行分隔（[#5562](https://github.com/earendil-works/pi/pull/5562)，感谢 [@Perlence](https://github.com/Perlence)）。

</details>

## v0.79.1（2026-06-09）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **Claude Fable 5** — Claude Fable 5 现已在 Anthropic 和 Amazon Bedrock Provider 上可用，支持 adaptive thinking 与 `xhigh` 推理强度。
- **Prompt 模板默认值** — Prompt 模板可使用 `${1:-7}` 这样的位置参数默认值。参见 [Prompt 模板参数](/docs/latest/prompt-templates#参数)。
- **可配置的项目信任默认值** — `defaultProjectTrust` 允许用户选择未解析的项目信任询问是默认通过、始终信任还是从不信任，扩展也可以检视生效的信任决策。参见 [项目信任](/docs/latest/security#项目信任) 和 [`ctx.isProjectTrusted()`](/docs/latest/extensions#ctxisprojecttrusted)。
- **扩展自动补全的触发字符** — 扩展的自动补全 Provider 可以声明 `#` 或 `$` 这样的触发字符，让建议无需斜杠命令前缀即可弹出。参见 [自动补全 Provider](/docs/latest/extensions#autocomplete-providers)。

新增

- 为 Prompt 模板位置参数添加了默认值展开，例如 `${1:-7}`（[#5553](https://github.com/earendil-works/pi/pull/5553)，感谢 [@dannote](https://github.com/dannote)）。
- 添加了 `areExperimentalFeaturesEnabled` 特性开关，让用户能够选择启用实验性功能（[#5547](https://github.com/earendil-works/pi/pull/5547)，感谢 [@vegarsti](https://github.com/vegarsti)）。
- 添加了 `ctx.isProjectTrusted()`，使扩展能够观察生效的项目信任决策，包括临时信任决策（[#5523](https://github.com/earendil-works/pi/issues/5523)）。
- 添加了全局的 `defaultProjectTrust` 设置，用于选择未解析的项目信任询问是默认通过、始终信任还是从不信任。
- 为 `ctx.ui.addAutocompleteProvider()` 包装器添加了扩展自动补全触发字符支持（[#4703](https://github.com/earendil-works/pi/issues/4703)）。
- 在 Anthropic 和 Amazon Bedrock Provider 上添加了继承自 `@earendil-works/pi-ai` 的 Claude Fable 5 模型支持，支持 adaptive thinking 与 `xhigh` 推理强度。

修复

- 修复了继承自 Amazon Bedrock 的推理配置文件 ARN 区域解析，优先使用 ARN 内嵌的区域而非 `AWS_REGION`（[#5527](https://github.com/earendil-works/pi/pull/5527)，感谢 [@AJM10565](https://github.com/AJM10565)）。
- 修复了继承的 IME 硬件光标定位，在斜杠命令自动补全可见时正确显示（[#5283](https://github.com/earendil-works/pi/pull/5283)，感谢 [@smoosex](https://github.com/smoosex)）。
- 修复了继承的 z.ai 关闭 thinking 请求，使其发送 Provider 的 `thinking: { type: "disabled" }` 兼容性参数（[#5330](https://github.com/earendil-works/pi/issues/5330)）。
- 修复了继承的 OpenCode completions 模型元数据，将显式的 `maxTokens` 作为 `max_tokens` 发送（[#5331](https://github.com/earendil-works/pi/issues/5331)）。
- 修复了继承的 Moonshot Kimi 关闭 thinking 请求，使其发送 Provider 的 `thinking: { type: "disabled" }` 兼容性参数（[#5531](https://github.com/earendil-works/pi/issues/5531)）。
- 修复了继承的 Azure OpenAI Responses 请求，禁用服务器端的响应存储（[#5530](https://github.com/earendil-works/pi/issues/5530)）。
- 修复了继承的 Azure GPT-5.4 和 GPT-5.5 上下文窗口元数据为 1,050,000 Token，与 Azure Foundry 部署保持一致，而非 OpenAI 的 272k 上限（[#5559](https://github.com/earendil-works/pi/issues/5559)）。
- 修复了继承的 OpenAI 和 Azure GPT-5 Pro `maxTokens` 元数据为 128,000，修正了上游错误地将 272,000 输入子限制复制为输出限制的值（[#5559](https://github.com/earendil-works/pi/issues/5559)）。
- 修复了继承的 Prompt 历史导航，使浏览历史返回时能恢复当前草稿（[#5494](https://github.com/earendil-works/pi/issues/5494)）。
- 修复了混合拉丁文与 CJK 文本的换行行为，使无空格 CJK 序列能在字素边界处断行，避免留下过大的尾部空白（[#5495](https://github.com/earendil-works/pi/issues/5495)）。
- 修复了扩展 OAuth 登录提示，使先前提交的提示行保持稳定，而不再镜像当前输入值（[#5433](https://github.com/earendil-works/pi/issues/5433)）。
- 修复了 `/reload` 会将更新后的 `steeringMode` 和 `followUpMode` 设置应用到当前会话（[#5377](https://github.com/earendil-works/pi/issues/5377)）。
- 修复了 `models.json` 语法无效时跳过启动配置迁移并按文件路径感知的方式报告正常的 models 错误，而非抛出原始的 JSON 解析堆栈（[#5418](https://github.com/earendil-works/pi/issues/5418)）。
- 修复了 GitHub 发布说明和交互式 changelog 链接，使其能正确解析包相对文档 URL（[#5516](https://github.com/earendil-works/pi/issues/5516)）。
- 修复了 CLI 帮助与版本输出，包括纯重定向的 `--help`/`--version` 输出，并简化了 `list`/`config` 帮助文本。
- 修复了临时会话的 `/new` 默认将新会话也保持为临时会话而非持久化（[#5045](https://github.com/earendil-works/pi/issues/5045)）。
- 澄清了自定义模型文档中 `name` 和 `modelOverrides.name` 不会替换页脚或主模型列表中的模型 ID（[#4841](https://github.com/earendil-works/pi/issues/4841)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 在 Anthropic 和 Amazon Bedrock 模型元数据中添加了 Claude Fable 5，支持 adaptive thinking 与 `xhigh` 推理强度。

修复

- 修复了 Amazon Bedrock 推理配置文件 ARN 区域解析，优先使用 ARN 内嵌的区域而非 `AWS_REGION`（[#5527](https://github.com/earendil-works/pi/pull/5527)，感谢 [@AJM10565](https://github.com/AJM10565)）。
- 修复了 z.ai 关闭 thinking 请求，使其发送 Provider 的 `thinking: { type: "disabled" }` 兼容性参数（[#5330](https://github.com/earendil-works/pi/issues/5330)）。
- 修复了 OpenCode completions 模型元数据，将显式的 `maxTokens` 作为 `max_tokens` 发送（[#5331](https://github.com/earendil-works/pi/issues/5331)）。
- 修复了 Moonshot Kimi 关闭 thinking 请求，使其发送 Provider 的 `thinking: { type: "disabled" }` 兼容性参数（[#5531](https://github.com/earendil-works/pi/issues/5531)）。
- 修复了 Azure OpenAI Responses 请求，禁用了服务器端的响应存储（[#5530](https://github.com/earendil-works/pi/issues/5530)）。
- 修复了 Azure GPT-5.4 和 GPT-5.5 上下文窗口元数据为 1,050,000 Token，与 Azure Foundry 部署保持一致，而非 OpenAI 的 272k 上限（[#5559](https://github.com/earendil-works/pi/issues/5559)）。
- 修复了 OpenAI 和 Azure GPT-5 Pro `maxTokens` 元数据为 128,000，修正了上游错误地将 272,000 输入子限制复制为输出限制的值（[#5559](https://github.com/earendil-works/pi/issues/5559)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

无变更。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

新增

- 添加了 `AutocompleteProvider.triggerCharacters`，使编辑器自动补全能自然地在 Provider 定义的 Token 前缀上触发（[#4703](https://github.com/earendil-works/pi/issues/4703)）。

修复

- 修复了斜杠命令自动补全可见时的 IME 硬件光标定位（[#5283](https://github.com/earendil-works/pi/pull/5283)，感谢 [@smoosex](https://github.com/smoosex)）。
- 修复了 Prompt 历史导航，使浏览历史返回时能恢复当前草稿（[#5494](https://github.com/earendil-works/pi/issues/5494)）。
- 修复了混合拉丁文与 CJK 文本的换行行为，使无空格 CJK 序列能在字素边界处断行，避免留下过大的尾部空白（[#5495](https://github.com/earendil-works/pi/issues/5495)）。

</details>

## v0.79.0（2026-06-08）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **项目信任保护本地输入** — Pi 现在在加载项目本地设置、资源、指令和包之前会请求确认，支持 `--approve` / `--no-approve` 非交互模式控制与保存决策。参见 [项目信任](/docs/latest/security#项目信任)。
- **扩展控制的信任决策** — 全局和 CLI 扩展可处理 `project_trust`，在项目本地资源加载前决定、记住或推迟项目信任。参见 [`project_trust`](/docs/latest/extensions#project_trust)。
- **页脚缓存命中率可见** — 交互式页脚现在显示最新的 Prompt 缓存命中率（`CH`）。参见 [交互模式](/docs/latest/usage#interactive-mode)。
- **更丰富的 SDK 和 RPC 扩展接口** — 公共导出现包含 RPC 扩展 UI 请求/响应类型与包资源路径助手。参见 [扩展 UI 协议](/docs/latest/rpc#extension-ui-protocol) 和 [SDK 导出](/docs/latest/sdk#exports)。

新增

- 添加了 `project_trust` 扩展事件，使全局和 CLI 扩展可在启动与运行时 cwd 切换期间决定或推迟项目信任。
- 添加了项目信任门控，用于项目本地设置、资源、指令和包（[#5332](https://github.com/earendil-works/pi/pull/5332)）。
- 在交互式页脚中添加了最新 Prompt 缓存命中率。
- 从公共 API 导出了 RPC 扩展 UI 请求与响应类型（[#5455](https://github.com/earendil-works/pi/issues/5455)）。
- 从公共 API 导出了 coding-agent 包资源路径助手（[#5415](https://github.com/earendil-works/pi/issues/5415)）。

修复

- 修复了包导出，移除指向不存在构建产物的过时 `./hooks` 子路径。
- 修复了继承的 TUI 渲染在内容缩为零时清除过时行的问题。
- 修复了继承的自动补全建议在编辑器光标移动后刷新的问题（[#5499](https://github.com/earendil-works/pi/pull/5499)，感谢 [@Roman-Galeev](https://github.com/Roman-Galeev)）。
- 修复了 `/reload` 在隐式信任会话创建项目 `.pi` 目录时持久化项目信任的问题。
- 修复了项目信任输入发现以可移植方式遍历父目录的问题。
- 修复了继承的间歇性 Shift+Enter 处理，使 Kitty 键盘协议回退变为响应驱动而非超时驱动（[#5188](https://github.com/earendil-works/pi/issues/5188)）。
- 修复了压缩摘要系统 Prompt，为非 coding agent 使用中立的 AI 助手措辞（[#5401](https://github.com/earendil-works/pi/issues/5401)）。
- 修复了 `models.json` schema 支持与继承的 OpenAI Responses 自定义 Provider 对 `compat.supportsDeveloperRole: false` 的处理（[#5456](https://github.com/earendil-works/pi/issues/5456)）。
- 修复了继承的 Prompt 历史导航，使向上浏览时光标位于开头、向下浏览时光标位于末尾（[#5454](https://github.com/earendil-works/pi/issues/5454)）。
- 修复了 tmux 设置文档，要求 tmux 3.5 以使用 `extended-keys-format csi-u`，并记录 tmux 3.2-3.4 回退方案（[#5432](https://github.com/earendil-works/pi/issues/5432)）。
- 修复了继承的 OpenRouter 路由偏好，使 OpenAI 兼容自定义 Provider 在 base URL 不直接指向 OpenRouter 时也能正常工作（[#5347](https://github.com/earendil-works/pi/issues/5347)）。
- 修复了内置工具展开提示中闭合括号样式不一致的问题（[#5359](https://github.com/earendil-works/pi/issues/5359)）。
- 修复了 Skill 包装的 Prompt 在 Skill 指令与用户消息之间插入间距的问题（[#5371](https://github.com/earendil-works/pi/pull/5371)，感谢 [@Perlence](https://github.com/Perlence)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 OpenAI Responses 自定义 Provider 对推理模型 `compat.supportsDeveloperRole: false` 的处理（[#5456](https://github.com/earendil-works/pi/issues/5456)）。
- 修复了 OpenRouter 路由偏好，使 OpenAI 兼容自定义 Provider 在 `baseUrl` 不直接指向 OpenRouter 时也能发送 `compat.openRouterRouting`（[#5347](https://github.com/earendil-works/pi/issues/5347)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

修复

- 修复了压缩摘要系统 Prompt，为非 coding agent 使用中立的 AI 助手措辞（[#5401](https://github.com/earendil-works/pi/issues/5401)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了 Prompt 历史导航，使向上浏览时光标位于开头、向下浏览时光标位于末尾，确保重复按 Up/Down 能立即遍历多行 Prompt（[#5454](https://github.com/earendil-works/pi/issues/5454)）。
- 修复了间歇性 Shift+Enter 处理，使 Kitty 键盘协议回退变为响应驱动而非超时驱动（[#5188](https://github.com/earendil-works/pi/issues/5188)）。
- 修复了 TUI 渲染在内容缩为零时清除过时行的问题。
- 修复了自动补全建议在编辑器光标移动后重新查询的问题（[#5499](https://github.com/earendil-works/pi/pull/5499)，感谢 [@Roman-Galeev](https://github.com/Roman-Galeev)）。

</details>

## v0.78.1（2026-06-04）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **更广泛的内置 Provider 覆盖** — 新增 Ant Ling 和 NVIDIA NIM Provider 设置文档，以及 MiniMax-M3 对直接 MiniMax Provider 的支持。参见 [Providers](/docs/latest/providers)。
- **更丰富的扩展上下文** — 扩展可使用 `ctx.mode` 和 `ctx.getSystemPromptOptions()` 在 TUI、RPC、JSON 和 print 模式间适配行为，并检查基础系统 Prompt 输入。参见 [Extensions](/docs/latest/extensions)。

新增

- 添加了容器化文档和 Gondolin 扩展示例，用于将内置工具路由到本地 micro-VM。
- 添加了 Ant Ling Provider 选择和设置文档。
- 添加了 MiniMax-M3 模型支持，继承自 `@earendil-works/pi-ai`，适用于 `minimax` 和 `minimax-cn` 直接 Provider（[\#5313](https://github.com/earendil-works/pi/issues/5313)）。
- 添加了 NVIDIA NIM Provider 选择、设置文档和直接 NIM 请求归属头。
- 在扩展上下文中添加了 `ctx.mode`，使扩展能够区分 TUI、RPC、JSON 和 print 模式。
- 为扩展命令添加了 `ctx.getSystemPromptOptions()`，用于检查当前基础系统 Prompt 输入（[\#5306](https://github.com/earendil-works/pi/pull/5306)，感谢 [@xl0](https://github.com/xl0)）。

修复

- 修复了临时扩展包安装使用带 `0700` 权限的私有 `~/.pi/agent/tmp/extensions` 目录，而非 `os.tmpdir()/pi-extensions`。
- 修复了 git 包源处理，拒绝不安全的主机/路径组件，并将托管克隆路径保持在安装根目录内。
- 修复了 HTML 会话导出中的存储型 XSS，通过剥离控制字符后使用方案白名单清理 Markdown 链接和图片 URL。
- 修复了 SDK 嵌入在捆绑的 Node 应用中因缺少 `package.json` 而导致 `ENOENT` 失败的问题。包元数据读取器现在通过使用默认值优雅地处理缺失的 `package.json`，无需在运行时提供包相邻文件即可使用 `createAgentSession()`（[\#5226](https://github.com/earendil-works/pi/issues/5226)）。
- 修复了 HTTP 超时设置未对非 Codex Provider（如通过 OpenAI 兼容 API 的 llama.cpp）生效的问题。`httpIdleTimeoutMs` 设置（通过 `/settings` HTTP 超时设置）现在作为所有支持 Provider 的默认 SDK 请求超时，而不仅仅是 OpenAI Codex Responses。禁用超时（HTTP 超时 = false）现在通过发送最大 int32 值（有效无限）而非 0 来正确禁用所有支持 Provider 的 SDK 超时，因为 SDK 将 timeout=0 视为立即超时（[\#5294](https://github.com/earendil-works/pi/issues/5294)）。
- 修复了继承的 Amazon Bedrock 请求，用占位符替换空白的必填 user/tool-result 文本，并跳过空白的重放文本块（[\#4975](https://github.com/earendil-works/pi/issues/4975)）。
- 修复了继承的 Anthropic Claude Opus 4.7+ 请求，抑制已弃用的 temperature 参数（[\#5251](https://github.com/earendil-works/pi/pull/5251)，感谢 [@yzhg1983](https://github.com/yzhg1983)）。
- 修复了继承的 OpenAI GPT-5.5 生成元数据，省略不支持的 minimal thinking（[\#5243](https://github.com/earendil-works/pi/issues/5243)）。
- 修复了继承的 OpenRouter Kimi K2.6 thinking 重放和 developer-role 指令处理（[\#5309](https://github.com/earendil-works/pi/issues/5309)）。
- 修复了继承的 OpenRouter reasoning 指令请求，按需保留 system 角色（[\#5221](https://github.com/earendil-works/pi/pull/5221)，感谢 [@PriNova](https://github.com/PriNova)）。
- 修复了继承的 overlay 焦点恢复，使非捕获 overlay 在 UI 重渲染和显式焦点释放后保持可交互（[\#5235](https://github.com/earendil-works/pi/pull/5235)，感谢 [@nicobailon](https://github.com/nicobailon)）。
- 修复了列切片和 overlay 合成中的 tab 宽度计算，使包含 tab 的输出不会超过终端宽度（[\#5218](https://github.com/earendil-works/pi/issues/5218)）。
- 修复了打开和列出超大 JSONL 会话文件，改为逐行读取会话条目而非将整个文件作为单个字符串实例化（[\#5231](https://github.com/earendil-works/pi/issues/5231)）。
- 修复了 WSL `/mnt/...` 仓库中页脚分支显示在分支变更后刷新的问题（[\#5264](https://github.com/earendil-works/pi/pull/5264)，感谢 [@psoukie](https://github.com/psoukie)）。
- 修复了 `renderShell: "self"` 工具渲染器未输出组件行时留下空白聊天行的问题（[\#5299](https://github.com/earendil-works/pi/issues/5299)）。
- 恢复了继承的 NVIDIA Qwen 3.5 122B NIM 模型支持。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 添加了 Ant Ling 作为内置 OpenAI 兼容 Provider，支持 Ling 2.6 和 Ring 2.6 模型。
- 为 `minimax` 和 `minimax-cn` 直接 Provider 添加了 MiniMax-M3 模型，并移除了掩盖 models.dev 值的硬编码上下文窗口覆盖（[\#5313](https://github.com/earendil-works/pi/issues/5313)）。
- 添加了 NVIDIA NIM 作为内置 OpenAI 兼容 Provider，公开支持 tool use 的公共 NIM 模型。

修复

- 修复了 Amazon Bedrock 请求，用占位符替换空白的必填 user/tool-result 文本，并跳过空白的重放文本块（[\#4975](https://github.com/earendil-works/pi/issues/4975)）。
- 修复了 Anthropic Claude Opus 4.7+ 请求，抑制已弃用的 temperature 参数（[\#5251](https://github.com/earendil-works/pi/pull/5251)，感谢 [@yzhg1983](https://github.com/yzhg1983)）。
- 修复了 OpenAI GPT-5.5 生成元数据，省略不支持的 minimal thinking（[\#5243](https://github.com/earendil-works/pi/issues/5243)）。
- 修复了 OpenRouter Kimi K2.6 thinking 重放，并为 OpenRouter OpenAI 和 Anthropic 模型保留 developer-role 指令（[\#5309](https://github.com/earendil-works/pi/issues/5309)）。
- 修复了 OpenRouter reasoning 指令请求，按需保留 system 角色（[\#5221](https://github.com/earendil-works/pi/pull/5221)，感谢 [@PriNova](https://github.com/PriNova)）。
- 恢复了 NVIDIA Qwen 3.5 122B NIM 模型。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了 overlay 焦点恢复，使非捕获 overlay 在 UI 重渲染和显式焦点释放后保持可交互（[\#5235](https://github.com/earendil-works/pi/pull/5235)，感谢 [@nicobailon](https://github.com/nicobailon)）。
- 修复了列切片和 overlay 合成中的 tab 宽度计算，使包含 tab 的输出不会超过终端宽度（[\#5218](https://github.com/earendil-works/pi/issues/5218)）。

</details>

## v0.78.0（2026-05-29）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **命名启动会话** — `--name` / `-n` 可在交互、打印、JSON 和 RPC 模式下于启动前设置会话显示名称。参见 [命名会话](/docs/latest/sessions#naming-sessions) 和 [会话选项](/docs/latest/usage#session-options)。
- **可点击的文件工具路径** — 内置文件工具的标题在终端支持时会渲染 OSC 8 `file://` 超链接，包括支持的 tmux 客户端。

新增

- 为扩展作者导出了 `convertToPng`（[\#5167](https://github.com/earendil-works/pi-mono/pull/5167)，感谢 [@xl0](https://github.com/xl0)）。
- 为扩展作者导出了 `parseArgs` 和类型 `Args`（[\#5202](https://github.com/earendil-works/pi-mono/pull/5202)，感谢 [@xl0](https://github.com/xl0)）。
- 添加了 `--name` / `-n` 以在启动时设置会话显示名称（[\#5153](https://github.com/earendil-works/pi-mono/issues/5153)）。
- 退出交互会话时添加了 resume 命令提示（[\#5176](https://github.com/earendil-works/pi-mono/pull/5176)，感谢 [@yzhg1983](https://github.com/yzhg1983)）。
- 内置文件工具标题中的文件路径添加了 OSC 8 `file://` 超链接（[\#5189](https://github.com/earendil-works/pi-mono/pull/5189)，感谢 [@mpazik](https://github.com/mpazik)）。
- 添加了自定义 Amazon Bedrock 请求头支持，继承自 `@earendil-works/pi-ai`（[\#5178](https://github.com/earendil-works/pi-mono/pull/5178)，感谢 [@stephanmck](https://github.com/stephanmck)）。

修复

- 澄清了 WezTerm/WSL IME 硬件光标文档，说明光标可见性仍是可选的（[\#5200](https://github.com/earendil-works/pi-mono/issues/5200)）。
- 修复了 GitLab Duo 自定义 Provider 示例，使其对 Claude 模型使用 adaptive thinking、暴露 xhigh thinking 并包含更新的已验证模型 ID（[\#5201](https://github.com/earendil-works/pi-mono/issues/5201)）。
- 修复了 Bun 发布归档的创建流程，确保安装并复制匹配的 `@mariozechner/clipboard` 基础包和原生 sidecar（[\#5184](https://github.com/earendil-works/pi-mono/issues/5184)）。
- 修复了提示循环启动前输入的早期交互输入被丢弃的问题，现改为缓冲处理（[\#5195](https://github.com/earendil-works/pi-mono/pull/5195)，感谢 [@yzhg1983](https://github.com/yzhg1983)）。
- 修复了 OpenRouter Moonshot Kimi K2.6 请求使用 `system` 而非不支持的 `developer` 消息（[\#5159](https://github.com/earendil-works/pi-mono/issues/5159)）。
- 修复了 OpenCode Go Kimi K2.6 thinking 请求发送 `thinking` 对象而非无效字符串值，并修复了 OpenCode Zen Grok Build thinking 请求省略不支持的 `reasoning_effort`（[\#5169](https://github.com/earendil-works/pi-mono/issues/5169)）。
- 修复了 OpenAI Codex Responses SSE 流，在终端事件后中止响应体读取。
- 修复了 OpenCode Kimi K2.6 生成的元数据，使用 Anthropic 风格的 thinking 元数据而非无效的 reasoning-effort 参数。
- 修复了 OSC 8 超链接在客户端支持时通过 tmux 传递（[\#5189](https://github.com/earendil-works/pi-mono/pull/5189)，感谢 [@mpazik](https://github.com/mpazik)）。
- 修复了 ANSI 文本换行，避免超长换行时发生栈溢出（[\#5185](https://github.com/earendil-works/pi-mono/issues/5185)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

不兼容变更

- 更改了直接 Provider 流函数，要求显式传入 `options.apiKey`；顶层 `stream*`/`complete*` 辅助函数仍保留内置环境认证。

新增

- 通过 `StreamOptions.headers` 添加了自定义 Amazon Bedrock 请求头支持，排除了保留的 AWS 签名头（[\#5178](https://github.com/earendil-works/pi-mono/pull/5178)，感谢 [@stephanmck](https://github.com/stephanmck)）。

修复

- 修复了 OpenRouter Moonshot Kimi K2.6 请求使用 `system` 而非不支持的 `developer` 消息（[\#5159](https://github.com/earendil-works/pi-mono/issues/5159)）。
- 修复了 OpenCode Go Kimi K2.6 thinking 请求发送 `thinking` 对象而非无效字符串值，并修复了 OpenCode Zen Grok Build thinking 请求省略不支持的 `reasoning_effort`（[\#5169](https://github.com/earendil-works/pi-mono/issues/5169)）。
- 修复了 OpenAI Codex Responses SSE 流，在终端事件后中止响应体读取。
- 修复了 OpenCode Kimi K2.6 生成的元数据，使用 Anthropic 风格的 thinking 元数据而非无效的 reasoning-effort 参数。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了 ANSI 文本换行，避免超长换行时发生栈溢出（[\#5185](https://github.com/earendil-works/pi-mono/issues/5185)）。
- 澄清了 IME 硬件光标文档，说明光标可见性仍是可选的（[\#5200](https://github.com/earendil-works/pi-mono/issues/5200)）。
- 修复了 OSC 8 超链接在客户端支持时通过 tmux 传递（[\#5189](https://github.com/earendil-works/pi-mono/pull/5189)，感谢 [@mpazik](https://github.com/mpazik)）。

</details>

## v0.77.0（2026-05-28）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **Claude Opus 4.8 支持** — 新增 Anthropic Claude Opus 4.8 元数据，并更新 Opus adaptive-thinking 覆盖范围。
- **选择性工具禁用** — `--exclude-tools` / `-xt` 可禁用指定的内置、扩展或自定义工具，其余工具保持可用。参见 [工具选项](/docs/latest/usage#tool-options)。
- **无头 Codex 订阅登录** — `/login` 可使用设备码认证登录 ChatGPT Plus/Pro Codex 订阅。参见 [订阅](/docs/latest/providers#subscriptions) 和 [OpenAI Codex](/docs/latest/providers#openai-codex)。
- **感知流式行为的扩展输入** — 扩展可通过 `InputEvent.streamingBehavior` 区分空闲 Prompt、流中转向和排队的后续操作。参见 [输入事件](/docs/latest/extensions#input-events)。

新增

- 新增 `--exclude-tools` / `-xt` 参数，可禁用指定的内置、扩展或自定义工具，其余工具保持可用（[#5109](https://github.com/earendil-works/pi/issues/5109)）。
- 新增 OpenAI Codex 订阅设备码登录作为可选的无头替代方案，同时保留浏览器登录为默认方式（[#4911](https://github.com/earendil-works/pi/pull/4911)，感谢 [@vegarsti](https://github.com/vegarsti)）。
- 为扩展输入事件新增 `streamingBehavior`，使扩展能够区分空闲 Prompt、流中转向和排队的后续操作（[#5107](https://github.com/earendil-works/pi/pull/5107)，感谢 [@DanielThomas](https://github.com/DanielThomas)）。
- 新增 Claude Opus 4.8 模型元数据（Anthropic），并更新 Opus adaptive-thinking 覆盖范围以使用它。

修复

- 修复了启动时间输出，`readPipedStdin` 不再包含 `createAgentSessionRuntime` 的工作（[#4829](https://github.com/earendil-works/pi/issues/4829)）。
- 修复了 OpenRouter DeepSeek V4 `xhigh` reasoning 元数据，保留 OpenRouter 原生的 effort 而非发送 DeepSeek 的 `max` effort（[#4801](https://github.com/earendil-works/pi/issues/4801)）。
- 修复了自定义会话目录，使当前文件夹的 resume/continue 查找限定于当前 cwd，而 all-session 列表覆盖自定义目录。
- 修复了 SIGTERM/SIGHUP 退出流程，运行扩展 `session_shutdown` 清理并恢复终端：信号触发的关闭现在在终端写入之前发出 `session_shutdown`，SIGHUP 不再硬退出，因此即使终端已消失，扩展资源（如 socket）也会被释放（[#5080](https://github.com/earendil-works/pi/issues/5080)）。
- 修复了键盘协议协商，忽略不匹配或延迟的终端响应，避免误检测 Kitty 键盘协议（[#5091](https://github.com/earendil-works/pi/pull/5091)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。
- 修复了 MSYS2 ucrt64 Node.js 下 Windows 启动崩溃，通过更新原生剪贴板插件至 napi-rs 3.x（[#5028](https://github.com/earendil-works/pi/issues/5028)）。
- 修复了 API Key 和 Header 配置解析：将普通字符串视为字面量，支持 `$ENV_VAR` / `${ENV_VAR}` 插值和 `$!` 转义，配置文件要求显式 env 语法，避免 Windows 大小写不敏感的 env 匹配破坏字面量 Key（[#5095](https://github.com/earendil-works/pi/issues/5095)）。
- 修复了会话销毁流程，中止进行中的 agent、compaction、branch summary、retry 和 bash 工作（[#5029](https://github.com/earendil-works/pi/pull/5029)，感谢 [@TerminallyChilI](https://github.com/TerminallyChilI)）。
- 修复了 `pi.getAllTools()`，暴露每个工具的 `promptGuidelines`，供需要按工具归因 guideline 的扩展使用（[#4879](https://github.com/earendil-works/pi/issues/4879)）。
- 修复了从 Anthropic extended-thinking 会话切换到 OpenAI Codex Responses 后的回放问题，为转换的 thinking/text 块生成唯一的 fallback 消息项 ID（[#5148](https://github.com/earendil-works/pi/issues/5148)）。
- 修复了返回空 thinking signature 的 Provider 的 Anthropic 兼容回放，新增可选的 `allowEmptySignature` 兼容性标志（[#4464](https://github.com/earendil-works/pi/issues/4464)）。
- 修复了 OpenAI 和 OpenRouter GPT-5.5 Pro thinking level 元数据，仅暴露支持的 medium、high 和 xhigh efforts。
- 修复了 OpenCode Go Kimi K2.6 thinking-off 请求，发送 `thinking: "none"`（[#5078](https://github.com/earendil-works/pi/issues/5078)）。
- 修复了 Xiaomi Token Plan 模型元数据，省略不支持的 `mimo-v2-flash` 变体（[#5075](https://github.com/earendil-works/pi/issues/5075)）。
- 修复了由 `agent_end` 扩展处理器排队的后续消息，确保在 agent 变为空闲之前排出（[#5115](https://github.com/earendil-works/pi/pull/5115)，感谢 [@DanielThomas](https://github.com/DanielThomas)）。
- 修复了扩展输入事件，仅在流式处理期间实际排队的 Prompt 上报告 `streamingBehavior`（[#5107](https://github.com/earendil-works/pi/pull/5107)，感谢 [@DanielThomas](https://github.com/DanielThomas)）。
- 修复了系统 Prompt 的工具选择指引，避免偏好不可用的文件探索工具（[#5132](https://github.com/earendil-works/pi/issues/5132)）。
- 修复了 fenced `diff` 代码块及其他 highlight.js 作用域，在 `cli-highlight` 替换后保持感知主题的语法高亮颜色（[#5092](https://github.com/earendil-works/pi/issues/5092)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 新增 OpenAI Codex 订阅设备码登录作为可选的无头替代方案，同时保留浏览器登录为默认方式（[#4911](https://github.com/earendil-works/pi/pull/4911)，感谢 [@vegarsti](https://github.com/vegarsti)）。
- 新增 Claude Opus 4.8 模型元数据（Anthropic），并更新 Opus adaptive-thinking 覆盖范围以使用它。

修复

- 修复了 OpenRouter DeepSeek V4 `xhigh` reasoning 元数据，保留 OpenRouter 原生的 effort 而非发送 DeepSeek 的 `max` effort（[#4801](https://github.com/earendil-works/pi/issues/4801)）。
- 修复了从 Anthropic extended-thinking 会话切换到 OpenAI Codex Responses 后的回放问题，为转换的 thinking/text 块生成唯一的 fallback 消息项 ID（[#5148](https://github.com/earendil-works/pi/issues/5148)）。
- 修复了返回空 thinking signature 的 Provider 的 Anthropic 兼容回放，新增可选的 `allowEmptySignature` 兼容性标志（[#4464](https://github.com/earendil-works/pi/issues/4464)）。
- 修复了 OpenAI 和 OpenRouter GPT-5.5 Pro thinking level 元数据，仅暴露支持的 medium、high 和 xhigh efforts。
- 修复了 OpenCode Go Kimi K2.6 thinking-off 请求，发送 `thinking: "none"`（[#5078](https://github.com/earendil-works/pi/issues/5078)）。
- 修复了 Xiaomi Token Plan 模型元数据，省略不支持的 `mimo-v2-flash` 变体（[#5075](https://github.com/earendil-works/pi/issues/5075)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

不兼容变更

- 将 agent harness 的 `model_select` 和 `thinking_level_select` 事件重命名为 `model_update` 和 `thinking_level_update`。

新增

- 新增 agent harness 工具注册表 API、`tools_update` 事件、分支级活跃工具持久化和重复工具验证。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了键盘协议协商，忽略不匹配或延迟的终端响应，避免误检测 Kitty 键盘协议（[#5091](https://github.com/earendil-works/pi/pull/5091)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。

</details>

## v0.76.0（2026-05-27）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **自动化场景的显式会话 ID** — `--session-id <id>` 允许脚本创建或恢复一个精确的项目本地会话。参见 [Sessions](/docs/latest/usage#sessions)。
- **RPC bash 输出可排除在模型上下文之外** — RPC 客户端可向 `bash` 传递 `excludeFromContext`，使指定命令的输出不会随下一次 Prompt 发送。参见 [RPC 模式](/docs/latest/rpc#bash)。
- **更可预测的 Provider 重试与超时** — Codex WebSocket/SSE 等待已设上限，`retry.provider.maxRetries` 控制 Provider 重试，取代原先隐藏的 SDK 默认值。参见 [重试设置](/docs/latest/settings#retry)。
- **跨环境更好的终端编辑体验** — 修复了 Apple Terminal 的 Shift+Enter、Windows/JetBrains 的能力检测，以及支持 Unicode 的单词导航。参见 [终端配置](/docs/latest/terminal-setup) 和 [快捷键](/docs/latest/keybindings)。

新增

- 新增 `--session-id` 参数，允许 CLI 调用者使用精确的项目本地会话 ID，不存在时自动创建（[#4874](https://github.com/earendil-works/pi/issues/4874)）。
- 为 `bash` RPC 命令新增 `excludeFromContext` 标志，与内部 `executeBash` API 对齐（[#5039](https://github.com/earendil-works/pi/issues/5039)）。

修复

- 修复了用户消息转录渲染，保留用户编写的有序列表标记（[#5013](https://github.com/earendil-works/pi/issues/5013)）。
- 修复了自更新命令，显式运行 `pi update` 时绕过 npm、pnpm 和 Bun 的最低发布年龄门槛（[#4929](https://github.com/earendil-works/pi/issues/4929)）。
- 修复了上下文 Token 估算，用户图片附件现在与工具结果图片一致计数（[#4983](https://github.com/earendil-works/pi/issues/4983)）。
- 修复了 `httpIdleTimeoutMs` 应用于 OpenAI Codex Responses WebSocket 空闲等待，新增 `websocketConnectTimeoutMs` 限制 WebSocket 连接等待时间，并为 Codex SSE 添加了 10 秒响应头超时（[#4945](https://github.com/earendil-works/pi/issues/4945)）。
- 修复了 `RpcClient`，当子进程意外退出时拒绝待处理请求并消费 stdin 管道错误（[#4764](https://github.com/earendil-works/pi/issues/4764)）。
- 修复了托管 npm 扩展更新，避免包管理器将 pi 宿主包作为 peer 依赖安装或解析（[#4907](https://github.com/earendil-works/pi/issues/4907)）。
- 修复了 RPC 模式原始 stdout 写入，重试瞬时背压错误并在关闭期间刷新排队的协议输出（[#4897](https://github.com/earendil-works/pi/issues/4897)）。
- 修复了 OpenAI Codex Responses 缓存亲和性头，发送 `session-id` 而非与代理不兼容的 `session_id`（[#4967](https://github.com/earendil-works/pi/issues/4967)）。
- 修复了 `openai-codex/gpt-5.3-codex-spark` 模型元数据，使用其 128k 上下文窗口（[#4969](https://github.com/earendil-works/pi/issues/4969)）。
- 修复了 OpenRouter/Poolside 上下文溢出检测，处理 `maximum allowed input length` 错误（[#4943](https://github.com/earendil-works/pi/issues/4943)）。
- 修复了 Provider 重试控制，`retry.provider.maxRetries` 现在被正确执行，SDK 重试默认为 `0`，配额/计费 429 错误不再被 Pi 的重试机制重试（[#4991](https://github.com/earendil-works/pi-mono/pull/4991)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。
- 修复了 Apple Terminal 的 Shift+Enter，当 Terminal.app 发送普通回车时检测本地 macOS 修饰键状态。
- 修复了 Windows Terminal 能力检测，启用 OSC 8 超链接，使可点击的长 URL 在换行时保持有效（[#4923](https://github.com/earendil-works/pi/issues/4923)）。
- 修复了 JetBrains 终端能力检测，启用真彩色同时禁用不支持的 OSC 8 超链接（[#5037](https://github.com/earendil-works/pi-mono/pull/5037)，感谢 [@Perlence](https://github.com/Perlence)）。
- 修复了编辑器和输入的单词导航/删除，使用 Unicode 词边界同时保留 ASCII 标点符号边界（[#5022](https://github.com/earendil-works/pi-mono/pull/5022)，感谢 [@haoqixu](https://github.com/haoqixu)；[#5067](https://github.com/earendil-works/pi-mono/pull/5067)，感谢 [@haoqixu](https://github.com/haoqixu)；[#5068](https://github.com/earendil-works/pi-mono/pull/5068)，感谢 [@haoqixu](https://github.com/haoqixu)）。
- 修复了开发文档中 `AGENTS.md` 链接，指向 pi-mono 指南（[#5041](https://github.com/earendil-works/pi/issues/5041)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 OpenAI Codex Responses 缓存亲和性头，发送 `session-id` 而非与代理不兼容的 `session_id`（[#4967](https://github.com/earendil-works/pi/issues/4967)）。
- 修复了 `openai-codex/gpt-5.3-codex-spark` 生成的元数据，使用其 128k 上下文窗口（[#4969](https://github.com/earendil-works/pi/issues/4969)）。
- 修复了 OpenRouter/Poolside 上下文溢出检测，处理 `maximum allowed input length` 错误（[#4943](https://github.com/earendil-works/pi/issues/4943)）。
- 修复了 OpenAI Codex Responses WebSocket 流和 SSE 响应头等待，应用有界超时而非无限等待（[#4945](https://github.com/earendil-works/pi/issues/4945)）。
- 修复了 Provider 重试控制，OpenAI Codex Responses 现在正确执行 `maxRetries`，SDK 重试默认为 `0`，配额/计费 429 错误不再被重试（[#4991](https://github.com/earendil-works/pi-mono/pull/4991)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

修复

- 修复了上下文 Token 估算，用户图片附件现在与工具结果图片一致计数（[#4983](https://github.com/earendil-works/pi/issues/4983)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

新增

- 新增可选的 Markdown 渲染器选项，保留源文件中的有序列表标记用于转录渲染（[#5013](https://github.com/earendil-works/pi/issues/5013)）。

修复

- 修复了 Apple Terminal 的 Shift+Enter，当 Terminal.app 发送普通回车时检测本地 macOS 修饰键状态。
- 修复了 Windows Terminal 能力检测，启用 OSC 8 超链接，使可点击的长 URL 在换行时保持有效（[#4923](https://github.com/earendil-works/pi/issues/4923)）。
- 修复了 JetBrains 终端能力检测，启用真彩色同时禁用不支持的 OSC 8 超链接（[#5037](https://github.com/earendil-works/pi-mono/pull/5037)，感谢 [@Perlence](https://github.com/Perlence)）。
- 修复了编辑器和输入的单词导航/删除，使用 Unicode 词边界同时保留 ASCII 标点符号边界（[#5022](https://github.com/earendil-works/pi-mono/pull/5022)，感谢 [@haoqixu](https://github.com/haoqixu)；[#5067](https://github.com/earendil-works/pi-mono/pull/5067)，感谢 [@haoqixu](https://github.com/haoqixu)；[#5068](https://github.com/earendil-works/pi-mono/pull/5068)，感谢 [@haoqixu](https://github.com/haoqixu)）。

</details>

## v0.75.5（2026-05-23）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **更清晰的 read 工具输出** — 折叠的 `read` 工具卡片现在默认只显示读取的行，按 `Ctrl+O` 仍可展开查看完整文件内容。
- **Windows 上更快的文件工具** — 内置文件工具现在在流式传输期间使用异步文件系统操作，图片缩放也在 worker 中脱离主 TUI 线程运行。
- **更可靠的包更新** — `pi update` 和 git 包安装现在会协调固定的 git ref 并保持包设置完整。参见 [Packages](/docs/latest/packages)。
- **自定义 Anthropic 兼容模型的自适应思考** — 自定义 Provider 模型配置可通过 `compat.forceAdaptiveThinking` 启用自适应思考 Claude 行为。参见 [自定义 Provider](/docs/latest/custom-provider) 和 [模型](/docs/latest/models)。

新增

- 为自定义 Anthropic 兼容模型配置文档和验证添加了 `compat.forceAdaptiveThinking` 支持（[#4797](https://github.com/earendil-works/pi-mono/pull/4797)，感谢 [@mbazso](https://github.com/mbazso)）。
- 为 SDK 消费者添加了编辑工具结果详情的标准统一补丁（[#4821](https://github.com/earendil-works/pi/issues/4821)）。

变更

- 折叠的 read 工具卡片现在默认仅显示读取的行，展开后才显示完整内容（[#4916](https://github.com/earendil-works/pi/issues/4916)）。
- 修改了根开发安装文档，使用 `npm install --ignore-scripts`（[#4868](https://github.com/earendil-works/pi/issues/4868)）。

修复

- 修复了 `pi update` 将 git-pinned 包协调到其配置的 ref（[#4869](https://github.com/earendil-works/pi/issues/4869)）。
- 修复了 Windows 上的包/资源路径处理和 glob/模式解析（[#4873](https://github.com/earendil-works/pi-mono/pull/4873)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。
- 修复了配置模式匹配，从正确的基础目录解析模式（[#4898](https://github.com/earendil-works/pi-mono/pull/4898)，感谢 [@haoqixu](https://github.com/haoqixu)）。
- 修复了主题选择器，按其内容名称而非文件名列出主题（[#4830](https://github.com/earendil-works/pi-mono/pull/4830)，感谢 [@Perlence](https://github.com/Perlence)）。
- 修复了 OpenCode Zen/Go 请求发送每个会话的 OpenCode 路由头（[#4847](https://github.com/earendil-works/pi/issues/4847)）。
- 修复了 Amazon Bedrock Provider 在严格包管理器下的加载，继承了 `@earendil-works/pi-ai` 中声明的 `@smithy/node-http-handler` 依赖（[#4842](https://github.com/earendil-works/pi/issues/4842)）。
- 修复了 Amazon Bedrock Claude 请求默认发送模型输出 Token 上限，避免 Bedrock 的 4096 Token 默认截断（[#4848](https://github.com/earendil-works/pi/issues/4848)）。
- 修复了导出的会话 HTML，对属性值中的引号字符进行转义（[#4832](https://github.com/earendil-works/pi/issues/4832)）。
- 修复了 GitHub Copilot 设备码登录，在浏览器可用环境中持续打开验证 URL，同时忽略无头使用的浏览器启动失败（[#4788](https://github.com/earendil-works/pi-mono/pull/4788)，感谢 [@vegarsti](https://github.com/vegarsti)）。
- 修复了 git 包安装，将现有检出与请求的 ref 对齐，并在不丢失过滤器的情况下更新包设置（[#4870](https://github.com/earendil-works/pi/issues/4870)）。
- 发布了 0.74.2 救援版本，告知 Node 20 用户在更新到更新版 Pi 之前先升级 Node（[#4876](https://github.com/earendil-works/pi/issues/4876)）。
- 修复了最终 bash 工具卡片，避免渲染重复的完整输出截断路径（[#4819](https://github.com/earendil-works/pi/issues/4819)）。
- 修复了 bash 工具截断行数统计，忽略尾随换行符作为额外输出行（[#4818](https://github.com/earendil-works/pi/issues/4818)）。
- 修复了底栏主目录缩写，避免缩短仅共享同一前缀的兄弟路径（[#4878](https://github.com/earendil-works/pi/issues/4878)）。
- 修复了 macOS Bun 发布二进制文件，解析原生剪贴板 sidecar，使 Ctrl+V 图片粘贴可以加载 `@mariozechner/clipboard`（[#4307](https://github.com/earendil-works/pi/issues/4307)）。
- 修复了 coding-agent 工具，避免在流式传输期间使用同步文件系统操作，并将图片缩放移出主 TUI 线程（[#4756](https://github.com/earendil-works/pi-mono/pull/4756)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

不兼容变更

- 修改了 `OAuthLoginCallbacks`，要求提供 `onDeviceCode` 和 `onSelect`，以便 OAuth Provider 可以依赖 Pi 提供设备码和选择界面回调。

修复

- 修复了自定义 Anthropic 兼容模型别名，通过添加 `compat.forceAdaptiveThinking` 模型元数据并将内置 adaptive-thinking 选择移出 Provider ID 子字符串检查（[#4797](https://github.com/earendil-works/pi-mono/pull/4797)，感谢 [@mbazso](https://github.com/mbazso)）。
- 修复了 GitHub Copilot OAuth 登录，依赖必需的设备码回调，无需运行时回调可用性保护。
- 修复了 Amazon Bedrock Provider 在严格包管理器下的加载，声明其直接的 `@smithy/node-http-handler` 依赖（[#4842](https://github.com/earendil-works/pi/issues/4842)）。
- 修复了 Amazon Bedrock Claude 请求默认发送模型输出 Token 上限，匹配 Anthropic 请求并避免 Bedrock 的 4096 Token 默认截断（[#4848](https://github.com/earendil-works/pi/issues/4848)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- 将 Windows VT 输入的可选 `koffi` 依赖替换为小型内嵌原生辅助，减少安装体积的同时保留 Shift+Tab 处理（[#4480](https://github.com/earendil-works/pi/issues/4480)）。

</details>

## v0.75.4（2026-05-20）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **加固的 npm 安装与发布流程** — Pi CLI 现在附带生成的 shrinkwrap 来锁定传递依赖，阻止意外修改 lockfile，在检查中验证依赖固定和生命周期脚本白名单，在支持的平台上禁用自更新和本地发布安装的生命周期脚本，并在发布前对隔离的 npm 和 Bun 安装进行冒烟测试。

新增

- `pi update` 运行后显示交互式更新说明，用户可在继续前查看已安装版本的变更日志（[#4724](https://github.com/earendil-works/pi-mono/pull/4724)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。
- 从包根目录导出了图像缩放工具函数，供 SDK 消费者使用（[#4775](https://github.com/earendil-works/pi-mono/pull/4775)，感谢 [@xl0](https://github.com/xl0)）。

变更

- 修改源码语法，避免需要 JavaScript 产出的 TypeScript 构造，使核心源码兼容 Node.js 的 strip-only 类型检查。
- 从 CLI 包中移除了 Web UI 工作空间引用和包级开发 watch 脚本。
- 发布的 npm 安装包现在包含 `npm-shrinkwrap.json` 以锁定 CLI 包的传递依赖。
- 改进了终端主题检测，优化了浅色/深色模式和真彩色处理。
- 自更新包管理器命令现在在重新安装时禁用生命周期脚本。

修复

- 修复系统提示，使模型在读取特定主题的相对引用前，先解析 pi 文档和示例的绝对包路径（[#4752](https://github.com/earendil-works/pi/issues/4752)）。
- 修复了扩展 `ctx.abort()` 在 tool call 预检期间停止后续确认并恢复队列中的交互输入（如 Escape）（[#4276](https://github.com/earendil-works/pi/issues/4276)）。
- 修复了 AgentSession 的重试、压缩和事件结算，改为使用等待的 Agent 生命周期而非独立事件队列，并在 `agent_end` 会话事件中添加了 `willRetry`。
- 修复了分叉会话的运行时状态，使活动会话 ID 与分叉目标保持一致（[#4799](https://github.com/earendil-works/pi-mono/pull/4799)，感谢 [@Perlence](https://github.com/Perlence)）。
- 修复了子 Agent 扩展的并行模式，使其向父模型返回有用的每任务输出和失败任务诊断信息，而非仅 100 字符的预览（[#4710](https://github.com/earendil-works/pi/issues/4710)）。
- 修复了 Windows 本地 bash 执行，在后台 SDK 进程启动时隐藏辅助控制台窗口（[#4699](https://github.com/earendil-works/pi/issues/4699)）。
- 修复了托管的 npm 扩展文件夹，在支持的平台上设置云同步忽略元数据（[#4763](https://github.com/earendil-works/pi/issues/4763)）。
- 修复了 HTTP 空闲超时配置，使长时间运行的 Provider 流避免过早的空闲断开（[#4759](https://github.com/earendil-works/pi-mono/pull/4759)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。
- 修复了默认系统提示的边界，使用显式的 XML 标签实现更清晰的文件分隔（[#4709](https://github.com/earendil-works/pi-mono/pull/4709)，感谢 [@herrnel](https://github.com/herrnel)）。
- 修复了 HTML 分享/导出侧边栏中共享工具条目的点击，使其滚动到已渲染的 tool call（[#4664](https://github.com/earendil-works/pi-mono/pull/4664)，感谢 [@yzhg1983](https://github.com/yzhg1983)）。
- 修复了主题调色板，设置明确的文本颜色以避免终端默认颜色漂移。
- 修复了真彩色检测，使终端图像渲染和交互主题决策保持一致。
- 修复了从 `@earendil-works/pi-tui` 继承的加载指示器启动逻辑，确保初始化不会在帧可用前运行。
- 修复了从 `@earendil-works/pi-ai` 继承的 OpenAI 兼容默认输出 token 请求，避免在 vLLM 等服务器上预留不可能完成的上下文窗口（[#4675](https://github.com/earendil-works/pi/issues/4675)）。
- 修复了从 `@earendil-works/pi-ai` 继承的 OpenAI prompt 缓存键，使其保持在 64 字符的 Provider 限制内（[#4720](https://github.com/earendil-works/pi/issues/4720)）。
- 修复了 Windows 上 fnm 管理的 Node.js 安装的 npm 系列包命令，这些安装同时暴露了无扩展名的 Unix 脚本和 `.cmd` 存根（[#4793](https://github.com/earendil-works/pi/issues/4793)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- 移除了包级开发 watch 脚本，因为根级别的 TypeScript 检查现在已验证 strip-only 兼容的源码。

修复

- 修复了加载器初始化，确保指示器启动不会在帧初始化前运行。
- 修复了真彩色能力检测，使终端图像渲染与交互主题检测器保持一致。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

变更

- 修改源码语法，避免需要 JavaScript 产出的 TypeScript 构造，保持包与 Node.js strip-only 类型检查兼容。
- 移除了包级开发 watch 脚本。

修复

- 修复了 tool call 预检在运行中止后停止准备兄弟 tool call（[#4276](https://github.com/earendil-works/pi/issues/4276)）。
- 修复了以换行符结尾的超长单行输出的尾部截断（[#4715](https://github.com/earendil-works/pi/issues/4715)）。
- 修复了 Windows Node 执行环境的命令启动，在后台进程中隐藏辅助控制台窗口（[#4699](https://github.com/earendil-works/pi/issues/4699)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

变更

- 修改源码语法，避免需要 JavaScript 产出的 TypeScript 构造，保持包与 Node.js strip-only 类型检查兼容。
- 移除了包级开发 watch 脚本。

新增

- 新增了一流的 OAuth 设备码回调元数据、共享轮询支持和 GitHub Copilot OAuth 集成。

修复

- 修复了 OpenAI 兼容的 `streamSimple()` 请求，停止发送模型派生的默认输出 token 上限，避免在 vLLM 等服务器上发生上下文窗口预留失败，同时保留显式的 `maxTokens` 和必需的 Anthropic `max_tokens` 处理（[#4675](https://github.com/earendil-works/pi/issues/4675)）。
- 修复了 OpenAI prompt 缓存键，将会话派生值限制在 64 字符的 API 限制内（适用于 OpenAI Responses、Chat Completions、Codex Responses 和 Azure OpenAI Responses）（[#4720](https://github.com/earendil-works/pi/issues/4720)）。

</details>

## v0.75.3（2026-05-18）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 在模型选择器完成后刷新可用模型列表，使新增的 Provider 和模型立即可见。
- 修复了终端关闭或 SSH 断开时的静默退出，确保 pi 正确关闭会话并清理系统任务。
- 改进了失效会话的扩展生命周期，在发出 `session_shutdown` 后从扩展中移除过期的 `withSession` 回调。
- 修复了通过外部编辑器编辑后在 `pi -p` 中错误应用扩展标志的问题。
- 修复了 `/compact` 提示参数在命令行解析中被丢弃的问题。
- 修复了自动密钥登录选择器面板在某些 Provider 上显示为空白的问题。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 OpenAI 兼容的 token 计数，使用 tiktoken 解析器的 `encodeSingle` 方法以处理非 UTF-8 编码的输入，提高可靠性。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

修复

- 修复了会话 fork 和克隆后运行时状态未完全重建的问题，确保所有内部回调指向正确的会话实例。

</details>

## v0.75.2（2026-05-18）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 为 piped 输入增加了 `--print` 模式的 ANSI 检测，防止二进制数据混乱终端状态。
- 修复了 pi 在 Python 单元测试的 `subprocess.run()` 中启动时无法正确刷新输出的问题。
- 修复了 `/compact` 设置默认提示时的问题。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了 TUI 输出刷新处理，确保在管道和非 TTY 环境中正确工作。

</details>

## v0.75.1（2026-05-18）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新增

- **启动时检查更新** — Pi 现在在启动时检查新版本并通知用户更新可用，而非仅在显式运行 `pi update` 时检查。

变更

- 在构建时预编译扩展宿主，以消除 `jiti` 导入开销，加快扩展加载速度。
- 自动完成菜单现在出现在编辑器文本上方而非重叠，在编辑器靠近屏幕底部时提供更好的可见性。

修复

- 修复了编辑视图滚动和 `PageDown` 处理。
- 修复了 `/compact` 设置默认压缩提示的处理。
- 将 `@earendil-works/pi-tui` 和 `@earendil-works/pi-ai` 作为外部依赖，保持 CLI 包体积紧凑。
- 修复了保存的会话在加载后无法通过自定义 Keybindings 切换模型的问题。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

新增

- 在包入口点导出了 `EditorShelf` 类型。

变更

- 自动完成下拉菜单现在浮动在编辑器上方而非重叠，提供更好的可见性。
- 将 `@napi-rs/clipboard` 设为可选依赖。

修复

- 修复了编辑视图的滚动溢出行为。
- 修复了水平滚动和 `PageDown` 键的处理。

</details>

## v0.75.0（2026-05-17）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **事件驱动的自更新** — Pi 现在通过自动版本检查支持更可靠的自更新，检测到新版本时显示通知。支持 `pi update` 和 `pi update self` 命令。参见 [Usage](/docs/latest/usage)。
- **Model Context Protocol (MCP) 工具支持** — Pi 扩展现在可以注册 MCP 工具客户端。使用 `pi.registerMCPServer()` 配置 MCP 服务器，在会话启动时自动连接。参见 [Extensions](/docs/latest/extensions)。
- **Shell 环境配置** — Pi 新的 Shell 环境设置允许自定义 `SHELL`、`TERM` 和 `COLORTERM` 环境变量。参见 [Settings](/docs/latest/settings)。
- **`/compact` 默认提示** — `/compact` 命令现在接受可选提示词来自定义压缩摘要的重点。

变更

- 重构了 Provider 模型解析，改进对 Provider 前缀模型解析和 Provider 回退处理的错误报告。
- 重构包以简化依赖结构，拆分 watch 和开发脚本。
- 依赖项 `@inquirer/prompts` 更新到 7.6.0。
- ANSI 处理更新以匹配 `strip-ansi` 行为。
- 使用标准 `uuid` 包生成 UUIDv7，替代之前的 nanoid 实现。
- 改进自动完成滚动指示器，并在无匹配时清除自动完成。

修复

- 修复了 ANSI 剥离以匹配移除依赖后的 `strip-ansi` 行为。
- 修复了会话 ID 共享的 UUIDv7 序列生成。
- 修复了从 `@earendil-works/pi-ai` 继承的 OpenRouter 缓存 token 使用统计、Fireworks 缓存兼容性和 OpenAI Codex WebSocket 代理处理。
- 修复了从 `@earendil-works/pi-tui` 继承的 Markdown 列表换行、任务列表复选框、大 Markdown 渲染、WezTerm Kitty 键盘转义处理和短视口内联图像放置。
- 修复了跨包作用域的主题共享，使扩展不会因 `Theme not initialized` 崩溃（[#4333](https://github.com/earendil-works/pi/issues/4333)）。
- 修复了快捷键提示在 macOS 上显示 Option 而非 Alt（[#4289](https://github.com/earendil-works/pi/issues/4289)）。
- 修复了交互式更新通知，在终端支持超链接时将会话日志渲染为 OSC 8 超链接（[#4280](https://github.com/earendil-works/pi/issues/4280)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- 移除了 nanoid UUID 生成，改用标准 `uuid` 包。
- 更新 ANSI 处理以匹配 `strip-ansi` 行为。
- 移除了包级开发 watch 脚本。

修复

- 修复了 Markdown 列表换行，避免在列表标记后错误换行。
- 修复了 Markdown 任务列表复选框渲染。
- 修复了大 Markdown 内容的高效渲染。
- 修复了 WezTerm 中 CSI-u 修饰键的 Kitty 键盘协议处理。
- 修复了短视口中内联图像的放置。
- 修复了在选择器和自动完成组件中按预期显示滚动指示器。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

变更

- 移除了包级开发 watch 脚本。

修复

- 修复了错误边界在指示错误时重新抛出异常。
- 修复了 tool call 预检使得相邻 tool call 在并行解析期间检测到上下文溢出时正确失败。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

变更

- 重构包以简化依赖结构，拆分 watch 和开发脚本。
- 移除了 nanoid UUID 生成，改用标准 `uuid` 包。

修复

- 修复了 OpenRouter 缓存的 token 使用统计处理。
- 修复了 Fireworks 平台缓存的兼容性处理。
- 修复了 OpenAI Codex WebSocket 代理处理。
- 修复了 OpenAI 兼容流中交错的 content 和 tool call delta 处理。

</details>

## v0.74.1（2026-05-16）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **OpenAI Codex WebSocket 传输** — 新的 `websocket-cached` 传输模式为 ChatGPT Plus/Pro 用户保持 WebSocket 连接，实现更快的后续请求。参见 [Providers](/docs/latest/providers)。

新增

- 为 Anthropic 模型支持了扩展的思考（thinking）块级别 `high` 和 `xhigh`。
- 为 ChatGPT Pro 用户新增了 `o3` 和 `o4-mini` 模型。

变更

- 将包作用域从 `@mariozechner` 迁移到 `@earendil-works`。
- `@earendil-works/pi-tui` 和 `@earendil-works/pi-ai` 现在作为外部依赖，减小 CLI 包体积。
- 改进了 `pi update` 命令，支持包名映射和重命名检测。

修复

- 修复了子 Agent 扩展，当未提供 `contextWindow` 时正确获取 Provider 的模型上下文窗口。
- 修复了扩展文件名检测，支持子目录中的嵌套扩展。
- 修复了模型选择器中模型显示名称的格式化。
- 修复了 `@earendil-works/pi-tui` 中的加载器范围和元数据键。
- 修复了外部编辑器编辑后的扩展标志应用。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 为 Anthropic 模型支持了扩展的思考块级别 `high` 和 `xhigh`。

变更

- 将包作用域从 `@mariozechner` 迁移到 `@earendil-works`。
- 重构了 Provider 流处理，支持 WebSocket 传输。

修复

- 修复了 OpenAI Codex WebSocket 传输在流式和非流式模式下的处理。
- 修复了流式响应的传输编码处理。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

变更

- 将包作用域从 `@mariozechner` 迁移到 `@earendil-works`。

修复

- 修复了 Agent 循环中的传输错误处理。
- 修复了子 Agent 扩展的上下文窗口配置。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- 将包作用域从 `@mariozechner` 迁移到 `@earendil-works`。
- 移除了 `@napi-rs/clipboard` 依赖，改用纯 JavaScript 剪贴板实现。

修复

- 修复了 WezTerm 中的 Kitty 键盘协议处理。
- 修复了 macOS 上加载器指示器的渲染问题。

</details>

## v0.74.0（2026-05-07）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

变更

- 更新了仓库链接和包引用，迁移到 `earendil-works/pi-mono` 和 `@earendil-works/*` 包作用域。

</details>

## v0.73.1（2026-05-07）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **npm 作用域迁移的自更新支持**：`pi update --self` 现在支持即将到来的包名从 `@mariozechner/pi-coding-agent` 到 `@earendil-works/pi-coding-agent` 的迁移。新包发布后，现有的全局安装可以通过正常的自更新流程更新；pi 会卸载旧的全局包并安装版本检查端点返回的包名。
- **交互式 OAuth 登录选择**：OAuth Provider 现在可以在 `/login` 中呈现多个登录选项，实现 Provider 特定的交互式认证流程。参见 [Providers](/docs/latest/providers)。
- **JSONC 风格 `models.json` 解析**：`models.json` 现在支持注释和尾逗号，使自定义 Provider 和模型配置更易于维护。参见 [Providers](/docs/latest/providers) 和 [Custom Providers](/docs/latest/custom-provider)。

新增

- 新增了交互式登录选择支持，使 OAuth Provider 可以呈现多个登录选项（[#4190](https://github.com/earendil-works/pi-mono/pull/4190)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）。

变更

- `pi update --self` 现在遵循 Pi 版本检查端点返回的活动包名，省略时默认当前包，并在安装重命名包前卸载旧的全局包。
- 扩展加载改用上游 `jiti` 2.7 替代 `@mariozechner/jiti` 分支（[#4244](https://github.com/earendil-works/pi-mono/pull/4244)，感谢 [@pi0](https://github.com/pi0)）。
- `models.json` 解析现在允许注释和尾逗号（[#4162](https://github.com/earendil-works/pi-mono/pull/4162)，感谢 [@julien-c](https://github.com/julien-c)）。

修复

- 修复了 `pi -p` 将以 YAML frontmatter 开头的提示误认为扩展标志而非用户消息的问题（[#4163](https://github.com/badlogic/pi-mono/issues/4163)）。
- 修复了在工具运行时切换思考块可见性后，待处理的工具结果未在实时 TUI 中更新的问题（[#4167](https://github.com/badlogic/pi-mono/issues/4167)）。
- 修复了 `/copy` 在仅有 Wayland 的合成器（Hyprland、Niri 等）上报告成功但未写入剪贴板的问题——在 Linux 上跳过了仅 X11 的原生插件，改用 `wl-copy`/`xclip`/`xsel`（[#4177](https://github.com/badlogic/pi-mono/issues/4177)）。
- 修复了 HTML 会话导出，从渲染的用户消息中剥离 Skill 包装 XML（[#4234](https://github.com/earendil-works/pi-mono/pull/4234)，感谢 [@aliou](https://github.com/aliou)）。
- 修复了在同一 choice 中交错 content 和 tool call delta 的 OpenAI 兼容聊天补全流。
- 修复了 OpenAI Codex OAuth 刷新失败在 TUI 活动时直接写入 stderr 的问题（[#4141](https://github.com/badlogic/pi-mono/issues/4141)）。
- 修复了 OpenAI Codex Responses 请求发送非空系统提示的问题（[#4184](https://github.com/earendil-works/pi-mono/issues/4184)）。
- 修复了 Kimi For Coding 模型中 Kimi K2 P6 别名的模型解析（[#4218](https://github.com/earendil-works/pi-mono/issues/4218)）。
- 修复了 Kitty 内联图像重绘保持在 TUI 拥有的终端区域内，避免写入活动视口下方。
- 修复了 Kitty 内联图像渲染，让终端分配图像 ID 并将解析的图像 ID 限制在有效值内。
- 修复了内联图像能力检测，在 cmux 终端中禁用内联图像。

</details>

## v0.73.0（2026-05-04）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **小米 MiMo API 计费和区域 Token Plan Provider** — `xiaomi` 现在使用 API 计费，包含独立的 `xiaomi-token-plan-{cn,ams,sgp}` Provider。参见 [Providers](/docs/latest/providers)。（[#4112](https://github.com/badlogic/pi-mono/pull/4112)，感谢 [@Phoen1xCode](https://github.com/Phoen1xCode)）
- **增量 bash 输出流式传输** — Bash 工具输出现在在命令运行时即可看到，而非仅在完成后显示。（[#4145](https://github.com/badlogic/pi-mono/issues/4145)）
- **紧凑的 read 渲染** — Pi 文档、上下文文件和技能的交互式 `read` 输出默认折叠，并显示选定的行范围。

不兼容变更

- 将内置的 `xiaomi` Provider 从 Token Plan AMS 切换到小米的 API 计费端点，并将其 `/login` 显示名称从 "Xiaomi MiMo Token Plan" 改为 "Xiaomi MiMo"。`XIAOMI_API_KEY` 现在指向来自 [platform.xiaomimimo.com](https://platform.xiaomimimo.com) 的 API 计费密钥。Token Plan 用户应切换到相应的 `xiaomi-token-plan-*` Provider 并设置对应的环境变量（[#4112](https://github.com/badlogic/pi-mono/pull/4112)，感谢 [@Phoen1xCode](https://github.com/Phoen1xCode)）。

新增

- 新增了三个小米 MiMo Token Plan 区域 Provider：`xiaomi-token-plan-cn`（`XIAOMI_TOKEN_PLAN_CN_API_KEY`）、`xiaomi-token-plan-ams`（`XIAOMI_TOKEN_PLAN_AMS_API_KEY`）、`xiaomi-token-plan-sgp`（`XIAOMI_TOKEN_PLAN_SGP_API_KEY`），每个默认使用 `mimo-v2.5-pro` 模型（[#4112](https://github.com/badlogic/pi-mono/pull/4112)，感谢 [@Phoen1xCode](https://github.com/Phoen1xCode)）。

变更

- `read` 工具渲染现在默认在交互式输出中折叠 Pi 文档、AGENTS/CLAUDE 上下文文件和 `SKILL.md` 的内容。

修复

- 修复了为 Qwen 3.5/3.6 和 MiniMax M2.7 生成的 OpenAI 兼容模型元数据，使这些模型通过内置 Provider 目录正常工作（[#4110](https://github.com/badlogic/pi-mono/pull/4110)，感谢 [@jsynowiec](https://github.com/jsynowiec)）。
- 修复了 Bedrock Claude Opus 4.7 的 `xhigh` 思考请求，保留 Provider 的原生效值。
- 修复了 OpenAI Codex WebSocket 传输，在流开始前设置失败时回退到 SSE，并在助手消息中显示传输诊断信息（[#4133](https://github.com/badlogic/pi-mono/issues/4133)）。
- 修复了 OpenAI Codex WebSocket 传输在会话关闭时关闭缓存的 WebSocket 会话，避免 `--print` 和 JSON 模式进程在响应后保持存活（[#4103](https://github.com/badlogic/pi-mono/issues/4103)）。
- 修复了紧凑 `read` tool call 直接渲染并在交互式输出中包含选定行范围。
- 修复了交互式会话在终端输入丢失时退出而非继续处于损坏状态。
- 修复了 bash 工具输出在命令运行时增量流式传输，而非等待命令完成（[#4145](https://github.com/badlogic/pi-mono/issues/4145)）。
- 修复了选择器和自动完成的模糊排序，优先精确匹配。

</details>

## v0.72.1（2026-05-02）

无显著变更。

## v0.72.0（2026-05-01）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **小米 MiMo Token Plan Provider** — 新增 Anthropic 兼容的 Provider，支持 `XIAOMI_API_KEY` 认证，默认模型 `mimo-v2.5-pro`，支持 `/login` 显示。参见 [Providers](/docs/latest/providers)。（[#4005](https://github.com/badlogic/pi-mono/pull/4005)，感谢 [@Phoen1xCode](https://github.com/Phoen1xCode)）
- **模型思考级别元数据** — 模型现在可以通过 `thinkingLevelMap` 声明支持的思考级别，替代旧的 `reasoningEffortMap`。参见 [Models](/docs/latest/models) 和 [Custom Providers](/docs/latest/custom-provider)。（[#3208](https://github.com/badlogic/pi-mono/issues/3208)）
- **自定义 Provider 基础 URL 覆盖** — `pi.registerProvider()` 现在支持逐模型的 `baseUrl` 设置。参见 [Custom Providers](/docs/latest/custom-provider)。（[#4063](https://github.com/badlogic/pi-mono/issues/4063)）
- **回合后停止回调** — Agent 循环现在可以通过 `shouldStopAfterTurn` 在完成一个回合后优雅退出。
- **自更新检测修复** — Pi 现在能正确识别并应用可用更新。（[#3942](https://github.com/badlogic/pi-mono/issues/3942)、[#3980](https://github.com/badlogic/pi-mono/issues/3980)、[#3922](https://github.com/badlogic/pi-mono/issues/3922)）

不兼容变更

- 将 `models.json` 和 `pi.registerProvider()` 模型定义中的 `compat.reasoningEffortMap` 替换为模型级别的 `thinkingLevelMap`（[#3208](https://github.com/badlogic/pi-mono/issues/3208)）。迁移方式：将旧映射从 `compat.reasoningEffortMap` 移至 `thinkingLevelMap`。使用字符串值表示 Provider 特定的思考值，使用 `null` 表示不支持且应在循环中隐藏和跳过的 pi 级别。

新增

- 新增小米 MiMo Token Plan Provider 支持（[#4005](https://github.com/badlogic/pi-mono/pull/4005)，感谢 [@Phoen1xCode](https://github.com/Phoen1xCode)）。
- 新增模型级别的 `thinkingLevelMap` 支持，使模型只暴露它们实际支持的思考级别（[#3208](https://github.com/badlogic/pi-mono/issues/3208)）。
- 新增 `shouldStopAfterTurn` Agent 循环回调，用于回合后停止控制。

修复

- 修复了默认传输设置为 `auto`，使 OpenAI Codex 在可用时使用缓存的 WebSocket 上下文（[#4083](https://github.com/badlogic/pi-mono/issues/4083)）。
- 修复了 `pi.registerProvider()` 遵循逐模型的 `baseUrl` 覆盖（[#4063](https://github.com/badlogic/pi-mono/issues/4063)）。
- 修复了自更新检测，使 pi 能正确识别新版本并应用更新（[#3942](https://github.com/badlogic/pi-mono/issues/3942)、[#3980](https://github.com/badlogic/pi-mono/issues/3980)、[#3922](https://github.com/badlogic/pi-mono/issues/3922)）。

</details>

## v0.71.1（2026-05-01）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新增

- 为 ChatGPT 订阅认证使用的 OpenAI Codex Provider 新增了 `websocket-cached` 传输选项。该模式在同一会话中保持 WebSocket 打开，首次请求后仅发送新增的对话内容而非重新发送完整聊天历史。

</details>

## v0.71.0（2026-04-30）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

不兼容变更

- 移除了内置的 Google Gemini CLI 和 Google Antigravity 支持。使用这些 Provider 的现有配置必须切换到其他受支持的 Provider。

新功能

- **Cloudflare AI Gateway Provider 支持** — 支持 `CLOUDFLARE_API_KEY`/`CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_GATEWAY_ID` 认证，默认模型解析和 `/login` 显示。参见 [Providers](/docs/latest/providers)。（[#3856](https://github.com/badlogic/pi-mono/pull/3856)，感谢 [@mchenco](https://github.com/mchenco)）
- **OpenAI Responses API 支持** — 使用 `compat: "openai-responses"` 的新 `o3` 和 `o4-mini` 模型可通过兼容层使用。参见 [Models](/docs/latest/models)。（[#3898](https://github.com/badlogic/pi-mono/pull/3898)，感谢 [@joshblum](https://github.com/joshblum)）
- **OpenAI Codex WebSocket 传输** — 新的 `transport` 设置支持 `websocket` 模式以实现更快的 ChatGPT 订阅认证请求。参见 [Providers](/docs/latest/providers)。（[#3930](https://github.com/badlogic/pi-mono/pull/3930)，感谢 [@f](https://github.com/f)）
- **Anthropic 扩展思考级别** — Anthropic 模型现在支持 `high` 和 `xhigh` 思考级别。参见 [Keybindings](/docs/latest/keybindings)。（[#3953](https://github.com/badlogic/pi-mono/pull/3953)，感谢 [@mitsuhiko](https://github.com/mitsuhiko)）
- **GitHub Models Provider** — 新的 GitHub Models Provider 支持通过 GitHub API 密钥访问模型。参见 [Providers](/docs/latest/providers)。（[#3840](https://github.com/badlogic/pi-mono/pull/3840)，感谢 [@joshblum](https://github.com/joshblum)）
- **OpenAI 新模型 `o3` 和 `o4-mini`** — 通过 OpenAI Responses API 使用。参见 [Models](/docs/latest/models)。

新增

- 新增 Cloudflare AI Gateway Provider。
- 新增 OpenAI Responses API 兼容支持。
- 新增 OpenAI Codex WebSocket 传输支持。
- 新增 Anthropic `high` 和 `xhigh` 思考级别。
- 新增 GitHub Models Provider。
- 新增 OpenAI `o3` 和 `o4-mini` 模型。

修复

- 修复了内置 Codex 模型元数据中 `maxOutput` 值和聊天补全与响应 API 之间的 `maxTokens` 默认值。
- 修复了工具列表系统提示生成，正确包含上下文中的自定义工具。
- 修复了 macOS 上终止 pi 时残留的 `bash` 子进程。
- 修复了会话共享命令在非 TTY 环境中的优雅降级。

</details>

## v0.70.6（2026-04-28）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复了 TUI 在等待最终响应时标记后端进程为孤立进程并提前退出的问题。
- 修复了聊天补全 Provider 的思考级别支持检测。
- 修复了 streamSimple 模型中思考块中的 `redacted` 文本处理。
- 修复了 `maxOutput` 设置与 Provider 的 `maxTokens` 的协调。
- 修复了控制台应用控制序列（DCS）字符串的处理，改进终端兼容性。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 `streamSimple` 模型中思考块的 `redacted` 文本聚合。
- 修复了聊天补全 Provider 的思考级别支持检测。
- 修复了 `maxOutput` 与 Provider 的 `maxTokens` 之间的映射。

</details>

## v0.70.5（2026-04-27）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复了自动 Keybinding 帮助弹窗意外出现的问题。
- 修复了在某些终端配置中 TUI 布局在启动时被截断的问题。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了编辑器内文本和行号的水平滚动同步。

</details>

## v0.70.4（2026-04-27）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 紧急修复了某些终端中启动时 TUI 渲染失败的问题。

</details>

## v0.70.3（2026-04-27）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新增

- **模型上下文大小显示** — `/session` 现在显示上下文中使用的 Token 数和模型的最大 Token 数。

修复

- 修复了 Agent 事件队列处理，确保 `tool_execution_start` 在 `message_start` 之后的正确顺序。
- 修复了 `pi -p` 中通过 `@` 引用文件但文件不存在时的优雅降级。
- 修复了自定义 Provider 中 Anthropic 兼容的 `max_tokens` 与 `max_completion_tokens` 设置。
- 改进了 Git 变更检测以更好地处理未跟踪的文件。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 `streamSimple` 中非标准 `max_tokens` 字段名的处理。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

修复

- 修复了事件发射顺序，确保 `tool_execution_start` 在 `message_start` 之后可靠排序。

</details>

## v0.70.2（2026-04-24）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复了某些 Linux 终端中后备颜色主题检测的兼容性。
- 修复了非交互式模式下的会话保存行为。

</details>

## v0.70.1（2026-04-24）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复了在终端调整大小时主题颜色的重新计算。
- 修复了 Windows 上 Git Bash 的 shell 路径检测。
- 修复了 macOS 上后台进程的进程组处理。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 Provider 特定 `maxTokens` 到 `max_tokens` 字段的映射。

</details>

## v0.70.0（2026-04-23）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **初始发布** — Pi Coding Agent 的首个公开版本。

</details>

---

## 历史版本

| 版本    | 日期       |
| ------- | ---------- |
| 0.69.0  | 2026-04-22 |
| 0.68.1  | 2026-04-22 |
| 0.68.0  | 2026-04-20 |
| 0.67.68 | 2026-04-17 |
| 0.67.67 | 2026-04-17 |
| 0.67.6  | 2026-04-16 |
| 0.67.5  | 2026-04-16 |
| 0.67.4  | 2026-04-16 |
| 0.67.3  | 2026-04-15 |
| 0.67.2  | 2026-04-15 |
| 0.67.1  | 2026-04-15 |
| 0.67.0  | 2026-04-14 |
| 0.66.0  | 2026-04-13 |
| 0.65.5  | 2026-04-11 |
| 0.65.4  | 2026-04-09 |
| 0.65.3  | 2026-04-09 |
| 0.65.2  | 2026-04-09 |
| 0.65.1  | 2026-04-09 |
| 0.65.0  | 2026-04-08 |
| 0.64.0  | 2026-04-08 |
| 0.63.4  | 2026-04-08 |
| 0.63.3  | 2026-04-07 |
| 0.63.2  | 2026-04-07 |
| 0.63.1  | 2026-04-07 |
| 0.63.0  | 2026-04-06 |
| 0.62.0  | 2026-04-02 |
| 0.61.1  | 2026-04-02 |
| 0.61.0  | 2026-04-02 |
| 0.60.2  | 2026-04-01 |
| 0.60.1  | 2026-04-01 |
| 0.60.0  | 2026-03-31 |
| 0.59.0  | 2026-03-30 |
| 0.58.0  | 2026-03-24 |
| 0.57.0  | 2026-03-20 |
| 0.56.1  | 2026-03-17 |
| 0.56.0  | 2026-03-17 |
| 0.55.7  | 2026-03-11 |
| 0.55.6  | 2026-03-10 |
| 0.55.5  | 2026-03-09 |
| 0.55.4  | 2026-03-09 |
| 0.55.3  | 2026-03-09 |
| 0.55.2  | 2026-03-06 |
| 0.55.1  | 2026-03-06 |
| 0.55.0  | 2026-03-06 |
| 0.54.0  | 2026-03-05 |
| 0.53.1  | 2026-03-04 |
| 0.53.0  | 2026-03-03 |
| 0.52.0  | 2026-03-03 |
| 0.51.2  | 2026-03-03 |
| 0.51.1  | 2026-03-03 |
| 0.51.0  | 2026-03-03 |
| 0.50.1  | 2026-03-02 |
| 0.50.0  | 2026-03-02 |
| 0.49.0  | 2026-03-01 |
| 0.48.0  | 2026-02-28 |
| 0.47.0  | 2026-02-28 |
| 0.46.0  | 2026-02-27 |
| 0.45.3  | 2026-02-27 |
| 0.45.2  | 2026-02-27 |
| 0.45.1  | 2026-02-26 |
| 0.45.0  | 2026-02-26 |
| 0.44.0  | 2026-02-24 |
| 0.43.4  | 2026-02-08 |
| 0.43.3  | 2026-02-06 |
| 0.43.2  | 2026-02-06 |
| 0.43.1  | 2026-02-05 |
| 0.43.0  | 2026-02-05 |
| 0.42.0  | 2026-02-04 |
| 0.41.0  | 2026-02-03 |
| 0.40.2  | 2026-02-02 |
| 0.40.1  | 2026-02-02 |
| 0.40.0  | 2026-02-02 |
| 0.39.1  | 2026-02-01 |
| 0.39.0  | 2026-02-01 |
| 0.38.0  | 2026-02-01 |
| 0.37.0  | 2026-01-31 |
| 0.36.0  | 2026-01-31 |
| 0.35.0  | 2026-01-31 |
| 0.34.0  | 2026-01-30 |
| 0.33.1  | 2026-01-29 |
| 0.33.0  | 2026-01-29 |
| 0.32.1  | 2026-01-29 |
| 0.32.0  | 2026-01-28 |
| 0.31.0  | 2026-01-28 |
| 0.30.0  | 2026-01-28 |
| 0.29.0  | 2026-01-27 |
| 0.28.0  | 2026-01-27 |
| 0.27.0  | 2026-01-26 |
| 0.26.0  | 2026-01-25 |
| 0.25.0  | 2026-01-24 |
| 0.24.0  | 2026-01-24 |
| 0.23.0  | 2026-01-23 |
| 0.22.0  | 2026-01-23 |
| 0.21.0  | 2026-01-22 |
| 0.20.0  | 2026-01-21 |
| 0.19.0  | 2026-01-15 |
| 0.18.0  | 2026-01-14 |
| 0.17.0  | 2026-01-13 |
| 0.16.0  | 2026-01-11 |
| 0.15.0  | 2026-01-10 |
| 0.14.0  | 2026-01-09 |
| 0.13.0  | 2026-01-08 |
| 0.12.0  | 2026-01-07 |
| 0.11.4  | 2026-01-07 |
| 0.11.3  | 2026-01-06 |
| 0.11.2  | 2026-01-06 |
| 0.11.1  | 2026-01-06 |
| 0.11.0  | 2026-01-05 |
| 0.10.6  | 2025-11-28 |
| 0.10.5  | 2025-11-28 |
| 0.10.4  | 2025-11-28 |
| 0.10.3  | 2025-11-28 |
| 0.10.2  | 2025-11-26 |
| 0.10.1  | 2025-11-25 |
| 0.10.0  | 2025-11-25 |
| 0.9.4   | 2025-11-26 |
| 0.9.3   | 2025-11-25 |
| 0.9.2   | 2025-11-24 |
| 0.9.1   | 2025-11-22 |
| 0.9.0   | 2025-11-22 |
| 0.8.0   | 2025-11-21 |
| 0.7.2   | 2025-11-21 |
| 0.7.1   | 2025-11-20 |
| 0.7.0   | 2025-11-20 |
| 0.6.3   | 2025-11-19 |
| 0.6.2   | 2025-11-18 |
| 0.6.1   | 2025-11-18 |
| 0.6.0   | 2025-11-18 |
| 0.5.3   | 2025-11-17 |
| 0.5.2   | 2025-11-17 |
| 0.5.1   | 2025-11-17 |
| 0.5.0   | 2025-11-15 |
| 0.4.0   | 2025-11-15 |
| 0.3.0   | 2025-11-14 |
| 0.2.0   | 2025-11-13 |
| 0.1.6   | 2025-11-13 |
| 0.1.5   | 2025-11-13 |
| 0.1.4   | 2025-11-13 |
| 0.1.3   | 2025-11-12 |
| 0.1.2   | 2025-11-12 |
| 0.1.1   | 2025-11-11 |
| 0.1.0   | 2025-11-10 |

---

### 完整变更日志

各包的完整变更历史：

- [Pi Coding Agent](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/CHANGELOG.md)
- [Pi TUI](https://github.com/earendil-works/pi/blob/main/packages/tui/CHANGELOG.md)
- [Pi Agent](https://github.com/earendil-works/pi/blob/main/packages/agent/CHANGELOG.md)
- [Pi AI](https://github.com/earendil-works/pi/blob/main/packages/ai/CHANGELOG.md)

---

> **法律声明**：本页面聚合自 pi 各子包的 CHANGELOG.md 文件的中文翻译，仅供学习参考。
