# 选择模型

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/models) 的中文翻译。仅供学习参考。

对于内置 Provider，先运行 `/login`，再用 `/model` 选择模型。只有当 Pi 尚未包含你需要的 Provider 或端点时，才使用自定义模型配置。

## 选择连接方式

| 你拥有的                             | 推荐的设置                           |
| ------------------------------------ | ------------------------------------ |
| 受支持的订阅                         | 通过 `/login` 登录                   |
| Provider API Key                     | 通过 `/login` 保存，或设置其环境变量 |
| 本地 GGUF 模型                       | 把 Pi 连接到 llama.cpp router        |
| OpenAI、Anthropic 或 Google 兼容端点 | 把它加入 `models.json`               |
| 使用自定义协议或认证流程的 Provider  | 构建或安装 Provider 扩展             |

在[模型目录](https://pi.dev/models)中浏览当前的 Provider、模型 ID、能力、上下文上限和定价。Pi 以内置目录启动，也可以叠加来自 pi.dev 的更新目录数据。缓存的目录数据离线也可用；运行 `pi update --models` 强制刷新。

## 认证

运行 `/login` 并选择一个 Provider。Pi 把凭证存储在 [`auth.json`](configuration.md#agent-directory) 中。运行 `/logout` 可以删除某个 Provider 的已存凭证。

你也可以通过 Provider 的环境变量提供 API Key。这在 CI 等不希望 Pi 写入凭证的环境中很有用。[Provider 认证](providers.md)列出了这些变量和云 Provider 的设置方式。

配置了多个凭证来源时，Pi 的优先顺序是：运行时 `--api-key`、已存的 `auth.json` 凭证、`models.json` 中的 `apiKey`，最后才是 Provider 的环境变量或环境中的云凭证。Provider 扩展可以定义自己的认证行为。

请对 `auth.json` 和任何含凭证的命令保密。在你信任某个项目之后，项目的设置和扩展可以在 Pi 进程内执行。从不可信目录加载配置之前，请阅读[安全](security.md)。

## 选择模型

运行 `/model` 搜索可用模型。选择器显示对应 Provider 已有可用认证的模型。在某个模型上按 `Ctrl+S` 可把它保存为新会话的默认模型。

运行 `/thinking` 选择当前模型的 thinking level。在其中按 `Ctrl+S` 保存启动级别。Pi 只提供所选模型支持的级别。

`Ctrl+P` 在可用模型间循环。用 `/scoped-models` 控制该循环并保存选择，也可以通过[设置](settings.md#model-cycling)配置模型匹配模式。

会话会记录模型和 thinking level 的变更。恢复会话时会恢复它们，但不会改变新会话的默认值。

## 连接本地模型

Pi 直接集成 llama.cpp router。Router 会发现 GGUF 文件并按需加载模型。Pi 的 `/llama` 命令管理 router，`/model` 选择它已加载的模型。

服务器启动、模型布局、下载和连接排查见[使用 llama.cpp 运行本地模型](llama-cpp.md)。

对于 Ollama、LM Studio、vLLM、SGLang 和其他兼容服务器，请在 `models.json` 中[配置兼容端点](#configure-a-compatible-endpoint)。

## 配置兼容端点

当某个端点使用 Pi 已支持的 API 时，使用 [`models.json`](configuration.md#agent-directory)。这包括大多数 Ollama、LM Studio、vLLM、SGLang 和代理部署。

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [{ "id": "qwen2.5-coder:7b" }]
    }
  }
}
```

这个占位 Key 让模型对 Pi 可用；Ollama 会忽略它。对于需要认证的端点，`apiKey` 和 header 值可以使用 `$NAME` 或 `${NAME}` 环境变量插值、字面量，或以 `!command` 开头。`models.json` 中的命令在请求时运行，Pi 不会缓存结果。

打开 `/model` 会重新加载该文件。`models` 条目会添加或替换该 Provider 上同 ID 的模型。用 `modelOverrides` 修改已有内置或扩展提供的模型的元数据，而不替换该 Provider 的模型列表。未知的 override ID 会被忽略。

### 描述模型输入和缓存

用 `inputLimits.images.resize` 控制 Pi 在把新图片附件、`read` 结果和工具结果图片存入对话历史之前如何编码它们：

```json
{
  "id": "vision-model",
  "input": ["text", "image"],
  "inputLimits": {
    "images": {
      "resize": {
        "maxWidth": 1568,
        "maxHeight": 1568,
        "maxBytes": 524288,
        "jpegQuality": 75
      }
    }
  }
}
```

`maxBytes` 限制 base64 编码后的载荷。省略的 resize 字段使用保守默认值：2000 × 2000 像素、编码后 4.5 MiB、JPEG 质量 80。图片只编码一次；更换模型不会重写历史图片。目录也可以用 `inputLimits.maxRequestBytes`、`images.maxPerMessage` 和 `images.maxPerRequest` 描述请求的硬限制，但 Pi 目前还不会据此重写或拒绝历史。

<a id="prompt-cache-lifetimes"></a>

用 `promptCache` 声明 Provider 对 `short` 或 `long` 保留层级尽力而为的缓存时长（秒）：

```json
{ "id": "claude-sonnet-5", "promptCache": { "short": 300, "long": 3600 } }
```

在公布的区间中选择保守的一端。当前层级没有时长数据的模型不具备缓存预热资格。`modelOverrides` 条目可以为内置或扩展模型设置 `inputLimits` 或 `promptCache`，包括通过已验证代理访问的模型。见 [`cacheWarming`](settings.md#model-and-thinking)。

兼容性设置应当描述端点请求或响应行为中已验证的差异。不要仅因为某个端点宣称兼容 OpenAI 或 Anthropic 就开启这些设置。

## 添加自定义 Provider

当 Provider 需要自定义流式处理、模型发现或认证行为时，使用扩展。扩展工作流见[自定义 Provider](custom-provider.md)。

## 排查问题

### 模型不出现

确认它的 Provider 已有可用认证。自定义模型可以从 `models.json` 加载，但在 Pi 能解析凭证之前，它们不会出现在 `/model` 中。对于 llama.cpp，只显示 router 当前已加载的模型。

### 认证只在一个 Shell 中生效

检查该 Key 是否来自环境变量而不是 `auth.json`。环境变量必须存在于启动 Pi 的那个进程中。

### 在远程机器上登录会打开浏览器

如果 Provider 支持无头认证流程，请使用它。有些 Provider 允许你把最终的跳转 URL 或授权码粘贴回 Pi。见[以交互方式认证](providers.md#authenticate-interactively)。

### 兼容端点拒绝请求

检查它在 `models.json` 中的 API 类型和兼容性设置。上游服务器必须支持相应的请求字段和行为。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
