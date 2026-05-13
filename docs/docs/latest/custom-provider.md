# Custom Providers（自定义 Provider）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/custom-provider) 的中文翻译。仅供学习参考。

扩展可以通过 `pi.registerProvider()` 注册自定义模型 Provider。可用于：

- **代理** —— 通过企业代理或 API 网关路由请求
- **自定义端点** —— 使用自托管或私有模型部署
- **OAuth/SSO** —— 为企业 Provider 添加认证流程
- **自定义 API** —— 为非标准 LLM API 实现流式传输

## 快速参考

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // 覆盖现有 Provider 的 baseUrl
  pi.registerProvider("anthropic", {
    baseUrl: "https://proxy.example.com"
  });

  // 注册新 Provider
  pi.registerProvider("my-provider", {
    name: "My Provider",
    baseUrl: "https://api.example.com",
    apiKey: "MY_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "my-model",
        name: "My Model",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 4096
      }
    ]
  });
}
```

## 覆盖现有 Provider

最简单的用例是将现有 Provider 通过代理重定向：

```ts
pi.registerProvider("anthropic", {
  baseUrl: "https://proxy.example.com"
});

pi.registerProvider("openai", {
  headers: { "X-Custom-Header": "value" }
});
```

当只提供 `baseUrl` 和/或 `headers`（没有 `models`）时，该 Provider 的所有现有模型保留。

## 注册新 Provider

要添加全新 Provider，指定 `models` 和所需配置。扩展工厂可以是 `async` 的，用于动态获取模型。

```ts
export default async function (pi: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = await response.json();

  pi.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 128000,
      maxTokens: model.max_tokens ?? 4096
    }))
  });
}
```

当提供 `models` 时，它会**替换**该 Provider 的所有现有模型。

## API 类型

| API | 用途 |
|---|---|
| `anthropic-messages` | Anthropic Claude API 及兼容 |
| `openai-completions` | OpenAI Chat Completions API 及兼容 |
| `openai-responses` | OpenAI Responses API |
| `mistral-conversations` | Mistral SDK Conversations/Chat |
| `google-generative-ai` | Google Generative AI API |
| `google-vertex` | Google Vertex AI API |
| `bedrock-converse-stream` | Amazon Bedrock Converse API |

## OAuth 支持

添加 OAuth/SSO 认证，集成 `/login`：

```ts
pi.registerProvider("corporate-ai", {
  baseUrl: "https://ai.corp.com/v1",
  api: "openai-responses",
  models: [...],
  oauth: {
    name: "Corporate AI (SSO)",
    async login(callbacks) {
      const code = await callbacks.onPrompt({ message: "Enter SSO code:" });
      const tokens = await exchangeCodeForTokens(code);
      return {
        refresh: tokens.refreshToken,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },
    async refreshToken(credentials) { /* ... */ },
    getApiKey(credentials) {
      return credentials.access;
    }
  }
});
```

## 卸载 Provider

```ts
pi.unregisterProvider("my-provider");
```

这会移除动态模型、API Key 回退、OAuth Provider 注册和自定义流处理器注册。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
