# Providers

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/providers) 的中文翻译。仅供学习参考。

Pi 支持两类 Provider：基于订阅的（通过 OAuth）和 API Key 型（通过环境变量或 auth 文件）。对于每个 Provider，"Pi 知道所有可用的模型"，模型列表随每次 Pi 发布更新。

## 订阅（Subscriptions）

在交互模式下运行 `/login` 并选择 Provider：

- **ChatGPT Plus/Pro (Codex)**
- **Claude Pro/Max**
- **GitHub Copilot**

使用 `/logout` 清除已存储的凭证。Token 存储在 `~/.pi/agent/auth.json` 中，**过期时自动刷新**。

### OpenAI Codex

需要 ChatGPT Plus 或 Pro 订阅。由 OpenAI 通过 Codex for OSS 计划正式认可。

### Claude Pro/Max

Anthropic 订阅认证适用于 Claude Pro/Max 账户。第三方工具的额外使用按 Token 计费，不会扣减 Claude 计划额度。

### GitHub Copilot

按 Enter 使用 github.com，或提供 GitHub Enterprise Server 域名。如果出现"model not supported"错误，在 VS Code 中：Copilot Chat → 模型选择器 → 选择模型 → "Enable"。

## API Keys

### 环境变量或 Auth 文件

| Provider | 环境变量 | `auth.json` key |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | `anthropic` |
| Azure OpenAI Responses | `AZURE_OPENAI_API_KEY` | `azure-openai-responses` |
| OpenAI | `OPENAI_API_KEY` | `openai` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek` |
| Google Gemini | `GEMINI_API_KEY` | `google` |
| Mistral | `MISTRAL_API_KEY` | `mistral` |
| Groq | `GROQ_API_KEY` | `groq` |
| Cerebras | `CEREBRAS_API_KEY` | `cerebras` |
| Cloudflare AI Gateway | `CLOUDFLARE_API_KEY` | `cloudflare-ai-gateway` |
| Cloudflare Workers AI | `CLOUDFLARE_API_KEY` | `cloudflare-workers-ai` |
| xAI | `XAI_API_KEY` | `xai` |
| OpenRouter | `OPENROUTER_API_KEY` | `openrouter` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway` |
| ZAI | `ZAI_API_KEY` | `zai` |
| OpenCode Zen | `OPENCODE_API_KEY` | `opencode` |
| OpenCode Go | `OPENCODE_API_KEY` | `opencode-go` |
| Hugging Face | `HF_TOKEN` | `huggingface` |
| Fireworks | `FIREWORKS_API_KEY` | `fireworks` |
| Together AI | `TOGETHER_API_KEY` | `together` |
| Kimi For Coding | `KIMI_API_KEY` | `kimi-coding` |
| MiniMax | `MINIMAX_API_KEY` | `minimax` |
| Xiaomi MiMo | `XIAOMI_API_KEY` | `xiaomi` |

### Auth 文件

凭证存储在 `~/.pi/agent/auth.json` 中：

```json
{
  "anthropic": { "type": "api_key", "key": "sk-ant-..." },
  "openai": { "type": "api_key", "key": "sk-..." },
  "deepseek": { "type": "api_key", "key": "sk-..." }
}
```

文件以 `0600` 权限创建（仅用户可读写）。Auth 文件凭证优先于环境变量。

### Key 解析

`key` 字段支持三种格式：

- **Shell 命令**：前缀 `!`，执行命令并使用 stdout 作为值（进程生命周期内缓存）
- **环境变量**：使用命名环境变量的值
- **字面值**：直接使用

```json
{ "type": "api_key", "key": "!op read 'op://vault/item/credential'" }
{ "type": "api_key", "key": "MY_ANTHROPIC_KEY" }
{ "type": "api_key", "key": "sk-ant-..." }
```

## 云 Provider

### Azure OpenAI

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.openai.azure.com
```

### Amazon Bedrock

三种认证方式：
1. AWS Profile：`export AWS_PROFILE=your-profile`
2. IAM Keys：`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
3. Bearer Token：`AWS_BEARER_TOKEN_BEDROCK`

```bash
pi --provider amazon-bedrock --model us.anthropic.claude-sonnet-4-20250514-v1:0
```

### Google Vertex AI

使用 Application Default Credentials：

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
```

## 自定义 Provider

- 通过 `models.json` 添加 Ollama、LM Studio、vLLM 等
- 通过扩展实现自定义 API 实现或 OAuth 流程

## 解析顺序

凭证解析优先级：
1. CLI `--api-key` 标志
2. `auth.json` 条目（API Key 或 OAuth Token）
3. 环境变量
4. `models.json` 中的自定义 Provider Key

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
