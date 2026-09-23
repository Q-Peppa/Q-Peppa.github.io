# Provider 认证

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/providers) 的中文翻译。仅供学习参考。

大多数托管 Provider 支持以下认证方式中的一种或两种：

- 通过浏览器或设备流程进行由 OAuth 支持的登录。
- 提供 API Key。

用 `/login [provider]` 查看某个 Provider 支持的方式。Amazon Bedrock 和 Google Vertex AI 也可以使用环境中的云凭证。

## 以交互方式认证

运行 `/login` 并选择一个 Provider。Pi 会引导你完成它的 OAuth 或 API Key 流程，并把得到的凭证保存到 [`auth.json`](configuration.md#agent-directory)。

在远程或无头机器上，OAuth 回调可能无法到达本地进程。出现提示时，把最终的跳转 URL 或授权码粘贴回 Pi。

运行 `/logout` 并选择一个 Provider 可以删除它已存的凭证。这不会取消环境变量、不会移除 `models.json` 中的认证，也不会在 Provider 处吊销凭证。

`auth.json` 可能包含 API Key 和 OAuth Token。请对它保密，不要提交它。

Radius 认证使用它的网关目录，并缓存刷新后的模型元数据以便之后离线启动。在 `models.json` 中配置的自定义 Radius 网关使用它自己的目录，而不会继承公开的 `radius.pi.dev` 目录。

## 使用环境变量中的 API Key

环境变量在 CI 以及任何不希望 Pi 保存 Key 的场景都很有用。启动 Pi 之前设置该变量：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

下表覆盖只有一个主要 API Key 变量的 Provider。需要额外配置或支持环境凭证的 Provider 在[云 Provider](#cloud-providers) 中介绍。

| Provider                             | 环境变量                        |
| ------------------------------------ | ------------------------------- |
| Anthropic                            | `ANTHROPIC_API_KEY`             |
| Ant Ling                             | `ANT_LING_API_KEY`              |
| OpenAI                               | `OPENAI_API_KEY`                |
| DeepSeek                             | `DEEPSEEK_API_KEY`              |
| NVIDIA NIM                           | `NVIDIA_API_KEY`                |
| Google Gemini                        | `GEMINI_API_KEY`                |
| GitHub Copilot                       | `COPILOT_GITHUB_TOKEN`          |
| Mistral                              | `MISTRAL_API_KEY`               |
| Groq                                 | `GROQ_API_KEY`                  |
| Cerebras                             | `CEREBRAS_API_KEY`              |
| xAI                                  | `XAI_API_KEY`                   |
| OpenRouter                           | `OPENROUTER_API_KEY`            |
| Vercel AI Gateway                    | `AI_GATEWAY_API_KEY`            |
| ZAI Coding Plan（全球）              | `ZAI_API_KEY`                   |
| ZAI Coding Plan（中国）              | `ZAI_CODING_CN_API_KEY`         |
| OpenCode Zen and Go                  | `OPENCODE_API_KEY`              |
| Radius                               | `RADIUS_API_KEY`                |
| Hugging Face                         | `HF_TOKEN`                      |
| Fireworks                            | `FIREWORKS_API_KEY`             |
| Together AI                          | `TOGETHER_API_KEY`              |
| Baseten                              | `BASETEN_API_KEY`               |
| Kimi For Coding                      | `KIMI_API_KEY`                  |
| Meta                                 | `META_API_KEY`                  |
| MiniMax                              | `MINIMAX_API_KEY`               |
| MiniMax（中国）                      | `MINIMAX_CN_API_KEY`            |
| Moonshot AI（全球和中国）            | `MOONSHOT_API_KEY`              |
| Qwen Token Plan and Individual       | `QWEN_TOKEN_PLAN_API_KEY`       |
| Qwen Token Plan（中国）              | `QWEN_TOKEN_PLAN_CN_API_KEY`    |
| Xiaomi MiMo                          | `XIAOMI_API_KEY`                |
| Xiaomi MiMo Token Plan（中国）       | `XIAOMI_TOKEN_PLAN_CN_API_KEY`  |
| Xiaomi MiMo Token Plan（阿姆斯特丹） | `XIAOMI_TOKEN_PLAN_AMS_API_KEY` |
| Xiaomi MiMo Token Plan（新加坡）     | `XIAOMI_TOKEN_PLAN_SGP_API_KEY` |

Anthropic 也把 `ANTHROPIC_OAUTH_TOKEN` 识别为 API 凭证，把 `ANTHROPIC_AUTH_TOKEN` 识别为 bearer 认证。

## 从命令加载 API Key

要在不把解析出的 Key 写入磁盘的情况下使用密钥管理器，请把 `auth.json` 中某个 Provider 的 `key` 设为一个以 `!` 开头的命令：

```json
{
  "anthropic": {
    "type": "api_key",
    "key": "!security find-generic-password -ws 'anthropic'"
  }
}
```

Pi 在第一次需要该 Key 时运行命令，并在进程存活期间缓存它的标准输出。输出为空、超时或非零退出会让该 Key 保持未解析，直到 Pi 重启。

## 云 Provider

下面的 Provider 需要额外设置，或可以使用其云平台提供的凭证。

已存的 API Key 凭证可以包含一个 `env` 对象。它的值对该 Provider 优先于进程环境：

```json
{
  "cloudflare-workers-ai": {
    "type": "api_key",
    "key": "...",
    "env": {
      "CLOUDFLARE_ACCOUNT_ID": "account-id"
    }
  }
}
```

### Azure OpenAI

设置 API Key，以及 base URL 或资源名：

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.ai.azure.com
# 或者：
export AZURE_OPENAI_RESOURCE_NAME=your-resource
```

`ai.azure.com`、`cognitiveservices.azure.com` 和 `openai.azure.com` 下的资源根 URL 会被规范化为 OpenAI API 路径。

### Amazon Bedrock

Bedrock 可以使用 bearer token 或环境中的 AWS 凭证来源：

```bash
# 命名 profile
export AWS_PROFILE=your-profile

# IAM keys
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
# 临时凭证需要该项
export AWS_SESSION_TOKEN=...

# Bedrock bearer token
export AWS_BEARER_TOKEN_BEDROCK=...

# 当 profile 或 AWS SDK 配置未提供时的区域
export AWS_REGION=us-west-2
# 也支持 AWS_DEFAULT_REGION
```

Pi 还通过标准的 `AWS_CONTAINER_CREDENTIALS_*` 和 `AWS_WEB_IDENTITY_TOKEN_FILE` 变量支持 ECS 任务凭证和 IRSA。

### Cloudflare AI Gateway

该网关需要 Token、account ID 和 gateway ID：

```bash
export CLOUDFLARE_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_GATEWAY_ID=...
```

account ID 和 gateway ID 可以来自进程环境，也可以来自 `auth.json` 中凭证的 `env` 对象。

`CLOUDFLARE_API_KEY` 用于向网关认证 Pi。上游访问可以使用 Cloudflare 统一计费、存储在该网关中的凭证，或为 `models.json` 中该 Provider 配置的 `Authorization` header。

### Cloudflare Workers AI

Workers AI 需要 Token 和 account ID：

```bash
export CLOUDFLARE_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
```

account ID 也可以存储在凭证的 `env` 对象中。

### Google Vertex AI

使用 Google Cloud API Key：

```bash
export GOOGLE_CLOUD_API_KEY=...
```

要使用 Application Default Credentials，请配置项目和位置：

```bash
export GOOGLE_CLOUD_PROJECT=your-project
# 也支持 GCLOUD_PROJECT
export GOOGLE_CLOUD_LOCATION=us-central1
```

然后认证：

```bash
gcloud auth application-default login
```

要改用服务账号 Key 文件，请设置 `GOOGLE_APPLICATION_CREDENTIALS`，并同时设置项目和位置。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
