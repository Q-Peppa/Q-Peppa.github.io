# 新闻

> Pi Coding Agent 及其子包的版本发布记录。

## v0.80.8（2026-07-16）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

不兼容变更

- 将 SDK 的 `CreateAgentSessionOptions.authStorage` 和 `modelRegistry` 选项替换为异步 `modelRuntime` 选项。`AuthStorage` 及其存储后端不再导出；请使用 `ModelRuntime`（或自定义 pi-ai `CredentialStore`），或 `readStoredCredential()` 进行一次性读取。
- 移除了冗余的 `ModelRuntime.getAll()`、`find()`、`getSnapshot()` 和 `getAuthOptions()` 投影。请直接使用 pi-ai `Models` 的 `getModels()`、`getModel()`、`getProviders()` 和 `checkAuth()` 方法。
- 将 SDK 通过 `ModelRegistry.getApiKeyAndHeaders()` 组装的请求认证替换为 `ModelRuntime.getAuth()`。传入 Provider ID 返回 Provider 作用域认证；传入模型还会解析内置、`models.json` 和扩展模型请求头。
- 面向扩展的 `ModelRegistry.refresh()` 从同步 `void` 改为 `Promise<void>`，因为 `models.json` 加载是异步的。扩展必须在同步读取注册表之前 await 它。
- 将规范的动态目录刷新迁移到异步 `ModelRuntime.refresh()` / pi-ai `Models.refresh()`。旧版扩展 OAuth `modifyModels` 在凭据初始化后仍作为同步兼容投影保留。

新功能

- **统一的模型运行时与 Provider 认证** — `ModelRuntime` 集中管理模型配置、Provider 自有的 `/login` 和动态 Provider 目录。详见 [Providers](/docs/latest/providers)。
- **实时模型目录刷新** — `/model` 在后台刷新已配置的 Provider，`pi update --models` 可强制立即刷新。详见[安装和管理](/docs/latest/packages#install-and-manage)。
- **xAI 设备码 OAuth 与 Grok 4.5 Responses 支持** — 使用设备码登录 xAI，并以低、中、高 thinking 级别使用 Grok 4.5。详见 [xAI](/docs/latest/providers#xai-grokx-subscription)。

新增

- 新增 `ModelRuntime` 作为规范的异步 SDK 和内部模型/认证门面，同时保留面向扩展的同步 `ModelRegistry` API。`ModelRuntime.create()` 可通过 `credentials` 选项接受任何 pi-ai `CredentialStore`。
- 新增 Provider 自有的 `/login` 发现，直接从注册的 pi-ai Provider 获取，包括 ambient 认证状态和信息链接。
- 新增基于文件的动态目录 `models-store.json`、按 Provider 的 pi.dev 目录覆盖，以及 Radius 网关支持（包括从旧版凭据缓存目录离线迁移）。
- 新增扩展 Provider `refreshModels(context)` 支持动态模型发现，并可选地由 Provider 控制持久化。
- 新增 `pi update --models`，用于在不更新 Pi 或扩展的情况下强制立即刷新模型目录。
- 新增继承的 xAI 设备码 OAuth 登录，以及 Grok 4.5 OpenAI Responses 支持，提供低、中、高 thinking 级别（[#6651](https://github.com/earendil-works/pi-mono/pull/6651)，感谢 [@Jaaneek](https://github.com/Jaaneek)）。

变更

- `ModelRuntime` 改为通过临时 pi-ai Provider 方法组合内置 Provider、不可变的 `models.json` 配置和扩展覆盖。
- `ModelRuntime` 改为拥有最终请求组装：`getAuth(model)` 包含已配置模型请求头；流方法只解析一次认证；`before_provider_headers` 作为仅 Models 的请求头转换在 Provider 分发前运行。
- `/model` 改为立即渲染当前模型快照、在后台刷新已配置 Provider，并用部分结果或超时错误更新打开的选择器。

修复

- 修复已配置 Provider 目录刷新，使其能解析 pi.dev 以模型 ID 为键的响应、将检查频率限制为每 4 小时一次、发送带版本的 Pi user agent、将未实现路由视为不可用覆盖，并在 `/model` 中显示简洁刷新状态。
- 修复相邻的助手 thinking blocks，使其渲染为一个 thinking 区域。
- 修复继承的 OpenAI Codex 会话 ID 超过 64 字符的问题，以符合 API 限制（[#6630](https://github.com/earendil-works/pi-mono/issues/6630)）。
- 修复继承的终端输出，统一规范化 tab 字符（[#6697](https://github.com/earendil-works/pi-mono/pull/6697)，感谢 [@xz-dev](https://github.com/xz-dev)）。
- 修复检查 npm 包后的 Windows 终端标题（[#6629](https://github.com/earendil-works/pi-mono/issues/6629)）。
- 修复 Bun 独立二进制文件打包 OAuth 适配器以支持交互式登录。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

不兼容变更

- 将运行时认证改为 Provider 作用域的 `Models.checkAuth()`、`getAuth()`、`login()` 和 `logout()` API。`checkAuth()` 现在返回 `AuthCheck | undefined`，API key 认证解析器不再接收模型。
- 移除了旧版内置 OAuth Provider 对象、全局 OAuth 注册表 API 和公开的低层内置 login/refresh 函数。请改用规范的 `Provider.auth.oauth` 方法；`oauth` 子路径现在仅保留扩展兼容类型。
- 将规范登录交互接口从 `AuthLoginCallbacks` 重命名为 `AuthInteraction`；它暴露了 API key 和 OAuth 流程共用的 Provider 中立 `prompt()` / `notify()` 协议。
- 更改 `Models` 请求契约：`getAuth(model)` 现在包含模型请求头，`getAuth(providerId)` 仍为 Provider 作用域，Models 流选项可包含 `transformHeaders`。自定义 `Models` 实现必须在合并 auth/模型和显式请求头后执行该转换，然后在 Provider 分发前移除它。
- 将动态模型刷新改为 `Models.refresh(options)`，刷新每个已配置的动态 Provider 并返回按 Provider 的错误/取消状态。`Provider.refreshModels(context)` 现在接收有效凭据、作用域模型存储、网络策略和 abort 信号。

新增

- 为 `Models` 新增 Provider 自有的认证与可用性解析，包括存储的 OAuth 刷新和通过 `CredentialStore` 的交互式登录支持。
- 新增 `CredentialStore.list()` 异步枚举非机密凭据，以及支持凭据感知的 `Provider.filterModels()` 可用性策略。
- 新增中立的认证流程信息/链接事件，以及 Provider 自有的 Amazon Bedrock 和 Google Vertex AI 凭据选择流程。
- 新增 `ModelsStore`，使用内存默认实现来恢复和持久化动态 Provider 目录。
- 新增动态 Radius `pi-messages` 网关 Provider，支持 OAuth 和凭据特定的目录刷新。
- 新增 `Models.refresh({ force: true })`，让 Provider 绕过新鲜度检查执行显式刷新。
- 新增 xAI 设备码 OAuth 登录，并将 Grok 4.5 路由到 OpenAI Responses，支持低、中、高 thinking（[#6651](https://github.com/earendil-works/pi-mono/pull/6651)，感谢 [@Jaaneek](https://github.com/Jaaneek)）。

变更

- `Models.getAuth(model)` 改为包含模型请求头，并新增仅作用于 Models 的 `transformHeaders` 流选项，在 auth 和显式请求头组装之后、Provider 分发之前运行。

修复

- 修复 Cloudflare Workers AI 和 AI Gateway 流，使其在认证解析后对账户和网关端点占位符实例化，包括使用自定义模型对象的兼容流。
- 修复懒加载 Provider 流，使其在转发内部流时保留最终助手消息。
- 修复 OpenAI Codex 会话 ID 超过 64 字符的问题，以符合 API 限制（[#6630](https://github.com/earendil-works/pi-mono/issues/6630)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复终端输出，统一规范化 tab 字符（[#6697](https://github.com/earendil-works/pi-mono/pull/6697)，感谢 [@xz-dev](https://github.com/xz-dev)）。

</details>

## v0.80.7（2026-07-14）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

不兼容变更

- 移除了 `openai-responses` 的 `compat.sendSessionIdHeader` 标志。会话亲和行为现在由 `compat.sessionAffinityFormat`（`"openai"`、`"openai-nosession"` 或 `"openrouter"`）控制。将 `sendSessionIdHeader: false` 替换为 `sessionAffinityFormat: "openai-nosession"`（[#6496](https://github.com/earendil-works/pi-mono/pull/6496)，感谢 [@petrroll](https://github.com/petrroll)）。

新功能

- **缓存友好的动态工具加载** — 扩展可以在执行期间添加工具，同时受支持的 Anthropic 和 OpenAI Responses 模型保留 prompt 缓存前缀。详见[动态工具加载](/docs/latest/extensions#dynamic-tool-loading)。
- **消息复制快捷键** — `Ctrl+X` 复制转录中最后一条助手消息或 `/tree` 中选中的消息，使旧消息和分支消息可直接复制。详见[显示和消息队列](/docs/latest/keybindings#display-and-message-queue)。
- **Fable 5 `xhigh` 和 `max` thinking** — 在生成的 Provider 目录中提供原生的 `xhigh` 和 `max` thinking 级别。详见[模型选项](/docs/latest/usage#模型选项)。

新增

- 为扩展工具添加了缓存友好的动态工具加载，由 tool result 触发。受支持的 Anthropic 和 OpenAI Responses 模型在工具定义可用时加载定义，保留缓存的 prompt 前缀。详见[动态工具加载](/docs/latest/extensions#dynamic-tool-loading)（[#6474](https://github.com/earendil-works/pi-mono/pull/6474)）。
- 在所有生成的 Provider 目录中为 Claude Fable 5 添加了继承的原生 `xhigh` 和 `max` thinking 级别（[#6490](https://github.com/earendil-works/pi-mono/pull/6490)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 添加了 `Ctrl+X` 复制最后一条助手消息或 `/tree` 中选中的消息。
- 为 OpenAI 和 Codex Responses 添加了继承的 `toolChoice` 支持，包括 required 和 named 工具选择（[#6588](https://github.com/earendil-works/pi-mono/pull/6588)，感谢 [@xl0](https://github.com/xl0)）。

修复

- 修复了继承的 OpenRouter 模型上下文窗口，使用 top provider 的实际上下文长度（[#6481](https://github.com/earendil-works/pi-mono/pull/6481)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了继承的 OpenRouter OpenAI 兼容会话 ID，使用 `x-session-id` 请求头代替 OpenAI 特定的会话亲和字段（[#6496](https://github.com/earendil-works/pi-mono/pull/6496)，感谢 [@petrroll](https://github.com/petrroll)）。
- 修复了 `Ctrl+V` 在剪贴板不含图片时粘贴文本的行为。
- 修复了 `/login amazon-bedrock` 提示并保存 Bedrock API key，而非仅显示 ambient AWS 凭据设置说明。
- 修复了继承的 Amazon Bedrock ambient AWS 凭据，继续使用 SigV4 认证，包括自定义模型 ID（[#6532](https://github.com/earendil-works/pi-mono/pull/6532)，感谢 [@ribelo](https://github.com/ribelo)）。
- 修复了继承的 Cloudflare Workers AI 和 AI Gateway 认证，在存储的凭据仅包含 API key 时使用 ambient 账户和网关 ID（[#6292](https://github.com/earendil-works/pi-mono/pull/6292)，感谢 [@markphelps](https://github.com/markphelps)）。
- 修复了继承的旧终端解码中 `Alt+,` 和 `Alt+.` 等 Alt+符号组合键（[#6523](https://github.com/earendil-works/pi-mono/pull/6523)，感谢 [@ribelo](https://github.com/ribelo)）。
- 修复了 GitHub Copilot `mai-code-1-flash-picker` 模型路由，使其通过 `/responses` 端点（[#6544](https://github.com/earendil-works/pi-mono/pull/6544)，感谢 [@petrroll](https://github.com/petrroll)）。
- 修复了分支摘要，使其在使用 ambient 认证而非 API key 的 Provider 上正常工作（[#6595](https://github.com/earendil-works/pi-mono/pull/6595)，感谢 [@davidbrai](https://github.com/davidbrai)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

不兼容变更

- 移除了 `OpenAIResponsesCompat.sendSessionIdHeader` 标志。会话亲和行为现在由 `compat.sessionAffinityFormat`（`"openai"`、`"openai-nosession"` 或 `"openrouter"`）控制。将 `sendSessionIdHeader: false` 替换为 `sessionAffinityFormat: "openai-nosession"`（[#6496](https://github.com/earendil-works/pi-mono/pull/6496)，感谢 [@petrroll](https://github.com/petrroll)）。

新增

- 添加了缓存友好的动态工具加载。`ToolResultMessage.addedToolNames` 标记 `Context.tools` 中工具可用的位置；Anthropic 和 OpenAI Responses 使用原生延迟加载，使后加载的工具不进入缓存前缀，其他 Provider 继续正常使用 `Context.tools`（[#6474](https://github.com/earendil-works/pi-mono/pull/6474)）。
- 在所有生成的 Provider 目录中为 Claude Fable 5 添加了原生 `xhigh` 和 `max` thinking 级别（[#6490](https://github.com/earendil-works/pi-mono/pull/6490)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 为 OpenAI 和 Codex Responses 添加了 `toolChoice` 支持，包括 required 和 named 工具选择（[#6588](https://github.com/earendil-works/pi-mono/pull/6588)，感谢 [@xl0](https://github.com/xl0)）。

修复

- 修复了 OpenRouter 模型上下文窗口，使用 top provider 的实际上下文长度（[#6481](https://github.com/earendil-works/pi-mono/pull/6481)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了 GitHub Copilot `mai-code-1-flash-picker` 模型路由，使其通过 `/responses` 端点（[#6544](https://github.com/earendil-works/pi-mono/pull/6544)，感谢 [@petrroll](https://github.com/petrroll)）。
- 修复了 Amazon Bedrock 请求，使用通用 `apiKey` 流选项作为 Bedrock bearer token。
- 修复了 OpenRouter OpenAI 兼容会话 ID，使用 `x-session-id` 请求头代替 OpenAI 特定的会话亲和字段（[#6496](https://github.com/earendil-works/pi-mono/pull/6496)，感谢 [@petrroll](https://github.com/petrroll)）。
- 修复了 Amazon Bedrock ambient AWS 凭据，继续使用 SigV4 认证，包括自定义模型 ID（[#6532](https://github.com/earendil-works/pi-mono/pull/6532)，感谢 [@ribelo](https://github.com/ribelo)）。
- 修复了 Cloudflare Workers AI 和 AI Gateway 认证，在存储的凭据仅包含 API key 时使用 ambient 账户和网关 ID（[#6292](https://github.com/earendil-works/pi-mono/pull/6292)，感谢 [@markphelps](https://github.com/markphelps)）。
- 修复了 Amazon Bedrock 错误，报告未处理的 provider stop reason，而非仅显示 `An unknown error occurred`（[#6598](https://github.com/earendil-works/pi-mono/pull/6598)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了 Azure OpenAI Responses reasoning replay，当 `encrypted_content` 仅出现在终端 response event 中时（[#6608](https://github.com/earendil-works/pi-mono/pull/6608)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了省略 `message_delta` 事件中 `usage` 的 Anthropic 兼容代理（[#6611](https://github.com/earendil-works/pi-mono/pull/6611)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了 OpenCode OpenAI Responses 模型，省略不支持的 `session-id` 请求头，同时保留其他缓存亲和数据（[#6645](https://github.com/earendil-works/pi-mono/pull/6645)，感谢 [@davidbrai](https://github.com/davidbrai)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

新增

- 添加了 `AgentToolResult.addedToolNames` 向 `ToolResultMessage` 的传播，使 result 引入的工具可从该转录点起加载（[#6474](https://github.com/earendil-works/pi-mono/pull/6474)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了旧终端解码中 `Alt+,` 和 `Alt+.` 等 Alt+符号组合键（[#6523](https://github.com/earendil-works/pi-mono/pull/6523)，感谢 [@ribelo](https://github.com/ribelo)）。

</details>

## v0.80.6（2026-07-09）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **`max` thinking 级别** — 全新的可选 thinking 级别，位于 `xhigh` 之上，在 GPT-5.6 和 adaptive Claude 模型上原生支持，可通过 CLI（`--thinking max`）、SDK、RPC 和模型选择使用。自定义主题可定义 `thinkingMax`。详见 [CLI 参考](/docs/latest/usage#cli-reference)。
- **基于输入量的定价阶梯** — 请求级输入 token 定价阶梯，用于精确的长上下文成本核算（如 GPT-5.4/5.5/5.6 长上下文费率），也可在 `models.json` 和 `modelOverrides` 中为自定义模型配置。详见 [模型配置](/docs/latest/models#model-configuration)。

新增

- 在 CLI、SDK、RPC、模型选择和主题中添加了可选的 `max` thinking 级别。自定义主题可定义 `thinkingMax`；已有主题回退到 `thinkingXhigh`。
- 在 `models.json`、`modelOverrides` 和扩展注册的 Provider 中为自定义模型成本添加了请求级输入 token 定价阶梯。
- 为 `shellPath` 设置添加了 `~`（home 目录）展开（[#6470](https://github.com/earendil-works/pi/pull/6470)，感谢 [@aaronkyriesenbach](https://github.com/aaronkyriesenbach)）。

修复

- 修复了 compact 后输出 token 预算继承问题，使其忽略 compact 边界之前的过期助手使用量（[#6464](https://github.com/earendil-works/pi/issues/6464)）。
- 修复了 GPT-5.4 和 GPT-5.5 长上下文成本核算的继承问题，同时保留了需要显式覆盖的模型的 272K 默认上下文限制。
- 修复了 GPT-5.6 元数据继承问题，使直接 OpenAI 请求保持在 272K 短上下文阶梯，同时暴露 Codex 后端的 372K 上下文窗口及长上下文定价，并移除了不存在的裸 `gpt-5.6` 别名。
- 修复了 Anthropic 消息转换继承问题，保留 thinking text 为空但有有效签名的 thinking blocks，而非丢弃它们，避免新版 Claude 模型出现 thinking-block 错误（[#6457](https://github.com/earendil-works/pi/pull/6457)，感谢 [@davidbrai](https://github.com/davidbrai)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 添加了独立的可选 `max` thinking 级别，包括 GPT-5.6 和 Anthropic adaptive-thinking effort 的原生 `xhigh` 和 `max` 支持，匹配 Anthropic 文档：所有 adaptive Claude 模型支持 `max`，Opus 4.7/4.8、Sonnet 5 和 Fable 5 支持原生 `xhigh`。
- 在模型成本元数据和使用量成本计算中添加了请求级输入 token 定价阶梯。

修复

- 修复了 compact 后输出 token 预算，使其忽略 compact 边界之前的过期助手使用量（[#6464](https://github.com/earendil-works/pi/issues/6464)）。
- 修复了 GPT-5.4 和 GPT-5.5 长上下文成本核算，同时保留需要显式覆盖的模型的 272K 默认上下文限制。
- 修复了 GPT-5.6 元数据，使直接 OpenAI 请求保持在 272K 短上下文阶梯，同时暴露 Codex 后端的 372K 上下文窗口及长上下文定价，并从 OpenAI 和 Azure OpenAI Responses 目录中移除了不存在的裸 `gpt-5.6` 别名。
- 修复了 Anthropic 消息转换，保留 thinking text 为空但有有效签名的 thinking blocks，而非丢弃它们，避免新版 Claude 模型出现 thinking-block 错误（[#6457](https://github.com/earendil-works/pi/pull/6457)，感谢 [@davidbrai](https://github.com/davidbrai)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

新增

- 在 `xhigh` 之后添加了 `max` 模型 thinking 级别。

</details>

## v0.80.5（2026-07-09）

此版本无面向用户的功能变更，所有包均为内部改进。

## v0.80.4（2026-07-09）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **Prompt 缓存未命中可见性** — 可通过 `showCacheMissNotices` 在转录中显示显著的缓存未命中通知。详见 [模型与 Thinking](/docs/latest/settings#模型与-thinking)。
- **项目级资源配置** — `pi config -l` 和 Tab 切换管理全局与项目级包资源。详见 [启用和禁用资源](/docs/latest/packages#启用和禁用资源)。
- **扩展生命周期和 Provider 钩子** — 扩展获得 `agent_settled`、`before_provider_headers`、条目渲染器和 `InlineExtension`。详见 [agent_start / agent_end / agent_settled](/docs/latest/extensions#agent_start--agent_end--agent_settled)、[before_provider_headers](/docs/latest/extensions#before_provider_headers) 和 [InlineExtension](/docs/latest/sdk#inlineextension)。
- **新的继承模型和传输支持** — GPT-5.6 元数据、Copilot Claude Sonnet 5 和 zstd Codex SSE 传输通过继承的 Provider 支持可用。详见 [Providers](/docs/latest/providers) 和 [模型选项](/docs/latest/usage#模型选项)。

新增

- 添加了继承的 OpenAI GPT-5.6 模型元数据，支持 `gpt-5.6`、`gpt-5.6-sol`、`gpt-5.6-terra` 和 `gpt-5.6-luna`，并验证了 `openai-codex` 对 `gpt-5.6-sol`、`gpt-5.6-terra` 和 `gpt-5.6-luna` 的支持。
- 在 GitHub Copilot 模型目录中添加了继承的 Claude Sonnet 5（[#6200](https://github.com/earendil-works/pi/issues/6200)）。
- 为 OpenAI Codex Responses SSE 传输添加了继承的 zstd 请求体压缩。
- 添加了 `/login <provider>` 支持，含 Provider 自动补全。
- 添加了 CLI 等效模型和作用域模型解析的公共 SDK 导出（[#6201](https://github.com/earendil-works/pi/issues/6201)）。
- 添加了扩展和 RPC `agent_settled` 事件，以及完全 settled 的 agent 运行的会话级空闲等待（[#6363](https://github.com/earendil-works/pi/issues/6363)）。
- 添加了 `before_provider_headers` 扩展钩子，用于注入 Provider 请求头（[#6350](https://github.com/earendil-works/pi/pull/6350)，感谢 [@pmateusz](https://github.com/pmateusz)）。
- 添加了 `InlineExtension` 类型，用于命名的内联扩展工厂（[#6267](https://github.com/earendil-works/pi/pull/6267)，感谢 [@any-victor](https://github.com/any-victor)）。
- 添加了扩展条目渲染器，用于持久化的仅显示会话条目，在交互模式下渲染而不发送到模型上下文。
- 添加了 `pi config` 的项目级资源覆盖管理，包括通过 `pi config -l` 启动项目模式，以及全局和项目作用域之间的 Tab 切换（[#6309](https://github.com/earendil-works/pi/pull/6309)）。
- 从 agent harness 中添加了继承的 `InMemorySessionStorage` 和 `JsonlSessionStorage` 导出（[#6435](https://github.com/earendil-works/pi/issues/6435)）。
- 在 JSONL 会话头中添加了继承的自定义元数据支持（[#6417](https://github.com/earendil-works/pi/pull/6417)，感谢 [@ArcadiaLin](https://github.com/ArcadiaLin)）。
- 添加了 `showCacheMissNotices` 设置和 `/settings` 开关，用于显著的 Prompt 缓存未命中转录通知。

修复

- 修复了 gRPC `ResourceExhausted` Provider 错误（如 NVIDIA NIM 瞬时耗尽响应）的继承重试分类（[#6449](https://github.com/earendil-works/pi/pull/6449)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了 Cloudflare 524 超时响应的继承重试分类（[#6239](https://github.com/earendil-works/pi/issues/6239)）。
- 修复了 GitHub Copilot 设备码登录轮询继承问题，在首次 token 轮询前等待，并遵循服务器提供的 `slow_down` 间隔，避免浏览器授权后的错误失败或挂起（[#6187](https://github.com/earendil-works/pi/issues/6187)）。
- 修复了 OpenAI Codex WebSocket 会话继承问题，在后端 60 分钟限制之前轮换缓存连接，避免长会话出现连接限制失败（[#6268](https://github.com/earendil-works/pi/issues/6268)）。
- 修复了 DS4 服务器对 `Prompt has ... tokens, but the configured context size is ... tokens` 错误的上下文溢出检测继承问题（[#6262](https://github.com/earendil-works/pi/issues/6262)）。
- 修复了 Fireworks GLM 5.2 Fast 继承问题，使其使用 OpenAI 兼容端点和 `thinkingLevelMap`，与 GLM 5.2 对齐（[#6195](https://github.com/earendil-works/pi/issues/6195)）。
- 修复了 fork 菜单对同一选项重复选择的忽略问题（[#6430](https://github.com/earendil-works/pi/pull/6430)，感谢 [@davidbrai](https://github.com/davidbrai)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 添加了 OpenAI GPT-5.6 模型元数据，支持 `gpt-5.6`、`gpt-5.6-sol`、`gpt-5.6-terra` 和 `gpt-5.6-luna`，并验证了 `openai-codex` 对 `gpt-5.6-sol`、`gpt-5.6-terra` 和 `gpt-5.6-luna` 的支持。
- 从 models.dev 刷新了生成的模型目录，新增了 Kimi K2.7 Code（GitHub Copilot）和多个 Provider 的 Fable 5 等模型（[#6256](https://github.com/earendil-works/pi/issues/6256)）。
- 在 GitHub Copilot 模型目录中添加了 Claude Sonnet 5（[#6200](https://github.com/earendil-works/pi/issues/6200)）。
- 为 OpenAI Codex Responses SSE 传输添加了 zstd 请求体压缩。请求在 Node/Bun 支持 zstd 时发送 `Content-Encoding: zstd`；WebSocket 传输不变。

修复

- 修复了 gRPC `ResourceExhausted` Provider 错误（如 NVIDIA NIM 瞬时耗尽响应）的重试分类（[#6449](https://github.com/earendil-works/pi/pull/6449)，感谢 [@davidbrai](https://github.com/davidbrai)）。
- 修复了底层消息转换，在 Provider 转换前规范化 `null` 消息内容，避免松散导入转录的崩溃（[#6343](https://github.com/earendil-works/pi/pull/6343)）。
- 修复了 Xiaomi Token Plan 模型元数据，使其遵循上游 models.dev token-plan 目录，移除不支持的 `mimo-v2-omni` 变体（[#6204](https://github.com/earendil-works/pi/issues/6204)）。
- 修复了 GitHub Copilot 设备码登录轮询，在首次 token 轮询前等待，避免部分用户在浏览器授权后出现设备码错误（[#6187](https://github.com/earendil-works/pi/issues/6187)）。
- 修复了 OAuth 设备码轮询，遵循服务器提供的 `slow_down` 间隔，而不仅应用 RFC 8628 的 5 秒增量，使提前到达的轮询（如 WSL/VM 时钟漂移）时 GitHub Copilot 登录恢复而非挂起（[#6187](https://github.com/earendil-works/pi/issues/6187)）。
- 修复了 OpenAI Codex user-agent 构建，同步加载 Node OS 元数据，避免在 Node/Bun 中报告 `pi (browser)` 的启动竞态。
- 修复了 Fireworks GLM 5.2 Fast，使其使用 OpenAI 兼容端点和 `thinkingLevelMap`，与 GLM 5.2 对齐（[#6195](https://github.com/earendil-works/pi/issues/6195)）。
- 修复了 Amazon Bedrock Claude Fable 5 和 Claude Sonnet 5 的 Prompt 缓存点数（[#6235](https://github.com/earendil-works/pi/issues/6235)）。
- 修复了 Amazon Bedrock Claude 5 Prompt 缓存定价元数据，移除了过期的回退覆盖。
- 修复了 DS4 服务器对 `Prompt has ... tokens, but the configured context size is ... tokens` 错误的上下文溢出检测（[#6262](https://github.com/earendil-works/pi/issues/6262)）。
- 修复了 OpenAI Codex WebSocket 会话，在后端 60 分钟限制之前轮换缓存连接，避免长会话出现连接限制失败（[#6268](https://github.com/earendil-works/pi/issues/6268)）。
- 修复了 OpenAI Completions 和 Responses Provider，在工具结果文本为空且无图片内容时发送 `(no tool output)` 而非 `(see attached image)`，防止模型虚构图片附件。
- 修复了 OpenAI Responses 和 Azure OpenAI Responses 请求，避免发送低于 Provider 最小值的 `max_output_tokens`（[#6265](https://github.com/earendil-works/pi/issues/6265)）。
- 修复了 Cloudflare 524 超时响应的重试分类（[#6239](https://github.com/earendil-works/pi/issues/6239)）。
- 修复了 Bun fetch socket-drop 错误（如 `socket connection was closed`）的重试分类，使瞬时流断开自动重试（[#6431](https://github.com/earendil-works/pi/issues/6431)）。
- 修复了 GitHub Copilot 扩展上下文窗口模型（Claude Opus 4.7/4.8、Claude Opus 4.6、Claude Sonnet 4.6/5、Claude Fable 5、GPT-5.3 Codex、GPT-5.4、GPT-5.5），使其使用 `contextWindow: 1000000`，防止过早压缩和预算不足（[#6439](https://github.com/earendil-works/pi/issues/6439)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

新增

- 添加了可配置的 harness 会话上下文条目变换和自定义条目消息投射器。
- 在 JSONL 会话头中添加了自定义元数据支持（[#6417](https://github.com/earendil-works/pi/pull/6417)，感谢 [@ArcadiaLin](https://github.com/ArcadiaLin)）。
- 导出了 `InMemorySessionStorage` 和 `JsonlSessionStorage`（[#6435](https://github.com/earendil-works/pi/issues/6435)）。

修复

- 修复了 harness 分轮压缩，使摘要请求串行化，避免单并发 Provider 被要求运行重叠的生成请求（[#5536](https://github.com/earendil-works/pi/issues/5536)）。
- 修复了 harness 工具调用，使被长度截断的助手消息中的工具调用失败，而非等待缺失的工具结果（[#6285](https://github.com/earendil-works/pi/pull/6285)）。
- 修复了 harness 会话导入，在上下文投射前规范化 `null` 消息内容，避免松散导入转录的崩溃（[#6343](https://github.com/earendil-works/pi/pull/6343)）。
- 修复了非正数或过大的 harness shell 执行超时，使其以明确的验证错误失败，而非被压缩为即时超时（[#6181](https://github.com/earendil-works/pi/issues/6181)）。
- 修复了 harness 会话存储的短条目 ID，使用生成的 uuidv7 的随机尾部而非时间戳前缀（后者在调用之间近乎恒定）（[#6242](https://github.com/earendil-works/pi/issues/6242)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了编辑器粘贴标记处理，当粘贴标记被删除或终端状态被清除时防止过期的粘贴状态残留（[#6397](https://github.com/earendil-works/pi/pull/6397)，感谢 [@affanali2k3](https://github.com/affanali2k3)）。

</details>

## v0.80.3（2026-06-30）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **Anthropic Claude Sonnet 5 支持** — Claude Sonnet 5 通过继承的 Anthropic 兼容和 Bedrock Provider 目录可用，并启用了自适应 thinking。详见 [Providers](/docs/latest/providers) 和 [Model Options](/docs/latest/usage#model-options)。
- **可配置的输出间距** — `outputPad` 可控制用户消息、助手消息和 thinking 块的水平内边距。详见 [Settings](/docs/latest/settings#ui--display)。
- **外部编辑器配置** — `externalEditor` 允许 Ctrl+G 使用配置的编辑器，再回退到 `$VISUAL`/`$EDITOR`。详见 [Settings](/docs/latest/settings#ui--display) 和 [Keybindings](/docs/latest/keybindings)。
- **更丰富的 RPC 会话树访问** — RPC 客户端可以通过 `get_entries` 和 `get_tree` 检查会话条目和树快照。详见 [get_entries](/docs/latest/rpc#get_entries) 和 [get_tree](/docs/latest/rpc#get_tree)。
- **扩展会话元数据更新** — 扩展可以通过 `session_info_changed` 观察会话名称变化。详见 [session_info_changed](/docs/latest/extensions#session_info_changed)。
- **现代 Azure Foundry 端点支持** — Azure OpenAI Responses Provider 设置支持当前的 Microsoft Foundry 端点 URL。详见 [Azure OpenAI](/docs/latest/providers#azure-openai)。

新增

- 添加了继承的 Anthropic Claude Sonnet 5 模型支持。
- 添加了 `get_entries` 和 `get_tree` RPC 命令，用于通过 RPC 读取会话条目和树快照（[#6078](https://github.com/earendil-works/pi/pull/6078)）。
- 添加了 `./rpc-entry` 包导出，用于直接以 RPC 模式启动 Pi。
- 添加了扩展的会话名称变更事件（[#6175](https://github.com/earendil-works/pi/pull/6175)）。
- 添加了继承的 Azure OpenAI Responses 支持，用于现代 Microsoft Foundry 端点 URL（[#6004](https://github.com/earendil-works/pi/pull/6004)）。
- 添加了继承的 `Usage.reasoning` token 计数，用于报告 reasoning/thinking token 使用情况的 Provider（[#6057](https://github.com/earendil-works/pi/issues/6057)）。
- 添加了 `externalEditor` settings.json 覆盖项，用于 Ctrl+G 外部编辑器命令，默认回退到 Windows 上的 Notepad 和其他平台上的 `nano`（[#6122](https://github.com/earendil-works/pi/issues/6122)）。
- 添加了 `outputPad` 设置，用于用户消息、助手消息和 thinking 的水平内边距（[#6168](https://github.com/earendil-works/pi/issues/6168)）。

变更

- 将默认 OpenAI 模型更改为 `gpt-5.5`。
- 将继承的 OpenAI Codex Responses SSE 响应头等待时间更改为使用配置的 HTTP 超时，而非之前的固定 20 秒超时，减少慢连接上的假超时（[#4945](https://github.com/earendil-works/pi/issues/4945)）。

修复

- 修复了继承的 Claude Sonnet 5 元数据，使其对 Anthropic 兼容和 Bedrock 请求使用自适应 thinking 负载。
- 修复了继承的生成式 Xiaomi MiMo 模型定价，使其与 models.dev 当前的按量付费定价一致（[#6138](https://github.com/earendil-works/pi/issues/6138)）。
- 修复了继承的 Provider HTTP 错误，使其包含响应体而非不透明的 SDK 消息（[#5832](https://github.com/earendil-works/pi/pull/5832)）。
- 修复了继承的 `streamSimple()` max-token 上限，使那些将输入和输出计入同一上下文窗口的 Provider 不会拒绝长请求（[#5595](https://github.com/earendil-works/pi/issues/5595)）。
- 修复了继承的 OpenAI Responses 流，使其在输出项乱序完成时保留 reasoning 回放状态（[#6009](https://github.com/earendil-works/pi/issues/6009)）。
- 修复了继承的 Z.AI preserved thinking 请求，使其在启用 thinking 时发送 `thinking.clear_thinking: false`，允许回放的 `reasoning_content` 参与 Provider 缓存（[#6083](https://github.com/earendil-works/pi/issues/6083)）。
- 修复了前导 Prompt 压缩，使其在压缩后停止而非立即继续（[#6074](https://github.com/earendil-works/pi/pull/6074)）。
- 修复了恢复会话时资源通知保持在消息之前的问题（[#6048](https://github.com/earendil-works/pi/pull/6048)）。
- 修复了启动基准计时输出，使其在 TUI 关闭后打印、保留扩展计时，并在停止基准模式前耗尽终端查询回复（[#6030](https://github.com/earendil-works/pi/pull/6030)、[#6063](https://github.com/earendil-works/pi/pull/6063)）。
- 修复了扩展工具变更，使其在同一 agent 运行中的下一次 Provider 请求前应用，而不丢失 `before_agent_start` 系统提示覆盖（[#6162](https://github.com/earendil-works/pi/issues/6162)）。
- 修复了 undici 在终止流中 HTTP 响应时发出内部客户端错误导致的崩溃（[#6133](https://github.com/earendil-works/pi/issues/6133)）。
- 修复了压缩事件回归测试，以覆盖状态指示器清理并保持 CI 通过。
- 修复了交互式状态指示器，使结束工作、重试、压缩或分支摘要指示器在启用 clear-on-shrink 时不再缩小 TUI（[#6026](https://github.com/earendil-works/pi/pull/6026)）。
- 修复了 `--session` 和 `SessionManager.open()`，使其拒绝非空无效的会话文件而不覆盖它们（[#6002](https://github.com/earendil-works/pi/issues/6002)）。
- 修复了用户消息转译渲染，使 Markdown 转义序列（如 `\"`）中的可见反斜杠得以保留（[#6105](https://github.com/earendil-works/pi/issues/6105)）。
- 修复了因输出长度而停止的助手消息，使其显示可见的不完整响应错误（[#4290](https://github.com/earendil-works/pi/issues/4290)）。
- 修复了 `--no-session --session-id`，使临时 CLI 运行可以使用确定性会话 ID 以获得 Provider 缓存亲和性（[#6070](https://github.com/earendil-works/pi/issues/6070)）。
- 修复了磁盘 BMP 图像文件，使其被检测、转换为 PNG，并通过 `read` 和 CLI `@file` 输入附加（[#6047](https://github.com/earendil-works/pi/issues/6047)）。
- 修复了针对明确告知调用者重试请求的 Provider 流错误的自动重试（[#6019](https://github.com/earendil-works/pi/issues/6019)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 为 Anthropic 兼容、Bedrock、OpenRouter 和 Vercel AI Gateway Provider 添加了 Anthropic Claude Sonnet 5 模型元数据。
- 添加了 Azure OpenAI Responses 对现代 Microsoft Foundry 端点 URL 的支持（[#6004](https://github.com/earendil-works/pi/pull/6004)）。
- 在 `Usage` 中添加了可选的 `reasoning` 字段，报告 reasoning/thinking token 计数作为 `output` 的子集。Anthropic（`output_tokens_details.thinking_tokens`）、OpenAI Responses/Codex/Azure（`output_tokens_details.reasoning_tokens`）、OpenAI Completions（`completion_tokens_details.reasoning_tokens`）以及 Google Generative AI / Vertex（`thoughtsTokenCount`）均已填充。Bedrock Converse 和 Mistral 未填充，因为这些 API 不返回 reasoning token 细分（[#6057](https://github.com/earendil-works/pi/issues/6057)）。

变更

- 将 OpenAI Codex Responses SSE 响应头等待时间更改为使用配置的 HTTP 超时，而非之前的固定 20 秒超时，减少慢连接上的假超时（[#4945](https://github.com/earendil-works/pi/issues/4945)）。

修复

- 修复了 Claude Sonnet 5 元数据，使其对 Anthropic 兼容和 Bedrock 请求使用自适应 thinking 负载。
- 修复了生成的 Xiaomi MiMo 模型定价，使其与 models.dev 当前的按量付费定价一致（[#6138](https://github.com/earendil-works/pi/issues/6138)）。
- 修复了 Provider HTTP 错误，使其包含响应体而非不透明的 SDK 消息（[#5832](https://github.com/earendil-works/pi/pull/5832)）。
- 修复了 `streamSimple()` 发送上下文感知的 max-token 上限，使那些将输入和输出计入同一上下文窗口的 Provider 不会拒绝长请求（[#5595](https://github.com/earendil-works/pi/issues/5595)）。
- 修复了 OpenAI Responses 流，使其在输出项乱序完成时保留 reasoning 回放状态（[#6009](https://github.com/earendil-works/pi/issues/6009)）。
- 修复了针对明确告知调用者重试请求的 Provider 错误的重试分类（[#6019](https://github.com/earendil-works/pi/issues/6019)）。
- 修复了 Z.AI preserved thinking 请求，使其在启用 thinking 时发送 `thinking.clear_thinking: false`，允许回放的 `reasoning_content` 参与 Provider 缓存（[#6083](https://github.com/earendil-works/pi/issues/6083)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

新增

- 为需要下一轮循环上下文的 `Agent` 用户添加了 `prepareNextTurnWithContext`。

修复

- 修复了 `Agent.prepareNextTurn`，使其持续接收运行中止信号而非下一轮上下文。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

新增

- 添加了可选的 Markdown 渲染器选项，用于保留转译渲染中的源反斜杠转义（[#6105](https://github.com/earendil-works/pi/issues/6105)）。

</details>

## v0.80.2（2026-06-23）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

变更

- 将继承的 pi-ai `ApiKeyCredential` 更改为使用与 `auth.json` 兼容的鉴别器 `type: "api_key"` 和 Provider 作用域内的 `env` 值，而非 `type: "api-key"` 和元数据。
- 将继承的 agent-core 公共 harness shell 执行选项类型从 `ExecutionEnvExecOptions` 重命名为 `ShellExecOptions`。

修复

- 修复继承的 Anthropic 兼容自定义模型，使其使用显式兼容性元数据，而非用于会话亲和性头部和不支持的工具字段省略的 Provider 名称启发式方法。
- 修复继承的请求作用域内的 `apiKey` 和 `env` 值，使其参与 Provider 身份验证解析，以便 Cloudflare 等 Provider 可以从显式调用选项中派生请求特定的基础 URL（[#6021](https://github.com/earendil-works/pi/issues/6021)）。
- 恢复 pi-ai compat 入口点上继承的临时传统逐 API 流别名，如 `streamSimpleOpenAICompletions`（[#6016](https://github.com/earendil-works/pi/issues/6016)、[#6017](https://github.com/earendil-works/pi/issues/6017)）。
- 恢复 `openai-completions` 中继承的运行时 `detectCompat` 回退，用于没有显式兼容性元数据的模型（[#6020](https://github.com/earendil-works/pi/issues/6020)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

变更

- 将 `ApiKeyCredential` 更改为使用与 `auth.json` 兼容的鉴别器 `type: "api_key"` 和 Provider 作用域内的 `env` 值，而非 `type: "api-key"` 和元数据。

修复

- 修复 Anthropic 兼容自定义模型，使其使用显式兼容性元数据，而非用于会话亲和性头部和不支持的工具字段省略的 Provider 名称启发式方法。
- 修复请求作用域内的 `apiKey` 和 `env` 值，使其参与 Provider 身份验证解析，以便 Cloudflare 等 Provider 可以从显式调用选项中派生请求特定的基础 URL（[#6021](https://github.com/earendil-works/pi/issues/6021)）。
- 恢复 compat 入口点上的临时传统逐 API 流别名，如 `streamSimpleOpenAICompletions`（[#6016](https://github.com/earendil-works/pi/issues/6016)、[#6017](https://github.com/earendil-works/pi/issues/6017)）。
- 恢复 `openai-completions` 中的运行时 `detectCompat` 回退，用于没有显式兼容性元数据的模型（[#6020](https://github.com/earendil-works/pi/issues/6020)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

变更

- 将公共 harness shell 执行选项类型从 `ExecutionEnvExecOptions` 重命名为 `ShellExecOptions`。

</details>

## v0.80.1（2026-06-23）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

修复

- 修复继承的 Amazon Bedrock 作用域内 `AWS_PROFILE` 端点解析，适用于内置推理配置文件端点。
- 修复继承的 Fireworks Anthropic 兼容请求，为自定义 Fireworks 模型应用会话亲和性和不支持的工具字段默认值。
- 修复继承的 Together MiniMax M2.7 元数据，以避免不支持的 Together 推理切换。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复 Amazon Bedrock 作用域内 `AWS_PROFILE` 端点解析的回归问题，适用于内置推理配置文件端点。
- 修复 Fireworks Anthropic 兼容请求，为自定义 Fireworks 模型应用会话亲和性和不支持的工具字段默认值。
- 修复 Together MiniMax M2.7 元数据，以避免不支持的 Together 推理切换。

</details>

## v0.80.0（2026-06-23）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

变更

- 添加 `Ctrl+J` 作为默认换行快捷键，与 `Shift+Enter` 并列。
- 将显示的 `zai` Provider 标签重命名为 ZAI Coding Plan (Global) 以提高清晰度（[#5965](https://github.com/earendil-works/pi/issues/5965)）。
- pi-ai 的旧全局 API（`stream`/`complete`/`completeSimple`、`getModel`/`getModels`/`getProviders`、`registerApiProvider`、`getEnvApiKey` 等）已从 `@earendil-works/pi-ai` 根入口点移至 `@earendil-works/pi-ai/compat`。扩展在运行时不受影响：扩展加载器会将 pi-ai 根解析为 compat 入口点（严格超集），因此现有扩展可继续正常工作。对 pi-ai 已发布类型进行类型检查的扩展应将这些导入切换为 `@earendil-works/pi-ai/compat`（或迁移到新的 `createModels()`/Provider-factory API）。compat 入口点和加载器别名将在未来版本中通过迁移指南移除。

修复

- 修复会话名称，在存储或显示标签前规范化换行符（[#5999](https://github.com/earendil-works/pi/pull/5999)，感谢 [@haoqixu](https://github.com/haoqixu)）。
- 修复会话选择器，按每个子树中最新活动对线程化会话树排序（[#5784](https://github.com/earendil-works/pi/pull/5784)，感谢 [@Perlence](https://github.com/Perlence)）。
- 修复与扩展相关的崩溃和启动失败报告，建议使用 `pi -ne` 重启。
- 修复继承的 OpenAI Responses 流，使其在缺失终端事件前失败，并修复上下文使用和压缩估算，在截断响应后忽略格式错误的全零助手使用情况（[#5526](https://github.com/earendil-works/pi/pull/5526)，感谢 [@dmmulroy](https://github.com/dmmulroy)）。
- 修复继承的 OpenAI Codex Responses WebSocket 会话，在输出开始前达到 OpenAI 连接限制时重新连接一次（[#5973](https://github.com/earendil-works/pi/issues/5973)）。
- 修复继承的 Amazon Bedrock 端点解析，使其遵循作用域内的 `AWS_PROFILE` 值。
- 修复继承的 Cloudflare Providers，要求账户/网关配置并通过 Provider 身份验证路由内置兼容调用。
- 修复 Provider 作用域内的身份验证环境变量值，使其能够到达继承的 `Models`/`ImagesModels` API 调用和兼容 API 密钥注入。
- 修复继承的 OpenCode Go GLM-5.2 元数据，以暴露 `xhigh` 推理并发送 Provider 的最大推理强度（[#5967](https://github.com/earendil-works/pi/issues/5967)）。
- 修复 `pi --resume`，使其加载用户包主题并解析自动亮/暗主题设置。
- 修复 `models.json` 自定义 Providers，使存储的凭据无需冗余 Provider 级别 `apiKey` 即可满足身份验证要求（[#5953](https://github.com/earendil-works/pi/issues/5953)）。

移除

- 移除了继承的选择性 Provider `@earendil-works/pi-ai/base` 和 `@earendil-works/pi-agent-core/base` 入口点；请改用带有显式 `Models` Provider 工厂的根包。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

不兼容变更

- 根入口点（`@earendil-works/pi-ai`）现在仅包含核心功能且无副作用。旧的全局 API 已移至临时的 `@earendil-works/pi-ai/compat` 入口点，这是根的严格超集：只需更改文件的导入路径即可完成迁移。被移动的符号包括 `stream`/`complete`/`streamSimple`/`completeSimple`、`getModel`/`getModels`/`getProviders`（现在是 `@earendil-works/pi-ai/providers/all` 中 `getBuiltinModel`/`getBuiltinModels`/`getBuiltinProviders` 的已弃用别名）、`registerApiProvider`/`unregisterApiProviders`/`resetApiProviders`/`getApiProvider`、`getEnvApiKey`/`findEnvKeys`、`setBedrockProviderModule`、每个 API 的惰性流包装器（`anthropicMessagesApi` 等）以及图像生成 API。
- 将 `Provider` 类型重命名为 `ProviderId`。`Provider` 现在是运行时 Provider 接口的名称（id、name、auth、模型列表、流行为）。
- API 实现模块已从 `src/providers/` 移至 `@earendil-works/pi-ai/api/*`，按 API id 重命名（`anthropic` -> `api/anthropic-messages`、`google` -> `api/google-generative-ai`、`mistral` -> `api/mistral-conversations`、`amazon-bedrock` -> `api/bedrock-converse-stream`），每个模块恰好导出 `stream` 和 `streamSimple`。旧的按实现导出的名称（`streamAnthropic`、`streamSimpleAnthropic` 等）和旧的原始 API 子路径（`./anthropic`、`./google`、`./openai-completions` 等）已移除；请通过 `@earendil-works/pi-ai/api/*` 导入原始 API 实现。
- 移除了 `@earendil-works/pi-ai/base` 选择性 Provider 入口点；请将根/核心 API 与显式的 `createModels()` 集合和 Provider 工厂一起使用，以实现隔离的 bundle。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

不兼容变更

- `AgentHarnessOptions.models` 是必需的，且是唯一的身份验证路径：Harness 通过提供的 `Models` 实例（`models.streamSimple()`/`completeSimple()`）流处理轮次、压缩和分支摘要，通过 Providers 解析身份验证。已移除 `AgentHarnessOptions.getApiKeyAndHeaders` — 按请求解析密钥的应用现在应将其表示为 `Models` 集合中 Providers 的身份验证（`ApiKeyAuth`/`OAuthAuth`）。使用 `createModels()` + Provider 工厂（或 `@earendil-works/pi-ai/providers/all` 中的 `builtinModels()`）构建；测试使用 `fauxProvider()`。
- `compact()`、`generateSummary()` 和 `generateBranchSummary()` 接受 `Models` 参数，不再接受显式的 `apiKey`/`headers`。
- `StreamFn` 以结构形式定义（`(model, context, options?) => AssistantMessageEventStream | Promise<...>`）；`Models.streamSimple` 满足它。
- 移除了 `@earendil-works/pi-agent-core/base` 选择性 Provider 入口点；请改用带有显式 `Models` 实例的根包。

修复

- 修复 Harness 会话名称，在存储标签前规范化换行符（[#5999](https://github.com/earendil-works/pi/pull/5999)，感谢 [@haoqixu](https://github.com/haoqixu)）。
- 修复 Harness 压缩估算，在截断响应后忽略格式错误的全零助手使用情况（[#5526](https://github.com/earendil-works/pi/pull/5526)，感谢 [@dmmulroy](https://github.com/dmmulroy)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- 添加 `Ctrl+J` 作为默认换行快捷键，与 `Shift+Enter` 并列。

</details>

## v0.79.10（2026-06-22）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **扩展压缩事件上下文** — Extension `session_before_compact` 和 `session_compact` 事件现在包含 `reason` 和 `willRetry`，使扩展可以区分手动 `/compact`、阈值自动压缩和溢出重试流程。参见 [session_before_compact / session_compact](/docs/latest/extensions#session_before_compact--session_compact) 和 [通过扩展自定义摘要](/docs/latest/compaction#custom-summarization-via-extensions)。
- **更安全的更新流程** — `pi update` 会安装精确匹配的已检出 Pi 版本，更新通知会显示 changelog URL，使升级更可预期。参见 [安装与管理](/docs/latest/packages#install-and-manage)。

新增

- 为扩展 `session_before_compact` 和 `session_compact` 事件添加了 `reason` 和 `willRetry` 元数据，使扩展可以区分手动、阈值和溢出压缩流程（[#5962](https://github.com/earendil-works/pi/pull/5962)，感谢 [@PizzaMarinara](https://github.com/PizzaMarinara)）。

修复

- 修复了 `find` 工具，使其在父 `.gitignore` 规则忽略嵌套仓库时仍能尊重嵌套 git 仓库边界（[#5960](https://github.com/earendil-works/pi/issues/5960)）。
- 修复了 usage 文档的斜杠命令表，补全 `/trust` 和 `/import`（[#5959](https://github.com/earendil-works/pi/issues/5959)）。
- 修复了继承的 OpenAI 兼容流式传输，保留在匹配 tool call delta 之前到达的加密 `reasoning_details`（[#5114](https://github.com/earendil-works/pi/issues/5114)）。
- 修复了损坏的 TUI 文档链接，指向计划模式扩展示例（[#5957](https://github.com/earendil-works/pi/issues/5957)）。
- 修复了会话替换或重载期间发出的瞬时扩展 UI 和会话启动消息，使其保持可见，并在重载完成前保持重载输入阻塞（[#5943](https://github.com/earendil-works/pi/issues/5943)）。
- 修复了 plan-mode 示例，使其保留活跃自定义工具、未找到计划时跳过动作提示，并从 `agent_end` 正确排队细化/执行 follow-up（[#5940](https://github.com/earendil-works/pi/issues/5940)）。
- 修复了 `pi update`，使其安装 Pi 更新检查返回的确切版本，`--force` 重新安装该检查版本，无可用版本时失败而不是回退到无版本重装，并报告旧版本和更新后的版本。
- 修复了更新通知，将实际 changelog URL 显示为超链接文本。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- 修复了 OpenAI 兼容流式传输，保留在匹配 tool call delta 之前到达的加密 `reasoning_details`（[#5114](https://github.com/earendil-works/pi/issues/5114)）。

</details>

## v0.79.9（2026-06-20）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **Chat-template thinking 兼容** — OpenAI 兼容的自定义 Provider 可以将 Pi 的 thinking 等级映射到 `chat_template_kwargs`，使基于 vLLM/Hugging Face chat-template 的模型（如 DeepSeek）能够使用 Provider 原生的 thinking 控制。参见 [Custom Provider API Types](/docs/latest/custom-provider#api-types) 和 [OpenAI Compatibility](/docs/latest/models#openai-compatibility)。
- **GLM-5.2 Provider 改进** — GLM-5.2 现在修正了 Fireworks OpenAI 兼容路由，并支持 OpenRouter `xhigh` thinking，使 GLM-5.2 用户在 `/model` 行为和高强度推理方面体验更佳。参见 [Model Options](/docs/latest/usage#model-options)。

新增

- 添加了继承的可配置 `chat-template` thinking 支持，适用于使用 `chat_template_kwargs` 的 OpenAI 兼容 Provider，例如 vLLM 后端的 DeepSeek 模型（[#5673](https://github.com/earendil-works/pi/issues/5673)）。

修复

- 修复了继承的 Fireworks GLM-5.2 元数据，使其使用支持 `reasoning_effort` 的 OpenAI 兼容 Chat Completions 端点（[#5923](https://github.com/earendil-works/pi/issues/5923)）。
- 修复了同目录会话切换，使其复用已导入的扩展模块，同时保持扩展实例的新鲜性和生命周期事件（[#5905](https://github.com/earendil-works/pi/issues/5905)）。
- 修复了深层会话分支构建上下文或分支路径时耗时呈平方级增长的问题（[#5909](https://github.com/earendil-works/pi/issues/5909)）。
- 修复了继承的 OpenRouter GLM-5.2 元数据，使其暴露 `xhigh` 推理并发送 OpenRouter 原生的 `xhigh` effort（[#5770](https://github.com/earendil-works/pi/issues/5770)）。
- 修复了继承的 Markdown 流式代码围栏渲染，部分闭合围栏不再导致代码块在内容流式输出过程中缩小或闪烁（[#5846](https://github.com/earendil-works/pi/pull/5846)，感谢 [@xl0](https://github.com/xl0)）。
- 修复了 fuzzy `edit` 匹配，使其保留未触及的行块，而不是通过归一化内容重写整个文件（[#5899](https://github.com/earendil-works/pi/issues/5899)）。
- 修复了通过旧版 WSL `bash.exe` 执行的 bash 命令，使其通过 stdin 传入脚本，shell 变量得以在目标 bash 中展开（[#5893](https://github.com/earendil-works/pi/issues/5893)）。
- 修复了 `/model`，使其隐藏当前已认证账号不可用的 GitHub Copilot 模型（[#5897](https://github.com/earendil-works/pi/issues/5897)）。
- 修复了 `/model` 选择器搜索，使精确的 Provider 前缀匹配排在代理 Provider 模型 ID 匹配之前（[#5892](https://github.com/earendil-works/pi/issues/5892)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 添加了可配置的 `chat-template` thinking 支持，适用于使用 `chat_template_kwargs` 的 OpenAI 兼容 Provider，例如 vLLM 后端的 DeepSeek 模型（[#5673](https://github.com/earendil-works/pi/issues/5673)）。

修复

- 修复了 Fireworks GLM-5.2 元数据，使其使用支持 `reasoning_effort` 的 OpenAI 兼容 Chat Completions 端点（[#5923](https://github.com/earendil-works/pi/issues/5923)）。
- 修复了 OpenRouter GLM-5.2 元数据，使其暴露 `xhigh` 推理并发送 OpenRouter 原生的 `xhigh` effort（[#5770](https://github.com/earendil-works/pi/issues/5770)）。
- 修复了 GitHub Copilot OAuth 模型可用性，使其使用已认证账号的模型选择器目录（[#5897](https://github.com/earendil-works/pi/issues/5897)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

修复

- 修复了 Node 执行环境通过旧版 WSL `bash.exe` 执行命令时，将脚本通过 stdin 传入，使 shell 变量在目标 bash 中得以展开（[#5893](https://github.com/earendil-works/pi/issues/5893)）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

修复

- 修复了 Markdown 流式代码围栏渲染，部分闭合围栏不再导致代码块在内容流式输出过程中缩小或闪烁（[#5846](https://github.com/earendil-works/pi/pull/5846)，感谢 [@xl0](https://github.com/xl0)）。

</details>

## v0.79.8（2026-06-19）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **选择性 Provider 基础入口** — SDK 用户可以将 `@earendil-works/pi-ai/base` 和 `@earendil-works/pi-agent-core/base` 与显式 Provider 注册配合使用，避免打包应用包含未使用的 Provider 传输层。参见 [`pi-ai` Base Entry Point](https://github.com/earendil-works/pi/blob/main/packages/ai/README.md#base-entry-point) 和 [`pi-agent-core` Base Entry Point](https://github.com/earendil-works/pi/blob/main/packages/agent/README.md#base-entry-point)。
- **Mistral Prompt 缓存** — Mistral 会话现在使用 Provider 端的 Prompt 缓存，具备会话亲和性和缓存 Token 用量/成本核算。参见 [API Keys](/docs/latest/providers#api-keys) 和 [Environment Variables](/docs/latest/usage#environment-variables)。
- **压缩后 Token 估算** — 压缩结果和压缩事件现在包含压缩后 Token 估算数，使客户端可以展示近似的上下文缩减量。参见 [RPC compact](/docs/latest/rpc#compact) 和 [compaction events](/docs/latest/rpc#compaction_start--compaction_end)。
- **OpenRouter Fusion 别名** — `openrouter/fusion` 现可作为内置 OpenRouter 模型别名使用。参见 [API Keys](/docs/latest/providers#api-keys)。

新增

- 添加了继承的 `@earendil-works/pi-ai/base` 和 `@earendil-works/pi-agent-core/base` 入口点，用于打包应用中的选择性 Provider 注册（[#5348](https://github.com/earendil-works/pi/pull/5348)，感谢 [@FredKSchott](https://github.com/FredKSchott)）。
- 添加了继承的 Mistral Prompt 缓存，使用 pi 会话 ID 作为 `prompt_cache_key`，包含缓存 Token 用量和成本核算（[#5854](https://github.com/earendil-works/pi/issues/5854)）。
- 为压缩结果和压缩事件添加了压缩后 Token 估算数（[#5877](https://github.com/earendil-works/pi/issues/5877)）。
- 添加了继承的 OpenRouter Fusion 别名 `openrouter/fusion`（[#5866](https://github.com/earendil-works/pi/pull/5866)，感谢 [@dannote](https://github.com/dannote)）。

修复

- 更新了存在漏洞的运行时依赖，包括 `undici` 和打包的 `protobufjs` 传递依赖。
- 修复了压缩，使其拒绝没有合格消息的会话，而不是产生空摘要（[#4811](https://github.com/earendil-works/pi/issues/4811)）。
- 修复了成功的溢出触发自动压缩，避免重试已完成的助手响应（[#5720](https://github.com/earendil-works/pi/issues/5720)）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

新增

- 添加了 `@earendil-works/pi-ai/base` 和直接 Provider 注册导出，供希望在不进行根内置注册的情况下选择性使用 Provider 传输层的打包工具使用（[#5348](https://github.com/earendil-works/pi/pull/5348)，感谢 [@FredKSchott](https://github.com/FredKSchott)）。
- 添加了 Mistral 请求的 Prompt 缓存，使用 pi 会话 ID 作为 `prompt_cache_key`，包含缓存 Token 用量和成本核算（[#5854](https://github.com/earendil-works/pi/issues/5854)）。
- 添加了 OpenRouter Fusion 别名 `openrouter/fusion`（[#5866](https://github.com/earendil-works/pi/pull/5866)，感谢 [@dannote](https://github.com/dannote)）。

</details>

<details>
<summary><strong>Pi Agent</strong></summary>

新增

- 添加了 `@earendil-works/pi-agent-core/base`，供希望将 agent core 与选择性 `@earendil-works/pi-ai/base` Provider 注册配合使用的打包工具使用（[#5348](https://github.com/earendil-works/pi/pull/5348)，感谢 [@FredKSchott](https://github.com/FredKSchott)）。

</details>

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
