# 用主题自定义 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/themes) 的中文翻译。仅供学习参考。

主题控制 Pi 在交互模式和 HTML 导出中使用的颜色。Pi 内置 `dark` 和 `light` 主题。你可以选择一个主题、跟随终端的浅色或深色外观，或创建自己的配色。

<a id="selecting-a-theme"></a>

## 选择主题

打开 `/settings` 并选择 **Theme**。你可以让所有终端外观使用同一个主题，也可以为浅色和深色终端分别选择主题。

该选择保存为 `theme` [设置](settings.md#terminal-and-display)：

```json
{
  "theme": "dark"
}
```

自动模式先存浅色主题，再存深色主题：

```json
{
  "theme": "light/dark"
}
```

自动模式生效时，Pi 在终端报告外观变化时切换主题。主题名不能包含 `/`，因为 Pi 把它保留给这种设置格式。

用 `--use-theme` 为单次调用选择初始主题，而不改动已保存的设置：

```bash
pi --use-theme light
pi --use-theme light/dark
```

该命令行选项见 [CLI 资源](cli.md#resources)。

## 创建自定义主题

复制一个[内置主题](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/src/modes/interactive/theme)，或按照[ schema](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json) 新建一个 JSON 文件。

1. 把文件保存为 `<agent-dir>/themes/my-theme.json`。agent 目录默认为 `~/.pi/agent`。
2. 把它的 `name` 设为 `my-theme`。
3. 修改 `vars` 和 `colors` 中的值。
4. 通过 `/settings` 选择 `my-theme`。

请让文件名与主题名一致。Pi 只对 `<agent-dir>/themes/<name>.json` 中的当前用户主题做热重载。从任何其他来源添加或修改主题后，请运行 `/reload`。

## 了解主题文件

| 属性      | 必填 | 作用                                                        |
| --------- | ---- | ----------------------------------------------------------- |
| `$schema` | 否   | 按 Pi 发布的 schema 启用编辑器校验和补全。                  |
| `name`    | 是   | 在选择器和设置中标识该主题。必须唯一，且不能包含 `/`。      |
| `vars`    | 否   | 定义可复用的颜色值。变量可以引用其他变量。                  |
| `colors`  | 是   | 把颜色分配给终端 UI 的角色。schema 标明了必需和可选的色名。 |
| `export`  | 否   | 覆盖 HTML 导出中的页面和面板背景。                          |

颜色可以写成四种形式：

| 形式         | 示例        | 含义                                 |
| ------------ | ----------- | ------------------------------------ |
| RGB 十六进制 | `"#00aaff"` | 六位 RGB 颜色。                      |
| 256 色索引   | `39`        | 从 `0` 到 `255` 的 ANSI 调色板索引。 |
| 变量引用     | `"primary"` | `vars` 中某个条目的值。              |
| 终端默认     | `""`        | 终端的默认前景色或背景色。           |

Pi 会解析链式变量引用。缺失的变量或循环引用会让主题无效。十六进制颜色在支持时使用 truecolor，在只支持 256 色的终端中做近似。如果颜色与它们的十六进制值不同，请检查终端的 truecolor 检测和对比度设置。见[配置终端](terminal-setup.md#override-detected-capabilities)。

确切的属性、必需的色名和可接受的取值类型见[主题 JSON schema](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json)。

Pi 在启动和 `/reload` 时报告无效的主题文件。

## 找到要修改的颜色

主题颜色描述的是界面角色，而不是单个组件。用下面这些分组定位 schema 中相关的部分：

| 区域       | 色名                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| 通用界面   | `accent`、`border*`、`text`、`muted`、`dim`、`success`、`error`、`warning` |
| 选择与全屏 | `selectedBg`、`searchMatch*`、`scrollbar*`                                 |
| 消息       | `userMessage*`、`customMessage*`、`thinkingText`                           |
| 工具执行   | `toolPendingBg`、`toolSuccessBg`、`toolErrorBg`、`toolTitle`、`toolOutput` |
| Markdown   | `md*`                                                                      |
| 工具 diff  | `toolDiff*`                                                                |
| 语法高亮   | `syntax*`                                                                  |
| 编辑器模式 | `thinking*`、`bashMode`                                                    |
| HTML 导出  | `export.pageBg`、`export.cardBg`、`export.infoBg`                          |

schema 是格式参考。内置主题提供了完整的值，你可以复制并调整。

有五个颜色是可选的，省略时继承另一个颜色：

| 可选颜色          | 回退            |
| ----------------- | --------------- |
| `scrollbarTrack`  | `muted`         |
| `scrollbarThumb`  | `text`          |
| `searchMatchBg`   | `selectedBg`    |
| `searchMatchText` | `text`          |
| `thinkingMax`     | `thinkingXhigh` |

如果省略 `export` 颜色，Pi 从 `userMessageBg` 推导出 HTML 页面和面板背景。

## 从项目或包加载主题

把项目主题放在 `.pi/themes/`。项目主题只在[项目信任](security.md#understand-project-trust)被授予后加载。

你也可以通过 `themes` 设置加载主题文件和目录，或在 Pi 包中分发它们。见[配置](configuration.md)、[设置](settings.md#resources)和 [Pi 包](packages.md)。

每个已加载主题的名称必须唯一。Pi 把重名报告为资源冲突。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
