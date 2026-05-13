# Shell Aliases（Shell 别名）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/shell-aliases) 的中文翻译。仅供学习参考。

Pi 以非交互模式（`bash -c`）运行 bash，默认不会展开别名。

要使 shell 别名生效，在 `~/.pi/agent/settings.json` 中添加：

```json
{
  "shellCommandPrefix": "shopt -s expand_aliases\neval \"$(grep '^alias ' ~/.zshrc)\""
}
```

根据你的 shell 配置文件调整路径（如 `~/.zshrc`、`~/.bashrc` 等）。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
