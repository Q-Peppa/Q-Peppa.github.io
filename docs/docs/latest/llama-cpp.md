# 使用 llama.cpp 运行本地模型

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/llama-cpp) 的中文翻译。仅供学习参考。

Pi 支持 [llama.cpp](https://github.com/ggml-org/llama.cpp) router 服务器。Router 会发现多个 GGUF 模型，并按需加载或卸载它们。

请使用支持 router 的较新 llama.cpp 构建。按照[构建说明](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)操作，或安装适合你平台的[预构建版本](https://github.com/ggml-org/llama.cpp/releases)。

## 启动 router

启动 `llama-server` 时不要传 `--model` 或 `-m`。传入模型会启动单模型模式而不是 router 模式。

```bash
llama-server \
  --models-dir ~/models \
  --no-models-autoload \
  --jinja \
  --host 127.0.0.1 \
  --port 8080 \
  -ngl 999 \
  -c 32768
```

重要选项：

- `--models-dir ~/models` 发现本地 GGUF 文件。
- `--no-models-autoload` 让加载只通过 `/llama` 显式进行。
- `--jinja` 启用兼容的聊天模板和 tool calling。
- `-ngl 999` 尽可能多地把层卸载到 GPU。
- `-c 32768` 设置每个已加载模型的上下文窗口。省略它会使用模型的原生上下文，这可能显著增加内存需求。

单文件模型可以直接放在模型目录中。多模态和分片模型放在单独的子目录里：

```text
~/models/
├── llama-3.2-1b-Q4_K_M.gguf
├── gemma-3-4b-it-Q4_K_M/
│   ├── gemma-3-4b-it-Q4_K_M.gguf
│   └── mmproj-F16.gguf
└── large-model-Q4_K_M/
    ├── large-model-Q4_K_M-00001-of-00003.gguf
    ├── large-model-Q4_K_M-00002-of-00003.gguf
    └── large-model-Q4_K_M-00003-of-00003.gguf
```

手动添加文件后重启 router。按模型设置上下文大小和其他选项，请使用 [llama.cpp 模型预设](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#model-presets)。

## 配置 Pi

启动 Pi 并配置 Provider：

```text
/login llama.cpp
```

输入 router URL 和可选的 API Key。默认 URL 是 `http://127.0.0.1:8080`。

如果你用 `--no-models-autoload` 启动 router，`/login llama.cpp` 只保存连接。运行 `/llama` 加载模型，然后用 `/model` 为当前会话选择已加载的模型。

不用 `/login` 也可以用环境变量配置相同的值：

```bash
export LLAMA_BASE_URL=http://127.0.0.1:8080
export LLAMA_API_KEY=optional-secret
pi
```

如果服务器使用 API Key，请用匹配的 `--api-key` 值启动 `llama-server`。只在本机访问时保留 `--host 127.0.0.1`。

## 管理模型

运行：

```text
/llama
```

- 选择一个未加载的模型来加载它。
- 选择一个已加载的模型来卸载它。
- 选择 **Download model…**，搜索 Hugging Face，然后选择仓库和量化方式。也可以直接输入 `owner/repository[:quant]`。
- 加载或下载期间按 Escape 确认取消。

Hugging Face 搜索会依次使用 `HF_TOKEN`（如果已设置）、`$HF_TOKEN_PATH`、`$HF_HOME/token`、`$XDG_CACHE_HOME/huggingface/token` 和 `~/.cache/huggingface/token`。搜索在未认证时也可用，但速率限制更低。下载受限仓库之前 Pi 会警告并给出其访问页面链接。下载由 llama.cpp 服务器执行，所以所选仓库需要访问权限时，它的进程也必须带有 `HF_TOKEN`。

如果还有其他模型已加载，Pi 会询问是先卸载它们还是保持加载。Pi 不会静默卸载模型，也从不删除模型文件。Router 可能与其他客户端共用，所以 `/llama` 总是显示 router 的当前状态。

已加载和休眠的模型都会出现在 `/model` 中。休眠模型在被选中时自动唤醒。启用 router 自动加载时，未加载的预设模型也会出现，并在选中时加载。使用 `--no-models-autoload` 时，先通过 `/llama` 加载模型再选择它。

如果 router 断开连接，`/llama` 会显示 **Retry** 和 **Close**。Retry 会重新连接并刷新模型状态，而不重放被中断的操作。

## 排查问题

检查 router 是否可达：

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/models
```

- **`/llama` 中没有模型：** 检查 `--models-dir`、目录布局，并重启 router。
- **使用 `--no-models-autoload` 时 `/model` 中缺少模型：** 先用 `/llama` 加载它。
- **加载失败或占用内存过多：** 降低 `-c`，或卸载另一个模型。
- **服务器不在 router 模式：** 启动时不要传 `--model`、`-m` 或 `-hf`。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
