# pi-ai：Models 运行时与 Provider 架构

`pi-ai` 是 Pi 与各家大模型对话的协议层和 Provider 运行时。Pi v0.80 之后，应该把它理解成两层：`pi-ai` 提供通用的 `Models`/`Provider` 能力，`coding-agent` 再用 `ModelRuntime` 组合内置目录、`models.json`、扩展 Provider 和凭证存储。本文基于 **Pi v0.80.10**，先讲 pi-ai 的稳定抽象，再讲 coding-agent 的组合层。

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

新架构的回答是：**每个调用者持有自己的 `Models` 实例**，Provider 自带认证配置，模型目录按 Provider 拆分；在 coding-agent 中，`ModelRuntime` 持有并管理这个 Models 集合，同时处理配置叠加、动态目录刷新和可用性快照。

## 核心抽象总览

```
┌─────────────────────────────────────────────────────────────┐
│                    coding-agent ModelRuntime                 │
│  ModelRuntime.create({ credentials, modelsPath })             │
│       │  组合 models.json、扩展 Provider、远程目录              │
│       ▼                                                        │
│                    pi-ai Models                               │
│  createModels({ credentials, modelsStore })                   │
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

## Provider：一个完整的 LLM Provider

**文件**：`packages/ai/src/models.ts`

```typescript
export interface Provider<TApi extends Api = Api> {
  id: string; // "anthropic"
  name: string; // "Anthropic"
  baseUrl?: string; // API 基础地址
  auth: ProviderAuth; // 认证配置
  getModels(): readonly Model[]; // 当前已知模型目录
  refreshModels?(context: RefreshModelsContext): Promise<void>; // 动态 Provider 可选
  stream(model, context, options?): AssistantMessageEventStream;
  streamSimple(model, context, options?): AssistantMessageEventStream;
}
```

一个 Provider 由四部分组成：

| 字段                          | 作用                                       |
| ----------------------------- | ------------------------------------------ |
| `id` / `name`                 | Provider 标识与显示名                      |
| `baseUrl`                     | API 基础地址，可被自定义 Provider 覆盖     |
| `auth`                        | 该 Provider 如何获取 API key / OAuth token |
| `getModels()`                 | 当前已知的模型元数据                       |
| `refreshModels()`             | 动态 Provider 刷新并持久化模型目录         |
| `stream()` / `streamSimple()` | Provider 实际执行请求                      |

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

> **v0.80 重要变化**：`Provider` 是完整的运行时接口。`Provider` 不只是一个 ID，它同时拥有认证、模型目录和流式行为；Provider ID 只是其中的 `id` 字段。

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
  stream(model: Model<TApi>, context: Context, options?: ApiStreamOptions<TApi>): AssistantMessageEventStream;
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
  getProviders(): readonly Provider[];
  getProvider(id: string): Provider | undefined;
  getModel(providerId: string, modelId: string): Model<any> | undefined;
  getModels(providerId?: string): readonly Model<any>[];
  getAvailable(providerId?: string): Promise<readonly Model<any>[]>;
  checkAuth(providerId: string): Promise<AuthCheck | undefined>;
  getAuth(providerId: string, overrides?: AuthResolutionOverrides): Promise<AuthResult | undefined>;
  getAuth(model: Model<any>, overrides?: AuthResolutionOverrides): Promise<AuthResult | undefined>;
  refresh(options?: ModelsRefreshOptions): Promise<ModelsRefreshResult>;
  login(providerId: string, type: AuthType, interaction: AuthInteraction): Promise<Credential>;
  logout(providerId: string): Promise<void>;
  setProvider(provider: Provider): void;
  deleteProvider(id: string): void;

  stream(model: Model<Api>, context: Context, options?: ApiStreamOptions): AssistantMessageEventStream;
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

const response = models.stream(
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
  read(providerId: string): Promise<Credential | undefined>;
  modify(
    providerId: string,
    fn: (current?: Credential) => Promise<Credential | undefined>,
  ): Promise<Credential | undefined>;
  delete(providerId: string): Promise<void>;
  list(): Promise<readonly CredentialInfo[]>;
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

旧版本曾把所有模型元数据放在一个 `models.generated.ts` 中；当前每个 Provider 有自己的模型目录：

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

## coding-agent 中的 ModelRuntime

**文件**：`packages/coding-agent/src/core/model-runtime.ts`

`ModelRuntime` 是 coding-agent 的规范模型/认证门面。它不替代 pi-ai 的 `Models`，而是在其上增加应用层能力：

1. 加载 `models.json` 和 `auth.json`
2. 注册内置 Provider、扩展 Provider 和原生 Provider
3. 组合 Provider 配置与模型覆盖
4. 刷新并缓存动态模型目录
5. 维护全部模型、已配置模型和认证状态的快照
6. 在请求前解析认证、模型请求头和环境变量

```typescript
const modelRuntime = await ModelRuntime.create({
  authPath: join(agentDir, 'auth.json'),
  modelsPath: join(agentDir, 'models.json'),
});

const model = modelRuntime.getModel('anthropic', 'claude-sonnet-4-5');
if (!model) throw new Error('model not found');

const response = modelRuntime.streamSimple(model, context, {
  timeoutMs: 300_000,
});
```

当前 SDK 的 `streamFn` 只负责把 Agent Loop 的请求交给 ModelRuntime；超时、重试、传输方式和扩展请求头也在这一层合并。

```typescript
streamFn: async (model, context, options) => {
  return modelRuntime.streamSimple(model, context, {
    ...options,
    transformHeaders: async (headers) => {
      return extensionRunner?.emitBeforeProviderHeaders(headers) ?? headers;
    },
  });
};
```

## Agent Harness 与 coding-agent 的边界

`packages/agent/src/harness/agent-harness.ts` 的 `AgentHarness` 仍然直接持有 `Models` 实例。它是更通用的 Agent 会话抽象，负责 prompt、队列、工具、会话和压缩，但不负责 coding-agent 的 `models.json`、项目设置或 CLI 生命周期。

`packages/coding-agent` 则把它们接起来：

```text
CLI / SDK
  → ModelRuntime（应用层模型与认证）
  → AgentSession
  → AgentHarness / Agent
  → streamFn
  → ModelRuntime.streamSimple()
  → Provider.streamSimple()
```

因此，阅读源码时要区分：

- `Models`：pi-ai 的 Provider 集合和通用调用接口
- `ModelRuntime`：coding-agent 的配置、认证、目录和可用性门面
- `ModelRegistry`：当前主要是给扩展保留的同步兼容门面
- `AgentHarness`：通用 Agent 会话与工具循环

## 关键设计决策

### 1. 无状态 Provider factory

每个 Provider factory（如 `anthropicProvider()`）都是无状态的纯函数。调用者可以创建多个 `Models` 实例，各自拥有独立的 Provider 配置和凭证。

### 2. 认证与协议分离

API 实现只关心协议；认证完全由 Provider 的 `auth` 字段和 `CredentialStore` 管理。新增 Provider 时不需要修改 API 实现。

### 3. 同步模型读取 + 显式刷新

`Models.getModel()` / `getModels()` 是同步的，返回当前快照。对于动态 Provider，需要调用 `models.refresh(options)`；它会并发刷新当前集合中的动态 Provider。`ModelRuntime.refresh(options)` 还会更新 coding-agent 的可用性快照。

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
