# Prompt 模板

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/prompt-templates) 的中文翻译。仅供学习参考。

Prompt 模板把 Markdown 文件变成可复用的 `/` 命令。当你想复用同一段 Prompt，又不需要添加可执行行为或更大一组配套指令时，使用它。

模板可以接受参数，并出现在命令补全中。Pi 可以从个人配置、项目配置、显式路径或 Pi 包加载模板。项目配置只在项目信任被授予后加载。

## 创建模板

创建 `~/.pi/agent/prompts/review.md`：

```markdown
---
description: Review staged git changes
argument-hint: '[focus]'
---

Review the staged changes. Focus on ${1:-correctness, security, and error handling}.
```

文件名成为命令名，所以这个模板可以通过 `/review` 使用。`description` 出现在命令补全中。如果省略它，Pi 使用第一个非空行。

`argument-hint` 是可选的。必需的参数用 `<尖括号>`，可选的参数用 `[方括号]`。

在活动会话中添加或修改模板后运行 `/reload`。

<a id="invoke-a-template"></a>

## 使用模板

在编辑器中输入模板命令：

```text
/review
/review concurrency
```

Pi 在生成的文本进入 Agent 之前展开模板。除非同名的扩展命令处理了它，扩展会先通过 `input` 事件收到原始输入。

模板支持以下替换：

| 语法                 | 结果                         |
| -------------------- | ---------------------------- |
| `$1`、`$2`、…        | 一个位置参数                 |
| `$@` 或 `$ARGUMENTS` | 所有参数用空格连接           |
| `${1:-default}`      | 第一个参数，或一个默认值     |
| `${@:-default}`      | 所有参数，或一个默认值       |
| `${@:N}`             | 从位置 `N` 开始的参数        |
| `${@:N:L}`           | 从位置 `N` 开始的 `L` 个参数 |

参数遵循类似 Shell 的引号规则，所以 `/review "API compatibility"` 提供一个包含空格的参数。

<a id="choose-where-it-loads"></a>

## 加入 Pi

把模板放在你的用户或项目 Prompt 目录中。约定俗成的 Prompt 目录只加载直接的 `.md` 子文件。

设置和包可以选择嵌套的 Markdown 文件；包清单可以用显式路径和 glob 收窄发现范围。这些选项见[设置](settings.md#resources)和 [Pi 包](packages.md)。

项目模板在信任被授予后成为编辑器中的命令。信任不熟悉的项目之前，请先审阅它们的内容。见[安全](security.md#understand-project-trust)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
