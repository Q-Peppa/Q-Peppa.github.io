# Windows 设置

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/windows) 的中文翻译。仅供学习参考。

Pi 在 Windows 上默认使用 Git Bash。系统按以下顺序检查：

1. `~/.pi/agent/settings.json` 中定义的自定义路径
2. Git Bash（`C:\Program Files\Git\bin\bash.exe`）
3. PATH 中的任何 `bash.exe`（支持 Cygwin、MSYS2 或 WSL）

对于大多数用户，[Git for Windows](https://git-scm.com/download/win) 就足够了。

## PowerShell 工具

可选的 `powershell` 工具在可用时通过 `pwsh.exe` 运行命令，否则使用 Windows PowerShell。它以 `-NoProfile -NonInteractive -ExecutionPolicy Bypass` 启动 PowerShell。管理员强制执行的执行策略仍可优先生效。

使用 `defaultTools` 替换面向模型的 `bash` 工具：

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

或者在比较行为的同时启用两者：

```json
{
  "defaultTools": ["read", "bash", "powershell", "edit", "write"]
}
```

`!` 和 `!!` 编辑器命令仍使用 Bash。

## 自定义 Bash 路径

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
