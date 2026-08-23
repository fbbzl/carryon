---
name: refactor
description: "Use when a confirmed implementation task needs a small, behavior-preserving refactor to improve readability, structure, or maintainability. Do not use for new behavior, defect fixes, review conclusions, or test execution."
metadata:
  version: 1.0.0
  type: agent-skill
  scope: software-engineering
  tags: [refactor, maintainability, dev, workflow]
  author: coding-skill
---

# refactor

在不改变已确认外部行为的前提下，完成范围受控、可回退的实现重构。该 Skill 只服务于 `dev` 的实现工作，不替代 `cr` 的审查结论或 `qa` 的测试结论。

## 适用条件

- 目标是降低复杂度、消除重复、提取职责、改善命名或强化类型约束，且需求、API 契约、权限和数据语义不变。
- 已明确改动范围、预期保持的行为和受影响调用方；范围不明时先完成影响分析。
- 若同时需要新增功能、修复缺陷、修改公共契约、迁移数据或改变性能目标，回到 `dev` 的常规实现流程；必要时先使用 `openspec`。

## 工作方式

1. 记录重构目标、当前行为不变量、文件范围和不做事项。
2. 选择最小的可独立构建切片；不把无关格式化或顺带重命名混入改动。
3. 实施重构后检查 diff、构建与静态检查结果，确认公开接口、权限、错误语义和数据不变量未被改变。
4. 向 `cr` 交付变更、行为不变量、受影响范围、构建/静态检查证据及未验证风险；不得自行宣布审查或测试通过。

## 边界与退出条件

- 不生成或执行测试，不作代码审查、验收或发布结论。
- 不以“重构”为名扩大需求、删除兼容行为或跳过迁移/恢复设计。
- 当行为等价性无法从当前证据证明时，标记未验证范围并交给 `cr`、`qa` 决定后续验证。
- 退出时必须能说明：目标是否完成、保持的行为、实际改动文件、已知风险和下一步。
