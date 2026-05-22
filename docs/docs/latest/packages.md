# Pi Packages（Pi 包）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/packages) 的中文翻译。仅供学习参考。

> Pi 可以帮你创建 Pi 包。告诉它你想打包扩展、Skills、Prompt 模板或主题即可。

Pi Packages 将扩展、Skills、Prompt 模板和主题打包，通过 npm 或 git 分享。包可以在 `package.json` 的 `pi` 字段中声明资源，或使用约定目录。

## 目录

- [安装和管理](#安装和管理)
- [Package 源](#package-源)
- [创建 Pi Package](#创建-pi-package)
- [包结构](#包结构)
- [Dependencies](#dependencies)
- [包过滤](#包过滤)
- [启用和禁用资源](#启用和禁用资源)
- [作用域和去重](#作用域和去重)

## 安装和管理

> **安全警告：** Pi 包以完全系统权限运行。扩展执行任意代码，Skills 可以指示模型执行任何操作（包括运行可执行文件）。安装第三方包前请审查源代码。

```bash
pi install npm:@foo/bar@1.0.0
pi install git:github.com/user/repo@v1
pi install https://github.com/user/repo          # 原始 URL 也可以
pi install /absolute/path/to/package
pi install ./relative/path/to/package

pi remove npm:@foo/bar
pi list                                           # 从设置中显示已安装的包
pi update                    # 更新 Pi 和所有未固定的包
pi update --extensions       # 仅更新所有未固定的包
pi update --self             # 仅更新 Pi
pi update --self --force     # 即使已是最新也重新安装 Pi
pi update npm:@foo/bar       # 更新一个包
pi update --extension npm:@foo/bar
```

这些命令管理 Pi 包，而非 Pi CLI 安装本身。要卸载 Pi 本身，请参阅 [Quickstart](quickstart.md#卸载)。

默认情况下 `install` 和 `remove` 写入全局设置（`~/.pi/agent/settings.json`）。使用 `-l` 写入项目设置（`.pi/settings.json`）。项目设置可分享给团队，Pi 启动时会自动安装任何缺失的包。

要试用一个包而不安装，使用 `--extension` 或 `-e`。这会安装到临时目录，仅对当前运行有效：

```bash
pi -e npm:@foo/bar
pi -e git:github.com/user/repo
```

## Package 源

Pi 在设置和 `pi install` 中接受三种源类型。

### npm

```
npm:@scope/pkg@1.2.3
npm:pkg
```

- 版本化规格会被固定，跳过包更新（`pi update`、`pi update --extensions`）。
- 全局安装位于 `~/.pi/agent/npm/` 下。
- 项目安装位于 `.pi/npm/` 下。
- 在 `settings.json` 中设置 `npmCommand`，可将 npm 包的查找和安装操作固定到特定的包装命令，如 `mise` 或 `asdf`。

示例：

```json
{
  "npmCommand": ["mise", "exec", "node@20", "--", "npm"]
}
```

### git

```
git:github.com/user/repo@v1
git:git@github.com:user/repo@v1
https://github.com/user/repo@v1
ssh://git@github.com/user/repo@v1
```

- 未带 `git:` 前缀时，仅接受协议 URL（`https://`、`http://`、`ssh://`、`git://`）。
- 带有 `git:` 前缀时，接受简写格式，包括 `github.com/user/repo` 和 `git@github.com:user/repo`。
- 支持 HTTPS 和 SSH URL。
- SSH URL 自动使用你配置的 SSH 密钥（遵循 `~/.ssh/config`）。
- 对于非交互式运行（如 CI），可设置 `GIT_TERMINAL_PROMPT=0` 禁用凭据提示，并设置 `GIT_SSH_COMMAND`（例如 `ssh -o BatchMode=yes -o ConnectTimeout=5`）以快速失败。
- Ref 会被固定为 tag 或 commit，跳过包更新（`pi update`、`pi update --extensions`）。使用 `pi install git:host/user/repo@new-ref` 将已有包移动到新的固定 ref。
- 克隆到 `~/.pi/agent/git/<host>/<path>`（全局）或 `.pi/git/<host>/<path>`（项目）。
- 克隆、拉取或固定 ref 变更后若存在 `package.json` 则运行 `npm install`。

**SSH 示例：**
```bash
# git@host:path 简写（需要 git: 前缀）
pi install git:git@github.com:user/repo

# ssh:// 协议格式
pi install ssh://git@github.com/user/repo

# 带版本 ref
pi install git:git@github.com:user/repo@v1.0.0
```

### 本地路径

```
/absolute/path/to/package
./relative/path/to/package
```

本地路径指向磁盘上的文件或目录，添加到设置中时不复制。相对路径相对于其所在设置文件解析。若路径为文件，作为单个扩展加载；若为目录，Pi 使用包规则加载资源。

## 创建 Pi Package

在 `package.json` 中添加 `pi` 清单，或使用约定目录。包含 `pi-package` 关键字以增加可发现性。

```json
{
  "name": "my-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

路径相对于包根目录。数组支持 glob 模式和 `!exclusions` 排除。

### Gallery 元数据

[包画廊](https://pi.dev/packages)展示标记了 `pi-package` 的包。添加 `video` 或 `image` 字段以显示预览：

```json
{
  "name": "my-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "video": "https://example.com/demo.mp4",
    "image": "https://example.com/screenshot.png"
  }
}
```

- **video**：仅 MP4。在桌面端悬停时自动播放。点击打开全屏播放器。
- **image**：PNG、JPEG、GIF 或 WebP。作为静态预览显示。

如果两者都设置，video 优先。

## 包结构

### 约定目录

如果没有 `pi` 清单，Pi 从以下约定目录自动发现资源：

- `extensions/` —— 加载 `.ts` 和 `.js` 文件
- `skills/` —— 递归查找 `SKILL.md` 文件夹，并加载顶级 `.md` 文件作为 Skills
- `prompts/` —— 加载 `.md` 文件
- `themes/` —— 加载 `.json` 文件

## Dependencies

第三方运行时依赖放在 `package.json` 的 `dependencies` 中。不注册扩展、Skills、Prompt 模板或主题的依赖也放在 `dependencies` 中。当 Pi 从 npm 或 git 安装包时，会运行 `npm install`，因此这些依赖会自动安装。

Pi 为扩展和 Skills 打包了核心包。如果你导入以下任何包，请在 `peerDependencies` 中列出它们并使用 `"*"` 范围，**不要将其打包进你的包**：`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-coding-agent`、`@earendil-works/pi-tui`、`typebox`。

**其他 Pi 包必须打包进你的 tarball。** 将它们添加到 `dependencies` 和 `bundledDependencies`，然后通过 `node_modules/` 路径引用其资源。Pi 以独立的模块根加载包，因此不同的安装不会冲突或共享模块。

示例：

```json
{
  "dependencies": {
    "shitty-extensions": "^1.0.1"
  },
  "bundledDependencies": ["shitty-extensions"],
  "pi": {
    "extensions": [
      "extensions",
      "node_modules/shitty-extensions/extensions"
    ],
    "skills": [
      "skills",
      "node_modules/shitty-extensions/skills"
    ]
  }
}
```

## 包过滤

在设置中使用对象形式过滤包加载的内容：

```json
{
  "packages": [
    "npm:simple-pkg",
    {
      "source": "npm:my-package",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"],
      "themes": ["+themes/legacy.json"]
    }
  ]
}
```

`+path` 和 `-path` 是相对于包根目录的精确路径。

- 省略某个键则加载该类型的所有资源。
- 使用 `[]` 则完全不加载该类型。
- `!pattern` 排除匹配项。
- `+path` 强制包含某个精确路径。
- `-path` 强制排除某个精确路径。
- 过滤器在清单之上叠加，缩小已允许的范围。

## 启用和禁用资源

使用 `pi config` 启用或禁用已安装包和本地目录中的扩展、Skills、Prompt 模板和主题。支持全局（`~/.pi/agent`）和项目（`.pi/`）两种作用域。

## 作用域和去重

包可以同时出现在全局和项目设置中。如果同一个包同时出现在两者中，项目条目优先。

身份判定规则：
- npm：包名
- git：不含 ref 的仓库 URL
- 本地：解析后的绝对路径

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
