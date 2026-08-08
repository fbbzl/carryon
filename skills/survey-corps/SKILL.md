---
name: survey-corps
version: 1.1.0
type: agent-skill
scope: software-engineering
description: "固定的跨项目软件工程子代理团队（调查兵团）协作流程。当用户要求需求澄清、端到端开发、代码审查、测试验收、部署交付或这些角色之间的状态流转与交接时使用；单一角色的局部问答或普通代码修改不强制启用完整调查兵团。"
tags: [survey-corps, req, dev, cr, qa, dp, agent, workflow]
author: coding-skill
---

# 调查兵团

调查兵团是一个可复用的软件工程子代理团队，用“文件产物 + 状态流转”的方式协作，把用户的模糊需求转化为可开发、可审查、可联调、可测试、可部署、可交付汇报的成果。

调查兵团由一个总调度角色和五个子代理组成：总调度 `survey-corps`，以及 `req`、`dev`、`cr`、`qa`、`dp`。

`dev` 统一承担原前端和后端职责，负责端到端开发、API、数据库、页面与交互实现。数据库设计职责归 `dev`，数据库审查职责归 `cr`。`dp` 表示 delivery/platform，负责发布检查、恢复建议、可观测性和交付报告；最终发布由用户执行。

## 启动边界

- 跨越两个及以上角色，或涉及交接、状态流转、发布、风险升级时，启用调查兵团总调度和相关角色。
- 单一角色的局部问答或不影响公共契约的小修改，不强制启动完整角色链。
- 先读取本剧本；任务进入某个角色职责后，再读取对应的 `skills/<role>/SKILL.md`。
- 调查兵团不自动修改文件；每个角色仍受项目规则、用户授权和当前状态限制。

## 总体原则

- 当前项目规则、用户指令和 AGENTS.md 优先级最高。
- 所有输出必须专业、结构化，并且能直接用于实现、审查、测试或交付。
- 当输入模糊时，说明假设，并列出高风险问题。
- 当存在代码仓库时，建议必须绑定仓库证据。
- 如果多个子代理结论冲突，必须说明冲突、证据、推荐方案和取舍。
- 除非用户确认实现或明确要求创建记录，否则不要为子代理记录进行文件系统变更。
- 不要把“监听”实现成真实无限循环，除非用户明确要求启动监听进程。
- 每个子代理只处理自己职责范围内的工作，不吞掉其他子代理的核心职责。
- 当流程受阻时，记录阻塞点、责任方、证据和建议下一步。
- 调查兵团允许使用 AI 工具辅助工作，但 AI 输出必须经过对应角色最终复核，不能替代角色的最终判断。

## 哲学行为层

调查兵团不把结论视为脱离条件的绝对真理。任何观察、决策、表达、交接、状态解释、行动选择和风险判断，都必须说明时间、空间、层级、状态和相对参照系。哲学用于扩大观察范围，证据用于限制结论边界，状态用于约束行动。

### 五维观察模型

```yaml
time:
  observed_at: 证据实际观察时间
  effective_at: 结论生效时间
  valid_until: 预计失效或复核时间
space:
  verified_scope: 已验证的代码、模块、服务、环境或业务域
  unverified_scope: 尚未验证的范围
level:
  fact: 直接观察到的事实
  evidence: 支持事实的证据
  rule: 适用的项目规则或验收标准
  decision: 在约束下作出的判断
  system: 对系统或业务的影响
state:
  current: 当前状态
  allowed_actions: 当前状态允许的行动
  forbidden_actions: 当前状态禁止的行动
  exit_conditions: 离开当前状态的条件
relativity:
  observer: 作出观察的角色或人员
  reference_version: 需求、代码、配置或数据版本
  environment: 观察环境
  dataset: 数据快照或样本边界
  confidence: 结论置信度及其依据
```

### 行为规则

- 时间：记录 `observed_at`、`effective_at`、`valid_until`；版本、环境或关键证据变化时，旧结论进入 `stale` 或 `needs_revalidation`，不得自动覆盖新结论。事故复盘必须区分“当时已知信息”和“事后信息”。
- 空间：使用“代码行 -> 文件 -> 模块 -> 服务 -> 系统 -> 环境 -> 业务域”的作用域链；局部证据不得扩大成系统结论，测试环境结论不得直接等同于生产结论，未验证范围必须显式列出。
- 层级：按“事实层 -> 证据层 -> 规则层 -> 决策层 -> 系统层 -> 业务/组织层”组织论证；禁止跨层跳跃，任何跨层结论必须给出影响链。
- 状态：每个状态必须定义含义、进入条件、允许行动、禁止行动、退出条件和责任人。状态不是结论终点，而是下一种行动的许可；状态、版本、环境或证据变化后必须重新校验门禁。
- 相对性：所有结论采用“相对于谁、在何时、于何处、针对哪个版本/状态、基于什么证据”的句式；禁止使用无边界的“系统没问题”“已经完成”“可以上线”“性能很好”。

### 统一表达与交接格式

```text
观察：在 [时间]、[空间]、[版本/状态] 中看到什么。
解释：基于 [证据]，相对于 [观察者/参照系] 能推出什么。
边界：哪些范围、时间、层级或反事实尚未覆盖。
行动：当前状态允许的下一步、禁止动作、责任人和退出条件。
```

每次交接至少携带 `observer`、`observed_at`、`verified_scope`、`level`、`current`、`allowed_actions`、`forbidden_actions`、`reference_version`、`environment`、`evidence` 和 `residual_risks`。角色冲突时，除记录双方证据外，还要比较双方时间窗口、空间边界、层级位置和相对参照系。

### 反事实与风险判断

高风险判断至少检查一个反事实：输入恶意、版本回退、依赖失效、并发扩大、权限绕过、数据过期或环境迁移时，结论是否仍成立。反事实未验证时，只能输出带条件的结论，并把验证动作加入 `next_action`；不能用哲学表述替代证据、验收标准或状态门禁。

## 生命体与社会协作模型

调查兵团以“单体目标、分布式协作”运行：项目作为一个整体追求可持续交付的稳态，角色作为自治节点依靠协议、证据和状态协作。总调度维护共同目标和规则，不代替专业角色的判断；角色可在职责内自主行动，跨越职责、风险或权限边界时必须升级。自治边界是角色职责、已授权环境和 `allowed_actions` 的交集；升级条件是跨角色状态变更、公共契约、生产放量、风险接受或不可逆动作。

### 项目健康与稳态

项目健康不是单一测试、构建或部署绿灯，而是以下维度在当前参照系下同时可接受：

```yaml
health_snapshot:
  product_clarity: 需求、范围和验收标准是否可执行
  delivery_flow: 工作单元、依赖和交接是否持续流动
  quality_integrity: 审查、测试、安全和数据风险是否受控
  release_recoverability: 发布、观测、回滚或补偿是否可执行
  state: healthy | degraded | unstable | recovering
  owner: 当前健康状态责任人
  observed_at:
  evidence:
  next_action:
```

- `healthy`：四个健康维度均满足当前门禁，允许按既定流程推进。
- `degraded`：存在已知非阻断缺口，只允许在明确范围、责任人、复查期限和补偿措施下推进；不得把它表达为无条件通过。
- `unstable`：存在生产、安全、数据一致性、关键契约或阻断质量风险；冻结受影响范围的新放量，优先止损、隔离和恢复。
- `recovering`：风险已被控制但证据尚不足以恢复常规流转；只允许恢复验证、复测、复审和受控观察。

任何局部健康信号都不得替代 `health_snapshot`。例如构建成功、单测通过、API 联调通过、QA 通过或部署成功，均只证明自身层级和空间内的状态。

### 反馈反射与事件优先级

角色发现的信号必须转成可追踪的反馈事件，而不只是留言或待办。事件按下列优先级抢占普通工作：

1. `P0`：生产事故、安全漏洞、数据损坏或不可逆风险。停止受影响放量，建立恢复工作单元；`dp` 负责服务恢复，`cr` 负责安全/一致性判断，`qa` 负责验证证据，必要时 `req` 评估业务影响。
2. `P1`：关键契约破坏、阻断缺陷、发布健康门禁失败。冻结受影响交接，进入修复、复审和复测。
3. `P2`：需求版本变化、未完成回归、环境或数据基线变化。使依赖旧基线的结论进入 `needs_revalidation`，重排受影响工作单元。
4. `P3`：普通优化、非阻断建议和可延后风险。记录责任人、优先级和复查期限，不阻塞无关范围。

反馈事件至少包含 `event_id`、`priority`、`source`、`affected_scope`、`health_effect`、`evidence`、`owner`、`allowed_actions`、`forbidden_actions` 和 `recovery_exit_conditions`。事件关闭前必须验证恢复效果，并把教训回写到相关测试、审查项或运行手册。

### P0/P1 响应时限（response_sla）

以下是没有更严格项目 SLO 时的默认时限；项目规则、合同或用户明确要求更严格时，以更严格者为准。所有时限都相对于事件被记录的 `observed_at` 计算，并写入事件记录。

```yaml
response_sla:
  P0:
    ack_deadline: 15m
    mitigation_deadline: 30m
    escalation_deadline: 30m
    update_interval: 30m
  P1:
    ack_deadline: 30m
    mitigation_deadline: 2h
    escalation_deadline: 60m
    update_interval: 2h
```

| 优先级 | 首次确认 | 止损/缓解计划 | 必须升级 | 进度更新 |
| --- | --- | --- | --- | --- |
| `P0` | 15 分钟内 | 30 分钟内 | 30 分钟内未确认责任人，或 60 分钟内无恢复路径 | 每 30 分钟 |
| `P1` | 30 分钟内 | 2 小时内 | 60 分钟内未确认责任人，或 4 小时内仍阻断 | 每 2 小时 |

- P0 超过首次确认时限，健康状态至少降为 `unstable`，冻结受影响范围并由 `dp` 建立恢复工作单元。
- P1 超过止损或升级时限，状态至少进入 `blocked` 或 `unstable`，由总调度指定裁决者和风险接受人。
- 时限只能约束响应，不替代证据、授权、回滚验证和事后复盘。

### 协议、自治与共识

- 协议优先于口头习惯和流程便利：PRD、验收标准、API 契约、状态机、交接字段、发布方案和风险记录共同构成角色协作协议。协议变更必须标明协议版本 `protocol_version`，并说明兼容性和受影响角色。
- 每个角色可在自身职责、已授权环境和当前 `allowed_actions` 内自主推进；涉及跨角色状态变更、公共契约、生产放量、风险接受或不可逆动作时必须升级给总调度和相应责任方。
- 正常发布共识至少包含：已冻结或明确适用的需求版本、`dev` 的构建/迁移/回滚证据、`cr` 的阻断结论、`qa` 的验收范围和未测风险、`dp` 的预检与恢复路径。缺少任一项时，不得把发布表达为常规通过。
- `cr` 发现的未关闭安全或数据一致性阻断风险，不得被流程便利静默覆盖。若项目规则允许风险接受，只能由用户或项目授权的风险接受人书面确认，并记录作用域、补偿措施、到期时间和复查动作。
- 生产发布的 Go/No-Go 由用户或项目授权方作最终风险接受；`survey-corps` 只核验协议与记录裁决，`dp` 只执行已授权且满足当前门禁的方案。
- 紧急例外不是跳过协议：必须记录 `exception_id`、原因、批准人、允许范围、有效期、补偿控制和事后复盘/复验时间；有效期结束前未补齐证据时，状态回退为 `degraded` 或 `unstable`。

### 失效传播与冲突降级

- PRD、验收标准或关键业务规则变为 `changed` 时，相关设计、开发、审查、测试和发布结论必须标记为 `stale` 或 `needs_revalidation`，并按影响链重新计算门禁。
- 代码、配置、依赖、迁移或运行环境变化时，依赖旧版本的 `ready_for_cr`、`qa_passed`、`ready`、`verified` 等状态不得继续作为新版本放行依据。
- 角色结论冲突且无法即时解决时，按安全与数据一致性优先原则降级：冻结有争议范围、保留无争议范围的自治推进、指定裁决者和升级时限；不得用默认继续推进替代裁决。
- 共识记录至少包含 `consensus_scope`、`protocol_version`、参与角色、各自证据、异议、裁决者、`risk_acceptance_owner`、有效期和复核条件。

## 统一执行范式

所有角色默认按以下循环工作，具体角色再叠加自己的专业判断：

```text
证据基线 -> 风险与影响分析 -> 方案及取舍 -> 最小可验证动作 -> 验证与退出判断 -> 交接与残余风险
```

- 证据基线：先读取上游产物、代码、配置、测试或运行记录，区分事实、假设和未知。
- 风险与影响分析：识别受影响范围、业务损失、兼容性、安全性和可逆性。
- 方案及取舍：记录采用方案、备选方案、关键取舍和需要升级的问题。
- 最小可验证动作：优先完成能证明关键假设的最小工作单元。
- 验证与退出判断：依据验收标准和证据决定通过、阻断、回退或继续补充信息。
- 交接与残余风险：交接产物必须说明证据、未解决风险、责任方和下一步。

### 工作模式

- 轻量：小型内部修改且不影响公共契约，记录假设、变更范围和自测证据。
- 标准：普通功能或局部 API/页面变更，补充影响分析、验收标准和测试矩阵。
- 高风险：公共 API、数据库、权限、金额、事务、生产发布或不可逆变更，必须先对齐方案，并提供回滚/补偿、审批和验证证据。

## 事件驱动协作模型

调查兵团采用事件驱动的产物流转模型。

每次激活某个子代理时：

1. 读取上游产物。
2. 对比 `status`、`version`、`updated_at`。
3. 只处理新增或变更的工作。
4. 写入下游产物或输出本轮结论。
5. 记录关键决策、证据和风险。
6. 退出本轮处理。

“while true 监听”只表示逻辑上的持续监听：每次被调用时处理一轮事件，不表示真实启动阻塞式无限循环。

### 状态机与冲突仲裁

- 状态变更前必须校验当前状态、触发事件、责任方和允许的下一状态。
- 任何角色不得跳过前置门禁直接把产物标记为下游通过状态。
- 角色结论冲突时，记录冲突点、双方证据、裁决者、取舍和后续责任人。
- 状态回退、重复消费和重复交接必须保持幂等，并记录原因。
- 决策优先级为：用户指令和项目规则 > 安全与合规 > 数据一致性 > 业务正确性 > 可维护性 > 性能优化 > 流程便利性。

## 主要产物

调查兵团围绕以下核心产物流转：

- 需求与验收记录
- 开发与变更记录
- 审查与联调结论
- 测试与验收结论
- 发布检查、部署记录与交付报告

业务图表、API 清单、数据库方案、Bug 列表、复测记录和 AI 辅助记录只在任务确实需要时生成。

## 产物状态字段

字段按工作模式填充，不要求每个轻量任务都生成完整档案：

```yaml
artifact:
artifact_id:
version:
protocol_version:
updated_at:
owner:
status:
source_artifacts:
related_files:
traceability:
evidence:
decision_log:
open_questions:
residual_risks:
trigger:
decision_evidence:
decision:
alternatives:
gate:
health_snapshot:
consensus:
escalation:
risk_acceptance_owner:
exception_id:
next_action:
```

推荐状态如下。

PRD 状态：

- `draft`
- `needs_user_confirm`
- `confirmed`
- `changed`
- `archived`

开发状态：

- `planned`
- `dev_in_progress`
- `dev_done`
- `ready_for_cr`
- `cr_blocked`
- `ready_for_qa`
- `qa_failed`
- `qa_passed`

API 状态：

- `planned`
- `contract_draft`
- `contract_confirmed`
- `dev_in_progress`
- `dev_done`
- `ready_for_cr`
- `in_integration`
- `integration_blocked`
- `ready_for_qa`
- `qa_passed`
- `qa_failed`
- `deprecated`

提测状态：

- `draft`
- `submitted`
- `qa_in_progress`
- `qa_blocked`
- `qa_passed`
- `qa_failed`

Bug 状态：

- `open`
- `assigned`
- `fixed`
- `retest`
- `closed`
- `reopened`

部署状态：

- `pending`
- `planned`
- `ready`
- `deploying`
- `deployed`
- `verified`
- `reported`
- `rolled_back`
- `blocked`

## 状态转换矩阵（state_transition_matrix）

状态不是标签，而是行动许可。任何转换都必须同时记录触发事件、责任角色、必要证据和禁止动作；版本、契约、配置、数据或环境变化时，先标记 `needs_revalidation`，再决定是否重新进入业务状态。

| 当前状态 | 触发事件 | 允许转为 | 必要证据 | 转换前禁止动作 |
| --- | --- | --- | --- | --- |
| `draft` | 需求范围已整理 | `needs_user_confirm` | 目标、非目标、假设、开放问题 | 不得交给 `dev` 当作确定契约 |
| `needs_user_confirm` | 用户或授权方确认 | `confirmed` | 确认记录、验收标准、版本 | 不得以假设替代确认 |
| `confirmed` | 需求或规则变化 | `changed` | 变更说明、影响链 | 不得继续复用旧下游结论 |
| `changed` | 新范围和验收标准重新确认 | `needs_user_confirm` | 新版本 PRD、影响重算、开放问题 | 不得沿用旧版本门禁 |
| `planned` | 工作单元依赖满足 | `dev_in_progress` | 目标、范围、依赖、回滚方式 | 不得无工作单元直接编码 |
| `dev_in_progress` | 实现和自测完成 | `dev_done` | 变更文件、自测证据、已知风险 | 不得宣布 QA 或发布通过 |
| `dev_done` | 开发交付输入完整 | `ready_for_cr` | 契约、影响范围、验证证据 | 不得跳过 `cr` |
| `ready_for_cr` | 存在阻断问题 | `cr_blocked` | 问题证据、影响、修复责任人 | 不得提测或放量 |
| `ready_for_cr` | 无阻断且联调完成 | `ready_for_qa` | review、联调、提测文件 | 不得宣布最终验收 |
| `cr_blocked` | 阻断修复并完成复审 | `ready_for_cr` | 修复证据、复审记录、残余风险 | 不得直接跳到 QA |
| `ready_for_qa` | 关键范围验证通过 | `qa_passed` | 测试范围、结果、未测风险、复测证据 | 不得修改业务代码或直接宣布生产成功 |
| `ready_for_qa` | 存在阻断或证据缺口 | `qa_failed` | 失败分类、复现步骤、责任侧 | 不得以局部绿灯替代回归 |
| `qa_failed` | 修复完成并重新提测 | `ready_for_qa` | 修复证据、回归范围、复测计划 | 不得直接标记 `qa_passed` |
| `qa_passed` | 发布共识和预检完整 | `ready` | 共识记录、风险接受、回滚证据 | 不得绕过 `dp` 预检 |
| `ready` | 发布预检和授权完成 | `deploying` | 构建、配置、迁移、回滚、共识记录 | 不得无授权生产操作 |
| `deploying` | 部署命令完成 | `deployed` | 版本、目标、部署记录 | 不得把部署完成当作交付完成 |
| `deployed` | 健康门禁和观察窗口通过 | `verified` | 技术健康、业务指标、观察证据 | 不得省略观察窗口 |
| `deploying`/`deployed` | 健康恶化或恢复失败 | `rolled_back` / `blocked` | 触发指标、回滚记录、影响范围 | 不得继续扩散 |
| `rolled_back` | 根因修复、恢复验证和新方案确认 | `planned` | 回滚报告、修复证据、新发布计划 | 不得直接重新放量 |
| `blocked` | 阻断原因关闭且重新授权 | `ready` | 阻断关闭证据、健康快照、授权记录 | 不得隐式解除阻断 |

跨版本、环境或证据变化的任何状态均可转入 `needs_revalidation` 标记；该标记解除前，只允许补证、复测、复审、恢复或受控观察。

## 交接产物模板（handoff_template）

普通交接统一使用以下最小结构：

```yaml
handoff:
  artifact_id:
  protocol_version:
  source_role:
  target_role:
  status:
  observed_at:
  reference_version:
  environment:
  verified_scope:
  unverified_scope:
  evidence: []
  decision:
  allowed_actions: []
  forbidden_actions: []
  health_snapshot:
  residual_risks: []
  next_action:
  exit_conditions: []
```

- 轻量：`artifact_id`、`status`、`evidence`、`next_action`、`residual_risks`。
- 标准：在轻量字段基础上增加版本、来源、追踪关系、验收和决策记录。
- 高风险：再补齐 `protocol_version`、健康快照、共识、升级、风险接受和例外字段。

### 反馈事件模板（feedback_event_template）

反馈事件使用以下结构，确保异常能抢占普通工作：

```yaml
event:
  event_id:
  priority: P0 | P1 | P2 | P3
  source:
  affected_scope:
  health_effect:
  evidence: []
  owner:
  allowed_actions: []
  forbidden_actions: []
  recovery_exit_conditions: []
  invalidates: []
```

### 发布共识模板（release_consensus_template）

发布共识和紧急例外使用以下结构：

```yaml
release_consensus:
  consensus_scope:
  protocol_version:
  req_version:
  dev_evidence:
  cr_blocking_conclusion:
  qa_scope_and_risks:
  dp_preflight_and_recovery:
  dissent: []
  decision: go | no_go | conditional
  risk_acceptance_owner:
  exception_id:
  exception_expires_at:
  compensating_controls: []
  post_review_at:
```

## API 清单字段

每个 API 至少包含：

```yaml
api_id:
module:
endpoint:
method:
purpose:
request:
response:
mock:
auth:
permission:
idempotency:
frontend_usage:
backend_behavior:
dev_status:
cr_status:
qa_status:
changed_files:
blocking_issues:
```

## Bug 字段

每个 bug 至少包含：

- Bug ID
- 来源：QA 测试、人工测试反馈、用户反馈、联调反馈或生产反馈
- 严重级别
- 优先级
- 状态
- 复现环境
- 复现步骤
- 预期结果
- 实际结果
- 关联 API 或模块
- 责任侧
- 指派对象
- 修复证据
- 复测结果
- 关闭原因

## 工作单元门禁

除 `req` 外，每个活跃子代理在正式开发、审查、测试、部署、联调或交付汇报前，必须先拆解自己的工作单元。

每个工作单元包含：

- 工作单元 ID
- 工作单元名称
- 来源需求或输入
- 目标
- 范围
- 依赖
- 交付物
- 验收标准
- 优先级
- 风险
- 决策取舍
- 证据和验证方式
- 退出标准
- 残余风险
- 建议执行顺序

工作单元清晰后，子代理再按建议顺序执行实际工作。

## 角色剧本索引（按需加载）

详细角色规则以独立剧本为准，主调度只保留职责边界和流转关系：

| 角色 | 独立剧本 | 核心职责 |
| --- | --- | --- |
| `req` | `skills/req/SKILL.md` | 需求澄清、业务建模、验收标准和需求变更影响链 |
| `dev` | `skills/dev/SKILL.md` | 端到端实现、契约、数据库、迁移、自测和开发交付 |
| `cr` | `skills/cr/SKILL.md` | 影响范围审查、契约/安全/数据一致性审查和联调 |
| `qa` | `skills/qa/SKILL.md` | 风险驱动测试、反馈归档、Bug 生命周期和验收 |
| `dp` | `skills/dp/SKILL.md` | 发布检查、恢复建议、观测和交付报告 |

角色进入自身职责后，必须读取对应独立剧本；跨角色状态变更仍由总调度依据状态矩阵仲裁。

## 常见流程

完整功能交付：

```text
req -> dev -> cr -> qa -> dp
```

常规修复：

```text
qa -> dev -> qa
```

高风险或契约修复：

```text
qa -> dev -> cr -> qa
```

发布检查与手动发布：

```text
qa -> dp -> 用户发布
```

## 按需复盘

只有发生阻断、返工、事故或用户明确要求时，才记录一次复盘：触发原因、证据、遗漏、修复动作和需要回写的规则。没有事件时不要求每日搜索、学习或生成额外记录。

## 跨角色纪律

- 任何子代理都不应越权吞掉其他子代理的核心职责。
- 当流程受阻时，记录阻塞点、责任方、证据和建议下一步。
