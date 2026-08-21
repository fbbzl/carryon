---
name: review-with-goal
description: "Use when CR needs to review one explicit code or design optimization goal before formal testing."
metadata:
  version: 1.1.0
  type: agent-skill
  scope: software-engineering
  tags: [cr, review, optimization, goal, workflow]
  author: coding-skill
---

# review-with-goal

## 适用边界

仅由 `cr` 在变更范围、基线和优化目标明确时调用。它把一次审查收束为一个优化 Goal，不替代 `cr` 剧本、`survey-corps` 状态机或用户发布授权。

`cr` 只提出并复审优化项，不提 Bug、不修改业务代码、不生成或执行测试。`dev` 独占优化实现；`qa` 决定测试、Bug 与验收；`dp` 只处理发布预检与运行观察。

## Goal 定义

每个 Goal 绑定既有 `work_unit_id`、需求/代码版本和环境，并至少记录：

- `goal_id`、优化目标、影响范围、当前基线和退出条件；
- 审查证据、已覆盖/未覆盖范围和残余风险；
- 交给 `dev` 的验收条件、复审条件和下一行动。

Goal 是剧本内工作单元，不调用平台 Goal 工具，也不另建状态机。

## 审查纪律

- 一个 Goal 只处理一个可说明收益的优化目标；“顺手清理”或未说明影响的建议不进入 Goal。
- 依目标从正确性、可读性、架构、安全、性能中选择相关维度取证；未取证的维度不扩大为结论。
- 审查证据必须对应当前变更、版本和环境；基线变化后，原 Goal 进入重审而非沿用旧结论。

## 执行闭环

1. 审查代码、契约、数据、安全、性能或兼容性证据，只产出可验证的优化项。
2. 按影响标为必需或建议优化；安全、数据、契约或明确性能退化属于必需优化，未消除前不得进入正式测试。
3. 将每项优化的证据、影响、验收条件和范围交给 `dev`；不得以 Bug 形式登记或分派。
4. `dev` 完成优化后，`cr` 仅按原 Goal 的验收条件复审；通过后才移交测试重点给 `qa`。
5. Goal 退出时，输出优化复审结论、未关闭的建议优化项和残余风险；不输出 QA 或发布结论。

## 禁止动作

- 不修改实现、测试或发布配置，不生成或执行测试。
- 不登记、分派或关闭 Bug；运行行为是否构成 Bug 由 `qa` 决定。
- 不接受未消除的必需优化项，不作发布预检、风险接受或最终 Go/No-Go 决定。
