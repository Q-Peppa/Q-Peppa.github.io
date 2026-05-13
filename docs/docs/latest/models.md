# Custom Models（自定义模型）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/models) 的中文翻译。仅供学习参考。

通过 `~/.pi/agent/models.json` 添加自定义模型配置。该文件在每次打开 `/model` 时重新加载，无需重启。

## 最小示例

对于 Ollama、LM Studio 或 vLLM 等本地模型，只需提供 `id`：

```json
{
  "providers": [
    {
      "name": "ollama",
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "llama3.1:8b" },
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  ]
}
```

某些 OpenAI 兼容服务器不支持 `developer` 角色。设置 `compat.supportsDeveloperRole` 为 `false`。如果不支持 `reasoning_effort`，设置 `compat.supportsReasoningEffort` 为 `false`。

## 完整示例

```json
{
  "providers": [
    {
      "name": "ollama",
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  ]
}
```

## 支持的 API 类型

| API | 说明 |
|---|---|
| `openai-completions` | OpenAI Chat Completions（最兼容） |
| `openai-responses` | OpenAI Responses API |
| `anthropic-messages` | Anthropic Messages API |
| `google-generative-ai` | Google Generative AI |

## Provider 配置

| 字段 | 说明 |
|---|---|
| `baseUrl` | API 端点 URL |
| `api` | API 类型 |
| `apiKey` | API Key（支持值解析） |
| `headers` | 自定义头（支持值解析） |
| `authHeader` | 设为 `true` 自动添加 `Authorization: Bearer <apiKey>` |
| `models` | 模型配置数组 |
| `modelOverrides` | 内置模型的逐模型覆盖 |

### 值解析

`apiKey` 和 `headers` 字段支持三种格式：
1. **Shell 命令**：`"!op read 'op://vault/item/credential'"`
2. **环境变量**：`"MY_API_KEY"`
3. **字面值**：`"sk-..."`

## 模型配置

| 字段 | 必需 | 默认值 | 说明 |
|---|---|---|---|
| `id` | 是 | - | 传递给 API 的模型标识符 |
| `name` | 否 | `id` | 人类可读标签 |
| `api` | 否 | Provider 的 `api` | 覆盖 Provider API 类型 |
| `reasoning` | 否 | `false` | 是否支持 extended thinking |
| `thinkingLevelMap` | 否 | - | 将 Pi thinking level 映射到 Provider 值 |
| `input` | 否 | `["text"]` | 输入类型 |
| `contextWindow` | 否 | `128000` | 上下文窗口（Token） |
| `maxTokens` | 否 | `16384` | 最大输出 Token |
| `cost` | 否 | 全零 | 每百万 Token 费用 |

## 覆盖内置 Provider

```json
{
  "providers": [
    {
      "name": "anthropic",
      "baseUrl": "https://proxy.example.com"
    }
  ]
}
```

所有内置 Anthropic 模型保持可用，现有 OAuth 或 API Key 认证继续有效。

## OpenAI 兼容性

对于部分 OpenAI 兼容的 Provider，使用 `compat` 字段：

| 字段 | 说明 |
|---|---|
| `supportsDeveloperRole` | 使用 `developer` 角色而非 `system` |
| `supportsReasoningEffort` | 支持 `reasoning_effort` 参数 |
| `supportsUsageInStreaming` | 支持流式使用统计 |
| `maxTokensField` | `"max_completion_tokens"` 或 `"max_tokens"` |
| `requiresToolResultName` | 在工具结果消息中包含 `name` |
| `thinkingFormat` | thinking 参数格式：`"openrouter"`、`"deepseek"`、`"together"`、`"qwen"`、`"qwen-chat-template"` |
| `cacheControlFormat` | 缓存控制格式：`"anthropic"` |
| `openRouterRouting` | OpenRouter 路由偏好设置 |

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
