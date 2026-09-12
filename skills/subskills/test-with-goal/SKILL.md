---
name: test-with-goal
description: "Use when QA needs to generate or execute tests for one explicit behavior or risk goal."
metadata:
  version: 1.6.0
  type: agent-skill
  scope: software-engineering
  tags: [qa, testing, goal, workflow]
  author: carryon
---

# test-with-goal

仅由 `qa` 在已确认需求、实现范围或待复测 Bug 明确时调用。它将一次独立测试收束为一个可验证目标，不替代 `qa` 的测试策略、`survey-corps` 状态或用户的发布授权。

## Goal

每个 Goal 复用当前 `work_unit_id`，记录目标行为或风险、当前版本与环境、测试预言机、范围、退出条件、证据和残余风险。需求、代码、环境、数据或夹具变化后，原证据只作历史参考。

## 执行

1. 根据剩余风险选择能独立验证它的最低测试层次，并准备可重复的数据或夹具。
2. 生成或更新必要测试资产并实际执行，记录命令、结果、版本、环境和未覆盖范围。
3. 发现不符合预言机的行为时，按 `qa` 剧本登记可复现 Bug；`dev` 修复后，复测原复现及受影响范围。
4. 按 `qa` 剧本输出 `pass`、`conditional` 或 `blocked`，不将局部结果扩大为整体验收或发布结论。

## 边界

- 覆盖率、性能、时限或其他指标只在验收条件或风险需要时度量，使用项目适用的工具；不得仅为采集指标改动构建配置。
- 不修改业务实现，不替代 `cr` 的审查、`dp` 的预检或用户的风险接受。
