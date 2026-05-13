# Pi Packages（Pi 包）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/packages) 的中文翻译。仅供学习参考。

Pi Packages 将扩展、Skills、Prompt 模板和主题打包，通过 npm 或 git 分享。

## 安全警告

**Pi 包以完全系统权限运行。扩展执行任意代码，Skills 可以指示模型执行任何操作。安装第三方包前请审查源代码。**

## 安装和管理

```bash
pi install npm:@foo/bar@1.0.0
pi install git:github.com/user/repo@v1
pi install https://github.com/user/repo
pi install /absolute/path/to/package
pi install ./relative/path/to/package
pi remove npm:@foo/bar
pi list
```

更新命令：

```bash
pi update                    # 更新 Pi 和所有包
pi update --extensions       # 仅更新包
pi update --self             # 仅更新 Pi
pi update npm:@foo/bar       # 更新特定包
```

默认情况下 `install` 和 `remove` 写入全局设置。使用 `-l` 写入项目设置（`.pi/settings.json`）。

## Package 源

### npm

```
npm:@scope/pkg@1.2.3
npm:pkg
```

版本化规格会被固定，跳过包更新。

### git

```
git:github.com/user/repo@v1
git:git@github.com:user/repo@v1
https://github.com/user/repo@v1
```

支持 HTTPS 和 SSH URL。Ref 会固定包，跳过更新。克隆到 `~/.pi/agent/git/<host>/<path>`（全局）或 `.pi/git/<host>/<path>`（项目）。

### 本地路径

```
/absolute/path/to/package
./relative/path/to/package
```

## 创建 Pi Package

在 `package.json` 中添加 `pi` 清单：

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

## 包结构约定

如果没有 `pi` 清单，Pi 从约定目录自动发现：

- `extensions/` —— `.ts` 和 `.js` 文件
- `skills/` —— 递归查找 `SKILL.md` 文件夹
- `prompts/` —— `.md` 文件
- `themes/` —— `.json` 文件

## 包过滤

在设置中使用对象形式过滤包加载内容：

```json
{
  "packages": [
    {
      "source": "npm:my-package",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"]
    }
  ]
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
