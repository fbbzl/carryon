---
name: test-with-goal
description: "Use when QA needs to generate or execute tests for one explicit behavior or risk goal."
metadata:
  version: 1.2.0
  type: agent-skill
  scope: software-engineering
  tags: [qa, testing, goal, workflow]
  author: coding-skill
---

# test-with-goal

## 适用边界

仅由 `qa` 在已确认需求、实现范围或待复测 Bug 明确时调用。它把一次测试工作收束为一个可验证 Goal，不替代 `qa` 剧本、`survey-corps` 状态机或用户发布授权。

`dev` 维护实现耦合的单元测试；`qa` 独占独立测试策略、集成/API/端到端/回归资产、正式执行、Bug 生命周期和验收结论；`cr` 不执行测试，`dp` 只消费结论。

## Goal 定义

每个 Goal 绑定既有 `work_unit_id`、需求/代码版本和环境，并至少记录：

- `goal_id`、目标行为或风险、测试预言机和退出条件；
- 已测范围、未测范围、数据/夹具和测试资产；
- 证据、观察时间、残余风险及下一行动。

Goal 是剧本内工作单元，不调用平台 Goal 工具，也不另建状态机。

## Goal 确认

开始测试前，必须与用户确认本次 Goal，至少明确目标行为或风险、测试范围、绑定环境和退出条件；得到用户明确同意后才能生成或执行测试。任务名称、既有 `work_unit_id` 或上游角色结论均不能替代该确认。

## 测试设计

- 先核验开发单元测试证据，再选择能够独立覆盖剩余风险的最低测试层次；用例验证可观察行为。
- 用例彼此独立，Mock 仅用于网络、数据库、时钟等系统边界；测试名称表达预期结果。
- 版本、环境、数据或夹具变化后，旧证据只可作为历史参考；当前结论必须基于本 Goal 的当前输入重新执行。

## 执行闭环

1. 根据目标选择最低足以独立覆盖风险的测试层次，并由 `qa` 生成或更新正式测试资产。
2. 在绑定环境和数据边界内执行测试，记录命令、结果、版本、环境与未覆盖范围。
3. 发现不符合预言机的行为时，`qa` 登记 Bug：复现步骤、预期/实际结果、影响范围、版本、环境和证据齐全后交给 `dev`。
4. `dev` 返回修复说明后，`qa` 复测原复现及受影响范围，并独占决定关闭或重开 Bug。
5. Goal 退出时，按 `qa` 剧本输出 `pass`、`conditional` 或 `blocked`；测试结论不等同于发布结论。

## 禁止动作

- 不修改业务实现，不代替 `cr` 做代码、安全或数据审查。
- 不将未复现的猜测登记为 Bug，不用局部绿灯扩大验收范围。
- 不作发布预检、风险接受或最终 Go/No-Go 决定。
