# Prompt Templates（Prompt 模板）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/prompt-templates) 的中文翻译。仅供学习参考。

> Pi 可以创建 Prompt 模板。让它为你的工作流构建一个。

Prompt 模板是**可以展开为完整 Prompt 的 Markdown 片段**。输入 `/name` 即可调用模板，其中 `name` 是不含 `.md` 的文件名。

## 位置

- **全局**：`~/.pi/agent/prompts/*.md`
- **项目**：`.pi/prompts/*.md`
- **包**：`prompts/` 目录或 `package.json` 中的 `pi.prompts` 条目
- **设置**：`prompts` 数组
- **CLI**：`--prompt-template <path>`（可重复）

使用 `--no-prompt-templates` 禁用发现。

## 格式

模板使用 YAML frontmatter 和 Markdown 正文：

```yaml
---
description: Review staged git changes
argument-hint: "<PR-URL>"
---
Review the staged changes (`git diff --cached`). Focus on:
- Bugs and logic errors
- Security issues
- Error handling gaps
```

- 文件名即命令名。`review.md` 变为 `/review`
- `description` 可选，缺少时使用第一行非空内容
- `argument-hint` 可选，用于在自动补全中显示参数提示

## 使用

在编辑器中输入 `/`，然后输入模板名称。自动补全会显示带描述的可用模板。

```
/review                           # 展开 review.md
/component Button                 # 带参数展开
/component Button "click handler" # 多个参数
```

## 参数

模板支持位置参数和切片：

- `$1`、`$2` 等 —— 位置参数
- `$@` 或 `$ARGUMENTS` —— 所有参数连接
- `${@:N}` —— 从第 N 个位置开始的参数（1-indexed）
- `${@:N:L}` —— 从 N 开始取 L 个参数

## 加载规则

- `prompts/` 中的模板发现是非递归的
- 子目录模板必须通过 `prompts` 设置或包清单显式添加

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
