# 新闻

> Pi Coding Agent 及其子包的版本发布记录。

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

| 版本 | 日期 |
|------|------|
| 0.69.0 | 2026-04-22 |
| 0.68.1 | 2026-04-22 |
| 0.68.0 | 2026-04-20 |
| 0.67.68 | 2026-04-17 |
| 0.67.67 | 2026-04-17 |
| 0.67.6 | 2026-04-16 |
| 0.67.5 | 2026-04-16 |
| 0.67.4 | 2026-04-16 |
| 0.67.3 | 2026-04-15 |
| 0.67.2 | 2026-04-15 |
| 0.67.1 | 2026-04-15 |
| 0.67.0 | 2026-04-14 |
| 0.66.0 | 2026-04-13 |
| 0.65.5 | 2026-04-11 |
| 0.65.4 | 2026-04-09 |
| 0.65.3 | 2026-04-09 |
| 0.65.2 | 2026-04-09 |
| 0.65.1 | 2026-04-09 |
| 0.65.0 | 2026-04-08 |
| 0.64.0 | 2026-04-08 |
| 0.63.4 | 2026-04-08 |
| 0.63.3 | 2026-04-07 |
| 0.63.2 | 2026-04-07 |
| 0.63.1 | 2026-04-07 |
| 0.63.0 | 2026-04-06 |
| 0.62.0 | 2026-04-02 |
| 0.61.1 | 2026-04-02 |
| 0.61.0 | 2026-04-02 |
| 0.60.2 | 2026-04-01 |
| 0.60.1 | 2026-04-01 |
| 0.60.0 | 2026-03-31 |
| 0.59.0 | 2026-03-30 |
| 0.58.0 | 2026-03-24 |
| 0.57.0 | 2026-03-20 |
| 0.56.1 | 2026-03-17 |
| 0.56.0 | 2026-03-17 |
| 0.55.7 | 2026-03-11 |
| 0.55.6 | 2026-03-10 |
| 0.55.5 | 2026-03-09 |
| 0.55.4 | 2026-03-09 |
| 0.55.3 | 2026-03-09 |
| 0.55.2 | 2026-03-06 |
| 0.55.1 | 2026-03-06 |
| 0.55.0 | 2026-03-06 |
| 0.54.0 | 2026-03-05 |
| 0.53.1 | 2026-03-04 |
| 0.53.0 | 2026-03-03 |
| 0.52.0 | 2026-03-03 |
| 0.51.2 | 2026-03-03 |
| 0.51.1 | 2026-03-03 |
| 0.51.0 | 2026-03-03 |
| 0.50.1 | 2026-03-02 |
| 0.50.0 | 2026-03-02 |
| 0.49.0 | 2026-03-01 |
| 0.48.0 | 2026-02-28 |
| 0.47.0 | 2026-02-28 |
| 0.46.0 | 2026-02-27 |
| 0.45.3 | 2026-02-27 |
| 0.45.2 | 2026-02-27 |
| 0.45.1 | 2026-02-26 |
| 0.45.0 | 2026-02-26 |
| 0.44.0 | 2026-02-24 |
| 0.43.4 | 2026-02-08 |
| 0.43.3 | 2026-02-06 |
| 0.43.2 | 2026-02-06 |
| 0.43.1 | 2026-02-05 |
| 0.43.0 | 2026-02-05 |
| 0.42.0 | 2026-02-04 |
| 0.41.0 | 2026-02-03 |
| 0.40.2 | 2026-02-02 |
| 0.40.1 | 2026-02-02 |
| 0.40.0 | 2026-02-02 |
| 0.39.1 | 2026-02-01 |
| 0.39.0 | 2026-02-01 |
| 0.38.0 | 2026-02-01 |
| 0.37.0 | 2026-01-31 |
| 0.36.0 | 2026-01-31 |
| 0.35.0 | 2026-01-31 |
| 0.34.0 | 2026-01-30 |
| 0.33.1 | 2026-01-29 |
| 0.33.0 | 2026-01-29 |
| 0.32.1 | 2026-01-29 |
| 0.32.0 | 2026-01-28 |
| 0.31.0 | 2026-01-28 |
| 0.30.0 | 2026-01-28 |
| 0.29.0 | 2026-01-27 |
| 0.28.0 | 2026-01-27 |
| 0.27.0 | 2026-01-26 |
| 0.26.0 | 2026-01-25 |
| 0.25.0 | 2026-01-24 |
| 0.24.0 | 2026-01-24 |
| 0.23.0 | 2026-01-23 |
| 0.22.0 | 2026-01-23 |
| 0.21.0 | 2026-01-22 |
| 0.20.0 | 2026-01-21 |
| 0.19.0 | 2026-01-15 |
| 0.18.0 | 2026-01-14 |
| 0.17.0 | 2026-01-13 |
| 0.16.0 | 2026-01-11 |
| 0.15.0 | 2026-01-10 |
| 0.14.0 | 2026-01-09 |
| 0.13.0 | 2026-01-08 |
| 0.12.0 | 2026-01-07 |
| 0.11.4 | 2026-01-07 |
| 0.11.3 | 2026-01-06 |
| 0.11.2 | 2026-01-06 |
| 0.11.1 | 2026-01-06 |
| 0.11.0 | 2026-01-05 |
| 0.10.6 | 2025-11-28 |
| 0.10.5 | 2025-11-28 |
| 0.10.4 | 2025-11-28 |
| 0.10.3 | 2025-11-28 |
| 0.10.2 | 2025-11-26 |
| 0.10.1 | 2025-11-25 |
| 0.10.0 | 2025-11-25 |
| 0.9.4 | 2025-11-26 |
| 0.9.3 | 2025-11-25 |
| 0.9.2 | 2025-11-24 |
| 0.9.1 | 2025-11-22 |
| 0.9.0 | 2025-11-22 |
| 0.8.0 | 2025-11-21 |
| 0.7.2 | 2025-11-21 |
| 0.7.1 | 2025-11-20 |
| 0.7.0 | 2025-11-20 |
| 0.6.3 | 2025-11-19 |
| 0.6.2 | 2025-11-18 |
| 0.6.1 | 2025-11-18 |
| 0.6.0 | 2025-11-18 |
| 0.5.3 | 2025-11-17 |
| 0.5.2 | 2025-11-17 |
| 0.5.1 | 2025-11-17 |
| 0.5.0 | 2025-11-15 |
| 0.4.0 | 2025-11-15 |
| 0.3.0 | 2025-11-14 |
| 0.2.0 | 2025-11-13 |
| 0.1.6 | 2025-11-13 |
| 0.1.5 | 2025-11-13 |
| 0.1.4 | 2025-11-13 |
| 0.1.3 | 2025-11-12 |
| 0.1.2 | 2025-11-12 |
| 0.1.1 | 2025-11-11 |
| 0.1.0 | 2025-11-10 |

---

### 完整变更日志

各包的完整变更历史：

- [Pi Coding Agent](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/CHANGELOG.md)
- [Pi TUI](https://github.com/earendil-works/pi/blob/main/packages/tui/CHANGELOG.md)
- [Pi Agent](https://github.com/earendil-works/pi/blob/main/packages/agent/CHANGELOG.md)
- [Pi AI](https://github.com/earendil-works/pi/blob/main/packages/ai/CHANGELOG.md)

---

> **法律声明**：本页面聚合自 pi 各子包的 CHANGELOG.md 文件的中文翻译，仅供学习参考。
