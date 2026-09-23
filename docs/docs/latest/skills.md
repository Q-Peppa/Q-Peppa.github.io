# Skills

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/skills) 的中文翻译。仅供学习参考。

Skill 为某一类工作给 Pi 提供专门的指令和配套文件。Pi 用名称和描述列出每个可用的 Skill，只在任务需要时才加载它的完整指令。

当某个工作流需要的上下文比 Prompt 模板多，但又不需要新的可执行集成点时，使用 Skill。Skill 可以把脚本、参考资料和资产与指令打包在一起。

Pi 实现 [Agent Skills 规范](https://agentskills.io/specification)。大多数字段无效时只会产生警告，而不会中止启动。

## 创建 Skill

Skill 是一个包含 `SKILL.md` 的目录：

```text
pdf-tools/
├── SKILL.md
├── scripts/
│   └── extract.sh
├── references/
│   └── formats.md
└── assets/
    └── template.json
```

`SKILL.md` 以 frontmatter 开头，后面是直接的指令：

```markdown
---
name: pdf-tools
description: Extract text and tables from PDF files. Use when reading, converting, or inspecting PDFs.
---

# PDF tools

Read `references/formats.md` before converting a document. Run scripts relative to this skill directory.
```

描述决定模型何时考虑加载该 Skill。请同时说明这个 Skill 做什么，以及它在什么情况下适用。避免「Helps with PDFs」这类描述，它没有提供足够的路由信息。

引用打包文件时使用相对于 Skill 目录的路径。Pi 会告诉模型该 Skill 的位置，以便解析这些路径。

## 了解 Skill 如何加载

启动时，Pi 扫描配置的 Skill 位置，并把每个 Skill 的名称、描述和路径加入系统提示。它不会加入完整指令。

任务匹配时，模型读取 `SKILL.md` 并遵循其中的指令。这样详细的指引在需要之前不会占用上下文。模型可能会漏掉相关的 Skill，所以需要强制加载时使用 `/skill:name`。

`/skill:name` 后面的参数会作为用户请求追加到已加载的指令之后：

```text
/skill:pdf-tools extract report.pdf
```

当某个 Skill 只应通过它的显式命令使用时，在 frontmatter 中设置 `disable-model-invocation: true`。`enableSkillCommands` [设置](settings.md)控制 Skill 命令是否出现在交互式命令发现中；手动输入的 `/skill:name` 命令仍然有效。

<a id="choose-where-it-loads"></a>

## 加入 Pi

把 Skill 放在你的用户或项目 Skill 目录中。包含 `SKILL.md` 的目录会被递归发现。

Pi 也支持 Agent Skills 的位置 `~/.agents/skills/` 和 `.agents/skills/`。项目 `.agents/skills/` 目录从工作目录向上穿过各祖先目录发现，遇到仓库根目录时停止。

Pi 接受某些独立的 Markdown Skill，但包含 `SKILL.md` 的目录是可移植的形式，应当优先使用。其他位置见[设置](settings.md#resources)和 [Pi 包](packages.md)。

项目 Skill 可以指示模型运行脚本或修改文件。授予项目信任之前，请审阅不熟悉的 Skill 及其配套文件。

## 编写可移植的 frontmatter

Agent Skills 规范定义了这些字段：

| 字段                       | 作用                          |
| -------------------------- | ----------------------------- |
| `name`                     | 命令名和显示名                |
| `description`              | 展示给模型的路由描述          |
| `license`                  | 许可证名称或随附的许可证文件  |
| `compatibility`            | 环境要求                      |
| `metadata`                 | 额外的键值元数据              |
| `allowed-tools`            | 实验性的预批准工具列表        |
| `disable-model-invocation` | 让该 Skill 不参与模型自动选择 |

名称使用小写字母、数字和连字符，不得以连字符开头、结尾，也不得连续出现连字符。名称最多 64 个字符；描述最多 1024 个。

Pi 不要求声明的名称与父目录一致，也不在两者不一致时警告。其他 Agent Skills 实现可能强制该要求，所以名称保持一致仍是可移植的选择。

格式错误的 `SKILL.md` 文件和声明了但没有描述的 Skill 不会被加载。名称冲突时保留最先发现的 Skill，并产生一条警告。

## 验证并分享 Skill

在能发现该 Skill 的位置运行 Pi，然后检查启动诊断和 `/skill:name` 命令。在活动会话中修改 Skill 后运行 `/reload`。

用 [Pi 包](packages.md)通过 npm 或 git 分发一个或多个 Skill。请把环境设置放在 Skill 内部，并在包中声明所需的运行时依赖。

示例见 [Anthropic skills 合集](https://github.com/anthropics/skills)和 [Pi skills 合集](https://github.com/badlogic/pi-skills)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
