# 用主题自定义 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/themes) 的中文翻译。仅供学习参考。

主题控制 Pi 在交互模式和 HTML 导出中使用的颜色。Pi 内置 `system`、`dark` 和 `light` 主题。你可以选择一个主题、跟随终端的浅色或深色外观，或创建自己的配色。

## 使用终端的颜色

`system` 主题是默认值。它从终端主题构建 Pi 的颜色，所以 Pi 匹配终端，而不是带上自己的配色：

- Pi 查询终端的默认前景色、背景色以及 16 种 ANSI 颜色。
- 每种 Pi 颜色从一种 ANSI 颜色取色相，例如错误用红色、链接用蓝色。
- Pi 设置每种颜色的明度，使它相对背景达到最低对比度。正文在背景和每个面板上至少保持 4.5:1 的 WCAG 对比度。
- 终端在浅色和深色之间切换时，Pi 再次查询颜色并重建主题。

主题会适配终端报告的内容：

| 终端报告         | 结果                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| 背景和 ANSI 颜色 | 来自终端调色板的颜色，按实际背景放置。                                          |
| 仅背景           | Pi 自己的色相，按实际背景放置。                                                 |
| 无               | ANSI 颜色索引和终端默认颜色，由终端自己渲染。次要文本为 faint，面板没有背景色。 |

Pi 启动时向终端询问颜色。终端通常在几毫秒内回答，Pi 最多等待 100 ms 再显示启动头部。如果终端没有及时回答，Pi 使用 ANSI 颜色回退，之后颜色到达时仍会应用，例如在较慢的 SSH 连接上。`system` 是保留名：同名的自定义主题会被忽略。

<a id="selecting-a-theme"></a>

## 选择主题

打开 `/settings` 并选择 **Theme**。你可以让所有终端外观使用同一个主题，也可以为浅色和深色终端分别选择主题。

该选择保存为 `theme` [设置](settings.md#terminal-and-display)：

```json
{
  "theme": "dark"
}
```

没有 `theme` 设置时，Pi 使用 `system`。

自动模式先存浅色主题，再存深色主题：

```json
{
  "theme": "light/dark"
}
```

Pi 根据终端报告的背景色和前景色判断终端是浅色还是深色。如果终端没有报告背景，Pi 使用终端的浅色/深色通知，然后是 `COLORFGBG` 环境变量，再然后是深色。同样的判断会选择浅色/深色对中的主题，以及 `system` 的外观。自动模式生效时，Pi 在终端报告外观变化时切换主题。主题名不能包含 `/`，因为 Pi 把它保留给这种设置格式。

用 `--use-theme` 为单次调用选择初始主题，而不改动已保存的设置：

```bash
pi --use-theme light
pi --use-theme light/dark
```

该命令行选项见 [CLI 资源](cli.md#resources)。

## 创建自定义主题

复制一个[内置主题](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/src/modes/interactive/theme)，或按照[ schema](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/schemas/theme.schema.json) 新建一个 JSON 文件。内置主题使用 OKHSL 颜色，并用变量表示多个角色共用的颜色，所以你可以直接调整色相、饱和度或明度。

1. 把文件保存为 `<agent-dir>/themes/my-theme.json`。agent 目录默认为 `~/.pi/agent`。
2. 把它的 `name` 设为 `my-theme`。
3. 修改 `vars` 和 `colors` 中的值。
4. 通过 `/settings` 选择 `my-theme`。

请让文件名与主题名一致。Pi 只对 `<agent-dir>/themes/<name>.json` 中的当前用户主题做热重载。从任何其他来源添加或修改主题后，请运行 `/reload`。

## 了解主题文件

| 属性                                                                                                                                                              | 必填 | 作用                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------- |
| `$schema`                                                                                                                                                         | 否   | 按 Pi 发布的 schema 启用编辑器校验和补全。                              |
| `name`                                                                                                                                                            | 是   | 在选择器和设置中标识该主题。必须唯一，不能包含 `/`，也不能是 `system`。 |
| `appearance`                                                                                                                                                      | 否   | `"dark"` 或 `"light"`：该主题设计面向的背景。省略时 Pi 从主题颜色检测。 |
| `vars`                                                                                                                                                            | 否   | 定义可复用的颜色值。变量可以引用其他变量。                              |
| `colors`                                                                                                                                                          | 是   | 把颜色分配给终端 UI 的角色。schema 标明了必需和可选的色名。             |
| `export`                                                                                                                                                          | 否   | 覆盖 HTML 导出中的页面和面板背景。                                      |
| 主题对象是严格的：只接受已文档化的顶层字段和颜色 Token。可复用的自定义颜色定义在 `vars` 下；`colors` 或 `export` 下的自定义 key，以及额外的顶层元数据都会被拒绝。 |

颜色可以写成六种形式：

| 形式         | 示例                    | 含义                                                                                                                   |
| ------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| RGB 十六进制 | `"#0af"` 或 `"#00aaff"` | 三位或六位 sRGB 颜色。                                                                                                 |
| OKLCH        | `"oklch(62% 0.1 200)"`  | 感知明度、色度和色相。                                                                                                 |
| OKHSL        | `"okhsl(250 60% 55%)"`  | 色相、饱和度和明度。饱和度相对于该色相和明度下 sRGB 色域允许的最大值，所以每个值都在色域内，相同饱和度看起来一样鲜艳。 |
| 256 色索引   | `39`                    | 从 `0` 到 `255` 的 ANSI 调色板索引。                                                                                   |
| 变量引用     | `"primary"`             | `vars` 中某个条目的值。                                                                                                |
| 终端默认     | `""`                    | 终端的默认前景色或背景色。                                                                                             |

终端默认颜色渲染为终端自己的颜色。Pi 需要具体值时（例如 HTML 导出或扩展的颜色计算），使用终端报告的默认颜色，或根据主题外观猜测黑色或白色。

Pi 会解析链式变量引用。缺失的变量或循环引用会让主题无效。Pi 在可用时使用 truecolor，把 OKLCH 色域映射到 sRGB，并为 256 色终端做近似。HTML 导出把 OKHSL 值转为十六进制，因为 CSS 不支持它们。如果颜色与源值不同，请检查终端的 truecolor 检测和对比度设置。见[配置终端](terminal-setup.md#override-detected-capabilities)。

确切的属性、必需的色名和可接受的取值类型见[主题 JSON schema](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/schemas/theme.schema.json)。

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
