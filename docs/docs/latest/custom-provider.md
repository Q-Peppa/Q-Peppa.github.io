# 自定义 Provider

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/custom-provider) 的中文翻译。仅供学习参考。

Provider 扩展把 Pi 连接到需要自定义认证、模型发现、请求处理或流式处理的模型服务。如果该服务已经使用受支持的 API，请在 `models.json` 中配置它。

Provider 扩展在 Pi 内部运行，可以检查凭证、Prompt、工具定义、模型响应和用量。请把它们视为受信任的代码，避免记录 secret 或 Provider 载荷。

## 选择最小的集成方式

| 需求                              | 使用                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| 在受支持的 API 之后添加模型       | [`models.json`](models.md#configure-a-compatible-endpoint) |
| 改变已有 Provider 的端点或 header | `models.json` 或一个小型 Provider 扩展                     |
| 动态发现模型                      | 带 `refreshModels` 的 Provider                             |
| 添加 `/login` 流程                | 带原生或旧式 OAuth 配置的 Provider                         |
| 实现不受支持的线上协议            | 带 `stream` 或 `streamSimple` 的 Provider                  |

Provider 扩展是一种[扩展](extensions.md)，所以它遵循相同的加载、信任、重载和错误行为。

## 注册 Provider

在扩展工厂函数中调用 `pi.registerProvider()`。Pi 会等待异步工厂函数完成后再继续启动，所以在这里注册的 Provider 可用于启动时的模型选择和 `pi --list-models`。

有两种注册形式：

- 注册来自 `@earendil-works/pi-ai` 的完整 `Provider`，以获得原生认证、过滤、发现、刷新和流式处理行为。
- 用 `ProviderConfig` 注册一个 Provider 名称，使用已有扩展所用的旧式配置形式。

对于静态端点和模型元数据之外还要自己做更多事的新集成，请优先使用完整 Provider。Pi 会在已注册的原生 Provider 之上组合 `models.json` 覆盖。

只为已有 Provider 注册 `baseUrl` 或 `headers` 会保留它的内置模型。在旧式形式中提供 `models` 会替换该注册所提供的模型。

初始扩展加载之后发起的调用会立即生效。用 `pi.unregisterProvider()` 移除动态 Provider，并恢复它替换掉的内置行为。

完整的注册示例（把流式处理委派给内置 API 实现）见已检入的 [GitLab Duo Provider](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/custom-provider-gitlab-duo/)。

## 提供认证

静态 Provider 可以通过字面量、环境变量插值或命令解析 API Key。这些值使用与 `models.json` 相同的语法：

- `$NAME` 和 `${NAME}` 读取环境变量。
- 以 `!command` 开头使用命令输出。
- `$$` 输出一个字面量 `$`。
- `$!` 输出一个字面且开头的 `!`。

当集成需要已存凭证、自定义解析、Provider 作用域环境或多登录方式时，使用原生 Provider 认证。

OAuth Provider 提供显示名、登录流程、Token 刷新和访问 Token 解析。注册之后它会出现在 `/login` 中，Pi 把返回的凭证存入 `~/.pi/agent/auth.json`。

OAuth 回调与 UI 无关。它们可以打开授权 URL、显示设备码、报告进度、请求输入，或让用户选择登录方式。网络请求期间请响应取消和传入的 abort signal。

绝不要把访问 Token、刷新 Token、Authorization header 或完整的 Provider 响应写入普通日志。

## 提供并刷新模型

每个模型都需要 ID、显示名、输入能力、上下文窗口、输出上限、推理支持和成本元数据。除非某个模型需要单独覆盖，否则在 Provider 级别选择 API 实现。

当 Pi 应当让空闲 Prompt 缓存保持温暖时，把 `promptCache.short` 或 `promptCache.long` 设为该 Provider 尽力而为的缓存时长（秒）。不设置它们会为对应保留层级禁用缓存预热。

兼容性标志描述原本受支持的 API 中已验证的差异。不要仅因为某个端点宣称兼容就开启它们。

请针对实际服务器确认请求字段和响应行为。

当可用目录来自实时服务时，使用 `refreshModels`。把 `context.signal` 传给阻塞式 I/O，以便调用方取消刷新。

两种注册形式有不同的刷新契约：

- 完整的 `Provider` 不返回任何内容。它调用 `context.publish({ update })` 安装 Provider 自有的模型状态，之后它同步的 `getModels()` 暴露最新列表。
- 旧式 `ProviderConfig.refreshModels` 返回模型定义。Pi 用返回的列表替换该注册的实时模型，并应用所请求的持久化。

只有当持久化的目录数据应当跨运行保留时才发布它。像 llama.cpp 这样的实时服务可以更新内存中的列表而不持久化；远程目录可以保留快照以便离线启动。

## 复用受支持的流式 API

当 Provider 协议与之匹配时，使用 Pi AI 的某个 API 实现。

受支持的实现覆盖 Anthropic Messages、OpenAI Chat Completions 和 Responses、Google Generative AI 和 Vertex、Azure OpenAI Responses、Mistral Conversations 以及 Bedrock Converse。

Provider 仍然可以自定义认证、base URL、header、模型过滤和发现，同时把请求转换和流式处理委派给已有的 API 实现。

这比复制一份流式实现更安全，因为它保留 Pi 的消息转换、工具处理、用量核算、取消和兼容性行为。

## 实现自定义流式处理

只有当没有现成的 API 实现能表示该服务时，才实现 `streamSimple`。请先研究 [`packages/ai/src/api`](https://github.com/earendil-works/pi/tree/main/packages/ai/src/api) 下的实现。

流收到的是规范化的 `TranscriptContext`。系统提示和工具声明位于转录的系统消息中，所以请用 `getCurrentSystemPrompt(context.messages)` 和 `getCurrentTools(context.messages)` 读取它们，而不要期望 `context.systemPrompt` 或 `context.tools`。支持对话中途系统消息的模型可以就地收到它们；否则调用 `collapseSystemMessages(context)` 把后续系统消息折叠进开头那条。

自定义流必须：

1. 创建一条 assistant 消息，包含 provider、model、timestamp、待定的 stop reason、content 和全零的 usage。
2. 请求设置成功后，在内容事件之前发出一次 `start` 事件。
3. 更新该消息，同时发出配对的 text、thinking 和 tool-call 事件。
4. 定稿 usage、cost、content 和 stop reason。
5. 恰好发出一次终止性的 `done` 或 `error` 事件，并关闭流。
6. 把取消转换为 aborted 结果。

请求设置可能在 `start` 之前失败；这种情况下流可以直接以 `error` 终止。请求认证缺失也可能在返回流之前同步抛出。

内容索引指向 assistant 消息中的块。请先更新每个块，再发出其 `partial` 字段暴露该状态的事件。到 `toolcall_end` 时，tool-call 参数必须包含有效的已解析输入。

流还必须响应通过 `SimpleStreamOptions` 提供的请求插桩：

- 在发送 Provider 请求之前调用 `options.onPayload`，并使用它返回的任何替换载荷。
- 在收到响应之后、消费其正文之前调用 `options.onResponse`。
- 透传 abort signal 和 Provider 作用域环境。

这些钩子支撑扩展的请求检查和响应 header 事件。省略它们会让该 Provider 的行为与 Pi 的内置 Provider 不同。

## 报告失败和用量

设置具体的终止 stop reason。Error 和 aborted 消息需要 `errorMessage`；成功的消息需要准确的 input、output、cache、total-token 和 cost 值。

Pi 可以在识别出上下文溢出错误后压缩并重试。如果该服务使用未知的消息，请在带防护的 `message_end` 处理器中只把该 Provider 的溢出响应规范化为 `context_length_exceeded`。

不要把速率限制或临时的 Provider 故障改写为上下文溢出。这些故障使用 Pi 的常规重试行为。

## 测试集成

至少测试：

- 普通和空文本响应
- tool call 和工具结果
- 受支持时的图片输入和图片工具结果
- 用量和成本核算
- 中止行为
- 上下文溢出
- 格式错误或不完整的流
- Unicode 边界
- 跨 Provider 的会话移交
- 认证刷新和取消

[`packages/ai/test`](https://github.com/earendil-works/pi/tree/main/packages/ai/test) 下的 Provider 测试定义了内置 Provider 应表现的行为。请改造相关测试套件，而不要只依赖手动 Prompt。

开发期间直接运行扩展，然后把它移到会被发现的扩展位置，或通过 [Pi 包](packages.md)分发。在活动会话中修改已发现的 Provider 扩展后，请运行 `/reload`。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
