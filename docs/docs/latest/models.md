# Custom Models（自定义模型）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/models) 的中文翻译。仅供学习参考。

通过 `~/.pi/agent/models.json` 添加自定义 Provider 和模型（Ollama、vLLM、LM Studio、代理等）。

:::tip 推广
使用 [OpenCode](https://opencode.ai/go?ref=WGY3CR98Z0) 订阅 AI 服务可额外获得 **5 美元**！
:::

## 目录

- [最小示例](#最小示例)
- [完整示例](#完整示例)
- [Google AI Studio 示例](#google-ai-studio-示例)
- [支持的 API 类型](#支持的-api-类型)
- [Provider 配置](#provider-配置)
- [模型配置](#模型配置)
- [覆盖内置 Provider](#覆盖内置-provider)
- [逐模型覆盖](#逐模型覆盖)
- [Anthropic Messages 兼容性](#anthropic-messages-兼容性)
- [OpenAI 兼容性](#openai-兼容性)

## 最小示例

对于本地模型（Ollama、LM Studio、vLLM），每个模型只需 `id`：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [{ "id": "llama3.1:8b" }, { "id": "qwen2.5-coder:7b" }]
    }
  }
}
```

`apiKey` 是必填字段，但 Ollama 会忽略它，所以任意值都可以。

某些 OpenAI 兼容服务器不支持用于推理能力模型的 `developer` 角色。对于这些 Provider，设置 `compat.supportsDeveloperRole` 为 `false`，这样 Pi 会将系统提示作为 `system` 消息发送。如果服务器也不支持 `reasoning_effort`，同时设置 `compat.supportsReasoningEffort` 为 `false`。

你可以在 Provider 级别设置 `compat` 以应用于所有模型，也可以在模型级别设置以覆盖特定模型。这通常适用于 Ollama、vLLM、SGLang 等 OpenAI 兼容服务器。

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        {
          "id": "gpt-oss:20b",
          "reasoning": true
        }
      ]
    }
  }
}
```

## 完整示例

在需要特定值时覆盖默认设置：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B (Local)",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

该文件在每次打开 `/model` 时重新加载。在会话期间编辑，无需重启。

## Google AI Studio 示例

使用 `google-generative-ai` 配合 `baseUrl` 添加 Google AI Studio 的模型，包括自定义 Gemma 4 条目：

```json
{
  "providers": {
    "my-google": {
      "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
      "api": "google-generative-ai",
      "apiKey": "$GEMINI_API_KEY",
      "models": [
        {
          "id": "gemma-4-31b-it",
          "name": "Gemma 4 31B",
          "input": ["text", "image"],
          "contextWindow": 262144,
          "reasoning": true
        }
      ]
    }
  }
}
```

向 `google-generative-ai` API 类型添加自定义模型时需要 `baseUrl`。

## 支持的 API 类型

| API                    | 说明                              |
| ---------------------- | --------------------------------- |
| `openai-completions`   | OpenAI Chat Completions（最兼容） |
| `openai-responses`     | OpenAI Responses API              |
| `anthropic-messages`   | Anthropic Messages API            |
| `google-generative-ai` | Google Generative AI              |

在 Provider 级别（所有模型的默认值）或模型级别（逐个覆盖）设置 `api`。

## Provider 配置

| 字段             | 说明                                                  |
| ---------------- | ----------------------------------------------------- |
| `baseUrl`        | API 端点 URL                                          |
| `api`            | API 类型（见上表）                                    |
| `apiKey`         | API Key（见下面的值解析）                             |
| `headers`        | 自定义请求头（见下面的值解析）                        |
| `authHeader`     | 设为 `true` 自动添加 `Authorization: Bearer <apiKey>` |
| `models`         | 模型配置数组                                          |
| `modelOverrides` | 此 Provider 上内置模型的逐模型覆盖                    |

### 值解析

`apiKey` 和 `headers` 字段支持三种格式：

- **Shell 命令：** `"!command"` 执行命令并使用 stdout
  ```json
  "apiKey": "!security find-generic-password -ws 'anthropic'"
  "apiKey": "!op read 'op://vault/item/credential'"
  ```
- **环境变量插值：** `"$ENV_VAR"` 或 `"${ENV_VAR}"` 使用命名环境变量的值。插值可以在更大的字面值内工作。
  ```json
  { "type": "api_key", "key": "$MY_ANTHROPIC_KEY" }
  { "type": "api_key", "key": "${KEY_PREFIX}_${KEY_SUFFIX}" }
  ```
  `$FOO_BAR` 是变量 `FOO_BAR`；当 `BAR` 是字面文本时使用 `${FOO}_BAR`。缺少的环境变量会使值变为未解析状态。
- **字面值：** 直接使用
  ```json
  "apiKey": "sk-..."
  { "type": "api_key", "key": "public" }
  ```
- **转义：** `"$$"` 产生字面值 `"$"`；`"$!"` 产生字面值 `"!"` 而不触发命令执行。

  ```json
  { "type": "api_key", "key": "$$literal-dollar-prefix" }
  { "type": "api_key", "key": "$!literal-bang-prefix" }
  ```

对于 `models.json`，Shell 命令在请求时解析。Pi 有意不对任意命令应用内置 TTL、过期复用或恢复逻辑。不同的命令需要不同的缓存和失败策略，Pi 无法推断出正确策略。

如果你的命令较慢、昂贵、受速率限制，或者希望在瞬态失败时继续使用之前的值，请将其包装在你自己的脚本或命令中，实现所需的缓存或 TTL 行为。

`/model` 可用性检查使用已配置的认证信息，不会执行 Shell 命令。

旧版大写环境变量格式的值（如 `MY_API_KEY`）会在启动时自动迁移为 `$MY_API_KEY`。

### 自定义请求头

```json
{
  "providers": {
    "custom-proxy": {
      "baseUrl": "https://proxy.example.com/v1",
      "apiKey": "$MY_API_KEY",
      "api": "anthropic-messages",
      "headers": {
        "x-portkey-api-key": "$PORTKEY_API_KEY",
        "x-secret": "!op read 'op://vault/item/secret'"
      },
      "models": [...]
    }
  }
}
```

## 模型配置

| 字段               | 必需 | 默认值               | 说明                                                                         |
| ------------------ | ---- | -------------------- | ---------------------------------------------------------------------------- |
| `id`               | 是   | —                    | 模型标识符（传递给 API）                                                     |
| `name`             | 否   | `id`                 | 人类可读的模型标签。用于匹配（`--model` 模式）并作为次要模型详情文本显示     |
| `api`              | 否   | Provider 的 `api`    | 为此模型覆盖 Provider 的 API                                                 |
| `reasoning`        | 否   | `false`              | 是否支持 extended thinking                                                   |
| `thinkingLevelMap` | 否   | 省略                 | 将 Pi 的 thinking level 映射到 Provider 值，并标记不支持的 level（见下文）   |
| `input`            | 否   | `["text"]`           | 输入类型：`["text"]` 或 `["text", "image"]`                                  |
| `contextWindow`    | 否   | `128000`             | 上下文窗口大小（Token）                                                      |
| `maxTokens`        | 否   | `16384`              | 最大输出 Token                                                               |
| `cost`             | 否   | 全零                 | `{"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0}`（每百万 Token） |
| `compat`           | 否   | Provider 的 `compat` | Provider 兼容性覆盖。当两者都设置时，与 Provider 级别的 `compat` 合并        |

当前行为：

- `/model`、`--list-models` 和交互式页脚按模型 `id` 显示条目。
- 配置的 `name` 用于模型匹配和次要模型详情文本。它不会替换页脚/状态栏中的模型 id。

### Thinking Level Map

在模型上使用 `thinkingLevelMap` 来描述模型特定的 thinking 控制。键是 Pi 的 thinking level：`off`、`minimal`、`low`、`medium`、`high`、`xhigh`。

值为三态：

| 值     | 含义                                        |
| ------ | ------------------------------------------- |
| 省略   | 该 level 受支持，使用 Provider 的默认映射   |
| 字符串 | 该 level 受支持，此值被发送给 Provider      |
| `null` | 该 level 不受支持，被隐藏/跳过/固定到最近值 |

仅支持 off、high 和 max 推理的模型示例：

```json
{
  "id": "deepseek-v4-pro",
  "reasoning": true,
  "thinkingLevelMap": {
    "minimal": null,
    "low": null,
    "medium": null,
    "high": "high",
    "xhigh": "max"
  }
}
```

不可禁用 thinking 的模型示例：

```json
{
  "id": "always-thinking-model",
  "reasoning": true,
  "thinkingLevelMap": {
    "off": null
  }
}
```

迁移：使用 `compat.reasoningEffortMap` 的旧配置应将映射移至模型级别的 `thinkingLevelMap`。对于不应在 UI 中显示的 level，使用 `null`。

## 覆盖内置 Provider

通过代理路由内置 Provider，无需重新定义模型：

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1"
    }
  }
}
```

所有内置 Anthropic 模型保持可用。现有的 OAuth 或 API Key 认证继续有效。

要将自定义模型合并到内置 Provider 中，包含 `models` 数组：

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1",
      "apiKey": "$ANTHROPIC_API_KEY",
      "api": "anthropic-messages",
      "models": [...]
    }
  }
}
```

合并语义：

- 内置模型被保留。
- 自定义模型按 Provider 内的 `id` 进行更新（upsert）。
- 如果自定义模型 `id` 与内置模型 `id` 匹配，则替换该内置模型。
- 如果自定义模型 `id` 是新的，则与内置模型并列添加。

## 逐模型覆盖

使用 `modelOverrides` 自定义特定内置模型，无需替换 Provider 的完整模型列表。

```json
{
  "providers": {
    "openrouter": {
      "modelOverrides": {
        "anthropic/claude-sonnet-4": {
          "name": "Claude Sonnet 4 (Bedrock Route)",
          "compat": {
            "openRouterRouting": {
              "only": ["amazon-bedrock"]
            }
          }
        }
      }
    }
  }
}
```

`modelOverrides` 支持每个模型的以下字段：`name`、`reasoning`、`input`、`cost`（部分）、`contextWindow`、`maxTokens`、`headers`、`compat`。

行为说明：

- `modelOverrides` 应用于内置 Provider 的模型。
- 未知模型 ID 被忽略。
- 你可以将 Provider 级别的 `baseUrl`/`headers` 与 `modelOverrides` 结合使用。
- 覆盖 `name` 仅会改变模型匹配和次要详情文本；页脚和主模型列表仍继续显示模型 `id`。
- 如果 Provider 也定义了 `models`，自定义模型在内置覆盖之后合并。具有相同 `id` 的自定义模型会替换已覆盖的内置模型条目。

## Anthropic Messages 兼容性

对于使用 `api: "anthropic-messages"` 的 Provider 或代理，使用 `compat` 控制 Anthropic 特定请求兼容性。

默认情况下，Pi 发送每个工具的 `eager_input_streaming: true`。如果代理或 Anthropic 兼容的后端拒绝此字段，将 `supportsEagerToolInputStreaming` 设为 `false`。Pi 会省略 `tools[].eager_input_streaming`，并在启用工具的请求中发送旧的 `fine-grained-tool-streaming-2025-05-14` beta 头。

某些 Anthropic 模型需要 adaptive thinking（`thinking.type: "adaptive"` 加 `output_config.effort`），而非旧的基于 token 预算的 thinking 负载。内置模型会自动设置此项。对于路由到这些模型的自定义 Provider 或别名，将 `forceAdaptiveThinking` 设为 `true`。

```json
{
  "providers": {
    "anthropic-proxy": {
      "baseUrl": "https://proxy.example.com",
      "api": "anthropic-messages",
      "apiKey": "$ANTHROPIC_PROXY_KEY",
      "compat": {
        "supportsEagerToolInputStreaming": false,
        "supportsLongCacheRetention": true,
        "forceAdaptiveThinking": true,
        "allowEmptySignature": true
      },
      "models": [
        {
          "id": "claude-opus-4-7",
          "reasoning": true,
          "input": ["text", "image"]
        }
      ]
    }
  }
}
```

| 字段                              | 说明                                                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supportsEagerToolInputStreaming` | Provider 是否接受每个工具的 `eager_input_streaming`。默认：`true`。设为 `false` 可省略该字段，并在启用工具的请求中使用旧的细粒度工具流 beta 头                                                        |
| `supportsLongCacheRetention`      | Provider 是否在缓存保留为 `long` 时接受 Anthropic 长缓存保留（`cache_control.ttl: "1h"`）。默认：`true`                                                                                               |
| `sendSessionAffinityHeaders`      | 启用缓存后是否从会话 ID 发送 `x-session-affinity`。默认：对已知 Provider 自动检测                                                                                                                     |
| `supportsCacheControlOnTools`     | Provider 是否接受工具定义上的 Anthropic 风格 `cache_control` 标记。默认：`true`                                                                                                                       |
| `forceAdaptiveThinking`           | 是否为此模型发送 adaptive thinking（`thinking.type: "adaptive"` 加 `output_config.effort`）。内置 adaptive 模型会自动设置。默认：`false`                                                              |
| `allowEmptySignature`             | 某些 Anthropic 兼容 Provider 会发出签名为空的 thinking 块，并在重放时仍然期望它们。仅在这些 Provider 上将 `allowEmptySignature` 设为 `true`；真正的 Anthropic 会拒绝空的 thinking 签名。默认：`false` |

## OpenAI 兼容性

对于部分 OpenAI 兼容的 Provider，使用 `compat` 字段。

- Provider 级别的 `compat` 应用于该 Provider 下的所有模型。
- 模型级别的 `compat` 覆盖该模型的 Provider 级别值。

```json
{
  "providers": {
    "local-llm": {
      "baseUrl": "http://localhost:8080/v1",
      "api": "openai-completions",
      "compat": {
        "supportsUsageInStreaming": false,
        "maxTokensField": "max_tokens"
      },
      "models": [...]
    }
  }
}
```

| 字段                                          | 说明                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supportsStore`                               | Provider 支持 `store` 字段                                                                                                                                                                  |
| `supportsDeveloperRole`                       | 使用 `developer` 角色而非 `system`                                                                                                                                                          |
| `supportsReasoningEffort`                     | 支持 `reasoning_effort` 参数                                                                                                                                                                |
| `supportsUsageInStreaming`                    | 支持 `stream_options: { include_usage: true }`（默认：`true`）                                                                                                                              |
| `maxTokensField`                              | 使用 `max_completion_tokens` 或 `max_tokens`                                                                                                                                                |
| `requiresToolResultName`                      | 在工具结果消息中包含 `name`                                                                                                                                                                 |
| `requiresAssistantAfterToolResult`            | 在工具结果后、用户消息前插入一条助手消息                                                                                                                                                    |
| `requiresThinkingAsText`                      | 将 thinking 块转换为纯文本                                                                                                                                                                  |
| `requiresReasoningContentOnAssistantMessages` | 在启用推理时，在所有重放的助手消息上包含空的 `reasoning_content`                                                                                                                            |
| `thinkingFormat`                              | 使用 `reasoning_effort`、`openrouter`、`deepseek`、`together`、`zai`、`qwen` 或 `qwen-chat-template` thinking 参数                                                                          |
| `cacheControlFormat`                          | 在系统提示、最后一个工具定义和最后一个用户/助手文本内容上使用 Anthropic 风格的 `cache_control` 标记。目前仅支持 `anthropic`                                                                 |
| `supportsStrictMode`                          | 在工具定义中包含 `strict` 字段                                                                                                                                                              |
| `supportsLongCacheRetention`                  | Provider 是否在缓存保留为 `long` 时接受长缓存保留：OpenAI 提示缓存的 `prompt_cache_retention: "24h"`，或当 `cacheControlFormat` 为 `anthropic` 时的 `cache_control.ttl: "1h"`。默认：`true` |
| `openRouterRouting`                           | OpenRouter Provider 路由偏好。此对象按原样作为 [OpenRouter API 请求](https://openrouter.ai/docs/guides/routing/provider-selection) 的 `provider` 字段发送                                   |
| `vercelGatewayRouting`                        | Vercel AI Gateway 路由配置，用于 Provider 选择（`only`、`order`）                                                                                                                           |

`openrouter` 使用 `reasoning: { effort }`。`together` 使用 `reasoning: { enabled }`，并在 `supportsReasoningEffort` 启用时也使用 `reasoning_effort`。`qwen` 使用顶级 `enable_thinking`。对需要 `chat_template_kwargs.enable_thinking` 的本地 Qwen 兼容服务器，使用 `qwen-chat-template`。

`cacheControlFormat: "anthropic"` 适用于那些在文本内容和工具定义上通过 `cache_control` 标记暴露 Anthropic 风格提示缓存的 OpenAI 兼容 Provider。

示例：

```json
{
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "$OPENROUTER_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "openrouter/anthropic/claude-3.5-sonnet",
          "name": "OpenRouter Claude 3.5 Sonnet",
          "compat": {
            "openRouterRouting": {
              "allow_fallbacks": true,
              "require_parameters": false,
              "data_collection": "deny",
              "zdr": true,
              "enforce_distillable_text": false,
              "order": ["anthropic", "amazon-bedrock", "google-vertex"],
              "only": ["anthropic", "amazon-bedrock"],
              "ignore": ["gmicloud", "friendli"],
              "quantizations": ["fp16", "bf16"],
              "sort": {
                "by": "price",
                "partition": "model"
              },
              "max_price": {
                "prompt": 10,
                "completion": 20
              },
              "preferred_min_throughput": {
                "p50": 100,
                "p90": 50
              },
              "preferred_max_latency": {
                "p50": 1,
                "p90": 3,
                "p99": 5
              }
            }
          }
        }
      ]
    }
  }
}
```

Vercel AI Gateway 示例：

```json
{
  "providers": {
    "vercel-ai-gateway": {
      "baseUrl": "https://ai-gateway.vercel.sh/v1",
      "apiKey": "$AI_GATEWAY_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "moonshotai/kimi-k2.5",
          "name": "Kimi K2.5 (Fireworks via Vercel)",
          "reasoning": true,
          "input": ["text", "image"],
          "cost": { "input": 0.6, "output": 3, "cacheRead": 0, "cacheWrite": 0 },
          "contextWindow": 262144,
          "maxTokens": 262144,
          "compat": {
            "vercelGatewayRouting": {
              "only": ["fireworks", "novita"],
              "order": ["fireworks", "novita"]
            }
          }
        }
      ]
    }
  }
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
