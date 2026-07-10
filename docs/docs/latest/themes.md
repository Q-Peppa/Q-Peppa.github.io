# Themes（主题）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/themes) 的中文翻译。仅供学习参考。

> Pi 可以帮你创建主题。告诉它你想要什么风格即可。

Themes 是定义 TUI 颜色的 JSON 文件。

## 目录

- [位置](#位置)
- [选择主题](#选择主题)
- [创建自定义主题](#创建自定义主题)
- [主题格式](#主题格式)
- [颜色 Token](#颜色-token)
- [颜色值](#颜色值)
- [提示](#提示)
- [示例](#示例)

## 位置

Pi 从以下位置加载主题：

- 内置主题：`dark` 和 `light`
- 全局：`~/.pi/agent/themes/*.json`
- 项目：`.pi/themes/*.json`（仅在项目被信任后加载）
- 包：`themes/` 目录或 `package.json` 中的 `pi.themes` 条目
- 设置：`themes` 数组，包含文件或目录
- CLI：`--theme <path>`（可重复）

使用 `--no-themes` 禁用主题发现。

## 选择主题

通过 `/settings` 或在 `settings.json` 中设置：

```json
{
  "theme": "my-theme"
}
```

首次运行时，Pi 检测终端背景色，默认选择 `dark` 或 `light`。

## 创建自定义主题

1. 创建主题文件：

```bash
mkdir -p ~/.pi/agent/themes
vim ~/.pi/agent/themes/my-theme.json
```

2. 使用所有必需颜色定义主题（见[颜色 Token](#颜色-token)）：

```json
{
  "$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
  "name": "my-theme",
  "vars": {
    "primary": "#00aaff",
    "secondary": 242
  },
  "colors": {
    "accent": "primary",
    "border": "primary",
    "borderAccent": "#00ffff",
    "borderMuted": "secondary",
    "success": "#00ff00",
    "error": "#ff0000",
    "warning": "#ffff00",
    "muted": "secondary",
    "dim": 240,
    "text": "",
    "thinkingText": "secondary",
    "selectedBg": "#2d2d30",
    "userMessageBg": "#2d2d30",
    "userMessageText": "",
    "customMessageBg": "#2d2d30",
    "customMessageText": "",
    "customMessageLabel": "primary",
    "toolPendingBg": "#1e1e2e",
    "toolSuccessBg": "#1e2e1e",
    "toolErrorBg": "#2e1e1e",
    "toolTitle": "primary",
    "toolOutput": "",
    "mdHeading": "#ffaa00",
    "mdLink": "primary",
    "mdLinkUrl": "secondary",
    "mdCode": "#00ffff",
    "mdCodeBlock": "",
    "mdCodeBlockBorder": "secondary",
    "mdQuote": "secondary",
    "mdQuoteBorder": "secondary",
    "mdHr": "secondary",
    "mdListBullet": "#00ffff",
    "toolDiffAdded": "#00ff00",
    "toolDiffRemoved": "#ff0000",
    "toolDiffContext": "secondary",
    "syntaxComment": "secondary",
    "syntaxKeyword": "primary",
    "syntaxFunction": "#00aaff",
    "syntaxVariable": "#ffaa00",
    "syntaxString": "#00ff00",
    "syntaxNumber": "#ff00ff",
    "syntaxType": "#00aaff",
    "syntaxOperator": "primary",
    "syntaxPunctuation": "secondary",
    "thinkingOff": "secondary",
    "thinkingMinimal": "primary",
    "thinkingLow": "#00aaff",
    "thinkingMedium": "#00ffff",
    "thinkingHigh": "#ff00ff",
    "thinkingXhigh": "#ff0000",
    "thinkingMax": "#ff0088",
    "bashMode": "#ffaa00"
  }
}
```

3. 通过 `/settings` 选择主题。

**热重载：** 编辑当前活跃的自定义主题文件时，Pi 自动重新加载，可即时预览效果。

## 主题格式

```json
{
  "$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
  "name": "my-theme",
  "vars": {
    "blue": "#0066cc",
    "gray": 242
  },
  "colors": {
    "accent": "blue",
    "muted": "gray",
    "text": "",
    ...
  }
}
```

- `name`：必需，必须唯一，且不能包含 `/`。
- `vars`：可选。在此定义可复用的颜色，然后在 `colors` 中引用。
- `colors`：必须定义全部 51 个必需 token。`thinkingMax` 为可选，缺失时回退到 `thinkingXhigh`。
- `$schema` 字段启用编辑器自动补全和验证。

## 颜色 Token

每个主题必须定义全部 51 个颜色 token，没有可选颜色。

### 核心 UI（11 个）

| Token          | 用途                           |
| -------------- | ------------------------------ |
| `accent`       | 主强调色（Logo、选中项、光标） |
| `border`       | 普通边框                       |
| `borderAccent` | 高亮边框                       |
| `borderMuted`  | 微妙边框（编辑器）             |
| `success`      | 成功状态                       |
| `error`        | 错误状态                       |
| `warning`      | 警告状态                       |
| `muted`        | 次要文本                       |
| `dim`          | 三级文本                       |
| `text`         | 默认文本（通常为 `""`）        |
| `thinkingText` | Thinking 块文本                |

### 背景和内容（11 个）

| Token                | 用途             |
| -------------------- | ---------------- |
| `selectedBg`         | 选中行背景       |
| `userMessageBg`      | 用户消息背景     |
| `userMessageText`    | 用户消息文本     |
| `customMessageBg`    | 扩展消息背景     |
| `customMessageText`  | 扩展消息文本     |
| `customMessageLabel` | 扩展消息标签     |
| `toolPendingBg`      | 工具框（等待中） |
| `toolSuccessBg`      | 工具框（成功）   |
| `toolErrorBg`        | 工具框（错误）   |
| `toolTitle`          | 工具标题         |
| `toolOutput`         | 工具输出文本     |

### Markdown（10 个）

| Token               | 用途         |
| ------------------- | ------------ |
| `mdHeading`         | 标题         |
| `mdLink`            | 链接文本     |
| `mdLinkUrl`         | 链接 URL     |
| `mdCode`            | 行内代码     |
| `mdCodeBlock`       | 代码块内容   |
| `mdCodeBlockBorder` | 代码块边框   |
| `mdQuote`           | 引用文本     |
| `mdQuoteBorder`     | 引用边框     |
| `mdHr`              | 水平分割线   |
| `mdListBullet`      | 列表项目符号 |

### 工具 Diff（3 个）

| Token             | 用途     |
| ----------------- | -------- |
| `toolDiffAdded`   | 新增行   |
| `toolDiffRemoved` | 删除行   |
| `toolDiffContext` | 上下文行 |

### 语法高亮（9 个）

| Token               | 用途     |
| ------------------- | -------- |
| `syntaxComment`     | 注释     |
| `syntaxKeyword`     | 关键字   |
| `syntaxFunction`    | 函数名   |
| `syntaxVariable`    | 变量     |
| `syntaxString`      | 字符串   |
| `syntaxNumber`      | 数字     |
| `syntaxType`        | 类型     |
| `syntaxOperator`    | 运算符   |
| `syntaxPunctuation` | 标点符号 |

### Thinking Level 边框（6 个必需，1 个可选）

编辑器边框颜色，指示思维级别（从微妙到突出的视觉层次）：

| Token             | 用途                                         |
| ----------------- | -------------------------------------------- |
| `thinkingOff`     | 思维关闭                                     |
| `thinkingMinimal` | 最简思维                                     |
| `thinkingLow`     | 低思维                                       |
| `thinkingMedium`  | 中等思维                                     |
| `thinkingHigh`    | 高思维                                       |
| `thinkingXhigh`   | 超高思维                                     |
| `thinkingMax`     | 最高思维；可选，缺失时回退到 `thinkingXhigh` |

### Bash 模式（1 个）

| Token      | 用途                              |
| ---------- | --------------------------------- |
| `bashMode` | Bash 模式编辑器边框（`!` 前缀时） |

### HTML Export（可选）

`export` 部分控制 `/export` HTML 输出的颜色。如果省略，颜色从 `userMessageBg` 派生。

```json
{
  "export": {
    "pageBg": "#18181e",
    "cardBg": "#1e1e24",
    "infoBg": "#3c3728"
  }
}
```

## 颜色值

支持四种格式：

| 格式   | 示例        | 说明                            |
| ------ | ----------- | ------------------------------- |
| Hex    | `"#ff0000"` | 6 位十六进制 RGB                |
| 256 色 | `39`        | xterm 256 色调色板索引（0-255） |
| 变量   | `"primary"` | 引用 `vars` 条目                |
| 默认   | `""`        | 终端默认颜色                    |

### 256 色调色板

- `0-15`：基本 ANSI 颜色（因终端而异）
- `16-231`：6×6×6 RGB 色块（`16 + 36×R + 6×G + B`，其中 R、G、B 为 0-5）
- `232-255`：灰度渐变

### 终端兼容性

Pi 使用 24 位 RGB 颜色（True Color）。大多数现代终端支持（iTerm2、Kitty、WezTerm、Windows Terminal、VS Code）。对于仅支持 256 色的旧终端，Pi 回退到最接近的近似值。

检查 True Color 支持：

```bash
echo $COLORTERM   # 应输出 "truecolor" 或 "24bit"
```

## 提示

- **暗色终端**：使用明亮、饱和度高的颜色，提高对比度。
- **亮色终端**：使用较暗、柔和的颜色，降低对比度。
- **色彩和谐**：从基础调色板（Nord、Gruvbox、Tokyo Night 等）开始，定义在 `vars` 中，统一引用。
- **测试**：用不同的消息类型、工具状态、Markdown 内容和长折行文本检查主题效果。
- **VS Code**：设置 `terminal.integrated.minimumContrastRatio` 为 `1` 以获得准确颜色。

## 示例

查看内置主题：

- [dark.json](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/interactive/theme/dark.json)
- [light.json](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/interactive/theme/light.json)

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
