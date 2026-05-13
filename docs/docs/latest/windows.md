# Windows 设置

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/windows) 的中文翻译。仅供学习参考。

Pi 在 Windows 上需要一个 bash shell。系统按以下顺序检查：

1. `~/.pi/agent/settings.json` 中定义的自定义路径
2. Git Bash（`C:\Program Files\Git\bin\bash.exe`）
3. PATH 中的任何 `bash.exe`（支持 Cygwin、MSYS2 或 WSL）

对于大多数用户，**Git for Windows** 就足够了。

## 自定义 Shell 路径

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
