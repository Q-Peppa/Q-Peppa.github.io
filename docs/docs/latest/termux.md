# Termux on Android 设置

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/termux) 的中文翻译。仅供学习参考。

Pi 通过 [Termux](https://termux.dev/) 在 Android 上运行，Termux 是 Android 的终端模拟器和 Linux 环境。

## 前置条件

1. 从 GitHub 或 F-Droid 安装 Termux（**不要**从 Google Play 安装，该版本已废弃）
2. 从 GitHub 或 F-Droid 安装 Termux:API 以启用剪贴板和其他设备集成

## 安装

```bash
# 更新包
pkg update && pkg upgrade

# 安装依赖
pkg install nodejs termux-api git

# 安装 Pi
npm install -g @earendil-works/pi-coding-agent

# 创建配置目录
mkdir -p ~/.pi/agent

# 运行 Pi
pi
```

## 剪贴板支持

剪贴板操作依赖 `termux-clipboard-set` 和 `termux-clipboard-get`。必须安装 Termux:API 才能使用。图像剪贴板（Ctrl+V 粘贴图像）在 Termux 上不支持。

## 示例 AGENTS.md

创建 `~/.pi/agent/AGENTS.md` 告知 Agent Termux 环境：

```markdown
- OS: Android (Termux terminal emulator)
- Home: /data/data/com.termux/files/home
- Prefix: /data/data/com.termux/files/usr
- Shared storage: /storage/emulated/0
```

### 常用 Termux 命令

打开 URL：
```bash
termux-open-url "https://example.com"
```

打开文件：
```bash
termux-open file.pdf
termux-open --chooser image.jpg
```

剪贴板：
```bash
termux-clipboard-set "text"
termux-clipboard-get
```

通知：
```bash
termux-notification -t "Title" -c "Content"
```

设备信息：
```bash
termux-battery-status
termux-wifi-connectioninfo
termux-telephony-deviceinfo
```

分享文件：
```bash
termux-share -a send file.txt
```

其他命令：`termux-toast`（Toast 弹窗）、`termux-vibrate`（震动）、`termux-tts-speak`（文字转语音）、`termux-camera-photo`（拍照）。

## 限制

- **无图像剪贴板**：Termux 剪贴板 API 仅支持文本
- **无原生二进制文件**：某些可选原生依赖（如剪贴板模块）在 Android ARM64 上不可用
- **存储访问**：访问 `/storage/emulated/0` 需要运行 `termux-setup-storage` 一次

## 故障排除

### 剪贴板不工作

确保同时安装了 Termux 和 Termux:API（均从 GitHub 或 F-Droid），然后安装 CLI 工具：

```bash
pkg install termux-api
```

### 共享存储权限被拒绝

运行一次：
```bash
termux-setup-storage
```

### Node.js 安装问题

```bash
npm cache clean --force
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
