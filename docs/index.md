---
pageType: home

hero:
  name: Pi 中文文档
  text: 代理工具有很多，但这是你的。
  tagline: Pi 是一个极简的终端编码助手。让 Pi 适应你的工作流，而不是反过来。
  actions:
    - theme: brand
      text: 快速开始
      link: /docs/latest/quickstart
    - theme: alt
      text: 阅读文档
      link: /docs/latest/
features:
  - title: 改变工具，而不是改变工作流
    details: Pi 不是封闭产品。需要命令、工具、Provider、工作流或 UI 调整？直接让 Pi 自己构建。它会即时定制自身，修改完成后 /reload 即可继续。
    icon: 🔄
  - title: 15+ Provider，数百种模型
    details: Anthropic、OpenAI、Google、Azure、Bedrock、Mistral、Groq、Cerebras、xAI、Hugging Face、Kimi、MiniMax、OpenRouter、Ollama 等。通过 API Key 或 OAuth 认证，使用 /model 或 Ctrl+L 中途切换模型。
    icon: 🤖
  - title: 四种运行模式
    details: 交互模式：完整 TUI 体验。Print/JSON 模式：pi -p "query" 用于脚本。RPC 模式：通过 stdin/stdout 的 JSON 协议集成。SDK 模式：将 Pi 嵌入你的应用。
    icon: 🖥️
  - title: 树状结构，可分享的会话历史
    details: 会话以树形结构存储。使用 /tree 导航到任意历史点继续对话。/share 上传到 GitHub Gist 获得可分享链接。
    icon: 🌲
  - title: 上下文工程
    details: AGENTS.md 启动时加载项目指令。SYSTEM.md 按项目替换系统提示。Compaction 自动摘要早期消息。Skills 按需加载能力包。通过扩展实现 RAG、长期记忆等。
    icon: 🧠
  - title: 基元，而非功能
    details: 子代理、计划模式、权限门禁、路径保护、SSH 执行、沙箱、MCP 集成——这些其他工具内置的功能，你都可以用扩展自己构建。不想自己写？让 Pi 帮你写，或者安装现成的包。
    icon: 🧱
---

## Pi 刻意没有内置什么

Pi 是激进可扩展的，所以它不需要替你决定工作流。以下功能你可以用扩展、Skills 或第三方包来实现，这让核心保持极简，同时让你按照自己的方式塑造 Pi。

| 我们没有内置 | 替代方案 |
|---|---|
| **No MCP** | 构建带 README 的 CLI 工具（见 Skills），或写一个扩展添加 MCP 支持。[为什么？](https://pi.dev/blog/pi) |
| **No 子代理** | 通过 tmux 派生 Pi 实例，或用扩展构建自己的实现，或安装一个包。 |
| **No 权限弹窗** | 在容器中运行，或用扩展构建符合你环境与安全需求的确认流程。 |
| **No 计划模式** | 把计划写到文件里，或用扩展构建，或安装一个包。 |
| **No 内置待办** | 使用 TODO.md 文件，或用扩展构建自己的。 |
| **No 后台 Bash** | 使用 tmux。完全可观测，直接交互。 |

## 关于本网站

本网站是 [Pi Coding Agent](https://pi.dev/) 的非官方中文翻译文档，仅供学习参考使用。

### 法律声明

- 本网站与 [pi.dev](https://pi.dev/) 及其所有者 **Earendil Inc.** 无任何法律关系。
- 本网站仅为社区爱好者制作的翻译版本，用于帮助中文开发者学习和使用 Pi。
- 原项目的所有权利（包括但不限于代码、商标、文档）归属于 Earendil Inc. 及原贡献者。
- 本翻译不保证与原文档完全一致，如有疑问请参考 [官方文档](https://pi.dev/docs/latest)。
- 如涉及侵权问题，请联系我们，我们将及时处理。

Pi 原始项目采用 **MIT License** 开源协议。
