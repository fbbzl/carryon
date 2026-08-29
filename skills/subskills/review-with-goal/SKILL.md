---
name: review-with-goal
description: "Use when CR needs to review one explicit correctness, contract, security, data, performance, or maintainability goal before formal testing."
metadata:
  version: 1.3.0
  type: agent-skill
  scope: software-engineering
  tags: [cr, review, optimization, goal, workflow]
  author: coding-skill
---

# review-with-goal

## 适用边界

仅由 `cr` 在变更范围、基线和审查目标明确时调用。它把一次审查收束为一个 Goal，不替代 `cr` 剧本、`survey-corps` 状态机或用户发布授权。

`cr` 输出并复审静态审查项，不修改代码、不执行测试、不管理 Bug 生命周期；`dev` 修复实现，`qa` 管理可复现 Bug 与验收，`dp` 处理发布。

## Goal 定义

每个 Goal 绑定既有 `work_unit_id`、需求/代码版本和环境，并至少记录：

- `goal_id`、审查目标、影响范围、当前基线和退出条件；
- 审查证据、已覆盖/未覆盖范围和残余风险；
- 交给 `dev` 的验收条件、复审条件和下一行动。

Goal 是剧本内工作单元，不调用平台 Goal 工具，也不另建状态机。

## Goal 建立

从用户任务、变更范围和既有 `work_unit_id` 建立 Goal，写明审查目标、影响范围、当前基线和退出条件。输入已足以界定审查时直接取证；只有目标或范围存在会实质改变结论的歧义时才询问用户。

## 审查纪律

- 一个 Goal 只处理一个可验证的审查目标；“顺手清理”或未说明影响的建议不进入 Goal。
- 依目标从正确性、可读性、架构、安全、性能中选择相关维度取证；未取证的维度不扩大为结论。
- 审查证据必须对应当前变更、版本和环境；基线变化后，原 Goal 进入重审而非沿用旧结论。

## 执行闭环

1. 审查代码、契约、数据、安全、性能或兼容性证据，产出可验证的审查项。
2. 正确性、契约、安全和数据风险为阻断项；其余按高、中风险或建议分级。
3. 将证据、影响、验收条件和范围交给 `dev`；需要运行时复现或 Bug 生命周期时交给 `qa`。
4. `dev` 修复后，`cr` 按原 Goal 复审；通过后移交测试重点给 `qa`。
5. 退出时输出复审结论、非阻断项和残余风险，不输出 QA 或发布结论。

## 禁止动作

- 不修改实现、测试或发布配置，不生成或执行测试。
- 不登记、分派或关闭 Bug；运行行为由 `qa` 复现和定级。
- 不接受未消除的阻断项，不作发布预检、风险接受或最终 Go/No-Go 决定。
