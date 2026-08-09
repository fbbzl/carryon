---
name: survey-corps
version: 1.2.10
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

### 四类健康门禁

| 门禁 | 最低通过条件 | 主责 | 复核 |
| --- | --- | --- | --- |
| `functional_contract` 功能与契约 | 当前需求/验收已确认；实现、API/业务契约和影响链一致；无未解释的破坏性差异 | `req` | `cr` |
| `quality_testing` 质量与测试 | `dev` 自测完成；`qa` 覆盖主路径、异常/边界和受影响回归；阻断 Bug 已关闭 | `qa` | `cr` |
| `security_data` 安全与数据 | 权限/信任边界和输入输出控制已审查；数据不变量、迁移及恢复/补偿有验证证据；无触及时有影响分析 | `cr` | `qa`（`dev` 提供变更证据） |
| `release_runtime` 发布与运行 | 发布前有 `dp` 预检、授权责任人与授权路径、可观测性、观察方案和停止/回滚路径；最终发布授权在 `ready -> deploying` 单独核验，发布后再补充观察窗口结果 | `dp` | 用户或授权方 |

每个门禁至少记录 `gate_id`、`status=pass|fail|unknown|expired`、`owner`、`reviewer`、`observed_at`、`valid_until`、`reference_version`、`environment`、`evidence`、`unverified_scope` 和 `next_action`。每项 `evidence` 只引用可核验的 URL、仓库路径/行号、命令或日志、测试/构建/事件 ID，并注明提供者和复核者；不得猜测 URL，无法取得时标为 `unknown`。

门禁记录继承健康快照的 `work_unit_id` 与 `target`；`status=pass` 必须有主责和复核方的可核验证据，证据项沿用下文统一 `evidence` 格式。

健康快照的 `gates` 必须恰好各出现一次 `functional_contract`、`quality_testing`、`security_data`、`release_runtime`；缺失或重复按 `unknown` 处理。不触及某门禁时也必须提交影响分析证据并记录为 `pass`，不新增 `N/A` 状态。

健康门禁在进入 `ready`、发布观察或显式健康评估时启用；更早阶段不生成 `healthy`/`degraded` 结论，尚未到评估阶段不把门禁视为失效。

`healthy` 仅表示目标范围内四类门禁均为 `pass`，证据绑定同一 `work_unit_id`、`reference_version`、`environment` 且未过 `valid_until`，并且 `active_p0_p1` 为空。任一门禁为 `unknown`、`expired` 或 `fail`，或健康状态为 `degraded`、`unstable`、`recovering`，均不得标记为 `healthy`。仅 `deployed` 阶段的观察证据缺失、`unknown` 或 `expired` 且尚未确认异常时保持 `recovering`；其余缺口只有在影响已证实非阻断且补偿控制有效时才可降为 `degraded`，否则进入 `unstable`。`degraded` 只允许已知的非 P0/P1 缺口，并明确责任人、补偿控制和有效期。

除上述 `deployed + recovering` 观察证据例外，门禁为 `unknown` 或 `expired` 时，按对应失效证据沿最上游影响链进入 `needs_revalidation`；未证实为非阻断前不得仅以 `degraded` 继续推进。

`qa_conditional` 阶段仅发布侧 `dp_preflight`、授权责任人与授权路径证据或健康证据缺失、`unknown` 或 `expired`，且 QA 条件证据、补偿控制、适用范围、版本和环境仍有效时，保持 `qa_conditional` 并 No-Go；补齐后按条件路径进入 `ready`。若 QA 测试环境、夹具、QA 证据或补偿控制失效，或适用范围、版本、环境变化/风险升级，则进入 `needs_revalidation -> ready_for_qa`，不得直接恢复发布；本条优先于通用证据失效兜底。

健康状态同样是行动许可：

| 状态 | 进入条件 | 责任人 | 退出证据 |
| --- | --- | --- | --- |
| `healthy` | 四类门禁均为 `pass` 且证据有效 | 总调度 | 任一门禁恶化则重新评估 |
| `degraded` | 已知非 P0/P1 缺口，且有责任人、补偿控制和有效期 | 缺口所属角色 | 补证完成或风险升级 |
| `unstable` | 生产、安全、数据或关键契约存在阻断风险 | `dp` 协调恢复，专业角色判定风险 | 影响已隔离且恢复证据成立 |
| `recovering` | 风险已控制但尚未恢复常规流转 | 恢复工作单元负责人 | 四类门禁逐项复核，复审、复测和观察窗口通过 |

工作流状态与健康状态是两个独立维度；前者控制交接，后者控制系统动作。健康状态只允许以下转换：

| 当前健康状态 | 触发 | 可转为 | 必要证据 |
| --- | --- | --- | --- |
| `healthy` | 出现已知非阻断缺口 | `degraded` | 影响范围、责任人、补偿控制、有效期 |
| `degraded` | 缺口关闭并复验 | `healthy` | 关闭证据、受影响范围复验 |
| `healthy` / `degraded` | 出现阻断风险 | `unstable` | 事件、影响范围、冻结动作 |
| `healthy` / `degraded` | 用户授权且开始受控部署/观察 | `recovering` | 部署记录、目标环境、观察指标、停止/回滚路径 |
| `unstable` | 影响已隔离 | `recovering` | 隔离证据、恢复计划、观察指标 |
| `recovering` | 四类门禁逐项复核，复审、复测和观察窗口通过 | `healthy` / `degraded` | 恢复证据、残余风险、健康快照 |
| `recovering` | 已确认异常扩大，或非单纯观察缺失的恢复证据失效 | `unstable` | 更新后的事件与影响范围 |

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
| `dev_done` | `cr` 退回资料且实现、版本基线未变 | `dev_done` | `handoff_result=needs_revision`、缺失字段、同一工作单元/版本/环境 | 禁止提测或发布；补齐后重新交接 |
| `ready_for_cr` | 有阻断 / 无阻断且联调完成 | `cr_blocked` / `ready_for_qa` | 审查证据 / 联调与提测文件 | 提测或最终验收 |
| `ready_for_cr` | `cr` 发现资料缺失且实现、版本基线未变 | `dev_done` | `handoff_result=needs_revision`、缺失字段、同一工作单元/版本/环境 | 禁止提测或发布；补齐后重新交接 |
| `cr_blocked` | 修复完成并重新提审 | `ready_for_cr` | 修复证据、复审输入 | 直接跳到 QA |
| `ready_for_qa` | 验证通过 / 条件通过 / 有阻断 | `qa_passed` / `qa_conditional` / `qa_failed` | 测试范围、结果、结论与健康影响 | 以局部绿灯代替回归 |
| `qa_failed` | 修复完成并重新提测 | `ready_for_qa` | 修复证据、回归范围、复测计划 | 直接标记通过 |
| `qa_conditional` | 缺口修复并准备复测 | `ready_for_qa` | 修复证据、受影响范围、复测计划 | 直接标记 `qa_passed` |
| `qa_conditional` | 风险被用户或授权方限时接受，且发布预检完整 | `ready` | 当前版本/环境、`health_snapshot.state=degraded`、风险接受证据、补偿控制及有效期、发布共识、`dp` 预检、授权责任人与授权路径 | 声称 `qa_passed`/`healthy` 或省略补偿控制 |
| `qa_conditional` | QA 条件证据/补偿控制失效，或适用范围、版本、环境变化/风险升级 | `needs_revalidation` | `revalidation_from=qa_conditional`、`invalidated_by`、受影响范围、失效证据 | 沿用条件结论或继续发布 |
| `qa_passed` | 发布共识、`cr`/`qa` 门禁通过且整体健康为 `healthy`，`dp` 预检完整 | `ready` | 当前工作单元、共识 ID/更新时间/有效期、需求与代码版本、目标环境、`cr` 阻断结论、QA 范围/风险、`dp` 预检、授权责任人与授权路径 | 以局部测试或跨环境旧共识代替当前共识 |
| `ready` | 用户或授权方给出最终发布授权 | `deploying` | 最终授权身份、范围、证据与有效期，构建、配置、迁移、回滚 | 预填授权、以风险接受代替发布授权或执行未授权操作 |
| `deploying` | 部署命令完成 | `deployed` | 版本、目标、操作者、部署记录 | 宣布交付成功 |
| `deploying` | 部署失败或健康门禁未满足 | `blocked` | 失败记录、健康快照、恢复动作 | 宣布部署成功 |
| `deployed` | 当前目标环境观察通过 | `verified` | 当前环境健康快照、观察窗口结果 | 省略观察或沿用旧环境证据 |
| `deployed` | 观察证据缺失、`unknown` 或 `expired`，但尚未确认异常 | `deployed` | `health_snapshot.state=recovering`、缺失证据、冻结扩量动作、重新观察计划 | 重复部署、扩大放量或声称异常 |
| `deployed` | 已确认异常并原地隔离或修复 | `deployed` | `health_snapshot.state=unstable`、事件、影响范围、隔离/修复动作 | 扩大放量或声称已恢复 |
| `deployed` | 已确认异常且回滚完成 | `rolled_back` | 异常证据、影响范围、回滚记录 | 仅因观察延迟触发回滚 |
| `verified` | 追溯发现 P0/P1 或数据/安全异常 | `blocked` / `rolled_back` | 事件、影响范围、恢复/隔离证据 | 继续扩散 |
| `rolled_back` | 根因修复并重新规划 | `planned` | 回滚报告、修复证据、当前需求版本、新方案、OpenSpec ID/版本/`status=confirmed`（如需） | 直接重新放量 |
| 任意状态 | P0/P1 或关键证据已确认阻断 | `blocked` | `blocked_from`、事件、健康快照、责任人、退出条件 | 继续受影响交接/放量 |
| `ready` / `deploying` | 尝试部署时最终授权缺失，或最终授权被拒/过期 | `blocked` | 授权缺失、拒绝或过期记录，`blocked_from`、健康快照、责任人、退出条件 | 部署或扩大放量；正常等待授权不触发本行 |
| `blocked` | 阻断关闭，但需求、实现、契约、数据、安全或测试证据曾变化或失效 | `needs_revalidation` | `event.status=closed`、`blocked_from`、`invalidated_by`、影响范围、失效证据、健康快照 | 直接回到 `planned`、`ready` 或复用旧证据 |
| `blocked` | 非发布阶段仅外部依赖或授权中断已恢复，且没有证据失效 | `resume_state`（必须等于记录的 `blocked_from`） | `event.status=closed`、同一 `work_unit_id`/`reference_version`/`environment`、未过期证据、`resume_state=blocked_from` | 把动态目标当作新状态、改写恢复目标或跳过原状态门禁 |
| `blocked` | `blocked_from` 为 `ready` 或 `deploying`，仅授权缺失、部署命令失败或运行中断已恢复，且交付物未变 | `ready` | `event.status=closed`、同一工作单元和需求/代码/配置/迁移版本、`cr`/`qa` 仍适用、更新后的 `dp` 预检、发布共识、授权与健康快照、`resume_state=ready` | 省略预检、共识、授权或直接部署 |
| `needs_revalidation` | 需求、实现、配置、依赖、迁移、契约、权限、安全或数据不变量变化后重新基线 | `planned` | 新版本、失效影响、影响链、OpenSpec（如需）、`resume_state=planned` | 跳过 dev、cr 或 qa |
| `needs_revalidation` | 实现基线未变，但 CR 证据失效或其适用性无法证明 | `ready_for_cr` | 工作单元和实现基线不变、失效影响、复审输入、`resume_state=ready_for_cr` | 直接提测或发布 |
| `needs_revalidation` | `revalidation_from=qa_conditional`，仅条件结论或补偿控制失效且上游基线未变 | `ready_for_qa` | 当前工作单元/版本/环境、失效影响、新测试与风险评估计划、`resume_state=ready_for_qa` | 直接恢复 `qa_conditional` 或 `ready` |
| `needs_revalidation` | 仅测试执行环境、测试夹具或 QA 证据失效，且上游基线未变 | `ready_for_qa` | 工作单元、产物/配置/依赖基线不变，CR 明确确认仍适用，环境/数据基线、复测计划、`resume_state=ready_for_qa` | 把配置、权限、安全、契约或数据不变量变化归为 QA-only |
| `needs_revalidation` | `revalidation_from` 为 `qa_passed` 或 `ready`，仅 DP 预检、授权或健康证据失效且上游证据未变 | `ready` | 同一 `work_unit_id`/`reference_version`/`environment`、需求/代码/配置/迁移版本不变、`cr`/`qa` 仍适用、更新后的预检、发布共识、授权与健康快照、`resume_state=ready` | 直接部署或复用失效证据 |
| 任意状态 | 版本、证据或环境变化 | `needs_revalidation` | `revalidation_from`、失效原因、影响范围 | 继续使用旧结论 |

具体状态行及 `invalidated_by` / `revalidation_from` 恢复规则优先于“任意状态”兜底；`unknown|expired` 只表示证据失效，只有 P0/P1 或已确认阻断才进入 `blocked`。同一事件同时包含多个 `invalidated_by` 分类时，按最上游影响链选择唯一 `resume_state`：需求/实现/配置/依赖/迁移/契约/权限/安全/数据到 `planned`，`cr` 到 `ready_for_cr`，QA 环境/夹具/证据或条件补偿控制到 `ready_for_qa`；仅发布侧 `dp_preflight`、授权证据（`ready` 前仅指责任人与路径，`ready` 后指最终授权）或健康证据失效时，按当前状态规则保持 `qa_conditional` 或恢复 `ready`，不得被通用兜底改写。

`deploying` 和 `deployed` 在观察窗口结束前一律保持健康状态 `recovering`；窗口通过后用当前目标环境的新快照转为 `healthy`/`degraded`。仅观察证据缺失、`unknown` 或 `expired` 且未确认异常时，工作流保持 `deployed`、冻结扩量并重新观察，不进入 `needs_revalidation` 或重复部署；确认异常后健康状态才转 `unstable`，完成回滚后工作流才转 `rolled_back`。若失效原因包含需求、实现、配置、迁移、安全或数据等上游基线变化，仍按最上游影响链重验证。

恢复判定按以下顺序执行，不由执行者自行选择目标：

1. 将 `blocked_from`、`revalidation_from`、`resume_state` 与同一 `work_unit_id`、`reference_version`、`environment` 绑定；前两者只记录前态，`resume_state` 必须是计算后的目标。
2. 用 `invalidated_by` 和影响链定位最上游失效门禁；入口和出口优先级为 `planned > ready_for_cr > ready_for_qa > ready`。允许的分类为 `requirement`、`implementation`、`config`、`dependency`、`migration`、`contract`、`permission`、`security`、`data`、`cr`、`qa_environment`、`qa_fixture`、`qa_evidence`、`dp_preflight`、`authorization`、`health`；若同时命中多个分类，按上一句优先级只选一个出口，QA 类失效优先于发布侧失效。
3. P0/P1、`security` 或 `data` 失效至少回到 `planned`；需求、实现、契约、配置、迁移或依赖变化也必须重新基线，不能复用旧证据。
4. 仅当发布阶段只发生授权缺失、部署命令失败或运行中断，交付物及上游证据未变，且新的 `dp` 预检、共识、授权和健康证据成立时，才可从 `blocked`/`needs_revalidation` 回到 `ready`；其他情况回到计算出的上游状态。

最小交接：

```yaml
handoff:
  work_unit_id:
  source_role:
  target_role:
  status:
  handoff_result: accepted | rejected | needs_revision
  handoff_feedback:
  source_state:
  observed_at:
  updated_at:
  reference_version:
  environment:
  blocked_from:
  revalidation_from:
  resume_state:
  invalidated_by: []
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

`target_role` 负责填写 `handoff_result`；未收到接收结果前，`status` 保持 `source_state`，不执行矩阵转换。`status` 是工作流状态，不兼作接收结果。`accepted` 才允许按状态表推进，且不等于 QA 或发布通过；`rejected` 或 `needs_revision` 都必须在 `handoff_feedback` 中写明原因、证据定位、影响、责任方、下一行动和退出条件，不能执行下游动作。`needs_revision` 是交接结果，不是 `needs_revalidation` 状态。

`rejected` 本身不决定状态；按下表从上到下匹配首个适用原因，得到唯一状态：

| 交接结果与原因 | 唯一状态处理 |
| --- | --- |
| `dev -> cr` 确认审查阻断 | 进入 `cr_blocked` |
| `cr -> qa` 确认验证阻断 | 进入 `qa_failed` |
| `req -> dev` 在首次接受前发现需求变化 | 进入 `changed -> needs_user_confirm` |
| `qa_conditional` 的 QA 条件证据、补偿控制或适用范围失效 | 进入 `needs_revalidation`，唯一恢复目标为 `ready_for_qa` |
| 任一交接确认 P0/P1 或关键证据阻断，或尝试部署时最终授权缺失/被拒/过期 | 进入 `blocked`；前述角色专用行优先 |
| `rejected`/`needs_revision` 仅因同一基线资料缺失 | 统一记为 `needs_revision`，保持或返回记录的 `source_state`，补齐后重新交接 |
| 已产生下游结论后，修订改变需求、实现、契约、配置、权限、安全、数据、环境或其他上游基线 | 进入 `needs_revalidation`，按最上游影响链计算唯一 `resume_state` |

统一交接与健康模板字段是权威摘要；角色剧本的特有字段是证据明细。两者必须一致，明细变化时同步更新摘要，冲突时不得交接。每项 `evidence` 至少包含 `evidence_id`、`locator`、`provided_by`、`reviewed_by`、`review_result`、`observed_at`、`reference_version`、`environment` 和 `result`；`locator` 只使用已有 URL、仓库路径/行号、命令/日志、测试/构建/事件 ID，不猜测 URL。

发送后、接收前将 `handoff_result` 留空；同一基线资料需补全时，`needs_revision` 保持或返回交接记录中的 `source_state`，修订后从该状态重新交接，不得误记为阻断状态。

`work_unit_id` 关联同一工作单元；交接顶层 `observed_at` 是本次结论的观察时间，证据项的 `observed_at` 是单项采集时间，`updated_at` 记录产物最后更新时间。

高风险健康快照：

```yaml
health_snapshot:
  work_unit_id:
  state: healthy | degraded | unstable | recovering
  owner:
  observed_at:
  updated_at:
  valid_until:
  reference_version:
  environment:
  target:
  gates:
    - gate_id:
      status: pass | fail | unknown | expired
      owner:
      reviewer:
      observed_at:
      valid_until:
      reference_version:
      environment:
      evidence: []
      unverified_scope: []
      next_action:
  active_p0_p1: []
  compensating_controls: []
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
  work_unit_id:
  consensus_id:
  updated_at:
  environment:
  target:
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

进入 `ready` 前，`approval_evidence` 只记录风险接受或授权路径确认，不是最终发布授权；最终授权只能在 `ready -> deploying` 时采集，并绑定授权身份、范围、证据和有效期。

`P0`（生产、安全、数据损坏）立即停止受影响放量并恢复；`P1`（关键契约、阻断缺陷、发布门禁失败）冻结交接并修复复验；`P2`（需求、环境或基线变化）使旧结论失效；`P3` 记录责任人和复查期限。

```yaml
event:
  event_id:
  work_unit_id:
  reference_version:
  environment:
  priority: P0 | P1 | P2 | P3
  status: active | mitigating | recovering | closed
  source:
  blocked_from:
  revalidation_from:
  observed_at:
  affected_scope: []
  health_effect:
  evidence: []
  owner:
  allowed_actions: []
  forbidden_actions: []
  recovery_exit_conditions: []
```

高风险健康快照和事件模板中的字段均为最小必填；无法取得值时必须显式标为未知，并禁止据此扩大结论或放量。事件关闭前必须验证恢复效果，并把遗漏回写到相关角色的检查项、测试或运行手册。

需求、验收标准、代码、配置、依赖、迁移、环境或数据变化时，沿影响链使依赖旧版本的审查、测试和发布结论进入 `needs_revalidation`（不另设 `stale` 状态）。冲突无法即时解决时，冻结争议范围，保留无争议范围，并指定裁决者和复核时限。

`qa_conditional` 不等于 `qa_passed`：它只在 `degraded` 且限时风险接受成立时允许受控推进，不能被改写成无条件通过。

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

## 轻量端到端示例

场景：只改一处用户可见文案，不改变公共契约、权限、数据或发布配置。本例目标环境即 `preview`；以下交接共享 `work_unit_id=copy-001`、`reference_version=copy-001-v1`、`environment=preview`，角色交接均有 `handoff_result=accepted`；证据的观察时间和结果等字段按统一模板补齐：

| 交接 | 状态 / 版本 | 证据 | 允许 / 禁止 | 下一步 / 退出条件 |
| --- | --- | --- | --- | --- |
| `req -> dev` | `confirmed` | `REQ-1@requirements.md#AC-1` | 改动限定于文案 / 改公共契约 | `dev` / 验收 ID 已确认 |
| `dev -> cr` | `ready_for_cr` | `DEV-1@diff-review; DEV-2@self-test` | 审查变更 / 声称 QA 或发布通过 | `cr` / 自测通过 |
| `cr -> qa` | `ready_for_qa` | `CR-1@review-log; IMP-1@impact-analysis` | 按影响范围测试 / 跳过阻断项 | `qa` / 无阻断 |
| `qa -> dp` | `qa_passed` | `QA-1@test-report` | 做发布预检 / 直接发布 | `dp` / 当前版本和环境通过 |
| `dp -> 用户` | `ready` | `DP-1@preflight; AUTH-PATH-1@authorization-path` | 用户授权后发布 / AI 代发 | 用户发布 / 观察窗口 `verified` |
| 用户发布 | `deploying -> deployed -> verified` | `AUTH-1@final-approval; OBS-1@target-health` | 受控观察 / 观察前扩大放量 | 用户 / 目标环境观察窗口通过 |

进入 `ready` 时，快照四类门禁均为 `pass` 且 `active_p0_p1=[]`。`dp -> 用户` 的 `accepted` 只表示交付报告已接收，不代替发布授权。若提升到其他目标环境，必须先建立该环境的新门禁快照并按环境变化重新核验；仅目标环境变化、`work_unit_id`/`reference_version` 不变且已证明 `cr`/`qa` 结论对新环境仍适用时，记录 `needs_revalidation` 并以 `resume_state=ready` 恢复；`cr` 适用性无法证明时回 `ready_for_cr`，`cr` 仍适用但 QA 适用性无法证明时回 `ready_for_qa`，需求、实现、契约、权限、安全、数据或其他上游基线受影响时回 `planned`，不得复用 `preview` 证据。观察窗口结束前保持 `recovering`，仅目标环境四门禁通过、无活动 P0/P1 且观察通过后才转 `verified`/`healthy`。若 QA 为 `qa_conditional`，只有用户限时接受、`degraded` 快照、补偿控制/有效期和 `dp` 预检齐全时才可到 `ready`；例如 QA 证据失效时记录 `revalidation_from=qa_conditional`、`invalidated_by=[qa_evidence]`、`resume_state=ready_for_qa`，重新回到受影响门禁。

冲突按安全与数据一致性优先：冻结争议范围，保留无争议范围，记录双方证据、裁决者与下一步。任何风险接受、Go/No-Go 和生产发布由用户或授权方作最终决定。

角色进入自身职责后，先读取上游产物并核对 `status`、`version`、`updated_at`；只处理新增或变化范围，完成一轮验证后交接，不实现真实的无限监听。
