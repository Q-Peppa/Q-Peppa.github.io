# 项目信任与认证体系

Pi 的安全边界有两部分：加载项目资源前的**项目信任**，以及发送 LLM 请求时由 `ModelRuntime` 协调的认证。本文以 **Pi v0.85.1** 源码为基准。

## 为什么需要项目信任？

Pi 会加载项目本地的多种资源：

- `.pi/` 下的设置、扩展、skills、prompts、themes
- `AGENTS.md` / `CLAUDE.md` / `.agents/skills` 等代理指令
- 项目本地安装的扩展包

这些资源可以执行代码。如果用户在一个不信任的仓库里运行 `pi`，恶意项目可能在不被察觉的情况下跑起来。

所以 Pi 的规则是：先决策，再加载项目本地扩展。

## 信任流程

```
启动或切换 cwd
  │
  ├─ 没有需要信任的资源？直接视为可继续
  ├─ CLI --approve / --no-approve？听覆盖值
  ├─ 先加载 user/global/CLI 扩展
  │     └─ 发 project_trust 事件
  ├─ 再看 ~/.pi/agent/trust.json
  ├─ 再看 settings.json 的 defaultProjectTrust
  └─ 仍未决定且有 UI → 弹出选择器
```

源码入口是 `packages/coding-agent/src/core/project-trust.ts` 的 `resolveProjectTrusted()`。它被嵌在 Runtime 工厂的 `ResourceLoader.reload({ resolveProjectTrust })` 里，而不是 `main()` 里单独先跑完再创建服务。

## ProjectTrustStore

**文件**：`packages/coding-agent/src/core/trust-manager.ts`

没有名为 `TrustManager` 的类。持久化对象叫 `ProjectTrustStore`：

```typescript
export class ProjectTrustStore {
  get(cwd: string): boolean | null; // true / false / 未记录
  getEntry(cwd: string): { path: string; decision: boolean } | null;
  set(cwd: string, decision: boolean | null): void;
  setMany(decisions: ProjectTrustUpdate[]): void;
}
```

`get()` 会沿着父目录向上找最近的明确记录。这就是“信任父文件夹”能够覆盖子目录的原因。

交互模式下的选项来自 `getProjectTrustOptions()`：

| 选项                             | 持久化                                   |
| -------------------------------- | ---------------------------------------- |
| Trust                            | 写入当前 cwd = true                      |
| Trust parent folder (...)        | 写入父目录 = true，并清掉当前 cwd 的记录 |
| Trust (this session only)        | 不写文件                                 |
| Do not trust                     | 写入当前 cwd = false                     |
| Do not trust (this session only) | 不写文件                                 |

需要信任的项目文件包括 `settings.json`、`extensions`、`skills`、`prompts`、`themes`、`SYSTEM.md`、`APPEND_SYSTEM.md`。

## 扩展如何参与

**文件**：`packages/coding-agent/src/core/extensions/types.ts`

只有 **user / global / CLI 扩展** 能听到 `project_trust`。项目本地扩展此时还没加载。同一个扩展里可以注册多个 handler，**第一个返回 `yes` 或 `no` 的生效**；`undecided` 会继续问下一个。

```typescript
pi.on('project_trust', async (event, ctx) => {
  // event.cwd
  return { trusted: 'yes', remember: true };
});
```

返回值是：

```typescript
type ProjectTrustEventDecision = 'yes' | 'no' | 'undecided';

interface ProjectTrustEventResult {
  trusted: ProjectTrustEventDecision;
  remember?: boolean;
}
```

`undecided` 表示扩展不拍板，交给后面的 store / 默认值 / UI。

## defaultProjectTrust

全局 `settings.json`：

```json
{
  "defaultProjectTrust": "ask"
}
```

| 值       | 行为                 |
| -------- | -------------------- |
| `ask`    | 未决策就询问（默认） |
| `always` | 默认信任             |
| `never`  | 默认不信任           |

没有 UI 的模式（print / json / rpc）如果走到“需要询问”这一步，会当作不信任，避免在脚本里悄悄加载项目扩展。

## 认证：从 `/login` 到一次请求

认证同样分两层：

1. **coding-agent**：`AuthStorage` + `ModelRuntime`
2. **pi-ai**：`CredentialStore` + Provider 的 `apiKey` / `oauth` 策略

### AuthStorage

**文件**：`packages/coding-agent/src/core/auth-storage.ts`

它实现了 pi-ai 的 `CredentialStore`，默认文件是 `~/.pi/agent/auth.json`。

```typescript
export class AuthStorage implements CredentialStore {
  static create(authPath?: string): AuthStorage;
  static inMemory(data?: Record<string, Credential>): AuthStorage;

  read(provider: string): Promise<Credential | undefined>;
  modify(
    provider: string,
    fn: (current?: Credential) => Promise<Credential | undefined>,
  ): Promise<Credential | undefined>;
  delete(provider: string): Promise<void>;
  list(): Promise<readonly CredentialInfo[]>;
}
```

`modify` 返回写入后的 credential。OAuth 刷新依赖这个带锁的写路径。

`auth.json` 大致长这样：

```json
{
  "anthropic": { "apiKey": "sk-ant-..." },
  "github-copilot": {
    "oauth": { "token": "ghu_...", "expiresAt": "2026-09-18T10:00:00Z" }
  }
}
```

### 一次请求怎样找到凭证

可以把它记成四步：

1. 选定模型和 Provider
2. 合并内置 Provider、`models.json`、扩展 Provider
3. 按运行时覆盖（`--api-key`）→ `auth.json` → Provider 配置 → 环境变量 解析
4. 交给 Provider 的 `stream` / `streamSimple`

`--api-key` 只存在于当前进程，不写回 `auth.json`。Provider 级别的 `env` 覆盖也只作用于该 Provider 的请求，不会改 `process.env`。

没有凭证时，`auth-guidance.ts` 会告诉用户该设哪个环境变量，或该跑 `/login <provider>`。

### 登录

`/login anthropic` 最终走到 `ModelRuntime.login()`。API key 登录用 `AuthInteraction.prompt({ type: "secret" })`；OAuth 登录用 `auth_url` / `device_code` 这类 `notify` 事件，TUI 的 login dialog 负责展示。

## 安全要点

1. **项目本地扩展在信任前不加载。**
2. **OAuth token 放在 `auth.json`，刷新在 CredentialStore 锁内完成。**
3. **Provider env 不污染全局进程环境。**
4. **runtime API key 不持久化。**
5. **无 TTY 时不会弹出信任 UI 后默认放行。**

## 下一步

- [上下文压缩与会话分支](compaction-and-branches.md)
- [Models 运行时与 Provider](models-runtime.md)
