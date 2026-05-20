# Skills（技能）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/skills) 的中文翻译。仅供学习参考。

> Pi 可以创建 Skills。让它为你的用例构建一个。

Skills 是**自包含的能力包**，由 Agent 按需加载。每个 Skill 为特定任务提供专业化的工作流、设置说明、辅助脚本和参考文档。

Pi 遵循 [Agent Skills 标准](https://agentskills.io/specification)，对违规会发出警告但保持宽容。Pi 允许 Skill 名称与其父目录不同（即使标准不允许），因为该规则对于跨多个 Agent 框架使用的共享 Skill 目录来说并不理想。

## 目录

- [位置](#位置)
- [如何工作](#如何工作)
- [Skill 命令](#skill-命令)
- [Skill 结构](#skill-结构)
- [Frontmatter](#frontmatter)
- [验证](#验证)
- [示例](#示例)
- [Skill 仓库](#skill-仓库)

## 位置

> **安全提示：** Skills 可以指示模型执行任何操作，并可能包含模型调用的可执行代码。使用前请审查 Skill 内容。

Pi 从多个来源加载 Skills：

- **全局**：
  - `~/.pi/agent/skills/`
  - `~/.agents/skills/`
- **项目**：
  - `.pi/skills/`
  - `.agents/skills/`（当前目录及向上到 git 仓库根目录或文件系统根目录的祖先目录）
- **包**：`skills/` 目录或 `package.json` 中的 `pi.skills` 条目
- **设置**：`skills` 数组，包含文件或目录
- **CLI**：`--skill <path>`（可重复，即使 `--no-skills` 也会加载）

发现规则：
- 在 `~/.pi/agent/skills/` 和 `.pi/skills/` 中，直接根目录的 `.md` 文件被发现为独立 Skills
- 在所有 Skill 位置中，包含 `SKILL.md` 的目录被递归发现
- 在 `~/.agents/skills/` 和项目 `.agents/skills/` 中，根目录的 `.md` 文件被忽略

使用 `--no-skills` 禁用发现（显式的 `--skill` 路径仍会加载）。

### 使用其他工具的 Skills

要使用 Claude Code 或 OpenAI Codex 的 Skills，将其目录添加到设置：

```json
{
  "skills": [
    "~/.claude/skills",
    "~/.codex/skills"
  ]
}
```

对于项目级别的 Claude Code Skills，添加到 `.pi/settings.json`：

```json
{
  "skills": ["../.claude/skills"]
}
```

## 如何工作

1. 启动时，Pi 扫描 Skill 位置并提取名称和描述
2. 系统 Prompt 按[规范](https://agentskills.io/integrate-skills)以 XML 格式包含可用 Skills
3. 当任务匹配时，Agent 使用 `read` 加载完整的 SKILL.md（模型不总是这样做；可使用提示或 `/skill:name` 强制加载）
4. Agent 按照指令执行，使用相对路径引用脚本和资源

这是一种渐进式披露：只有描述始终在上下文中，完整指令按需加载。

## Skill 命令

Skills 注册为 `/skill:name` 命令：

```bash
/skill:brave-search           # 加载并执行 Skill
/skill:pdf-tools extract      # 带参数加载 Skill
```

命令后的参数会作为 `User: <args>` 附加到 Skill 内容后面。

通过交互模式下的 `/settings` 或在 `settings.json` 中切换 Skill 命令：

```json
{
  "enableSkillCommands": true
}
```

## Skill 结构

Skill 是一个包含 `SKILL.md` 文件的目录。其他内容自由组织。

```
my-skill/
├── SKILL.md              # 必需：frontmatter + 指令
├── scripts/              # 辅助脚本
│   └── process.sh
├── references/           # 按需加载的详细文档
│   └── api-reference.md
└── assets/
    └── template.json
```

### SKILL.md 格式

````markdown
---
name: my-skill
description: What this skill does and when to use it. Be specific.
---

# My Skill

## Setup

Run once before first use:
```bash
cd /path/to/skill && npm install
```

## Usage

```bash
./scripts/process.sh <input>
```
````

使用相对于 Skill 目录的路径：

```markdown
See [the reference guide](references/REFERENCE.md) for details.
```

## Frontmatter

根据 [Agent Skills 规范](https://agentskills.io/specification#frontmatter-required)：

| 字段 | 必需 | 说明 |
|-------|----------|-------------|
| `name` | 是 | 最多 64 字符。小写 a-z、0-9、连字符。与标准不同，Pi 不要求此值匹配父目录名，因为该标准要求对于共享 Skill 目录并不理想。 |
| `description` | 是 | 最多 1024 字符。Skill 做什么，何时使用。 |
| `license` | 否 | 许可证名称或指向捆绑文件的引用。 |
| `compatibility` | 否 | 最多 500 字符。环境要求。 |
| `metadata` | 否 | 任意键值映射。 |
| `allowed-tools` | 否 | 空格分隔的预批准工具列表（实验性）。 |
| `disable-model-invocation` | 否 | 设为 `true` 时从系统提示隐藏，只能通过 `/skill:name` 使用。 |

### 命名规则

- 1–64 个字符
- 只能小写字母、数字、连字符
- 不能以连字符开头或结尾
- 不能有连续连字符
Pi 不要求名称匹配父目录名。Agent Skills 标准有此要求，但该要求对于多个工具使用的共享 Skill 目录来说并不理想。

有效：`pdf-processing`、`data-analysis`、`code-review`
无效：`PDF-Processing`、`-pdf`、`pdf--processing`

### 描述最佳实践

描述决定了 Agent 何时加载 Skill。要具体。

好：
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents.
```

差：
```yaml
description: Helps with PDFs.
```

## 验证

Pi 根据 Agent Skills 标准验证 Skills。大多数问题只产生警告但仍会加载：

- 名称超过 64 字符或包含无效字符
- 名称以连字符开头/结尾或有连续连字符
- 描述超过 1024 字符

未知的 frontmatter 字段被忽略。

**例外：** 缺少 description 的 Skills 不会加载。

名称冲突（不同位置的相同名称）会发出警告并保留第一个找到的 Skill。

## 示例

```
brave-search/
├── SKILL.md
├── search.js
└── content.js
```

**SKILL.md：**
````markdown
---
name: brave-search
description: Web search and content extraction via Brave Search API. Use for searching documentation, facts, or any web content.
---

# Brave Search

## Setup

```bash
cd /path/to/brave-search && npm install
```

## Search

```bash
./search.js "query"              # Basic search
./search.js "query" --content    # Include page content
```

## Extract Page Content

```bash
./content.js https://example.com
```
````

## Skill 仓库

- [Anthropic Skills](https://github.com/anthropics/skills) —— 文档处理（docx、pdf、pptx、xlsx）、Web 开发
- [Pi Skills](https://github.com/badlogic/pi-skills) —— Web 搜索、浏览器自动化、Google API、转录

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
