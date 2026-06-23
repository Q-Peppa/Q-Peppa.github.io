# pi-ai：Models 运行时与 Provider 架构

`pi-ai` 是 Pi 与各家大模型对话的"驱动层"。从 v0.79 开始，它经历了一次重大重构：从旧的全局 API registry 转向 **Models 运行时**。v0.80.0 进一步深化了这一重构，清理了模块边界和类型系统。本文基于 **Pi v0.80.0** 深入讲解新架构。

## 为什么重构？

旧架构（v0.78 及以前）的核心是 `api-registry.ts`：

```typescript
registerApiProvider('openai-completions', { stream, streamSimple });
registerApiProvider('anthropic-messages', { stream, streamSimple });

// 调用时
stream(model, context, opts); // 内部查表、注入 API key
```

问题：

1. **全局副作用**：`registerApiProvider` 修改模块级状态，tree-shaking 困难
2. **认证混乱**：API key 从环境变量、auth 文件、运行时覆盖等多种来源临时注入
3. **模型元数据臃肿**：所有模型塞进一个 `models.generated.ts`，动辄上万行
4. **OAuth 难管理**：没有统一凭证存储和刷新机制

新架构的回答是：**每个调用者持有自己的 `Models` 实例**，Provider 自带认证配置，模型目录按 Provider 拆分。

## 核心抽象总览

```
┌─────────────────────────────────────────────────────────────┐
│                        Models 运行时                         │
│  createModels({ credentials, authContext })                  │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Provider   │   │  Provider   │   │  Provider   │       │
│  │  anthropic  │   │   openai    │   │  openrouter │ ...   │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │    auth     │   │    auth     │   │    auth     │       │
│  │ apiKey/oauth│   │ apiKey/oauth│   │ apiKey/oauth│       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │   models    │   │   models    │   │   models    │       │
│  │   catalog   │   │   catalog   │   │   catalog   │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │     api     │   │     api     │   │     api     │       │
│  │anthropic-   │   │openai-      │   │openai-      │       │
│  │messages     │   │completions  │   │completions  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Provider：一个完整的 LLM 提供商

**文件**：`packages/ai/src/models.ts`

```typescript
export interface Provider<TApi extends Api = Api> {
  id: string; // "anthropic"
  name: string; // "Anthropic"
  baseUrl?: string; // API 基础地址
  auth: ProviderAuth; // 认证配置
  models: Model<TApi>[]; // 该 Provider 支持的模型列表
  api: ApiImplementation<TApi>; // API 实现
}
```

一个 Provider 由四部分组成：

| 字段          | 作用                                       |
| ------------- | ------------------------------------------ |
| `id` / `name` | Provider 标识与显示名                      |
| `baseUrl`     | API 基础地址，可被自定义 Provider 覆盖     |
| `auth`        | 该 Provider 如何获取 API key / OAuth token |
| `models`      | 模型元数据数组                             |
| `api`         | 该 Provider 使用哪种 LLM 协议实现          |

### Provider factory 示例

**文件**：`packages/ai/src/providers/anthropic.ts`

```typescript
import { anthropicMessagesApi } from '../api/anthropic-messages.lazy.ts';
import { envApiKeyAuth, lazyOAuth } from '../auth/helpers.ts';
import { createProvider, type Provider } from '../models.ts';
import { loadAnthropicOAuth } from '../utils/oauth/load.ts';
import { ANTHROPIC_MODELS } from './anthropic.models.ts';

export function anthropicProvider(): Provider<'anthropic-messages'> {
  return createProvider({
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    auth: {
      apiKey: envApiKeyAuth('Anthropic API key', ['ANTHROPIC_OAUTH_TOKEN', 'ANTHROPIC_API_KEY']),
      oauth: lazyOAuth({ name: 'Anthropic (Claude Pro/Max)', load: loadAnthropicOAuth }),
    },
    models: Object.values(ANTHROPIC_MODELS),
    api: anthropicMessagesApi(),
  });
}
```

> **v0.80.0 重要变化**：`Provider` 现在是完整的运行时接口（包含 id、name、auth、models、api），而不再是 string 类型的别名。Provider ID 的类型现在是 `ProviderId`（string 的别名）。

`createProvider()` 会做一些标准化工作（如给 api 实现绑定 Provider 上下文），返回一个 `Provider` 对象。

## API：只负责协议实现

**目录**：`packages/ai/src/api/`（v0.80.0 从 `src/providers/` 移至此处）

> **v0.80.0 路径变化**：API 实现模块从 `src/providers/*.ts` 移至 `src/api/*`，并按 API id 命名：
>
> - `anthropic.ts` → `api/anthropic-messages.ts`
> - `google.ts` → `api/google-generative-ai.ts`
> - `mistral.ts` → `api/mistral-conversations.ts`
> - `amazon-bedrock.ts` → `api/bedrock-converse-stream.ts`

每种 LLM 协议一个文件，只导出两个函数：

```typescript
export interface ApiImplementation<TApi extends Api> {
  stream(model: Model<TApi>, context: Context, options?: ApiStreamOptions<TApi>): Promise<AssistantMessageEventStream>;
  streamSimple(model: Model<TApi>, context: Context, options?: SimpleStreamOptions): AssistantMessageEventStream;
}
```

例如：

- `openai-completions.ts` — OpenAI Chat Completions API
- `openai-responses.ts` — OpenAI Responses API
- `anthropic-messages.ts` — Anthropic Messages API
- `google-generative-ai.ts` — Google Gemini API
- `bedrock-converse-stream.ts` — Amazon Bedrock Converse

API 实现内部只做协议转换和 SSE 解析，**不处理认证来源**。认证由 Provider 的 `auth` 配置和 Models 运行时的 `CredentialStore` 提供。

### lazy 包装

`api/*.lazy.ts` 是按需加载的 wrapper，用于减少启动时加载未使用 Provider 的实现代码：

```typescript
export function anthropicMessagesApi() {
  return {
    stream: (...args) => import('./anthropic-messages.ts').then((m) => m.stream(...args)),
    streamSimple: (...args) => import('./anthropic-messages.ts').then((m) => m.streamSimple(...args)),
  };
}
```

## Models 运行时：统一调用入口

**文件**：`packages/ai/src/models.ts`

```typescript
export interface Models {
  getModel(providerId: string, modelId: string): Model<any> | undefined;
  getModels(providerId?: string): Model<any>[];
  setProvider(provider: Provider): void;
  deleteProvider(id: string): void;
  refresh(providerId?: string): Promise<void>;

  stream(model: Model<Api>, context: Context, options?: ApiStreamOptions): Promise<AssistantMessage>;
  complete(model: Model<Api>, context: Context, options?: ApiStreamOptions): Promise<AssistantMessage>;
  streamSimple(model: Model<Api>, context: Context, options?: SimpleStreamOptions): AssistantMessageEventStream;
  completeSimple(model: Model<Api>, context: Context, options?: SimpleStreamOptions): Promise<AssistantMessage>;
}
```

### 创建 Models 实例

```typescript
import { createModels } from '@earendil-works/pi-ai';

const models = createModels({
  credentials: new InMemoryCredentialStore(),
  authContext: defaultAuthContext(),
});
```

### 注册 Provider

```typescript
import { anthropicProvider, openAIProvider } from '@earendil-works/pi-ai/providers/all';

models.setProvider(anthropicProvider());
models.setProvider(openAIProvider());
```

### 调用 LLM

```typescript
const model = models.getModel('anthropic', 'claude-sonnet-4-20250514');
if (!model) throw new Error('model not found');

const response = await models.stream(
  model,
  {
    systemPrompt: 'You are a helpful coding assistant.',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
    tools: [],
  },
  {
    maxTokens: 4096,
  },
);
```

### 内置全部 Provider

如果你不想逐个注册，可以用 `builtinModels()`：

```typescript
import { builtinModels } from '@earendil-works/pi-ai/providers/all';

const models = builtinModels();
```

这会把所有内置 Provider 都注册进去。Pi 自身在启动时就是这么做的。

## 认证基础设施

**目录**：`packages/ai/src/auth/`

### ProviderAuth

```typescript
export interface ProviderAuth {
  apiKey?: ApiKeyAuth;
  oauth?: OAuthAuth;
}
```

### 辅助函数

**文件**：`packages/ai/src/auth/helpers.ts`

```typescript
// 从环境变量读取 API key
envApiKeyAuth('OpenAI API key', ['OPENAI_API_KEY']);

// 延迟加载 OAuth 凭证
lazyOAuth({ name: 'GitHub Copilot', load: loadGitHubCopilotOAuth });
```

### CredentialStore

```typescript
export interface CredentialStore {
  read(providerId: string): Promise<StoredCredential | undefined>;
  modify(providerId: string, fn: (current?: StoredCredential) => StoredCredential | undefined): Promise<void>;
  delete(providerId: string): Promise<void>;
}
```

`InMemoryCredentialStore` 是默认实现。coding-agent 中使用的是 `AuthStorage`，它把凭证持久化到 `~/.pi/agent/auth.json`。

### AuthContext

`AuthContext` 提供认证所需的外部回调：

- `prompt()` / `notify()` — OAuth 登录提示
- 环境变量读取
- UI 状态更新

```typescript
export interface AuthContext {
  prompt: OAuthPrompt;
  notify: OAuthNotify;
  getEnv: (name: string) => string | undefined;
  // ...
}
```

OAuth 刷新在 `CredentialStore` 的锁内进行，避免并发刷新导致竞态。

## 模型目录：从单一文件到按 Provider 拆分

**目录**：`packages/ai/src/providers/*.models.ts`

v0.79 之前所有模型元数据在一个 `models.generated.ts` 中。v0.79 之后，每个 Provider 有自己的模型目录：

```
providers/
├── anthropic.models.ts
├── openai.models.ts
├── openrouter.models.ts
├── google.models.ts
└── ...
```

这样有几个好处：

1. **Tree-shaking**：只引用 `anthropicProvider()` 时不会打包 OpenAI 的模型目录
2. **按需生成**：`generate-models.ts` 可以单独更新某个 Provider 的模型
3. **类型更精确**：`Model<'openai-completions'>` 与 Provider 强绑定

### Model 类型

```typescript
export interface Model<TApi extends Api> {
  id: string;
  name: string;
  api: TApi;
  provider: string;
  contextWindow: number;
  reasoning: boolean;
  input: ('text' | 'image')[];
  cost: CostInfo;
  compat?: Compat;
  // ...
}
```

## 兼容层：compat.ts

**文件**：`packages/ai/src/compat.ts`

> **v0.80.0 重大变化**：根入口点 `@earendil-works/pi-ai` 现在是纯核心、无副作用。旧的全局 API 完全移到 `@earendil-works/pi-ai/compat` 入口点。

```typescript
import {
  stream,
  complete,
  streamSimple,
  completeSimple,
  getBuiltinModel,
  getBuiltinModels,
  getBuiltinProviders,
  registerApiProvider,
  unregisterApiProviders,
  resetApiProviders,
  getApiProvider,
  getEnvApiKey,
  findEnvKeys,
  setBedrockProviderModule,
} from '@earendil-works/pi-ai/compat';
```

这是临时兼容入口，未来会移除。新代码应使用 `createModels()` 和 Provider factory。

### 迁移路径

1. **保持旧行为**：只需将导入从 `@earendil-works/pi-ai` 改为 `@earendil-works/pi-ai/compat`
2. **迁移到新 API**：使用 `createModels()` + Provider factory

```typescript
// 新方式
import { createModels } from '@earendil-works/pi-ai';
import { anthropicProvider } from '@earendil-works/pi-ai/providers/anthropic';

const models = createModels();
models.setProvider(anthropicProvider());
```

### 已移除的入口点

> **v0.80.0 移除**：选择性 Provider 入口点 `@earendil-works/pi-ai/base` 和 `@earendil-works/pi-agent-core/base` 已移除。请使用根包配合显式的 `Models` 实例和 Provider factory。

## coding-agent 中如何组装 pi-ai

**文件**：`packages/coding-agent/src/core/sdk.ts`、`packages/coding-agent/src/core/model-registry.ts`

coding-agent 启动时会做以下事情：

1. 创建 `AuthStorage`（文件 backed 的 CredentialStore）
2. 创建 `ModelRegistry`，把 `AuthStorage` 和 settings 中的 Provider 配置结合
3. 构造 `Models` 实例（通常通过 `builtinModels()`）
4. 在 `Agent` 的 `streamFn` 中调用 `modelRegistry.getApiKeyAndHeaders(model)` 解析认证
5. 调用 `models.stream(model, context, { ...auth })`

```typescript
// sdk.ts 中的简化版 streamFn
streamFn: async (model, context, options) => {
  const auth = await modelRegistry.getApiKeyAndHeaders(model);
  if (!auth.ok) throw new Error(auth.error);

  const env = auth.env || options?.env ? { ...(auth.env ?? {}), ...(options?.env ?? {}) } : undefined;

  return models.stream(model, context, {
    ...options,
    apiKey: auth.apiKey,
    headers: auth.headers,
    env,
  });
};
```

## Agent Harness 中的变化（v0.80.0）

**文件**：`packages/agent/src/harness.ts`

> **v0.80.0 不兼容变更**：`AgentHarnessOptions.models` 现在是**必填项**，也是唯一的认证路径。

```typescript
// 之前（v0.79.x）
const harness = new AgentHarness({
  getApiKeyAndHeaders: async (model) => { ... }, // 已移除
  // ...
});

// 现在（v0.80.0）
const harness = new AgentHarness({
  models: myModelsInstance, // 必填！
  // ...
});
```

Harness 通过 `models.streamSimple()` / `completeSimple()` 处理：

- 对话回合流传输
- 会话压缩
- 分支摘要生成

认证完全通过 `Models` 实例中各 Provider 的 `auth` 配置解析。

### 压缩和摘要函数

`compact()`、`generateSummary()`、`generateBranchSummary()` 现在也接受 `Models` 参数，不再接受独立的 `apiKey` / `headers`：

```typescript
// v0.79.x（已过时）
const result = await compact(messages, model, { apiKey, headers });

// v0.80.0
const result = await compact(messages, model, models);
```

## 关键设计决策

### 1. 无状态 Provider factory

每个 Provider factory（如 `anthropicProvider()`）都是无状态的纯函数。调用者可以创建多个 `Models` 实例，各自拥有独立的 Provider 配置和凭证。

### 2. 认证与协议分离

API 实现只关心协议；认证完全由 Provider 的 `auth` 字段和 `CredentialStore` 管理。新增 Provider 时不需要修改 API 实现。

### 3. 同步模型读取 + 显式刷新

`Models.getModel()` / `getModels()` 是同步的，返回上一次已知的模型列表。对于动态 Provider（如 GitHub Copilot 的模型选择器），需要显式调用 `models.refresh(providerId)`。

### 4. 模型元数据编译期类型安全

```typescript
const model = getBuiltinModel('anthropic', 'claude-sonnet-4-20250514');
//     ^ Model<"anthropic-messages">

models.stream(model, context, options);
// TypeScript 会根据 model.api 推断 options 类型
```

## 下一步

- [项目信任与认证体系](trust-and-auth.md) — 看 coding-agent 如何把 `AuthStorage` 与 pi-ai 的 `CredentialStore` 打通
- [核心架构与设计哲学](architecture.md) — 回到高层设计模式
