# Themes（主题）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/themes) 的中文翻译。仅供学习参考。

Pi 从 JSON 文件加载主题，为 TUI 定义颜色。

## 位置

- 内置主题：`dark` 和 `light`
- 全局：`~/.pi/agent/themes/*.json`
- 项目：`.pi/themes/*.json`
- 包：`themes/` 目录或 `package.json` 中的 `pi.themes` 条目
- 设置：`themes` 数组
- CLI：`--theme <path>`（可重复）

## 选择主题

通过 `/settings` 或在 `settings.json` 中设置：

```json
{
  "theme": "my-theme"
}
```

## 创建自定义主题

1. 创建文件：

```bash
mkdir -p ~/.pi/agent/themes
vim ~/.pi/agent/themes/my-theme.json
```

2. 定义主题。支持**热重载**：编辑活跃的自定义主题文件会自动重新加载。

### 主题文件示例

```json
{
  "name": "my-theme",
  "vars": {
    "primary": "#00aaff",
    "secondary": 242
  },
  "colors": {
    "accent": "primary",
    "border": "primary",
    "borderAccent": "#00ffff",
    "success": "#00ff00",
    "error": "#ff0000",
    "warning": "#ffff00",
    "muted": "secondary",
    "dim": 240,
    "text": "",
    "thinkingText": "secondary"
  }
}
```

主题 JSON 有三个字段：
- `name` —— 必需，必须唯一
- `vars` —— 可复用颜色值
- `colors` —— 必须定义全部 51 个 token

## 颜色值格式

| 格式 | 示例 | 说明 |
|---|---|---|
| Hex | `"#ff0000"` | 6 位十六进制 RGB |
| 256 色 | `39` | xterm 调色板索引（0–255） |
| 变量 | `"primary"` | 引用 `vars` 条目 |
| 默认 | `""` | 终端默认颜色 |

## 颜色 Token（共 51 个）

### 核心 UI（11 个）
`accent`、`border`、`borderAccent`、`borderMuted`、`success`、`error`、`warning`、`muted`、`dim`、`text`、`thinkingText`

### 背景和内容（11 个）
`selectedBg`、`userMessageBg`、`userMessageText`、`customMessageBg`、`customMessageText`、`customMessageLabel`、`toolPendingBg`、`toolSuccessBg`、`toolErrorBg`、`toolTitle`、`toolOutput`

### Markdown（10 个）
`mdHeading`、`mdLink`、`mdLinkUrl`、`mdCode`、`mdCodeBlock`、`mdCodeBlockBorder`、`mdQuote`、`mdQuoteBorder`、`mdHr`、`mdListBullet`

### 工具 Diff（3 个）
`toolDiffAdded`、`toolDiffRemoved`、`toolDiffContext`

### 语法高亮（9 个）
`syntaxComment`、`syntaxKeyword`、`syntaxFunction`、`syntaxVariable`、`syntaxString`、`syntaxNumber`、`syntaxType`、`syntaxOperator`、`syntaxPunctuation`

### Thinking Level 边框（6 个）
`thinkingOff`、`thinkingMinimal`、`thinkingLow`、`thinkingMedium`、`thinkingHigh`、`thinkingXhigh`

### Bash 模式（1 个）
`bashMode`

## 终端兼容性

Pi 使用 24 位 RGB 颜色。大多数现代终端支持（iTerm2、Kitty、WezTerm、Windows Terminal、VS Code）。对于仅支持 256 色的终端，Pi 回退到最接近的近似值。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
