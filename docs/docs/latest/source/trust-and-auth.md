# 项目信任与认证体系

Pi 在 v0.79 引入了**项目信任（project trust）**机制，同时重构了 `pi-ai` 的认证层。本文基于 **Pi v0.79.10**，讲解 Pi 如何决定"是否信任一个项目"，以及 LLM 请求时认证如何被解析。

## 为什么需要项目信任？

Pi 会加载项目本地的多种资源：

- `.pi/` 目录下的设置、扩展、skills、prompts
- `AGENTS.md` / `CLAUDE.md` / `.agents/skills` 等代理指令
- 项目本地安装的 npm 包扩展

这些资源可以执行任意代码。如果用户在一个不信任的仓库里运行 `pi`，恶意项目可能通过 `.pi/extensions` 或 `AGENTS.md` 窃取数据或破坏系统。

项目信任就是 Pi 在加载这些资源前，先向用户请求明确的授权决策。

## 项目信任的数据流

```
启动 / 切换 cwd
  │
  ▼
检查 cwd 是否有 trust-requiring 资源
  │
  ▼
查询 ProjectTrustStore（~/.pi/agent/trust.json）
  │
  ▼
若已信任 → 直接加载项目资源
若未决策 →
  ├─ 触发 project_trust 扩展事件（user/global/CLI 扩展可参与决策）
  ├─ 若扩展未处理，弹出 TUI 选择器
  ├─ 用户选择：始终信任 / 仅本次信任 / 从不信任
  └─ 持久化决策（除"仅本次"外）
```

## 核心模块

### ProjectTrustStore 与 TrustManager

**文件**：`packages/coding-agent/src/core/trust-manager.ts`

`TrustManager` 负责：

- 记录每个 cwd 的信任状态
- 判断当前项目是否有需要信任的资源
- 提供信任选项（始终信任、仅本次、从不、记住本次）

```typescript
export interface ProjectTrustStore {
  isTrusted(cwd: string): boolean;
  isDenied(cwd: string): boolean;
  setTrusted(cwd: string): void;
  setDenied(cwd: string): void;
  remove(cwd: string): void;
}
```

### resolveProjectTrusted

**文件**：`packages/coding-agent/src/core/project-trust.ts`

这是项目信任的入口函数：

```typescript
export interface ResolveProjectTrustedOptions {
  cwd: string;
  trustStore: ProjectTrustStore;
  trustOverride?: boolean; // CLI --approve / --no-approve
  defaultProjectTrust?: DefaultProjectTrust; // 全局设置中的默认值
  extensionsResult?: LoadExtensionsResult;
  projectTrustContext: ProjectTrustContext;
  onExtensionError?: (message: string) => void;
}
```

流程：

1. 如果 `trustOverride` 为 `true` / `false`，直接使用该覆盖值
2. 否则检查 `defaultProjectTrust` 设置（`ask` / `always` / `never`）
3. 否则检查 `trustStore` 中是否已有决策
4. 否则触发 `project_trust` 扩展事件
5. 否则弹出 TUI 选择器

### project_trust 扩展事件

**文件**：`packages/coding-agent/src/core/extensions/types.ts`

扩展可以监听 `project_trust` 事件，在 UI 提示前决定或推迟信任：

```typescript
pi.on('project_trust', async (event, ctx) => {
  // event.cwd - 当前工作目录
  // event.projectTrustContext - 信任上下文
  // 返回 { action: "trust" | "deny" | "defer" }
  return { action: 'trust' };
});
```

只有 **user/global/CLI 扩展** 能参与 `project_trust`；项目本地扩展此时还未加载。

### defaultProjectTrust 设置

用户可以在 `settings.json` 中配置：

```json
{
  "defaultProjectTrust": "ask"
}
```

可选值：

| 值       | 行为                             |
| -------- | -------------------------------- |
| `ask`    | 每次遇到未决策项目都询问（默认） |
| `always` | 默认信任                         |
| `never`  | 默认不信任                       |

## 认证体系：从用户输入到 LLM 请求

Pi 的认证分为两层：

1. **coding-agent 层**：`AuthStorage` + `ModelRegistry` — 持久化凭证、解析 per-Provider / per-model 配置
2. **pi-ai 层**：`CredentialStore` + `AuthContext` + `ProviderAuth` — 统一的认证抽象

## AuthStorage

**文件**：`packages/coding-agent/src/core/auth-storage.ts`

`AuthStorage` 是 `~/.pi/agent/auth.json` 的封装，同时支持运行时覆盖（如 `--api-key`）。

```typescript
export class AuthStorage {
  static create(authPath?: string): AuthStorage;

  // 持久化 API key（如 /login 保存）
  async setApiKey(provider: string, apiKey: string): Promise<void>;

  // 运行时覆盖，不写入磁盘（如 --api-key）
  setRuntimeApiKey(provider: string, apiKey: string): void;

  // 读取 API key
  async getApiKey(provider: string, options?: { includeFallback?: boolean }): Promise<string | undefined>;

  // Provider 级别的 env 覆盖
  async getProviderEnv(provider: string): Promise<Record<string, string> | undefined>;

  // OAuth 相关
  async setOAuth(provider: string, credential: OAuthCredential): Promise<void>;
  async getOAuth(provider: string): Promise<OAuthCredential | undefined>;
}
```

`auth.json` 的大致结构：

```json
{
  "anthropic": {
    "apiKey": "sk-ant-..."
  },
  "github-copilot": {
    "oauth": {
      "token": "ghu_...",
      "expiresAt": "2026-06-23T10:00:00Z"
    }
  },
  "openai": {
    "apiKey": "sk-...",
    "env": {
      "OPENAI_BASE_URL": "https://custom.example.com"
    }
  }
}
```

## ModelRegistry

**文件**：`packages/coding-agent/src/core/model-registry.ts`

`ModelRegistry` 把 `AuthStorage`、settings 中的 Provider 配置、CLI 参数结合在一起，为每个模型请求解析出最终的认证信息。

```typescript
export interface ModelRegistry {
  getApiKeyAndHeaders(model: Model<Api>): Promise<ResolvedRequestAuth>;
  hasConfiguredAuth(model: Model<Api>): boolean;
  isUsingOAuth(model: Model<Api>): boolean;
  setProviderRequestConfig(provider: string, config: ProviderRequestConfig): void;
  setModelRequestHeaders(provider: string, modelId: string, headers: Record<string, string>): void;
}
```

### 认证解析优先级

对于一次 LLM 请求，`ModelRegistry.getApiKeyAndHeaders(model)` 按以下顺序解析：

1. **runtime 覆盖**：CLI `--api-key` 通过 `AuthStorage.setRuntimeApiKey()` 设置
2. **auth.json 中的 API key / OAuth token**
3. **settings 中的 Provider 配置**：`providerRequestConfigs` 里的 `apiKey`（支持 `env` 覆盖）
4. **per-model 请求头**：`modelRequestHeaders`
5. **环境变量**：pi-ai 的 `envApiKeyAuth` 作为 fallback

如果最终没有可用凭证，返回 `ok: false`，coding-agent 会抛出友好的错误提示（`auth-guidance.ts`）。

### Provider 级别的 env 覆盖

v0.79 支持为特定 Provider 配置 `env` 覆盖：

```json
{
  "openai": {
    "apiKey": "$OPENAI_API_KEY",
    "env": {
      "OPENAI_BASE_URL": "https://my-proxy.example.com"
    }
  }
}
```

这些 `env` 值只在该 Provider 的 LLM 请求中生效，不会污染全局进程环境。

## pi-ai 的认证抽象

**目录**：`packages/ai/src/auth/`

### ApiKeyAuth

```typescript
export interface ApiKeyAuth {
  name: string;
  resolve(authContext: AuthContext): Promise<ApiKeyCredential | undefined>;
}
```

`envApiKeyAuth()` 是最常见的实现：

```typescript
envApiKeyAuth('OpenAI API key', ['OPENAI_API_KEY']);
```

它会按顺序检查环境变量，返回 `{ apiKey }`。

### OAuthAuth

```typescript
export interface OAuthAuth {
  name: string;
  login(authContext: AuthContext): Promise<OAuthCredential>;
  refresh(credential: OAuthCredential, authContext: AuthContext): Promise<OAuthCredential>;
  toAuth(credential: OAuthCredential): Promise<RequestAuth>;
}
```

`lazyOAuth()` 让 OAuth 凭证延迟加载：

```typescript
lazyOAuth({ name: 'GitHub Copilot', load: loadGitHubCopilotOAuth });
```

### CredentialStore

pi-ai 的 `Models` 运行时内部使用 `CredentialStore`：

```typescript
export interface CredentialStore {
  read(providerId: string): Promise<StoredCredential | undefined>;
  modify(providerId: string, fn: (current?: StoredCredential) => StoredCredential | undefined): Promise<void>;
  delete(providerId: string): Promise<void>;
}
```

coding-agent 传入的是 `AuthStorage` 的适配器，使得 pi-ai 的读写最终落到 `~/.pi/agent/auth.json`。

### OAuth 刷新机制

OAuth token 过期时，pi-ai 会在 `CredentialStore` 的锁内执行刷新：

1. 读取当前 credential
2. 双检过期时间（double-checked expiry）
3. 调用 `OAuthAuth.refresh()`
4. 写回新 credential

这避免了多个并发请求同时刷新 OAuth token 的竞态问题。

## 端到端认证流程

以用户调用 `/login anthropic` 并发送第一条消息为例：

```
用户输入 /login anthropic
  │
  ▼
SlashCommands 处理 /login
  │
  ▼
Anthropic OAuth 或 API key 登录流程
  │
  ▼
AuthStorage.setApiKey() / setOAuth() 写入 auth.json
  │
  ▼
用户输入 "帮我看看这个 bug"
  │
  ▼
AgentSession.prompt()
  │
  ▼
_runAgentPrompt() → Agent Loop
  │
  ▼
streamAssistantResponse() 调用 streamFn
  │
  ▼
streamFn closure:
  ModelRegistry.getApiKeyAndHeaders(model)
    → AuthStorage.getApiKey() / getOAuth()
    → 若 OAuth，通过 pi-ai AuthContext 刷新
  models.stream(model, context, { apiKey, headers, env })
    → Provider 解析 auth
    → API 实现发送请求
```

## 无认证时的引导

**文件**：`packages/coding-agent/src/core/auth-guidance.ts`

如果 `ModelRegistry` 发现没有配置认证，会调用 `formatNoApiKeyFoundMessage()` 生成友好的错误提示，告诉用户：

- 该 Provider 需要什么环境变量
- 如何运行 `/login <provider>`
- 如何配置 `auth.json`

## 安全要点

1. **项目本地扩展在信任前不加载**：即使 `.pi/extensions` 里有恶意代码，只要项目未被信任，就不会执行。
2. **OAuth token 不暴露在环境变量**：保存到 `auth.json`，刷新由 pi-ai 内部处理。
3. **Provider env 覆盖不污染全局**：只对特定 Provider 请求生效。
4. **runtime API key 不持久化**：`--api-key` 只在当前进程有效。

## 下一步

- [上下文压缩与会话分支](compaction-and-branches.md) — 长会话管理
- [pi-ai：Models 运行时与 Provider 架构](models-runtime.md) — 回到 LLM 层架构
