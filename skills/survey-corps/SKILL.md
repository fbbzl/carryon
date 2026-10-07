---
name: survey-corps
description: "Coordinate a multi-role engineering task with the smallest necessary role chain, evidence-based handoffs, and explicit escalation for high-risk changes. The shorthand `sc` starts this workflow."
metadata:
  version: 3.0.7
  type: agent-skill
  scope: software-engineering
  tags: [survey-corps, req, dev, cr, qa, workflow]
  author: carryon
---

# 调查兵团

调查兵团用于跨角色工程协作：用最少的角色完成任务，并让结论能追溯到当前范围、版本、环境和证据。它协调 `req`、`dev`、`cr`、`qa`，不替代专业判断；代码同步、发布预检、生产发布及运行观察由用户或授权方负责。

## 启动别名

用户明确说“启动 `sc`”“运行 `sc`”或等价表达时，无论任务看起来需要几个角色，都启动调查兵团，并继续遵守本技能的最小角色链、subagent-only 和交接约束。`sc` 只是调查兵团的简称，不代表普通会话、独立任务或另一套工作流。

显式启动 `sc` 后，编排者必须立即为**当前 Codex 任务**调用 `show_sc_task_view(snapshot)`。该工具由 `survey-corps-task-view` MCP Apps server 提供，将 `structuredContent.snapshot` 传给 `ui://survey-corps/task-view` MCP App，并由 Codex 在内嵌 iframe 中渲染 HTML/CSS/JavaScript。`req`、`dev`、`cr`、`qa` 不是独立总视图入口，而是该总视图内可展开的成员子视图。

- 任务视图只有一条渲染路径：`show_sc_task_view(snapshot) -> ui://survey-corps/task-view -> Codex 内嵌 iframe`。禁止创建、复制、打开或展示本地 HTML 可视化产物，禁止文本、Markdown、Mermaid 或其他替代任务视图。
- 视图主流程固定为 `SC -> REQ -> DEV -> CR -> QA`，`QA` 是唯一任务出口，不在 QA 后渲染 SC 回流门禁。每个角色是可折叠任务卡，仅展示状态、摘要、必要证据、风险和下一步；状态机参考集、独立元数据面板、console 和 session log 不进入视图。
- 渐进展示只自动展开一个当前活动角色，其余角色保持折叠；用户手动展开任一角色时也必须关闭其他角色，任何时刻最多显示一个详情区。活动角色优先取 `role_details.<role>.status` 命中活动白名单的流程中最后一个角色；没有命中时，仅对能唯一定位角色的 `snapshot.state` 使用固定映射：`dev_in_progress -> DEV`、`ready_for_cr -> CR`、`ready_for_qa -> QA`。其他状态均不猜测活动角色，因此不自动展开任何卡。
- `show_sc_task_view` 工具缺失、MCP App 资源无法加载或工具调用失败时，立即将当前工作单元标记为 `blocked`，停止启动角色或继续交接。阻断报告必须说明实际错误，恢复条件为安装并启用 `survey-corps-task-view` 插件、启用 MCP Apps，必要时重启 Codex 并在新会话中确认该 tool 可用后重试。不得以任何降级视图绕过阻断。
- 每次角色启动、交接、状态变化、风险或证据变化时，必须再次调用同一 `show_sc_task_view` tool 更新快照。视图仅随这些明确的编排动作刷新，不声明自动事件订阅、后台轮询或平台原生实时同步。
- MCP App 展示不是权威记录，也不能改变状态机、角色交接、完成门禁或 subagent-only 约束。权威记录仍是当前任务中的工作单元、交接和角色结论。

### 任务视图数据契约

MCP App 资源 `mcp-app/assets/sc-task-view.html` 的渲染函数接收根元素、快照和可选调试选项：`window.renderSurveyCorpsTaskView(root, snapshot, options)`。正式调用不传第三参数。只有 `options.debug === true` 才显示并启用“播放动画”；`snapshot.debug` 和字符串 `"true"` 均不能开启调试。自动动画保持启用。可省略字段使用明确缺省提示，不得由视图猜测完成、通过或风险关闭。

```yaml
work_unit:
  work_unit_id:
  project_name:          # 可选；当前 Codex 会话所属项目名称，UI 不展示，不得猜测
  target:
  task_type:             # 可选；当前任务类型文本
  roles: []
  role_selection_reason: # 可选；编排者选择参与角色的原因
  scope: []              # 可选；文本或列表，与验收、环境一起折叠展示
  summary:               # 可选；只读任务总结文本，缺省“暂无总结”
  reference_version:
  environment:
  verified_scope: []
  unverified_scope: []
  acceptance: []
  risks: []
  evidence: []
  next_action:
view_id:                 # 必填；稳定逻辑 ID，格式为 sc-task-view:<work_unit_id>，UI 不展示
state:                   # 必填；编排者计算的唯一当前状态，不由 handoffs 数组推断
resume_state:            # state=needs_revalidation 时必填，表示从何处恢复复验
role_details:            # 可选，以 req/dev/cr/qa 为键
  req:
    status:              # 可选；角色自身快照，交接记录不能替代它
    agent_name:          # 可选；该角色真实 Codex subagent 的名字，缺失时不显示；不得用角色名或猜测值代替
    summary:
    evidence: []
    risks: []
    next_action:
    subskills: []        # 可选；所属角色实际调用的子技能记录，格式见下文
handoffs: []             # 权威交接记录；视图仅用于状态或 handoff 更新动画 fingerprint，不逐条展示
```

编排者每次构建快照时，按当前任务填写 `task_type`、实际参与的 `roles` 和 `role_selection_reason`；`project_name` 只取当前 Codex 会话实际所属项目名称，无法确认时省略；已启动角色的 `agent_name` 取自真实协作工具返回的名字，未启动或未取得名字时省略，不能编造。顶部只展示任务标题和状态，不展示项目名或视图 ID。参与角色只展示 `work_unit.roles` 中规范化、去重后的 req/dev/cr/qa，未提供有效角色时显示“尚未选择”，不根据状态猜测参与链。`scope`、`acceptance`、`environment` 有值时才展示可折叠的任务上下文；它不属于角色卡的互斥展开组。主流程仍止于 QA 卡，QA 下方的无边框任务总结只读展示 `work_unit.summary`，不是额外角色或完成门禁。

任务视图将当前 `snapshot.state` 和角色 `status` 映射为中文标签，不显示英文状态值；未知值显示“未知状态”，缺失角色状态显示“状态未提供”，权威快照值不变。不展示状态机、状态参考集、复验入口或 `resume_state`。`resume_state` 仍是 `state=needs_revalidation` 时的必填权威工作流字段，只是不进入该极简 UI。全部外部展示值须经 DOM `textContent` 输出；模板不得联网、引入第三方依赖、保存远端数据、执行状态变更或嵌入示例定时轮播。

`role_details.<role>.subskills` 是可选数组，每项包含 `name`、`status` 及可选字符串 `goal`、`summary`、`question`、`result`，`options` 和 `evidence` 只接收字符串数组。只记录该角色实际调用的子技能：REQ 支持 `align-with-visuals`、`grill-with-docs`；DEV 支持 `tech-select`；CR 支持 `review-with-goal`；QA 支持 `test-with-goal`。非法名称、角色不匹配、错误类型和空白内容不展示；只有名称或状态、没有任务内容的项也不展示。候选选项仅随有效问题展示。

子技能区嵌在所属角色的详情内；每项默认折叠，只有提供有效内容时才出现，不生成完整技能目录或流程节点。子技能折叠不参与角色互斥组，也不自动展开其他角色。状态使用中文标签，另支持 `needs_user_confirm`（等待用户确认）和 `needs_revision`（需要修订）。问题与选项只读，用户通过当前会话答复；视图不回传选择、不启动技能、不执行审批或改变权威状态。

`view_id` 不是文件名、路径或资源 URI。编排者对同一工作单元始终使用 `sc-task-view:<work_unit_id>`；MCP server 仅校验它是非空字符串，UI 不展示、不解析，也不用于定位本地产物。

## 何时启动

- 用户未明确启动 `sc` 时，任务需要两个及以上角色、明确交接、公共契约评估或风险升级才启动。
- 用户未明确启动 `sc` 且任务只需单个角色时，直接使用对应 Skill，不启动调查兵团。
- 先读取用户任务和必要的仓库上下文，再选择最小角色链。只有目标、权限、环境或风险会改变决策时才询问用户。

## Subagent-only 执行约束

调查兵团一旦被调用，所选择的每个角色都必须作为独立的真实 subagent 执行。调查兵团可以由当前代理负责编排、收集交接和汇总结果，但不得由当前会话直接代办角色工作，也不得用普通新会话、独立任务或文字模拟角色来替代 subagent。

- 角色启动必须使用当前执行环境提供的真实 subagent/协作代理机制，不绑定 Codex、客户端或具体工具名称；只要目标环境具备等价的 subagent 能力即可启动。普通新会话、独立任务或其他创建会话的机制不算角色 subagent，除非平台明确将其标记为当前任务的 subagent。
- 角色之间按本技能的交接协议传递工作单元和证据；子技能在所属角色的 subagent 内执行，不另行创建普通新会话。
- subagent 能力不可用、启动失败、角色无法独立接收任务或交接证据无法回收时，立即将调查兵团标记为 `blocked`，说明阻断原因和恢复条件。
- 禁止降级为当前代理内联执行、顺序模拟角色、仅输出角色口吻，或为了继续推进而自动创建普通新会话。

## 最小编排

只读取和启动已选择角色的本体 Skill。调查兵团的任何场景只要其范围包含代码改动，该场景的完整链路就必须包含 `cr` 和 `qa`，并在最终代码基线上完成审查与测试；无代码改动的场景不因此强制增加这两个角色。下表给出各个场景的工作流链路，完成前统一执行下文的完成门禁。每个活跃角色仍按自身本体 Skill 的条件选择专属从属 Skill。

| 情形 | 场景链路 | 需要时使用的从属 Skill |
| --- | --- | --- |
| 需求或影响不明 | `req`；需求收敛后按当前场景选择后续链路 | 有文档且存在高风险歧义：`grill-with-docs`；视觉化能消除歧义：`align-with-visuals` |
| 已确认的功能或行为变更 | `dev -> cr -> qa` | 无 |
| 受控重构 | `dev -> cr -> qa` | `refactor-with-goal`、`test-with-goal` |
| 未登记异常 | `qa -> dev -> cr -> qa` | `bugfix`、`test-with-goal` |
| 已登记缺陷 | `dev -> cr -> qa` | `bugfix`、`test-with-goal` |
| 性能、容量、成本或资源效率优化 | `cr（建项） -> dev -> cr（复审） -> qa` | `optimize` |

需求或影响不明时先由 `req` 收敛，再选择主场景。代码变更同时符合多行时，按缺陷修复、量化优化、受控重构、功能变更选择主链路；混合目标拆分工作单元并保留各自门禁。未登记异常先由 `qa` 复现登记，已登记缺陷从 `dev` 开始。优化先由 `cr` 建项，实施后复审。

高风险包括公共 API、权限、数据库或迁移、金额/事务和不可逆操作，是所有主场景的叠加门槛：需求或验收未确认时前置 `req`，实施前确认方案协议，不因风险等级替换缺陷、优化等主链路。代码同步、发布预检、生产发布及运行观察不属于调查兵团流程，由用户或授权方负责；这些操作改变代码基线时，调查兵团须按新基线重新完成 `cr -> qa`。

## 共同约束

每个活跃角色先定义并更新最小工作单元：

```yaml
work_unit:
  work_unit_id:
  target:              # 要交付的结果
  roles: []            # 本轮实际角色
  reference_version:   # 需求、代码、配置或依赖的当前基线
  environment:
  verified_scope: []
  unverified_scope: []
  acceptance: []
  risks: []
  evidence: []         # 路径/行号、命令和结果、测试或事件 ID；不猜测 URL
  next_action:
```

- 结论按“观察 → 解释 → 边界 → 行动”表达；不能将局部、旧版本或其他环境的证据扩大为系统结论。
- 需求、代码、配置、依赖、数据或环境变化时，只要影响旧结论，就让受影响的下游结论重新验证；不复用失效证据。
- 工作单元只记录会影响执行或结论的字段；时间敏感证据补充观察时间与有效期，高风险任务按下一节补充门禁。不为模板完整度创建额外文档或空字段。

新模块、公共 API、数据库、权限、事务、缓存/MQ 或不兼容变化实施前，建立最小方案协议：`protocol_id`、版本、范围、契约/数据/安全影响、恢复路径、裁决者和 `draft | needs_user_confirm | confirmed | invalidated` 状态；未到 `confirmed` 不实施高风险变更。

## 图示对齐

当组件、流程、依赖、状态或影响范围的关系会影响当前决策时，可用图示辅助对齐：静态关系图优先 Mermaid，无法渲染时输出等价的 ASCII 字符图；只有需要交互探索或用户明确要求时才使用 HTML。图示中的事实、假设和开放问题必须显式区分，不替代契约、测试、审批或交接记录。

## 高风险门槛

高风险任务必须对以下受影响项给出当前基线和可核验证据；未触及的项只写一行影响判断，不伪造“通过”。

| 项目 | 最低证据 |
| --- | --- |
| 功能与契约 | 已确认验收，以及 API/业务行为影响 |
| 质量与测试 | `dev` 的构建/静态检查/实现单元测试，以及 `qa` 的独立主路径、边界和受影响回归 |
| 安全与数据 | 权限/输入输出边界、数据不变量、迁移或补偿 |

`P0` 是已发生或迫近的生产中断、重大安全事件或数据损坏；`P1` 是已发生或迫近的关键契约、权限或核心流程失效。确认 P0/P1 后冻结受影响动作并记录 `event_id`、影响、责任人、证据和恢复条件；修复后从最早失效环节重新验证。

## 交接与状态

场景链路由上表确定；只运行当前场景选择的角色。每次交接使用：

开发场景状态为 `confirmed -> planned -> dev_in_progress -> ready_for_cr -> ready_for_qa -> qa_passed -> workflow_ready`；优化先由 `planned -> ready_for_cr` 建项，再进入 `dev_in_progress`，实施后复用 `ready_for_cr` 复审。QA 通过后由编排者核验门禁并将状态记为 `workflow_ready`。高风险事项尚待裁决时前置 `needs_user_confirm`；CR 阻断走 `cr_blocked -> ready_for_cr`，`qa_failed` 或 `qa_conditional` 按下文返修闭环处理，不能进入工作流完成。全局 `blocked` 的合法来源包括已确认的 P0/P1、未授权执行、任务视图 MCP 前置不可用，以及 subagent 能力不可用或交接证据无法回收。

需求、实现、配置、依赖、迁移、契约、权限、安全、数据、测试证据或环境变化时进入 `needs_revalidation`，按最早失效环节计算 `resume_state`；仅同一基线下补材料使用 `needs_revision`，不改变工作流状态。

```yaml
handoff:
  work_unit_id:
  from:
  to:
  state:
  handoff_result: pending | accepted | needs_revision | rejected
  reference_version:
  verified_scope: []
  unverified_scope: []
  evidence: []
  decision:
  risks: []
  next_action:
```

- 角色切换时由独立 subagent 记录交接；同一角色连续执行子技能可复用工作单元，不新增角色交接。接收方填写 `handoff_result`；`needs_revision` 表示同一基线下材料不全，`rejected` 表示职责、授权或结论不可接受，并在 `decision` 中说明原因；基线失效进入 `needs_revalidation`，确认 P0/P1 进入 `blocked`。
- 问题按所属资产派发：业务实现、配置、契约及实现单元测试归 `dev`；独立测试资产及其配置、fixture、测试预言机归 `qa`，测试环境或测试数据问题由 `qa` 处理或协调。未解决的一般阻断项保持其来源状态（如 `cr_blocked` 或 `qa_failed`）；已确认 P0/P1、未授权执行、任务视图 MCP 前置不可用或 subagent 前置不可用时进入全局 `blocked`。
- 角色边界：`req` 负责需求和验收标准；`dev` 负责实现、实现耦合的单元测试及恢复输入；`cr` 负责静态审查发现和复审；`qa` 负责独立正式测试、Bug 生命周期和验收结论；用户或授权方负责代码同步、发布与运行操作。

## 完成门禁与返修闭环

编排者负责核验完成门禁。只有以下条件全部满足，才能宣布“工作流完成”“任务完成”或同义结论：

- 本场景范围包含代码改动时，`cr` 和 `qa` 均须由独立真实 subagent 执行并回收结论；CR 明确通过，QA 的 `conclusion=pass` 且交接状态为 `qa_passed`。未运行、未返回、条件通过、证据不足或用户接受风险均不能替代通过。无代码改动时，按该场景链路完成所有选定角色及其适用门禁。
- 本场景范围包含代码改动时，`cr` 与 `qa` 的结论必须绑定同一最终 `work_unit_id`、`reference_version`、范围及适用环境，证据仍有效；最后一次相关修改后的受影响审查和测试已重新执行。
- 当前范围内未关闭的 CR 阻断项、高风险项、QA 阻断 Bug 及其他角色阻断项均为零，验收退出标准全部满足。
- 已选角色的工作与交接已完成；用户尚未同步代码或发布不影响调查兵团代码工作流完成。同步、发布或运行观察不属于本工作流的完成门禁。

CR 未通过时，按所属资产交给 `dev` 或 `qa` 处理，随后回到 `ready_for_cr` 复审，通过后进入 QA。QA 未通过时按同一归属处理；代码（含测试代码）、配置或契约改变后走 `ready_for_cr -> ready_for_qa`，复测原失败及受影响回归；仅恢复测试环境或数据且 CR 证据仍有效时可直接回到 `ready_for_qa`。同一有效基线上 QA 通过后由编排者核验完成门禁并记为 `workflow_ready`。用户同步产生新代码基线时重新经过 `cr -> qa`，其他证据失效按最早失效环节恢复，禁止沿用失效的通过结论。

在已有授权和任务范围内持续推进上述闭环，不把“角色已执行一轮”“报告已生成”或“已列出待修问题”当作完成。无法继续时（例如缺少权限、环境、依赖或关键决策，或连续两轮修复后同一阻断仍无实质进展），停止重复尝试，保留实际阻断或待处理状态，报告阻断证据、已尝试动作和恢复条件；只能声明“工作流未完成”，不得宣布成功。用户暂停或取消也不算通过。

本场景范围包含代码改动时，最终完成报告必须列出最终基线、CR 通过证据、QA 通过证据以及未关闭阻断项数量（必须为 0）；无代码改动时列出实际选定角色的完成证据和未关闭阻断项数量。非阻断建议可保留并说明范围，不扩大为无风险保证。

## 外部操作边界

用户或授权方负责代码同步、发布预检、生产发布及部署后运行观察。调查兵团不执行这些操作，也不把它们列为工作流完成门禁；若操作改变已审查或测试的代码基线，须从最早失效环节重新验证。
