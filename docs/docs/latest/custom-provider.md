# Custom Providers（自定义 Provider）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/custom-provider) 的中文翻译。仅供学习参考。

扩展可以通过 `pi.registerProvider()` 注册自定义模型 Provider。可用于：

- **代理** —— 通过企业代理或 API 网关路由请求
- **自定义端点** —— 使用自托管或私有模型部署
- **OAuth/SSO** —— 为企业 Provider 添加认证流程
- **自定义 API** —— 为非标准 LLM API 实现流式传输

## 扩展示例

查看以下完整的 Provider 示例：

- [`examples/extensions/custom-provider-anthropic/`](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/custom-provider-anthropic/)
- [`examples/extensions/custom-provider-gitlab-duo/`](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/custom-provider-gitlab-duo/)

## 目录

- [扩展示例](#扩展示例)
- [快速参考](#快速参考)
- [覆盖现有 Provider](#覆盖现有-provider)
- [注册新 Provider](#注册新-provider)
- [卸载 Provider](#卸载-provider)
- [OAuth 支持](#oauth-支持)
- [自定义流式 API](#自定义流式-api)
- [上下文溢出错误](#上下文溢出错误)
- [测试你的实现](#测试你的实现)
- [配置参考](#配置参考)
- [模型定义参考](#模型定义参考)

## 快速参考

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // 覆盖现有 Provider 的 baseUrl
  pi.registerProvider("anthropic", {
    baseUrl: "https://proxy.example.com"
  });

  // 注册新 Provider 并指定模型
  pi.registerProvider("my-provider", {
    name: "My Provider",
    baseUrl: "https://api.example.com",
    apiKey: "$MY_API_KEY",
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

扩展工厂也可以是 `async` 的。对于动态模型发现，在工厂中获取并注册模型，而不是在 `session_start` 中。pi 会等待工厂完成后再继续启动，因此 Provider 在交互式启动期间和 `pi --list-models` 中均可用。

## 覆盖现有 Provider

最简单的用例是将现有 Provider 通过代理重定向：

```typescript
// 所有 Anthropic 请求现在通过你的代理
pi.registerProvider("anthropic", {
  baseUrl: "https://proxy.example.com"
});

// 为 OpenAI 请求添加自定义请求头
pi.registerProvider("openai", {
  headers: {
    "X-Custom-Header": "value"
  }
});

// 同时指定 baseUrl 和 headers
pi.registerProvider("google", {
  baseUrl: "https://ai-gateway.corp.com/google",
  headers: {
    "X-Corp-Auth": "$CORP_AUTH_TOKEN"  // 环境变量引用或字面值
  }
});
```

当只提供 `baseUrl` 和/或 `headers`（没有 `models`）时，该 Provider 的所有现有模型保留并使用新端点。

## 注册新 Provider

要添加全新 Provider，指定 `models` 和所需配置。

如果模型列表来自远程端点，使用异步扩展工厂：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function (pi: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = (await response.json()) as {
    data: Array<{
      id: string;
      name?: string;
      context_window?: number;
      max_tokens?: number;
    }>;
  };

  pi.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "$LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 128000,
      maxTokens: model.max_tokens ?? 4096,
    })),
  });
}
```

这会在启动完成前注册获取到的模型。

```typescript
pi.registerProvider("my-llm", {
  baseUrl: "https://api.my-llm.com/v1",
  apiKey: "$MY_LLM_API_KEY",  // 环境变量引用
  api: "openai-completions",  // 使用的流式 API
  models: [
    {
      id: "my-llm-large",
      name: "My LLM Large",
      reasoning: true,        // 支持扩展思考
      input: ["text", "image"],
      cost: {
        input: 3.0,           // $/百万 token
        output: 15.0,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 200000,
      maxTokens: 16384
    }
  ]
});
```

当提供 `models` 时，它会**替换**该 Provider 的所有现有模型。

`apiKey` 和自定义请求头值使用与 `models.json` 相同的配置值语法：开头的 `!command` 将整个值作为命令执行，`$ENV_VAR` 和 `${ENV_VAR}` 插值环境变量，`$$` 产生字面值 `$`，`$!` 产生字面值 `!`。

## 卸载 Provider

使用 `pi.unregisterProvider(name)` 移除之前通过 `pi.registerProvider(name, ...)` 注册的 Provider：

```typescript
// 注册
pi.registerProvider("my-llm", {
  baseUrl: "https://api.my-llm.com/v1",
  apiKey: "$MY_LLM_API_KEY",
  api: "openai-completions",
  models: [
    {
      id: "my-llm-large",
      name: "My LLM Large",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
      contextWindow: 200000,
      maxTokens: 16384
    }
  ]
});

// 随后移除
pi.unregisterProvider("my-llm");
```

卸载会移除该 Provider 的动态模型、API Key 回退、OAuth Provider 注册和自定义流处理器注册。被覆盖的任何内置模型或 Provider 行为将被恢复。

在初始扩展加载阶段之后进行的调用会立即生效，无需 `/reload`。

### API 类型

`api` 字段决定使用哪个流式实现：

| API | 用途 |
|-----|---------|
| `anthropic-messages` | Anthropic Claude API 及兼容 |
| `openai-completions` | OpenAI Chat Completions API 及兼容 |
| `openai-responses` | OpenAI Responses API |
| `azure-openai-responses` | Azure OpenAI Responses API |
| `openai-codex-responses` | OpenAI Codex Responses API |
| `mistral-conversations` | Mistral SDK Conversations/Chat 流式 |
| `google-generative-ai` | Google Generative AI API |
| `google-vertex` | Google Vertex AI API |
| `bedrock-converse-stream` | Amazon Bedrock Converse API |

大多数兼容 OpenAI 的 Provider 使用 `openai-completions`。使用模型级别的 `thinkingLevelMap` 指定模型特定的思考级别，使用 `compat` 处理 Provider 的特殊行为：

```typescript
models: [{
  id: "custom-model",
  // ...
  reasoning: true,
  thinkingLevelMap: {              // 将 pi 级别映射到 Provider 值；null 隐藏不支持的级别
    minimal: null,
    low: null,
    medium: null,
    high: "default",
    xhigh: "max"
  },
  compat: {
    supportsDeveloperRole: false,   // 使用 "system" 而非 "developer"
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",   // 而非 "max_completion_tokens"
    requiresToolResultName: true,   // tool result 需要 name 字段
    thinkingFormat: "qwen",        // 顶层 enable_thinking: true
    cacheControlFormat: "anthropic" // Anthropic 风格的 cache_control 标记
  }
}]
```

使用 `openrouter` 实现 OpenRouter 风格的 `reasoning: { effort }` 控制。使用 `deepseek` 实现 DeepSeek 风格的 `thinking: { type: "enabled" | "disabled" }` 控制，启用时还会发送 `reasoning_effort`。使用 `together` 实现 Together 风格的 `reasoning: { enabled }` 控制；配合 `supportsReasoningEffort` 时还会发送 `reasoning_effort`。使用 `qwen-chat-template` 用于读取 `chat_template_kwargs.enable_thinking` 的本地 Qwen 兼容服务器。
使用 `cacheControlFormat: "anthropic"` 为兼容 OpenAI 的 Provider 启用 Anthropic 风格提示缓存，通过 `cache_control` 标记应用于系统提示、最后一个工具定义和最后一个用户/助手文本内容。

对于使用 `api: "anthropic-messages"` 的 Anthropic 兼容 Provider，对上游模型需要 adaptive thinking（`thinking.type: "adaptive"` 加 `output_config.effort`）的模型或 Provider 设置 `compat.forceAdaptiveThinking: true`。内置的 adaptive Claude 模型会自动设置此项。仅对产生空思考签名并在重放时期望 `signature: ""` 的 Provider 设置 `compat.allowEmptySignature: true`。

> 迁移说明：Mistral 已从 `openai-completions` 迁移到 `mistral-conversations`。
> 原生 Mistral 模型请使用 `mistral-conversations`。
> 如果你有意将 Mistral 兼容/自定义端点通过 `openai-completions` 路由，请根据需要显式设置 `compat` 标志。

### 认证请求头

如果你的 Provider 需要 `Authorization: Bearer <key>` 但不使用标准 API，设置 `authHeader: true`：

```typescript
pi.registerProvider("custom-api", {
  baseUrl: "https://api.example.com",
  apiKey: "$MY_API_KEY",
  authHeader: true,  // 添加 Authorization: Bearer 请求头
  api: "openai-completions",
  models: [...]
});
```

## OAuth 支持

添加 OAuth/SSO 认证，集成 `/login`：

```typescript
import type { OAuthCredentials, OAuthLoginCallbacks } from "@earendil-works/pi-ai";

pi.registerProvider("corporate-ai", {
  baseUrl: "https://ai.corp.com/v1",
  api: "openai-responses",
  models: [...],
  oauth: {
    name: "Corporate AI (SSO)",

    async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
      const method = await callbacks.onSelect({
        message: "选择登录方式：",
        options: [
          { id: "browser", label: "浏览器 OAuth" },
          { id: "device", label: "设备码" }
        ]
      });
      if (!method) throw new Error("登录已取消");

      let code: string;
      if (method === "device") {
        callbacks.onDeviceCode({
          userCode: "ABCD-1234",
          verificationUri: "https://sso.corp.com/device",
          intervalSeconds: 5,
          expiresInSeconds: 900
        });
        code = await pollDeviceCodeUntilComplete();
      } else {
        callbacks.onAuth({ url: "https://sso.corp.com/authorize?..." });
        code = await callbacks.onPrompt({ message: "输入 SSO 码：" });
      }

      // 兑换令牌（你的实现）
      const tokens = await exchangeCodeForTokens(code);

      return {
        refresh: tokens.refreshToken,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },

    async refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
      const tokens = await refreshAccessToken(credentials.refresh);
      return {
        refresh: tokens.refreshToken ?? credentials.refresh,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },

    getApiKey(credentials: OAuthCredentials): string {
      return credentials.access;
    },

    // 可选：根据用户订阅修改模型
    modifyModels(models, credentials) {
      const region = decodeRegionFromToken(credentials.access);
      return models.map(m => ({
        ...m,
        baseUrl: `https://${region}.ai.corp.com/v1`
      }));
    }
  }
});
```

注册后，用户可以通过 `/login corporate-ai` 进行认证。

### OAuthLoginCallbacks

`callbacks` 对象提供三种认证方式：

```typescript
interface OAuthLoginCallbacks {
  // 在浏览器中打开 URL（用于 OAuth 重定向）
  onAuth(params: { url: string }): void;

  // 显示设备码（用于设备授权流程）
  onDeviceCode(params: {
    userCode: string;
    verificationUri: string;
    intervalSeconds?: number;
    expiresInSeconds?: number;
  }): void;

  // 提示用户输入（用于手动输入令牌）
  onPrompt(params: { message: string }): Promise<string>;

  // 显示交互式选择器，例如选择浏览器 OAuth 还是设备码
  onSelect(params: {
    message: string;
    options: { id: string; label: string }[];
  }): Promise<string | undefined>;
}
```

### OAuthCredentials

凭证持久化存储在 `~/.pi/agent/auth.json`：

```typescript
interface OAuthCredentials {
  refresh: string;   // 刷新令牌（用于 refreshToken()）
  access: string;    // 访问令牌（由 getApiKey() 返回）
  expires: number;   // 过期时间戳（毫秒）
}
```

## 自定义流式 API

对于非标准 API 的 Provider，实现 `streamSimple`。在编写自己的实现之前，请先研究现有的 Provider 实现：

**参考实现：**
- [anthropic.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/anthropic.ts) - Anthropic Messages API
- [mistral.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/mistral.ts) - Mistral Conversations API
- [openai-completions.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/openai-completions.ts) - OpenAI Chat Completions
- [openai-responses.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/openai-responses.ts) - OpenAI Responses API
- [google.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/google.ts) - Google Generative AI
- [amazon-bedrock.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/amazon-bedrock.ts) - AWS Bedrock

### 流式模式

所有 Provider 遵循相同的模式：

```typescript
import {
  type AssistantMessage,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type SimpleStreamOptions,
  calculateCost,
  createAssistantMessageEventStream,
} from "@earendil-works/pi-ai";

function streamMyProvider(
  model: Model<any>,
  context: Context,
  options?: SimpleStreamOptions
): AssistantMessageEventStream {
  const stream = createAssistantMessageEventStream();

  (async () => {
    // 初始化输出消息
    const output: AssistantMessage = {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: "stop",
      timestamp: Date.now(),
    };

    try {
      // 推送 start 事件
      stream.push({ type: "start", partial: output });

      // 发起 API 请求并处理响应...
      // 随着数据到达推送内容事件...

      // 推送 done 事件
      stream.push({
        type: "done",
        reason: output.stopReason as "stop" | "length" | "toolUse",
        message: output
      });
      stream.end();
    } catch (error) {
      output.stopReason = options?.signal?.aborted ? "aborted" : "error";
      output.errorMessage = error instanceof Error ? error.message : String(error);
      stream.push({ type: "error", reason: output.stopReason, error: output });
      stream.end();
    }
  })();

  return stream;
}
```

### 事件类型

按以下顺序通过 `stream.push()` 推送事件：

1. `{ type: "start", partial: output }` - 流开始

2. 内容事件（可重复，为每个块跟踪 `contentIndex`）：
   - `{ type: "text_start", contentIndex, partial }` - 文本块开始
   - `{ type: "text_delta", contentIndex, delta, partial }` - 文本片段
   - `{ type: "text_end", contentIndex, content, partial }` - 文本块结束
   - `{ type: "thinking_start", contentIndex, partial }` - 思考开始
   - `{ type: "thinking_delta", contentIndex, delta, partial }` - 思考片段
   - `{ type: "thinking_end", contentIndex, content, partial }` - 思考结束
   - `{ type: "toolcall_start", contentIndex, partial }` - 工具调用开始
   - `{ type: "toolcall_delta", contentIndex, delta, partial }` - 工具调用 JSON 片段
   - `{ type: "toolcall_end", contentIndex, toolCall, partial }` - 工具调用结束

3. `{ type: "done", reason, message }` 或 `{ type: "error", reason, error }` - 流结束

每个事件中的 `partial` 字段包含当前的 `AssistantMessage` 状态。在接收数据时更新 `output.content`，然后将 `output` 作为 `partial` 传递。

### 内容块

在数据到达时将内容块添加到 `output.content`：

```typescript
// 文本块
output.content.push({ type: "text", text: "" });
stream.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });

// 文本到达时
const block = output.content[contentIndex];
if (block.type === "text") {
  block.text += delta;
  stream.push({ type: "text_delta", contentIndex, delta, partial: output });
}

// 块完成时
stream.push({ type: "text_end", contentIndex, content: block.text, partial: output });
```

### 工具调用

工具调用需要累积 JSON 并进行解析：

```typescript
// 开始工具调用
output.content.push({
  type: "toolCall",
  id: toolCallId,
  name: toolName,
  arguments: {}
});
stream.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });

// 累积 JSON
let partialJson = "";
partialJson += jsonDelta;
try {
  block.arguments = JSON.parse(partialJson);
} catch {}
stream.push({ type: "toolcall_delta", contentIndex, delta: jsonDelta, partial: output });

// 完成
stream.push({
  type: "toolcall_end",
  contentIndex,
  toolCall: { type: "toolCall", id, name, arguments: block.arguments },
  partial: output
});
```

### 使用量和成本

从 API 响应中更新使用量并计算成本：

```typescript
output.usage.input = response.usage.input_tokens;
output.usage.output = response.usage.output_tokens;
output.usage.cacheRead = response.usage.cache_read_tokens ?? 0;
output.usage.cacheWrite = response.usage.cache_write_tokens ?? 0;
output.usage.totalTokens = output.usage.input + output.usage.output +
                           output.usage.cacheRead + output.usage.cacheWrite;
calculateCost(model, output.usage);
```

### 上下文溢出错误

当请求超过模型的上下文窗口时，pi 可以通过压缩对话并重试来自动恢复。这种恢复仅在 pi 将失败识别为溢出时才启动。

检测在最终的助手消息上进行：

- `stopReason === "error"`
- `errorMessage` 匹配 pi 已知的溢出模式之一（参见 [`packages/ai/src/utils/overflow.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/utils/overflow.ts)）

如果你的 Provider 返回溢出错误且消息不被 pi 识别，从注册该 Provider 的同一扩展中规范化错误。使用 `message_end` 处理器重写助手消息，使其 `errorMessage` 以 pi 识别的短语开头。通用回退 `context_length_exceeded` 是最安全的选择。

```typescript
const MY_PROVIDER_OVERFLOW_PATTERN = /your provider's overflow phrase/i;

export default function (pi: ExtensionAPI) {
  pi.registerProvider("my-provider", { /* ... */ });

  pi.on("message_end", (event, ctx) => {
    const message = event.message;
    if (message.role !== "assistant") return;
    if (message.stopReason !== "error") return;
    if (
      message.provider !== "my-provider" &&
      ctx.model?.provider !== "my-provider"
    )
      return;

    const errorMessage = message.errorMessage ?? "";
    if (errorMessage.includes("context_length_exceeded")) return;
    if (!MY_PROVIDER_OVERFLOW_PATTERN.test(errorMessage)) return;

    return {
      message: {
        ...message,
        errorMessage: `context_length_exceeded: ${errorMessage}`,
      },
    };
  });
}
```

`message_end` 在 pi 跟踪助手消息以进行自动压缩之前运行，因此重写后的 `errorMessage` 是 pi 检查的内容。有了这个机制，pi 将：

1. 从 `errorMessage` 检测到溢出。
2. 从实时上下文中丢弃失败的助手消息。
3. 运行压缩。
4. 重试请求一次。

谨慎保护重写逻辑：

- 限定在您的 Provider 范围内（`message.provider` 和 `ctx.model?.provider`），以免影响其他 Provider 的不相关错误。
- 匹配 Provider 特定的模式，而不是 pi 的通用溢出模式。重写速率限制或节流错误（`rate limit`、`too many requests`）会错误地触发压缩，而不是 pi 的正常退避重试路径。
- 当 `errorMessage` 已经包含 `context_length_exceeded` 时跳过，使处理器幂等。

### 注册

注册你的流式函数：

```typescript
pi.registerProvider("my-provider", {
  baseUrl: "https://api.example.com",
  apiKey: "$MY_API_KEY",
  api: "my-custom-api",
  models: [...],
  streamSimple: streamMyProvider
});
```

## 测试你的实现

使用与内置 Provider 相同的测试套件测试你的 Provider。从 [packages/ai/test/](https://github.com/earendil-works/pi-mono/tree/main/packages/ai/test) 复制并适配以下测试文件：

| 测试 | 目的 |
|------|---------|
| `stream.test.ts` | 基本流式传输、文本输出 |
| `tokens.test.ts` | Token 计数和使用量 |
| `abort.test.ts` | AbortSignal 处理 |
| `empty.test.ts` | 空/最小响应 |
| `context-overflow.test.ts` | 上下文窗口限制 |
| `image-limits.test.ts` | 图像输入处理 |
| `unicode-surrogate.test.ts` | Unicode 边界情况 |
| `tool-call-without-result.test.ts` | 工具调用边界情况 |
| `image-tool-result.test.ts` | 工具结果中的图像 |
| `total-tokens.test.ts` | 总 Token 计算 |
| `cross-provider-handoff.test.ts` | Provider 间上下文交接 |

使用你的 Provider/模型对运行测试以验证兼容性。

## 配置参考

```typescript
interface ProviderConfig {
  /** Provider 在 UI 中的显示名称，例如 /login。 */
  name?: string;

  /** API 端点 URL。定义模型时需要。 */
  baseUrl?: string;

  /** API 密钥、环境变量插值（$ENV_VAR 或 ${ENV_VAR}）或 !command。定义模型时需要（除非使用 oauth）。 */
  apiKey?: string;

  /** 流式传输的 API 类型。定义模型时需要在 Provider 或模型级别指定。 */
  api?: Api;

  /** 非标准 API 的自定义流式实现。 */
  streamSimple?: (
    model: Model<Api>,
    context: Context,
    options?: SimpleStreamOptions
  ) => AssistantMessageEventStream;

  /** 包含在请求中的自定义请求头。值可以是环境变量名。 */
  headers?: Record<string, string>;

  /** 如果为 true，使用解析后的 API 密钥添加 Authorization: Bearer 请求头。 */
  authHeader?: boolean;

  /** 要注册的模型。如果提供，替换该 Provider 的所有现有模型。 */
  models?: ProviderModelConfig[];

  /** 支持 /login 的 OAuth Provider。 */
  oauth?: {
    name: string;
    login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials>;
    refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials>;
    getApiKey(credentials: OAuthCredentials): string;
    modifyModels?(models: Model<Api>[], credentials: OAuthCredentials): Model<Api>[];
  };
}
```

## 模型定义参考

```typescript
interface ProviderModelConfig {
  /** 模型 ID（例如 "claude-sonnet-4-20250514"）。 */
  id: string;

  /** 显示名称（例如 "Claude 4 Sonnet"）。 */
  name: string;

  /** 该特定模型的 API 类型覆盖。 */
  api?: Api;

  /** 该特定模型的 API 端点 URL 覆盖。 */
  baseUrl?: string;

  /** 模型是否支持扩展思考。 */
  reasoning: boolean;

  /** 将 pi 思考级别映射到 Provider/模型特定值；null 标记不支持的级别。 */
  thinkingLevelMap?: Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh", string | null>>;

  /** 支持的输入类型。 */
  input: ("text" | "image")[];

  /** 每百万 Token 的成本（用于使用量跟踪）。 */
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };

  /** 最大上下文窗口大小（Token）。 */
  contextWindow: number;

  /** 最大输出 Token 数。 */
  maxTokens: number;

  /** 该特定模型的自定义请求头。 */
  headers?: Record<string, string>;

  /** 所选 API 的兼容性设置。 */
  compat?: {
    // openai-completions
    supportsStore?: boolean;
    supportsDeveloperRole?: boolean;
    supportsReasoningEffort?: boolean;
    supportsUsageInStreaming?: boolean;
    maxTokensField?: "max_completion_tokens" | "max_tokens";
    requiresToolResultName?: boolean;
    requiresAssistantAfterToolResult?: boolean;
    requiresThinkingAsText?: boolean;
    requiresReasoningContentOnAssistantMessages?: boolean;
    thinkingFormat?: "openai" | "openrouter" | "deepseek" | "together" | "zai" | "qwen" | "qwen-chat-template";
    cacheControlFormat?: "anthropic";

    // anthropic-messages
    supportsEagerToolInputStreaming?: boolean;
    supportsLongCacheRetention?: boolean;
    sendSessionAffinityHeaders?: boolean;
    supportsCacheControlOnTools?: boolean;
    forceAdaptiveThinking?: boolean;
    allowEmptySignature?: boolean;
  };
}
```

`openrouter` 发送 `reasoning: { effort }`。`deepseek` 发送 `thinking: { type: "enabled" | "disabled" }` 并在启用时发送 `reasoning_effort`。`together` 发送 `reasoning: { enabled }`，并在启用 `supportsReasoningEffort` 时发送 `reasoning_effort`。`qwen` 用于 DashScope 风格的顶层 `enable_thinking`。使用 `qwen-chat-template` 用于读取 `chat_template_kwargs.enable_thinking` 的本地 Qwen 兼容服务器。
`cacheControlFormat: "anthropic"` 将 Anthropic 风格的 `cache_control` 标记应用于系统提示、最后一个工具定义和最后一个用户/助手文本内容。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
