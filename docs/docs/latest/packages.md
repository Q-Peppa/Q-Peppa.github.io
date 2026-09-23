# Pi 包

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/packages) 的中文翻译。仅供学习参考。

Pi 包把扩展、Skill、Prompt 模板和主题作为一个单元安装和分发。当某项自定义需要通过 npm 或 git 共享，或有多个资源属于同一组时，使用包。

包就是普通的目录或 npm 包。它可以暴露约定俗成的资源目录，在 `package.json` 的 `pi` 键下声明显式路径，并携带自己的运行时依赖。

## 安装和管理包

从 npm、git 或本地路径安装：

```bash
pi install npm:@example/pi-tools@1.0.0
pi install git:github.com/example/pi-tools@v1
pi install ./local-package
```

`pi list` 显示已配置的包。用 `pi remove <source>` 移除一个包，用 `pi update --extensions` 同步包安装。所有包命令和选项见[命令行](cli.md#package-commands)。

个人安装会写入 `~/.pi/agent/settings.json`。加上 `--local` 或 `-l` 会把包声明写入 `.pi/settings.json`。Pi 只在项目信任被授予后才读取该文件中的声明。

项目包只在项目信任确定之后才安装和加载。包可以执行扩展代码，也可以包含指示模型运行程序的 Skill。安装第三方包之前请先审阅其源码。授予项目信任之前请先审阅项目包声明。

用 `--extension` 或 `-e` 可以为单次调用试用一个包，而不把它加入设置：

```bash
pi -e npm:@example/pi-tools
```

## 选择来源

| 来源 | 示例                                  | 行为                       |
| ---- | ------------------------------------- | -------------------------- |
| npm  | `npm:@example/pi-tools@1.0.0`         | 安装在 Pi 的 npm 目录下    |
| git  | `git:github.com/example/pi-tools@v1`  | 克隆并同步到选定的 ref     |
| URL  | `https://github.com/example/pi-tools` | 视为 git 来源              |
| 本地 | `./pi-tools`                          | 从解析出的路径加载，不复制 |

带版本号的 npm 规格会被固定。Git tag 和 commit 同样固定；包更新会同步检出内容，但不会移动已配置的 ref。

相对本地路径从包含它的设置文件解析。文件路径加载一个扩展。目录遵循常规的包发现规则。

## 创建包

最简单的包使用约定俗成的目录：

```text
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

没有 `pi` 清单时，Pi 从这些目录中发现 TypeScript 和 JavaScript 扩展、Skill 目录、Markdown Prompt 和 JSON 主题。

当资源位于其他位置或需要过滤时，使用显式清单：

```json
{
  "name": "my-pi-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension.ts"],
    "skills": ["./resources/skills"],
    "prompts": ["./resources/prompts/*.md"],
    "themes": ["./resources/themes/*.json"]
  }
}
```

路径相对于包根目录。数组接受 glob 模式和排除项。当通过 glob 遍历无法发现时，请直接列出以点开头或符号链接的资源根。

`pi-package` 关键字让 npm 包可以被 [Pi 包画廊](https://pi.dev/packages)发现。可选的 `pi.image` 和 `pi.video` 字段可以添加画廊预览。

## 声明依赖

把扩展导入的运行时包放在 `dependencies` 中。Pi 在安装 npm 或 git 来源时安装包的依赖。

Pi 向扩展和 Skill 提供这些包：

- `@earendil-works/pi-ai`
- `@earendil-works/pi-agent-core`
- `@earendil-works/pi-coding-agent`
- `@earendil-works/pi-tui`
- `typebox`

请在 `peerDependencies` 中以 `"*"` 范围声明导入的 Pi 包，不要把它们打包进去。作为依赖使用的其他 Pi 包必须包含在发布的 tarball 中，并通过它们的 `node_modules` 资源路径引用。

已安装的包以独立的模块根加载。不要依赖两个包共享同一个依赖实例，也不要依赖一个包解析另一个包未声明的依赖。

## 选择包资源

设置中的对象形式可以收窄从某个包加载哪些资源：

```json
{
  "packages": [
    {
      "source": "npm:@example/pi-tools",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"]
    }
  ]
}
```

对每种资源类型：

- 省略该属性会加载包允许的全部资源。
- 用 `[]` 不加载该类型的任何资源。
- 用 `!pattern` 排除 glob 匹配项。
- 用 `+path` 包含一个精确的允许路径。
- 用 `-path` 排除一个精确路径。

过滤器只收窄包清单。它们不会暴露包本身未声明的资源。

运行 `pi config` 启用或停用已发现的资源。它从个人配置开始；按 Tab 切换作用域，或运行 `pi config --local` 从项目覆盖开始。

## 了解作用域和身份

同一个包可以同时出现在个人和项目设置中。项目条目通常替换个人条目。使用 `autoload: false` 时，项目条目改为对个人包起过滤增量作用。

Pi 用包名标识 npm 包，用不含 ref 的仓库 URL 标识 git 包，用解析出的绝对路径标识本地包。这防止同一个包通过等价声明被加载两次。

打包之前，请用[扩展](extensions.md)、[Skill](skills.md)、[Prompt 模板](prompt-templates.md)和[主题](themes.md)分别设计每个资源。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
