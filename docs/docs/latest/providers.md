# Providers

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/providers) 的中文翻译。仅供学习参考。

Pi 支持两类 Provider：基于订阅的（通过 OAuth）和 API Key 型（通过环境变量或 auth 文件）。内置目录随 pi 一起发布；已配置的 Provider 可以刷新更新的目录并缓存在 `~/.pi/agent/models-store.json` 中供离线使用。

:::tip 推广
🚀 使用 [OpenCode](https://opencode.ai/go?ref=WGY3CR98Z0) 订阅 AI 服务可额外获得 **5 美元**！
:::

## 目录

- [订阅](#订阅)
- [API Keys](#api-keys)
- [Auth 文件](#auth-文件)
- [云 Provider](#云-provider)
- [自定义 Provider](#自定义-provider)
- [解析顺序](#解析顺序)

## 订阅（Subscriptions）

在交互模式下运行 `/login` 并选择 Provider：

- **ChatGPT Plus/Pro (Codex)**
- **Claude Pro/Max**
- **GitHub Copilot**
- Radius

使用 `/logout` 清除已存储的凭证。Token 存储在 `~/.pi/agent/auth.json` 中，过期时自动刷新。

### OpenAI Codex

需要 ChatGPT Plus 或 Pro 订阅。由 OpenAI 通过 [Codex for OSS](https://developers.openai.com/community/codex-for-oss) 计划正式认可。

### Claude Pro/Max

Anthropic 订阅认证适用于 Claude Pro/Max 账户。第三方工具的使用从 [extra usage](https://claude.ai/settings/usage) 中扣除，按 Token 计费，不会扣减 Claude 计划额度。

### GitHub Copilot

按 Enter 使用 github.com，或输入你的 GitHub Enterprise Server 域名。如果出现"model not supported"错误，在 VS Code 中启用：Copilot Chat → 模型选择器 → 选择模型 → "Enable"。

### Radius

Radius 是一个动态 `pi-messages` 网关。`/login radius` 将 OAuth 令牌存储在 `auth.json` 中；网关目录独立刷新并缓存在 `models-store.json` 中。自定义 Radius 网关可以在 `models.json` 中通过 `"oauth": "radius"` 和网关 `baseUrl` 声明。

## API Keys

### 环境变量或 Auth 文件

使用 `/login` 在交互模式下选择 Provider 将 API Key 存储到 `auth.json` 中，或通过环境变量设置凭据：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

| Provider                             | 环境变量                                                                   | `auth.json` key          |
| ------------------------------------ | -------------------------------------------------------------------------- | ------------------------ |
| Anthropic                            | `ANTHROPIC_API_KEY`                                                        | `anthropic`              |
| Ant Ling                             | `ANT_LING_API_KEY`                                                         | `ant-ling`               |
| Azure OpenAI Responses               | `AZURE_OPENAI_API_KEY`                                                     | `azure-openai-responses` |
| OpenAI                               | `OPENAI_API_KEY`                                                           | `openai`                 |
| DeepSeek                             | `DEEPSEEK_API_KEY`                                                         | `deepseek`               |
| NVIDIA NIM                           | `NVIDIA_API_KEY`                                                           | `nvidia`                 |
| Google Gemini                        | `GEMINI_API_KEY`                                                           | `google`                 |
| Amazon Bedrock                       | `AWS_BEARER_TOKEN_BEDROCK`                                                 | `amazon-bedrock`         |
| Mistral                              | `MISTRAL_API_KEY`                                                          | `mistral`                |
| Groq                                 | `GROQ_API_KEY`                                                             | `groq`                   |
| Cerebras                             | `CEREBRAS_API_KEY`                                                         | `cerebras`               |
| Cloudflare AI Gateway                | `CLOUDFLARE_API_KEY`（+ `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_GATEWAY_ID`） | `cloudflare-ai-gateway`  |
| Cloudflare Workers AI                | `CLOUDFLARE_API_KEY`（+ `CLOUDFLARE_ACCOUNT_ID`）                          | `cloudflare-workers-ai`  |
| xAI                                  | `XAI_API_KEY`                                                              | `xai`                    |
| OpenRouter                           | `OPENROUTER_API_KEY`                                                       | `openrouter`             |
| Vercel AI Gateway                    | `AI_GATEWAY_API_KEY`                                                       | `vercel-ai-gateway`      |
| ZAI Coding Plan（全球）              | `ZAI_API_KEY`                                                              | `zai`                    |
| ZAI Coding Plan（中国）              | `ZAI_CODING_CN_API_KEY`                                                    | `zai-coding-cn`          |
| OpenCode Zen                         | `OPENCODE_API_KEY`                                                         | `opencode`               |
| OpenCode Go                          | `OPENCODE_API_KEY`                                                         | `opencode-go`            |
| Radius                               | `RADIUS_API_KEY`                                                           | `radius`                 |
| Hugging Face                         | `HF_TOKEN`                                                                 | `huggingface`            |
| Fireworks                            | `FIREWORKS_API_KEY`                                                        | `fireworks`              |
| Together AI                          | `TOGETHER_API_KEY`                                                         | `together`               |
| Kimi For Coding                      | `KIMI_API_KEY`                                                             | `kimi-coding`            |
| MiniMax                              | `MINIMAX_API_KEY`                                                          | `minimax`                |
| MiniMax（中国）                      | `MINIMAX_CN_API_KEY`                                                       | `minimax-cn`             |
| Xiaomi MiMo                          | `XIAOMI_API_KEY`                                                           | `xiaomi`                 |
| Xiaomi MiMo Token Plan（中国）       | `XIAOMI_TOKEN_PLAN_CN_API_KEY`                                             | `xiaomi-token-plan-cn`   |
| Xiaomi MiMo Token Plan（阿姆斯特丹） | `XIAOMI_TOKEN_PLAN_AMS_API_KEY`                                            | `xiaomi-token-plan-ams`  |
| Xiaomi MiMo Token Plan（新加坡）     | `XIAOMI_TOKEN_PLAN_SGP_API_KEY`                                            | `xiaomi-token-plan-sgp`  |

环境变量和 `auth.json` 键的参考：[`const envMap`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/env-api-keys.ts) 位于 [`packages/ai/src/env-api-keys.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/env-api-keys.ts)。

#### Auth 文件

凭证存储在 `~/.pi/agent/auth.json` 中：

```json
{
  "anthropic": { "type": "api_key", "key": "sk-ant-..." },
  "ant-ling": { "type": "api_key", "key": "..." },
  "openai": { "type": "api_key", "key": "sk-..." },
  "deepseek": { "type": "api_key", "key": "sk-..." },
  "nvidia": { "type": "api_key", "key": "nvapi-..." },
  "google": { "type": "api_key", "key": "..." },
  "opencode": { "type": "api_key", "key": "..." },
  "opencode-go": { "type": "api_key", "key": "..." },
  "together": { "type": "api_key", "key": "..." },
  "xiaomi": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-cn": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-ams": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-sgp": { "type": "api_key", "key": "..." }
}
```

文件以 `0600` 权限创建（仅用户可读写）。Auth 文件凭证优先于环境变量。

API Key 凭证还可以包含 Provider 作用域的环境变量值。在解析凭证 Key、Provider/模型请求头和 Provider 配置（如 Cloudflare 账户 ID、Azure OpenAI 设置、Vertex 项目/区域、Bedrock 设置、`PI_CACHE_RETENTION` 和 `HTTP_PROXY`/`HTTPS_PROXY`）时，这些值会优先于进程环境变量。

```json
{
  "cloudflare-ai-gateway": {
    "type": "api_key",
    "key": "$CLOUDFLARE_API_KEY",
    "env": {
      "CLOUDFLARE_API_KEY": "...",
      "CLOUDFLARE_ACCOUNT_ID": "account-id",
      "CLOUDFLARE_GATEWAY_ID": "gateway-id"
    }
  }
}
```

当 Pi 应使用与项目 Shell 环境不同的 Provider 设置时，可使用此功能。

### Key 解析

`key` 字段支持命令执行、环境变量插值和字面值：

- **Shell 命令：** `"!command"` 在开头时将**整个值**作为命令执行，并使用其 stdout 作为值。命令在进程生命周期内只运行一次（非每次请求），结果会被缓存。
  ```json
  { "type": "api_key", "key": "!security find-generic-password -ws 'anthropic'" }
  { "type": "api_key", "key": "!op read 'op://vault/item/credential'" }
  ```
- **环境变量插值：** `"$ENV_VAR"` 或 `"${ENV_VAR}"` 使用命名环境变量的值。插值可以在更大的字面值内工作。
  ```json
  { "type": "api_key", "key": "$MY_ANTHROPIC_KEY" }
  { "type": "api_key", "key": "${KEY_PREFIX}_${KEY_SUFFIX}" }
  ```
  `$FOO_BAR` 是变量 `FOO_BAR`；当 `BAR` 是字面文本时使用 `${FOO}_BAR`。缺少的环境变量会使值变为未解析状态。
- **转义：** `"$$"` 产生字面值 `"$"`；`"$!"` 产生字面值 `"!"` 而不触发命令执行。
  ```json
  { "type": "api_key", "key": "$$literal-dollar-prefix" }
  { "type": "api_key", "key": "$!literal-bang-prefix" }
  ```
- **字面值：** 直接使用。纯大写字符串如 `MY_API_KEY` 是字面量；使用 `$MY_API_KEY` 表示环境变量。
  ```json
  { "type": "api_key", "key": "sk-ant-..." }
  { "type": "api_key", "key": "public" }
  ```

OAuth 凭证在使用 `/login` 后也会存储在这里，并自动管理。

## 云 Provider

### Azure OpenAI

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.ai.azure.com
# 也支持：https://your-resource.cognitiveservices.azure.com
# 也支持：https://your-resource.openai.azure.com
# 根端点会自动规范化为 /openai/v1
# 或使用资源名称代替 base URL
export AZURE_OPENAI_RESOURCE_NAME=your-resource

# 可选
export AZURE_OPENAI_API_VERSION=2024-02-01
export AZURE_OPENAI_DEPLOYMENT_NAME_MAP=gpt-4=my-gpt4,gpt-4o=my-gpt4o
```

### Amazon Bedrock

使用 `/login amazon-bedrock` 存储 Bedrock API Key，或配置以下环境 AWS 凭证源之一：

```bash
# 方式 1：AWS Profile
export AWS_PROFILE=your-profile

# 方式 2：IAM Keys
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...

# 方式 3：Bearer Token
export AWS_BEARER_TOKEN_BEDROCK=...

# 可选区域（默认为 us-east-1）
export AWS_REGION=us-west-2
```

也支持 ECS 任务角色（`AWS_CONTAINER_CREDENTIALS_*`）和 IRSA（`AWS_WEB_IDENTITY_TOKEN_FILE`）。

```bash
pi --provider amazon-bedrock --model us.anthropic.claude-sonnet-4-20250514-v1:0
```

对于 ID 包含可识别模型名称的 Claude 模型（基础模型和系统定义的推理配置），提示缓存会自动启用。对于应用推理配置（其 ARN 不包含模型名称），设置 `AWS_BEDROCK_FORCE_CACHE=1` 以启用缓存点：

```bash
export AWS_BEDROCK_FORCE_CACHE=1
pi --provider amazon-bedrock --model arn:aws:bedrock:us-east-1:123456789012:application-inference-profile/abc123
```

如果你要连接到 Bedrock API 代理，可以使用以下环境变量：

```bash
# 设置 Bedrock 代理的 URL（标准 AWS SDK 环境变量）
export AWS_ENDPOINT_URL_BEDROCK_RUNTIME=https://my.corp.proxy/bedrock

# 如果代理不需要认证
export AWS_BEDROCK_SKIP_AUTH=1

# 如果代理仅支持 HTTP/1.1
export AWS_BEDROCK_FORCE_HTTP1=1
```

### Cloudflare AI Gateway

`CLOUDFLARE_API_KEY` 可通过 `/login` 设置。账户 ID 和网关 slug 可通过环境变量或 API Key 凭证中的 `env` 对象在 `auth.json` 中设置。

```bash
export CLOUDFLARE_API_KEY=...           # 或使用 /login
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_GATEWAY_ID=...        # 在 dash.cloudflare.com → AI → AI Gateway 创建
pi --provider cloudflare-ai-gateway --model "claude-sonnet-4-5"
```

通过 Cloudflare AI Gateway 路由到 OpenAI、Anthropic 和 Workers AI。Workers AI 使用 Unified API（`/compat`）和带前缀的模型 ID（`workers-ai/@cf/...`）。OpenAI 使用 OpenAI 透传路由（`/openai`）和原生 OpenAI 模型 ID，如 `gpt-5.1`。Anthropic 使用 Anthropic 透传路由（`/anthropic`）和原生 Anthropic 模型 ID，如 `claude-sonnet-4-5`。

AI Gateway 认证使用 `CLOUDFLARE_API_KEY` 作为 `cf-aig-authorization`。上游认证可以是以下之一：

| 模式        | 请求认证                                     | 上游认证                                                  |
| ----------- | -------------------------------------------- | --------------------------------------------------------- |
| Workers AI  | 仅 Cloudflare Token                          | Cloudflare 原生                                           |
| 统一计费    | 仅 Cloudflare Token                          | Cloudflare 处理上游认证并扣除额度                         |
| 存储的 BYOK | 仅 Cloudflare Token                          | Cloudflare 注入存储在 AI Gateway 仪表板中的 Provider 密钥 |
| 内联 BYOK   | Cloudflare Token 加上上游 `Authorization` 头 | 请求提供上游 Provider 密钥                                |

对于普通的 Pi 使用，建议使用统一计费或存储的 BYOK。内联 BYOK 需要配置额外的上游 `Authorization` 头给 Cloudflare AI Gateway Provider，例如通过 `models.json` 的 Provider/模型覆盖。

### Cloudflare Workers AI

`CLOUDFLARE_API_KEY` 可通过 `/login` 设置。`CLOUDFLARE_ACCOUNT_ID` 可通过环境变量或 API Key 凭证中的 `env` 对象在 `auth.json` 中设置。

```bash
export CLOUDFLARE_API_KEY=...           # 或使用 /login
export CLOUDFLARE_ACCOUNT_ID=...
pi --provider cloudflare-workers-ai --model "@cf/moonshotai/kimi-k2.6"
```

Pi 会自动设置 `x-session-affinity` 以享受[前缀缓存](https://developers.cloudflare.com/workers-ai/features/prompt-caching/)折扣。

### Google Vertex AI

使用 Application Default Credentials：

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
```

或设置 `GOOGLE_APPLICATION_CREDENTIALS` 为服务账户密钥文件。

## 自定义 Provider

**通过 models.json：** 添加 Ollama、LM Studio、vLLM 或任何支持兼容 API（OpenAI Completions、OpenAI Responses、Anthropic Messages、Google Generative AI）的 Provider。详见 [models.md](models.md)。

**通过扩展：** 对于需要自定义 API 实现或 OAuth 流程的 Provider，创建一个扩展。详见 [custom-provider.md](custom-provider.md) 和 [examples/extensions/custom-provider-gitlab-duo](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/custom-provider-gitlab-duo/)。

## 解析顺序

解析 Provider 凭证时：

1. CLI `--api-key` 标志
2. `auth.json` 条目（API Key 或 OAuth Token）
3. 环境变量
4. `models.json` 中的自定义 Provider Key

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
