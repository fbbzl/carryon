---
name: align-with-visuals
description: "Use when req needs a visual artifact to clarify requirements more efficiently than text alone."
metadata:
  version: 1.4.0
  type: agent-skill
  scope: software-engineering
  tags: [req, clarification, visualization, html, prototype, workflow]
  author: coding-skill
---

# align-with-visuals

`align-with-visuals` 是 `req` 的可视化对齐子技能。它把当前需求分歧变成可查看、比较或反馈的最小视觉产物；它不维护需求状态，也不把结论直接交给 `dev`。

## 启用与边界

- 仅由 `req` 在视觉表达能实质降低当前理解偏差时调用；文字已经足够时不生成产物。
- 高风险规则本身不清晰时先由 `req` 澄清来源和裁决，视觉展示不能把未确认内容变成事实。
- 本技能不替代需求状态、技术方案、实现、测试或发布结论。

## 工作方式

1. 读取当前需求版本、来源、范围、假设、开放问题和需要对齐的具体分歧；来源不足时返回 `req`。
2. 选择能消除该分歧的最小视觉形式，通常只生成一个主体视图；额外视图必须解决不同问题。
3. 默认产出 UTF-8、可独立查看的单文件 HTML，用户指定其他格式时服从用户要求。
4. 在产物中区分已确认事实、假设、开放问题和未覆盖范围，并关联来源、版本和适用范围。
5. 将产物、已验证/未验证范围和用户反馈返回 `req`；反馈不自动改变需求状态或触发外部操作。

## 质量与授权边界

- 只展示当前分歧所需内容，不保留装饰、占位模块或无来源数据。
- 多个视图共享的规则、状态和数据必须一致；差异视图只在存在上一有效版本且变化影响结论时生成。
- 选择控件只用于尚未决定且会影响范围、验收或风险的事项，已明确内容不重复确认。
- 产物默认本地运行，不发起未授权网络请求，不持久化反馈，不提交或写入外部系统。

## 返回给 req 的结果

```yaml
visual_alignment:
  work_unit_id:
  requirement_version:
  artifact:
  purpose:
  source_evidence: []
  verified_scope: []
  unverified_scope: []
  assumptions: []
  decision_items: []
  user_feedback: []
  next_action:
```

`confirmed`、验收、风险接受和需求版本更新均由 `req` 根据当前基线判定。
