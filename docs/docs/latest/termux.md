# Termux on Android 设置

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/termux) 的中文翻译。仅供学习参考。

Pi 通过 [Termux](https://termux.dev/) 在 Android 上运行，Termux 是 Android 的终端模拟器和 Linux 环境。

## 前置条件

1. 从 GitHub 或 F-Droid 安装 [Termux](https://github.com/termux/termux-app#installation)（**不要**从 Google Play 安装，该版本已废弃）
2. 从 GitHub 或 F-Droid 安装 [Termux:API](https://github.com/termux/termux-api#installation) 以启用剪贴板和其他设备集成

## 安装

```bash
# 更新包
pkg update && pkg upgrade

# 安装依赖
pkg install nodejs termux-api git

# 安装 Pi
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 创建配置目录
mkdir -p ~/.pi/agent

# 运行 Pi
pi
```

## 剪贴板支持

在 Termux 中运行时，剪贴板操作使用 `termux-clipboard-set` 和 `termux-clipboard-get`。必须安装 Termux:API 应用才能使用。

图像剪贴板（Ctrl+V 粘贴图像）在 Termux 上不支持。

## 示例 AGENTS.md 用于 Termux

创建 `~/.pi/agent/AGENTS.md` 帮助 Agent 了解 Termux 环境：

````markdown
# Agent Environment: Termux on Android

## Location

- **OS**: Android（Termux 终端模拟器）
- **Home**: `/data/data/com.termux/files/home`
- **Prefix**: `/data/data/com.termux/files/usr`
- **Shared storage**: `/storage/emulated/0`（Downloads、Documents 等）

## Opening URLs

```bash
termux-open-url "https://example.com"
```

## Opening Files

```bash
termux-open file.pdf              # 使用默认应用打开
termux-open --chooser image.jpg   # 选择应用
```

## Clipboard

```bash
termux-clipboard-set "text"   # 复制
termux-clipboard-get          # 粘贴
```

## Notifications

```bash
termux-notification -t "Title" -c "Content"
```

## Device Info

```bash
termux-battery-status         # 电池信息
termux-wifi-connectioninfo    # WiFi 信息
termux-telephony-deviceinfo   # 设备信息
```

## Sharing

```bash
termux-share -a send file.txt # 分享文件
```

## Other Useful Commands

```bash
termux-toast "message"        # 快速 Toast 弹窗
termux-vibrate                # 震动设备
termux-tts-speak "hello"      # 文字转语音
termux-camera-photo out.jpg   # 拍照
```

## Notes

- 需要安装 Termux:API 应用才能使用 `termux-*` 命令
- 使用 `pkg install termux-api` 安装命令行工具
- 访问 `/storage/emulated/0` 需要存储权限
````

## 限制

- **无图像剪贴板**：Termux 剪贴板 API 仅支持文本
- **无原生二进制文件**：某些可选原生依赖（如剪贴板模块）在 Android ARM64 上不可用，安装时会跳过
- **存储访问**：访问 `/storage/emulated/0`（Downloads 等）需要运行 `termux-setup-storage` 一次以授予权限

## 故障排除

### 剪贴板不工作

确保同时安装了以下应用：

1. Termux（从 GitHub 或 F-Droid）
2. Termux:API（从 GitHub 或 F-Droid）

然后安装 CLI 工具：

```bash
pkg install termux-api
```

### 共享存储权限被拒绝

运行一次以授予存储权限：

```bash
termux-setup-storage
```

### Node.js 安装问题

如果 npm 失败，尝试清除缓存：

```bash
npm cache clean --force
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
