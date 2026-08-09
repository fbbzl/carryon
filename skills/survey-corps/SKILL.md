---
name: survey-corps
version: 1.2.1
type: agent-skill
scope: software-engineering
description: "固定的跨项目软件工程子代理团队（调查兵团）协作流程"
tags: [survey-corps, req, dev, cr, qa, dp, agent, workflow]
author: coding-skill
---

# 调查兵团

调查兵团将需求转为可开发、审查、测试和交付的成果。它由总调度 `survey-corps` 与 `req`、`dev`、`cr`、`qa`、`dp` 五个专业角色组成。

项目像人体一样以边界、反馈和恢复维持整体健康；角色像社会节点一样在职责内自治，通过证据、协议和状态协作。总调度维护协议与流转，不替代专业判断；最终发布始终由用户或授权方执行。

## 启动边界

- 跨两个及以上角色、涉及交接、状态流转、公共契约、风险升级或发布时启用调查兵团。
- 单一角色的小修改不强制启用完整链路；只加载相关角色剧本。
- 先读本剧本，再读进入职责的 `skills/<role>/SKILL.md`；不自动创建文件、启动监听或执行未授权操作。

## 统一协作协议

所有结论都要说明五个维度，避免把局部、旧版本或测试环境的观察扩大为系统结论：

| 维度 | 必须说明 |
| --- | --- |
| 时间 | `observed_at`、结论适用时间与失效条件 |
| 空间 | `verified_scope` 与 `unverified_scope` |
| 层级 | 事实、证据、规则、决策与系统影响 |
| 状态 | 当前状态、允许/禁止动作与退出条件 |
| 相对性 | 观察者、版本、环境、数据边界与置信度 |

统一表达：`观察 -> 解释 -> 边界 -> 行动`。高风险结论至少验证一个反事实，例如恶意输入、版本回退、依赖失效、并发扩大、权限绕过、数据过期或环境迁移。

角色只可在自身职责、已授权环境和当前状态允许的范围内行动。跨角色状态变更、公共契约、生产放量、风险接受或不可逆操作必须升级；AI 只能辅助，最终判断由对应角色复核。

## 工作方式

```text
证据基线 -> 风险与影响 -> 最小可验证动作 -> 验证与状态判断 -> 交接与残余风险
```

- 轻量：局部且不影响公共契约，记录范围、自测证据和风险。
- 标准：普通功能或 API/页面变更，补充验收标准、影响分析和测试范围。
- 高风险：公共 API、数据库、权限、金额、事务、生产或不可逆变更，先对齐方案，并提供恢复路径和验证证据。

每个活跃角色在正式工作前定义自己的工作单元：ID、来源、目标、范围、依赖、交付物、验收标准、风险、验证方式、退出标准和残余风险。轻量任务可以只保留范围、自测证据和下一步。

项目健康只在当前参照系下判断：`healthy` 可按门禁推进；`degraded` 仅可在明确范围、责任人和补偿措施下推进；`unstable` 冻结受影响放量并优先恢复；`recovering` 只允许复审、复测和受控观察。构建、联调、测试或部署成功都只证明自身范围。

健康状态同样是行动许可：

| 状态 | 进入条件 | 责任人 | 退出证据 |
| --- | --- | --- | --- |
| `healthy` | 当前四类门禁均满足 | 总调度 | 任一门禁恶化则重新评估 |
| `degraded` | 有已知非阻断缺口 | 缺口所属角色 | 补证完成或风险升级 |
| `unstable` | 生产、安全、数据或关键契约存在阻断风险 | `dp` 协调恢复，专业角色判定风险 | 影响已隔离且恢复证据成立 |
| `recovering` | 风险已控制但尚未恢复常规流转 | 恢复工作单元负责人 | 复审、复测和观察窗口通过 |

## 状态与交接

状态是行动许可。版本、需求、代码、配置、数据或环境变化时，依赖旧证据的结论进入 `needs_revalidation`，不得直接沿用。

| 当前状态 | 触发事件 | 可转为 | 必要证据 | 禁止动作 |
| --- | --- | --- | --- | --- |
| `draft` | 范围已整理 | `needs_user_confirm` | 目标、假设、开放问题 | 作为确定契约交给开发 |
| `needs_user_confirm` | 用户确认 | `confirmed` | 验收标准、版本 | 以假设替代确认 |
| `confirmed` | 开发范围与工作单元确认 | `planned` | 需求版本、验收、依赖、回滚、OpenSpec ID/版本/`status=confirmed`（如需） | 未确认技术方案编码 |
| `confirmed` | 需求变化 | `changed` | 变更与影响 | 复用旧下游结论 |
| `changed` | 新范围整理完成 | `needs_user_confirm` | 新版本、差异、影响链 | 沿用旧门禁 |
| `planned` | 依赖满足且方案已确认 | `dev_in_progress` | 工作单元、范围、回滚、OpenSpec ID/版本/`status=confirmed`（如需） | 无工作单元或未确认方案编码 |
| `dev_in_progress` | 实现与自测完成 | `dev_done` | 变更、自测、风险 | 宣布 QA 或发布通过 |
| `dev_done` | 交付输入完整 | `ready_for_cr` | 契约、影响、验证 | 跳过 `cr` |
| `ready_for_cr` | 有阻断 / 无阻断且联调完成 | `cr_blocked` / `ready_for_qa` | 审查证据 / 联调与提测文件 | 提测或最终验收 |
| `cr_blocked` | 修复完成并重新提审 | `ready_for_cr` | 修复证据、复审输入 | 直接跳到 QA |
| `ready_for_qa` | 验证通过 / 有阻断 | `qa_passed` / `qa_failed` | 测试范围与结果 | 以局部绿灯代替回归 |
| `qa_failed` | 修复完成并重新提测 | `ready_for_qa` | 修复证据、回归范围、复测计划 | 直接标记通过 |
| `qa_passed` | 发布共识与预检完整 | `ready` | 需求版本、`cr` 阻断结论、QA 范围/风险、`dp` 预检、授权证据 | 以局部测试代替共识 |
| `ready` | 用户授权发布 | `deploying` | 构建、配置、迁移、回滚 | 未授权操作 |
| `deploying` | 部署命令完成 | `deployed` | 版本、目标、操作者、部署记录 | 宣布交付成功 |
| `deploying` | 部署失败或健康门禁未满足 | `blocked` | 失败记录、健康快照、恢复动作 | 宣布部署成功 |
| `deployed` | 观察通过 / 健康异常 | `verified` / `rolled_back` | 健康快照 / 回滚记录 | 省略观察 / 继续扩散 |
| `verified` | 追溯发现 P0/P1 或数据/安全异常 | `blocked` / `rolled_back` | 事件、影响范围、恢复/隔离证据 | 继续扩散 |
| `rolled_back` | 根因修复并重新规划 | `planned` | 回滚报告、修复证据、新方案、OpenSpec（如需） | 直接重新放量 |
| 任意状态 | P0/P1、授权缺失或关键证据阻断 | `blocked` | 事件、健康快照、责任人、退出条件 | 继续受影响交接/放量 |
| `blocked` | 阻断关闭并重新规划或授权 | `planned` / `ready` | 关闭/修复证据、健康快照、授权、上游证据有效性 | 隐式解除阻断 |
| `needs_revalidation` | 需求、代码、配置、依赖、迁移、契约或权限变化后重新基线 | `planned` | 新版本、失效影响、影响链、OpenSpec（如需）、`resume_state=planned` | 跳过 dev、cr 或 qa |
| `needs_revalidation` | 仅 CR 证据失效且实现版本未变 | `ready_for_cr` | 版本不变证据、失效影响、复审输入、`resume_state=ready_for_cr` | 直接提测或发布 |
| `needs_revalidation` | 仅 QA 环境、数据或测试证据失效且上游证据未变 | `ready_for_qa` | 版本不变证据、环境/数据基线、复测计划、`resume_state=ready_for_qa` | 直接标记通过或发布 |
| 任意状态 | 版本、证据或环境变化 | `needs_revalidation` | 失效原因、影响范围 | 继续使用旧结论 |

`blocked` 仅在阻断只涉及授权或运行恢复、且当前版本的 `cr`、`qa`、`dp` 证据仍有效时可转 `ready`；涉及代码、契约、数据、安全或测试证据变化时必须转 `planned`，重新走受影响链路。

最小交接：

```yaml
handoff:
  source_role:
  target_role:
  status:
  observed_at:
  reference_version:
  environment:
  resume_state:
  verified_scope: []
  unverified_scope: []
  evidence: []
  decision:
  allowed_actions: []
  forbidden_actions: []
  residual_risks: []
  next_action:
  exit_conditions: []
```

高风险健康快照：

```yaml
health_snapshot:
  state: healthy | degraded | unstable | recovering
  owner:
  observed_at:
  valid_until:
  verified_scope: []
  unverified_scope: []
  evidence: []
  allowed_actions: []
  forbidden_actions: []
  next_action:
```

发布共识：

```yaml
release_consensus:
  decision_owner:
  approval_evidence:
  req_version:
  code_version:
  cr_blocking_conclusion:
  qa_scope_and_risks:
  dp_preflight:
  risk_acceptance_owner:
  exception_id:
  valid_until:
  compensating_controls: []
```

`P0`（生产、安全、数据损坏）立即停止受影响放量并恢复；`P1`（关键契约、阻断缺陷、发布门禁失败）冻结交接并修复复验；`P2`（需求、环境或基线变化）使旧结论失效；`P3` 记录责任人和复查期限。

```yaml
event:
  event_id:
  priority: P0 | P1 | P2 | P3
  status: active | mitigating | recovering | closed
  source:
  observed_at:
  affected_scope: []
  health_effect:
  evidence: []
  owner:
  allowed_actions: []
  forbidden_actions: []
  recovery_exit_conditions: []
```

健康快照至少包含：`state`、`owner`、`observed_at`、`verified_scope`、`evidence` 和 `next_action`。事件关闭前必须验证恢复效果，并把遗漏回写到相关角色的检查项、测试或运行手册。

健康状态转换：`healthy|degraded -> unstable -> recovering -> healthy|degraded`；恢复证据未齐全时不得离开 `recovering`，异常扩大时回到 `unstable`。

需求、验收标准、代码、配置、依赖、迁移、环境或数据变化时，沿影响链使依赖旧版本的审查、测试和发布结论进入 `needs_revalidation`（不另设 `stale` 状态）。冲突无法即时解决时，冻结争议范围，保留无争议范围，并指定裁决者和复核时限。

`qa` 的 `conditional` 只能对应 `degraded`，不得直接生成 `qa_passed`；补偿控制缺失或有效期届满时回到 `needs_revalidation`。

授权方必须有可核验的身份、授权范围、审批证据和有效期；缺少记录时仅用户本人可作最终决定。活动 P0/P1 或 `unstable` 默认 No-Go，紧急例外只能授权受控恢复动作，不能豁免恢复验证。

高风险共识至少记录：适用需求/代码版本、参与角色、各自证据、异议、裁决者、风险接受人、有效期、补偿控制和复查条件。紧急例外还要记录原因、批准人、允许范围和到期时间。

## 角色边界

| 角色 | 唯一职责 | 交给下游的核心产物 |
| --- | --- | --- |
| `req` | 需求、验收、业务边界与变更影响 | 已确认需求、假设、验收标准 |
| `dev` | 端到端实现、契约、数据变更与自测 | 变更、契约、自测、恢复路径 |
| `cr` | 影响、契约、安全、数据一致性审查与联调 | 审查结论、阻断项、提测输入 |
| `qa` | 风险驱动测试、反馈闭环与验收 | 测试结论、未测风险、发布建议 |
| `dp` | 发布预检、恢复建议、观测与交付报告 | 预检结论、恢复路径、交付报告 |

常规链路：`req -> dev -> cr -> qa -> dp -> 用户发布`。普通修复可走 `qa -> dev -> qa`；涉及契约、安全或影响范围不明时走 `qa -> dev -> cr -> qa`。

冲突按安全与数据一致性优先：冻结争议范围，保留无争议范围，记录双方证据、裁决者与下一步。任何风险接受、Go/No-Go 和生产发布由用户或授权方作最终决定。

角色进入自身职责后，先读取上游产物并核对 `status`、`version`、`updated_at`；只处理新增或变化范围，完成一轮验证后交接，不实现真实的无限监听。
