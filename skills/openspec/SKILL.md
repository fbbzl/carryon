---
name: openspec
description: "Use when planning a new module or a material API, database, permission, transaction, cache, messaging, compatibility, or cross-service change before implementation."
metadata:
  version: 1.0.3
  type: agent-skill
  scope: software-engineering
  tags: [dev, specification, agent, workflow]
  author: coding-skill
---

# OpenSpec 使用协议

## 何时必须使用 OpenSpec

0. 新增模块
1. 修改公共 API
2. 修改数据库结构
3. 修改权限、事务、缓存、MQ 行为
4. 做不兼容改动
5. 跨服务调用契约变更

## 输出格式

每个 OpenSpec 文档先提供以下 YAML 元数据；`status` 只能是 `draft` 或 `confirmed`：

```yaml
spec_id:
work_unit_id:
title:
status: draft
version:
updated_at:
confirmed_at:
owner: dev
reference_version:
source_artifacts: []
evidence: []
confirmation_evidence: []
impact_chain: []
unverified_scope: []
open_questions: []
next_action:
```

`confirmation_evidence` 只定位当前会话、项目文档或既有产物中的确认内容，不要求账号、平台或固定人员字段，也不得生成 URL。`status=confirmed` 时该字段和 `confirmed_at` 必须有值，并能核对确认范围与当前 `version`；否则保持 `draft`。

正文必须包含以下 Markdown 章节；不触及的 API、数据库或非功能项明确写“不涉及”及判断依据，不能直接省略：

```markdown
## 目标与非目标

## 变更范围
### 新增
### 修改
### 废弃

## 方案、取舍与决策

## 影响链、兼容与恢复

## API 契约
### 接口列表
### 请求/响应模型
### 错误码
### 幂等性
### 权限

## 数据库变更
### 表结构
### 索引
### 迁移脚本
### 回滚方案
### 数据校验

## 非功能要求
### 性能
### 安全
### 兼容性
### 可观测性

## 任务拆分
## 验收标准
## 风险与依赖
```

## 流程

0. dev 识别到必须使用 OpenSpec 的变更
1. dev 起草 OpenSpec，标注状态为 `draft`
2. dev 与用户对齐方案，回答开放问题
3. 用户确认后记录 `confirmed_at` 与 `confirmation_evidence`，再将状态改为 `confirmed`
4. 开发实现必须严格按 OpenSpec 执行
5. 如实现中需调整 OpenSpec，先递增版本并退回 `draft`，旧确认随旧版本失效，重新确认后才能继续

## 最小压力示例

重大 API 或数据库变更仍有 `open_questions`、确认依据无法定位或用户未确认时，保持 `draft` 并禁止实现；开放问题关闭、影响链和恢复证据补齐，且当前版本的确认时间与依据可核验后，才转为 `confirmed`。

## 小型改动例外

不影响公共契约、数据库、权限、事务、缓存、MQ 的内部改动，可记录假设后直接推进。
