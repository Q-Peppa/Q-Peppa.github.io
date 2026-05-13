# Skills（技能）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/skills) 的中文翻译。仅供学习参考。

Skills 是**自包含的能力包**，由 Agent 按需加载。每个 Skill 为特定任务提供专业化的工作流、设置说明、辅助脚本和参考文档。

Pi 遵循 Agent Skills 标准，对违规会发出警告但保持宽容。

## 位置

Skills 从多个来源加载：

- **全局**：`~/.pi/agent/skills/` 和 `~/.agents/skills/`
- **项目**：`.pi/skills/` 和 `.agents/skills/`（当前目录及向上到 git 仓库根目录或文件系统根目录的祖先目录）
- **包**：`skills/` 目录或 `package.json` 中的 `pi.skills` 条目
- **设置**：`skills` 数组，包含文件或目录
- **CLI**：`--skill <path>`（可重复，即使 `--no-skills` 也会加载）

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

## 如何工作

1. 启动时，Pi 扫描 Skill 位置并提取名称和描述
2. 系统 Prompt 按规范以 XML 格式包含可用 Skills
3. 当任务匹配时，Agent 使用 `read` 加载完整的 SKILL.md
4. Agent 按照指令执行，使用相对路径引用脚本和资源

这是一种渐进式披露：只有描述始终在上下文中，完整指令按需加载。

## Skill 命令

Skills 注册为 `/skill:name` 命令：

```
/skill:brave-search           # 加载并执行 Skill
/skill:pdf-tools extract      # 带参数加载 Skill
```

## Skill 结构

Skill 是一个包含 `SKILL.md` 文件的目录：

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

```markdown
---
name: my-skill
description: What this skill does and when to use it. Be specific.
---

# My Skill

## Setup

```bash
cd /path/to/skill && npm install
```

## Usage

```bash
./scripts/process.sh <input>
```
```

## Frontmatter

| 字段 | 必需 | 说明 |
|---|---|---|
| `name` | 是 | 最多 64 字符。小写 a-z、0-9、连字符。必须匹配父目录名。 |
| `description` | 是 | 最多 1024 字符。Skill 做什么，何时使用。 |
| `license` | 否 | 许可证名称或指向捆绑文件的引用。 |
| `compatibility` | 否 | 最多 500 字符。环境要求。 |
| `metadata` | 否 | 任意键值映射。 |
| `allowed-tools` | 否 | 空格分隔的预批准工具列表（实验性）。 |
| `disable-model-invocation` | 否 | 设为 `true` 时隐藏，只能通过 `/skill:name` 使用。 |

### 命名规则

- 1–64 个字符
- 只能小写字母、数字、连字符
- 不能以连字符开头或结尾
- 不能有连续连字符
- 必须匹配父目录名

## 验证

Pi 根据 Agent Skills 标准验证 Skills。大多数问题只产生警告但仍会加载。**缺少 description 的 Skills 不会加载。**

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
