# pi-ai：Models 运行时与 Provider 架构

`pi-ai` 是 Pi 与各家大模型对话的协议层。Pi v0.80 之后可以把它理解成两层：`pi-ai` 提供通用的 `Models` / `Provider`，`coding-agent` 再用 `ModelRuntime` 组合内置目录、`models.json`、扩展 Provider 和凭证。本文基于 **Pi v0.85.1**。

## 为什么是两层？

旧架构的核心是全局 `api-registry`：`stream(model, context)` 查表、临时注入 API key。问题是副作用大、OAuth 难刷新、所有模型元数据挤在一个巨型文件里。

现在的回答是：

1. **每个调用者持有自己的 `Models` 实例**；
2. **Provider 自带认证和模型目录**；
3. **coding-agent 用 `ModelRuntime` 做产品级组合**。

全局旧 API 还在 `@earendil-works/pi-ai/compat`，给还没迁移的调用方用。新代码不要从那里起步。

```
coding-agent ModelRuntime
  └── pi-ai Models
        ├── Provider anthropic
        ├── Provider openai
        └── ...
              ├── auth
              ├── getModels()
              └── stream / streamSimple
```

## Provider：一家模型服务的完整配置

**文件**：`packages/ai/src/models.ts`

```typescript
export interface Provider<TApi extends Api = Api> {
  readonly id: string;
  readonly name: string;
  readonly baseUrl?: string;
  readonly headers?: ProviderHeaders;
  readonly auth: ProviderAuth;

  getModels(): readonly Model<TApi>[];
  refreshModels?(context: RefreshModelsContext): Promise<void>;
  filterModels?(models: readonly Model<TApi>[], credential?: Credential): readonly Model<TApi>[];

  stream(model, context, options?): AssistantMessageEventStream;
  streamSimple(model, context, options?): AssistantMessageEventStream;
  fetchDeferred?(model, handle, options?): AssistantMessageEventStream;
  cancelDeferred?(model, handle, options?): Promise<void>;
}
```

读码时先抓住前半段：id、auth、模型目录、stream。`filterModels` 用来按当前凭证过滤可见模型；`fetchDeferred` 是部分 Provider 的后取结果，不是主路径。

### 一个真实的 factory

**文件**：`packages/ai/src/providers/anthropic.ts`

Anthropic 没有简单套用 `envApiKeyAuth()`，因为它还要识别 `ANTHROPIC_AUTH_TOKEN` 这种 Bearer 头。结构仍然是 `createProvider()`：

```typescript
export function anthropicProvider(): Provider<'anthropic-messages'> {
  return createProvider({
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    auth: {
      apiKey: anthropicApiKeyAuth(),
      oauth: lazyOAuth({
        name: 'Anthropic (Claude Pro/Max)',
        isSubscription: true,
        load: loadAnthropicOAuth,
      }),
    },
    models: Object.values(ANTHROPIC_MODELS),
    api: anthropicMessagesApi(),
  });
}
```

多数只读环境变量的 Provider，会用 `packages/ai/src/auth/helpers.ts` 里的 `envApiKeyAuth(name, envVars)`。OAuth loader 在 `packages/ai/src/auth/oauth/`。

## API：只做协议

**目录**：`packages/ai/src/api/`

每种协议一个实现，外加 `.lazy.ts` 按需加载。常见文件：

- `openai-completions.ts`
- `openai-responses.ts`
- `anthropic-messages.ts`
- `google-generative-ai.ts`
- `bedrock-converse-stream.ts`

API 实现解析 SSE、翻译消息格式，**不决定 API key 从哪来**。认证由 Provider 的 `auth` 和 `CredentialStore` 提供。

## Models：统一调用入口

```typescript
const models = createModels({
  credentials: new InMemoryCredentialStore(),
});
models.setProvider(anthropicProvider());
models.setProvider(openAIProvider());

const model = models.getModel('anthropic', 'claude-sonnet-4-5');
const response = models.streamSimple(model, context, { maxTokens: 4096 });
```

一次性注册全部内置 Provider：

```typescript
import { builtinModels } from '@earendil-works/pi-ai/providers/all';

const models = builtinModels();
```

`getModel()` / `getModels()` 是同步快照。动态目录要先 `models.refresh()`。`getAvailable()` 会先确认 Provider 已经配置了认证。

## 认证：三件套

**目录**：`packages/ai/src/auth/`

把三个名字分开，读后面的 [项目信任与认证](trust-and-auth.md) 会轻松很多：

| 名字                | 职责                                |
| ------------------- | ----------------------------------- |
| **CredentialStore** | 读写已保存的 API key / OAuth token  |
| **AuthContext**     | 读环境变量、检查文件是否存在        |
| **AuthInteraction** | 登录时的 prompt / notify（UI 回调） |

`AuthContext` **没有** `prompt()`。登录交互在 `AuthInteraction` 上：

```typescript
export interface AuthContext {
  env(name: string): Promise<string | undefined>;
  fileExists(path: string): Promise<boolean>;
}

export interface AuthInteraction {
  signal?: AbortSignal;
  prompt(prompt: AuthPrompt): Promise<string>;
  notify(event: AuthEvent): void;
}
```

`CredentialStore.modify()` 是带锁的唯一写路径，OAuth 刷新也走它，避免并发刷新互相覆盖。

## 模型目录

每个 Provider 有 `providers/<id>.models.ts`。`packages/ai/src/models.generated.ts` 仍然存在，但它是这些文件的**汇总入口**，由 `npm run generate:models` 生成，不要手改。

只引用 `anthropicProvider()` 时，不会把所有 Provider 的目录都打进包里。这是拆文件的主要原因。

## 兼容层

**文件**：`packages/ai/src/compat.ts`

```typescript
import { stream, getBuiltinModel, registerApiProvider } from '@earendil-works/pi-ai/compat';
```

这里保留了旧的全局 `stream()` 和 api-registry。根包 `@earendil-works/pi-ai` 是无副作用的核心入口。新代码用 `createModels()` + Provider factory。

## coding-agent 的 ModelRuntime

**文件**：`packages/coding-agent/src/core/model-runtime.ts`

`ModelRuntime` **实现了** `Models` 接口。它不是另一套 LLM 协议，而是应用层门面：

1. 读取 `auth.json`、`models.json`
2. 注册内置 Provider、扩展 Provider、原生 Provider
3. 刷新并缓存动态目录
4. 维护“全部模型 / 已配置 / 当前认证状态”快照
5. 在请求前合并超时、重试、请求头

```typescript
const modelRuntime = await ModelRuntime.create({
  authPath: join(agentDir, 'auth.json'),
  modelsPath: join(agentDir, 'models.json'),
});

const response = modelRuntime.streamSimple(model, context, {
  timeoutMs: 300_000,
});
```

`ModelRegistry` 还在，主要给扩展提供同步兼容门面，已经不是核心请求路径。

## 和 Agent 的边界

```text
CLI / SDK
  → ModelRuntime
  → AgentSession
  → Agent
  → streamFn
  → ModelRuntime.streamSimple()
  → Provider.streamSimple()
```

`AgentHarness` 自己持有 `Models`，给通用/实验路径用。读交互模式时，记住上面这条链就够了。

## 关键设计

1. **Provider factory 无状态。** 调用者可以创建多份 `Models`。
2. **认证与协议分离。** 新增 Provider 不必改 API 解析器。
3. **同步读取，显式刷新。** 动态目录不会在 `getModel()` 里偷偷发网络请求。
4. **类型跟着 `model.api` 走。** `stream(model, context, options)` 能按协议收窄 options。

## 下一步

- [项目信任与认证](trust-and-auth.md) — `AuthStorage` 怎样落到 `auth.json`
- [核心架构](architecture.md)
