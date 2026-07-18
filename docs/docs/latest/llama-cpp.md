# llama.cpp

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/llama-cpp) 的中文翻译。仅供学习参考。

Pi 支持 [llama.cpp](https://github.com/ggml-org/llama.cpp) 路由服务器。该路由器可以发现多个 GGUF 模型，并按需加载或卸载。

请使用支持路由功能的最新 llama.cpp 构建版本。按照[构建说明](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)操作，或安装适合你平台的[预构建版本](https://github.com/ggml-org/llama.cpp/releases)。

## 启动路由器

启动 `llama-server` 时**不要**传 `--model` 或 `-m`。传入模型会启动单模型模式而非路由模式。

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
- `--no-models-autoload` 保持通过 `/llama` 显式加载。
- `--jinja` 启用兼容的聊天模板和 tool call。
- `-ngl 999` 将尽可能多的层卸载到 GPU。
- `-c 32768` 设置每个已加载模型的上下文窗口。省略此项则使用模型的原生上下文，可能需要更多内存。

单文件模型可以直接放在模型目录中。多模态和多分片模型放在单独的子目录中：

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

手动添加文件后重启路由器。关于按模型设置上下文大小和其他选项，请参见 [llama.cpp 模型预设](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#model-presets)。

## 配置 Pi

启动 Pi 并配置 Provider：

```text
/login llama.cpp
```

输入路由器 URL 和可选的 API Key。默认 URL 为 `http://127.0.0.1:8080`。

环境变量可以在不经过 `/login` 的情况下配置相同的值：

```bash
export LLAMA_BASE_URL=http://127.0.0.1:8080
export LLAMA_API_KEY=optional-secret
pi
```

如果服务器使用了 API Key，请使用匹配的 `--api-key` 值启动 `llama-server`。保持 `--host 127.0.0.1` 以仅限本地访问。

## 管理模型

运行：

```text
/llama
```

- 选择未加载的模型以加载它。
- 选择已加载的模型以卸载它。
- 选择 **Download model…**，搜索 Hugging Face，然后选择仓库和量化版本。也支持精确的 `owner/repository[:quant]` 值。
- 在加载或下载过程中按 Escape 确认取消。

Hugging Face 搜索在设置 `HF_TOKEN` 时使用它，然后依次检查 `$HF_TOKEN_PATH`、`$HF_HOME/token`、`$XDG_CACHE_HOME/huggingface/token` 和 `~/.cache/huggingface/token`。搜索也可以在没有认证的情况下工作，但速率限制较低。Pi 在下载受限仓库之前会发出警告并链接到其访问页面。下载由 llama.cpp 服务器执行，因此当所选仓库需要访问权限时，其进程也必须具有 `HF_TOKEN`。

如果其他模型已加载，Pi 会询问是先卸载它们还是保持加载。Pi 不会静默卸载模型，也永远不会删除模型文件。路由器可能与其他客户端共享，因此 `/llama` 始终显示路由器的当前状态。

只有已加载的模型才会出现在 `/model` 中。加载模型后，运行 `/model` 为当前 Pi 会话选择它。

如果路由器断开连接，`/llama` 会显示 **Retry** 和 **Close**。Retry 重新连接并刷新模型状态，不会重放被中断的操作。

## 故障排除

检查路由器是否可达：

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/models
```

- **`/llama` 中没有模型：** 检查 `--models-dir`、目录布局，并重启路由器。
- **`/model` 中缺少模型：** 先用 `/llama` 加载它。
- **加载失败或内存占用过高：** 降低 `-c` 或卸载其他模型。
- **服务器不在路由模式：** 启动时不要传 `--model`、`-m` 或 `-hf`。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
