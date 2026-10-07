# SC Agent Tree MCP App

这是项目内、零依赖的 Node stdio MCP server。它不是常驻服务：宿主在需要时启动 `server.js`，SC 状态更新通过 `show_sc_task_view` 传入当前 snapshot；Codex `thread` entrypoint 则以空参数调用同一工具。工具以 `_meta.ui.resourceUri` 绑定静态 `text/html;profile=mcp-app` resource，并以 `openai/ui` 的 `thread` entrypoint 声明 Codex 任务内入口。工具返回 `structuredContent.snapshot`，UI 通过 MCP Apps 的 `ui/notifications/tool-result` bridge 渲染该快照。

这是 SC 任务视图的唯一渲染路径。项目不生成或打开本地 `visualizations` HTML，也不提供文本或其他替代视图。若 MCP tool 不可用或调用失败，SC 工作单元将进入 `blocked`，直到插件和 MCP Apps 能力恢复。

## 本地验证

```powershell
node .\skills\survey-corps\mcp-app\test-server.js
node .\skills\survey-corps\mcp-app\test-cr-contract.js
node .\skills\survey-corps\mcp-app\test-app-bridge-contract.js
node .\skills\survey-corps\mcp-app\test-thread-entrypoint-contract.js
node .\skills\survey-corps\mcp-app\test-plugin-structure.js
node .\skills\survey-corps\mcp-app\test-motion-contract.js
node .\skills\survey-corps\mcp-app\test-ui-contract.js
node .\skills\survey-corps\mcp-app\test-ui-behavior.js
```

## 注册（需用户自行授权）

本仓库不会改写 Codex 配置，也不会代为安装。安装前请确认 Codex Desktop 支持本地 marketplace plugin 与 MCP Apps；随后由用户自行从仓库根目录的 `.agents/plugins/marketplace.json` 的 `source: { "source": "local", "path": "./skills/survey-corps/mcp-app" }` 选择 `survey-corps-task-view`。该 path 相对 marketplace root（仓库根）解析。安装配置使用 `node`、plugin cwd 和相对 `server.js`，不依赖本机绝对路径。不要使用 `codex mcp add` 注册同名 server；若用户配置中已有同名旧项，应先由用户自行移除或改名，避免冲突。

marketplace 将该插件标为 `AVAILABLE`、`ON_INSTALL` 和 `Productivity`；这些字段控制客户端的发现与安装流程，不构成运行时隔离保证。

注册的具体配置键由客户端版本决定；状态更新时调用 `show_sc_task_view`，参数为 `{ "snapshot": <当前 SC 快照> }`。`snapshot.view_id` 必填，对同一工作单元固定为 `sc-task-view:<work_unit_id>`；它是逻辑标识，不是路径或资源 URI，也不在 UI 中展示。入口空参调用 `{}` 会恢复当前 server 会话最近一次收到的快照；在首次收到快照前才返回 `sc-task-view:empty` 空视图。MCP App 资源 URI 为 `ui://survey-corps/task-view`。标准 `ui.resourceUri` 负责关联 HTML resource；Codex 专用的 `openai/ui.thread` entrypoint 负责让宿主把该 App 暴露为当前任务的侧栏入口。该入口仅声明可供用户在任务内容 tab 手动打开，不保证更新工具调用后自动展开右侧面板。

## 安全与边界

- 输入仅接受 JSON object，限制为 256 KiB；所有快照值由原模板以 `textContent` 输出。
- server 本身不联网、不写入磁盘，快照仅在当前 server 进程内缓存最近一份，无轮询或后台服务；marketplace 元数据不是运行时隔离保证。
- 工具展示不改变 SC 权威状态、交接或完成门禁。
- 已在当前验证环境完成 MCP App 注册与工具调用验收；`show_sc_task_view` 状态更新调用成功并返回 `structuredContent.snapshot`。不同 Codex Desktop 版本仍需单独确认宿主面板的视觉渲染。
