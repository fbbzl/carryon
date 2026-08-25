---
name: survey-corps
description: "Coordinate a multi-role engineering task with the smallest necessary role chain, evidence-based handoffs, and explicit escalation for high-risk changes or releases."
metadata:
  version: 2.1.1
  type: agent-skill
  scope: software-engineering
  tags: [survey-corps, req, dev, cr, qa, dp, workflow]
  author: coding-skill
---

# 调查兵团

调查兵团用于跨角色工程协作：用最少的角色完成任务，并让结论能追溯到当前范围、版本、环境和证据。它协调 `req`、`dev`、`cr`、`qa`、`dp`，不替代专业判断；生产发布、风险接受和不可逆操作始终由用户或授权方决定。

## 何时启动

- 任务需要两个及以上角色、明确交接、公共契约评估、风险升级或发布准备时启动。
- 单角色工作直接使用对应 Skill，不为形式而启动完整链路。
- 先读取用户任务和必要的仓库上下文，再选择最小角色链。只有目标、权限、环境或风险会改变决策时才询问用户。

## 最小编排

只读取和启动已选择角色的本体 Skill。下表只给出跨角色默认编排；每个活跃角色仍按自身本体 Skill 的条件选择专属从属 Skill。

| 情形 | 默认链路 | 需要时使用的从属 Skill |
| --- | --- | --- |
| 需求或影响不明 | `req -> dev` | 文档冲突且高风险：`grill-with-docs`；视觉化能消除歧义：`align-with-visuals` |
| 已确认的功能或行为变更 | `dev -> cr -> qa` | 无 |
| 受控重构 | `dev -> qa` | `refactor-with-goal`、`test-with-goal` |
| 缺陷修复 | `dev -> qa`；触及契约、安全或数据时加入 `cr` | `test-with-goal` |
| 高风险变更或发布 | `req -> dev -> cr -> qa -> dp` | 各角色按本体 Skill 选择 |

高风险包括公共 API、权限、数据库或迁移、金额/事务、生产环境和不可逆操作。代码或设计审查、测试验收、发布预检、Git 同步等单一职责工作，直接使用对应角色 Skill；Git 同步一次只选择一种同步从属 Skill。

## 共同约束

每个活跃角色先定义并更新最小工作单元：

```yaml
work_unit:
  work_unit_id:
  target:              # 要交付的结果
  roles: []            # 本轮实际角色
  reference_version:   # 需求、代码、配置或依赖的当前基线
  environment:
  observed_at:
  updated_at:
  valid_until:
  verified_scope: []
  unverified_scope: []
  acceptance: []
  risks: []
  evidence: []         # 路径/行号、命令和结果、测试或事件 ID；不猜测 URL
  next_action:
```

- 结论按“观察 → 解释 → 边界 → 行动”表达；不能将局部、旧版本或其他环境的证据扩大为系统结论。
- 需求、代码、配置、依赖、数据或环境变化时，只要影响旧结论，就让受影响的下游结论重新验证；不复用失效证据。
- 所有任务必填 `work_unit_id`、目标、角色、基线、环境、观察时间、已验证/未验证范围、证据和下一步；`updated_at`、`valid_until`、验收和风险仅在适用时填写。轻量任务不再扩展其他文档，标准任务补充验收与影响，高风险任务按下一节处理。

新模块、公共 API、数据库、权限、事务、缓存/MQ 或不兼容变化实施前，建立最小方案协议：`protocol_id`、版本、范围、契约/数据/安全影响、恢复路径、裁决者和 `draft | needs_user_confirm | confirmed | invalidated` 状态；未到 `confirmed` 不实施高风险变更。

## 高风险门槛

高风险任务必须对以下受影响项给出当前基线和可核验证据；未触及的项只写一行影响判断，不伪造“通过”。

| 项目 | 最低证据 |
| --- | --- |
| 功能与契约 | 已确认验收，以及 API/业务行为影响 |
| 质量与测试 | `dev` 的构建/静态检查，以及 `qa` 的主路径、边界和受影响回归 |
| 安全与数据 | 权限/输入输出边界、数据不变量、迁移或补偿 |
| 发布与运行 | 目标环境、观测、停止或回滚路径 |

健康快照 `health_snapshot` 只表示当前 `work_unit_id + reference_version + environment`：`healthy` 为受影响门禁证据均有效；`degraded` 为已知非 P0/P1 缺口且有责任人、补偿控制和有效期；`unstable` 为关键契约、安全、数据或生产存在阻断风险；`recovering` 为风险已控制但仍需复审、复测或观察。

`P0` 是已发生或迫近的生产中断、重大安全事件或数据损坏；`P1` 是关键契约、权限或核心流程失效、已确认的技术发布门禁失败或未授权部署尝试。确认 P0/P1 时立即冻结受影响动作并记录 `event_id`、影响、`health_effect`、责任人、证据和恢复条件；修复后从最早失效环节重新验证。

## 交接与状态

正常链路是 `req -> dev -> cr -> qa -> dp -> 用户发布`，但只运行已选择的段。每次交接使用：

主线状态为 `needs_user_confirm -> confirmed -> planned -> dev_in_progress -> ready_for_cr -> ready_for_qa -> qa_passed | qa_conditional -> ready -> deployed -> verified`。CR 阻断走 `cr_blocked -> ready_for_cr`，QA 阻断走 `qa_failed -> ready_for_qa`，已回滚记 `rolled_back`；P0/P1 或未授权执行进入 `blocked`。

需求、实现、配置、依赖、迁移、契约、权限、安全、数据、测试证据或环境变化时进入 `needs_revalidation`，按最早失效环节计算 `resume_state`；仅同一基线下补材料使用 `needs_revision`，不改变工作流状态。

```yaml
handoff:
  work_unit_id:
  from:
  to:
  state:
  source_state:
  handoff_result: pending | accepted | needs_revision | rejected
  handoff_feedback:
  reference_version:
  environment:
  observed_at:
  updated_at:
  valid_until:
  verified_scope: []
  unverified_scope: []
  evidence: []
  blocked_from:
  revalidation_from:
  invalidated_by: []
  resume_state:
  decision:
  risks: []
  next_action:
```

- 接收方填写 `handoff_result`；未 `accepted` 不正常推进。`needs_revision` 表示同一基线下材料不全，`rejected` 表示因职责、授权或结论不可接受而拒收，两者均保持 `source_state` 并记录 `handoff_feedback`；若拒收证据同时证明基线失效则进入 `needs_revalidation`，确认 P0/P1 则进入 `blocked`。
- 审查或测试发现问题，返回 `dev` 修复并复核受影响范围；未解决的高严重度风险保持 `blocked`。
- 角色边界：`req` 负责需求和验收；`dev` 负责实现、构建/静态检查和恢复输入；`cr` 负责契约、安全、数据与影响审查；`qa` 负责测试资产、正式测试和验收；`dp` 负责预检、观测和交付报告。

## 发布边界

`dp` 的预检至少确认版本、目标环境、观测和停止/回滚路径。`preflight_pass` 不等于发布授权或部署成功；`deployed` 也不等于观察通过的 `verified`。

只有当前验证仍有效、风险已处理或由用户限时接受，且用户或授权方给出绑定身份、范围、证据和有效期的 `authorization_status=granted` 后才能开始部署；实际开始部署却没有有效授权时进入 `blocked`。AI 不执行生产发布，部署后以目标环境观察结果更新结论。
