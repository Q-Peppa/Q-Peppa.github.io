# 在 Android 上用 Termux 运行 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/termux) 的中文翻译。仅供学习参考。

Pi 通过 [Termux](https://termux.dev/) 在 Android 上运行，Termux 是一个终端模拟器和 Linux 环境。文本输入、文件工具和 Shell 命令都受支持。配合 Termux:API，Pi 可以复制和粘贴 Android 剪贴板文本。不支持粘贴剪贴板图片。

## 开始之前

从 [GitHub 或 F-Droid](https://github.com/termux/termux-app#installation) 安装 Termux。不要使用已弃用的 Google Play 版本。

[Termux:API](https://github.com/termux/termux-api#installation) 是可选的。只有当你希望 Pi 复制或粘贴 Android 剪贴板文本，或 Shell 命令需要使用 Android 设备 API 时，才安装它。

## 安装 Pi

1. 更新 Termux 包：

   ```bash
   pkg update && pkg upgrade
   ```

2. 安装 Node.js 和 Git：

   ```bash
   pkg install nodejs git
   ```

3. 安装 Pi：

   ```bash
   npm install -g --ignore-scripts @earendil-works/pi-coding-agent
   ```

4. 验证安装：

   ```bash
   pi --version
   ```

5. 打开你想工作的文件夹并启动 Pi：

   ```bash
   cd /path/to/working-folder
   pi
   ```

接下来按照主[快速开始](quickstart.md#3-choose-a-model)连接模型并运行第一个任务。

## 访问 Android 共享存储

在你授予权限之前，Termux 无法访问 Android 共享存储。运行一次：

```bash
termux-setup-storage
```

批准之后，Android 共享存储可通过 `/storage/emulated/0` 访问，也可以通过 Termux 在 `~/storage/` 下创建的链接访问。

只有当 Pi 应当能访问这些文件时才授予该权限。在 Termux 中运行的命令和工具使用与 Termux 进程相同的存储权限。

## 使用剪贴板命令

Pi 用 `termux-clipboard-set` 复制文本，用 `termux-clipboard-get` 实现它的剪贴板粘贴快捷键。Shell 命令可以直接使用这两个命令。请安装 Termux:API 应用及其命令行包：

```bash
pkg install termux-api
```

验证集成：

```bash
printf 'Pi clipboard test' | termux-clipboard-set
termux-clipboard-get
```

第二条命令应输出 `Pi clipboard test`。

Termux 剪贴板 API 只支持文本。Pi 的剪贴板粘贴快捷键会把该文本插入编辑器，但无法附加剪贴板图片。

## 添加 Termux 专用指令

Pi 能检测到自己运行在 Termux 中，但无法推断你希望它如何与 Android 交互。只把你工作中相关的环境细节加入 `~/.pi/agent/AGENTS.md`：

```markdown
# Termux 环境

- Pi 运行在 Android 的 Termux 中。
- Android 共享存储在 `/storage/emulated/0` 下。
- 用 `termux-open-url "https://example.com"` 打开 URL。
- 用 `termux-open <path>` 打开文件。
- 除非任务需要，不要访问共享存储。
```

在活动会话中修改该文件后运行 `/reload`。

## 排查问题

### 剪贴板集成失败

确认两个组件都已安装：

1. 与 Termux 来源相同的 Termux:API Android 应用
2. `termux-api` 命令行包

然后在 Pi 之外运行上面的剪贴板验证命令。如果在那里也失败，请先修好 Termux:API 安装，再重试 Pi 的复制命令。

### 共享存储报权限被拒绝

运行 `termux-setup-storage`，批准 Android 权限请求，然后在 `~/storage/` 或 `/storage/emulated/0` 下重试该路径。

### 安装后找不到 Pi

打开新的 Termux Shell 并运行：

```bash
npm prefix -g
command -v pi
```

确认全局 npm 二进制目录在 `PATH` 上，如果包缺失则重新安装 Pi。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
