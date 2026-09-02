# carryon

本仓库是集体的编码纪律、工程标准和 AI 子代理协作剧本的知识库。

## 目录说明

> 注意：`skills/` 目录仅保留本仓库自研 skill。每个 skill 占一个子目录，以 `SKILL.md` 为入口，并使用 YAML frontmatter 描述元数据。

| 目录 | 用途 |
|---|---|
| `std/` | 编码标准与工程规范，按语言、框架、领域分类 |
| `skills/` | 本仓库自研的 AI 子代理协作剧本与流程 |

## 文件优先级

当本仓库规则与外部规则冲突时，优先级如下：

```
项目规则 / 用户指令 / AGENTS.md > 本仓库标准（std/）> 通用工程常识
```

## 如何使用

- 写 Java 项目：先看 `std/general.std`，再看 `std/java.std`，如果是 Spring Boot 项目加看 `std/spring.std`
- 写 API：参考 `std/api-design.std` + 语言标准
- 做代码审查：参考 `skills/cr/SKILL.md`
- 做测试与验收：参考 `skills/qa/SKILL.md`
- 需求分析：参考 `skills/req/SKILL.md`，完整流程见 `skills/survey-corps/SKILL.md`
- 全流程协作：参考 `skills/survey-corps/SKILL.md`

## std/ 文件索引

### 通用跨领域标准

- `std/general.std` — 通用编码原则
- `std/api-design.std` — API 设计规范
- `std/database.std` — 数据库设计规范
- `std/security.std` — 安全规范
- `std/git.std` — Git 使用规范
- `std/frontend.std` — 前端开发规范
- `std/devops.std` — DevOps 规范
- `std/logging.std` — 日志与可观测性规范

### 语言标准

- `std/java.std`
- `std/python.std`
- `std/go.std`
- `std/rust.std`
- `std/typescript.std`
- `std/csharp.std`
- `std/cpp.std`
- `std/kotlin.std`
- `std/scala.std`

### 框架标准

- `std/spring.std`
- `std/django.std`
- `std/fastapi.std`
- `std/nestjs.std`
- `std/react.std`
- `std/vue.std`
- `std/angular.std`
- `std/flutter.std`

## skills/ 文件索引

所有 skill 遵循统一发现约定：每个 skill 一个目录，内含带 YAML frontmatter 的 `SKILL.md`，至少提供 `name` 和 `description`。

### 自研 skill

- `skills/survey-corps/SKILL.md` — 调查兵团完整协作流程
- `skills/req/SKILL.md` — 需求代理剧本（含 AI 辅助文档能力）
- `skills/dev/SKILL.md` — 开发代理剧本（含工程开发规范）
- `skills/cr/SKILL.md` — 代码审查代理剧本（含 AI 辅助审查）
- `skills/qa/SKILL.md` — 测试代理剧本（含 AI 辅助测试生成）
- `skills/dp/SKILL.md` — 代码同步、发布预检、恢复建议与交付报告剧本（最终发布由用户或授权方执行）
- `skills/subskills/align-with-visuals/SKILL.md` — 需求可视化对齐流程
- `skills/subskills/grill-with-docs/SKILL.md` — 基于文档的高风险问题澄清
- `skills/subskills/refactor-with-goal/SKILL.md` — 高阶行为保持重构与等价证明流程
- `skills/subskills/review-with-goal/SKILL.md` — 单一优化目标的代码或设计审查流程
- `skills/subskills/test-with-goal/SKILL.md` — 单一行为或风险目标的测试流程
- `skills/subskills/sync-with-cherrypick/SKILL.md` — 已提交改动的精确跨分支搬运流程
- `skills/subskills/sync-with-merge/SKILL.md` — 异源分支合流与拓扑保留流程
- `skills/subskills/sync-with-rebase/SKILL.md` — 同源分支变基同步与可选推送流程
- `skills/subskills/sync-with-stash/SKILL.md` — 未提交改动的本地任务包同步流程

## 维护原则

- 新增标准时，保持与现有文件格式一致
- 跨语言通用的规则优先放在 `std/general.std`
- 框架特定的规则放在 `std/<framework>.std`
- 语言标准文件引用通用标准，避免重复描述
- 技能文件保持精炼，完整流程以 `skills/survey-corps/SKILL.md` 为准

## Skill 校验

修改 Skill 后运行：`pwsh -File skills/validate-skills.ps1`。
