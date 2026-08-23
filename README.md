# coding-skill

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

- 写 Java 项目：先看 `std/general.md`，再看 `std/java.md`，如果是 Spring Boot 项目加看 `std/spring.md`
- 写 API：参考 `std/api-design.md` + 语言标准
- 做代码审查：参考 `skills/cr/SKILL.md`
- 做测试与验收：参考 `skills/qa/SKILL.md`
- 需求分析：参考 `skills/req/SKILL.md`，完整流程见 `skills/survey-corps/SKILL.md`
- 全流程协作：参考 `skills/survey-corps/SKILL.md`

## std/ 文件索引

### 通用跨领域标准

- `std/general.md` — 通用编码原则
- `std/api-design.md` — API 设计规范
- `std/database.md` — 数据库设计规范
- `std/security.md` — 安全规范
- `std/git.md` — Git 使用规范
- `std/frontend.md` — 前端开发规范
- `std/devops.md` — DevOps 规范
- `std/logging.md` — 日志与可观测性规范

### 语言标准

- `std/java.md`
- `std/python.md`
- `std/go.md`
- `std/rust.md`
- `std/typescript.md`
- `std/csharp.md`
- `std/cpp.md`
- `std/kotlin.md`
- `std/scala.md`

### 框架标准

- `std/spring.md`
- `std/django.md`
- `std/fastapi.md`
- `std/nestjs.md`
- `std/react.md`
- `std/vue.md`
- `std/angular.md`
- `std/flutter.md`

## skills/ 文件索引

所有 skill 遵循统一发现约定：每个 skill 一个目录，内含带 YAML frontmatter 的 `SKILL.md`，至少提供 `name` 和 `description`。

### 自研 skill

- `skills/survey-corps/SKILL.md` — 调查兵团完整协作流程
- `skills/openspec/SKILL.md` — OpenSpec 使用协议
- `skills/req/SKILL.md` — 需求代理剧本（含 AI 辅助文档能力）
- `skills/dev/SKILL.md` — 开发代理剧本（含工程开发规范）
- `skills/refactor/SKILL.md` — 行为保持的受控实现重构
- `skills/cr/SKILL.md` — 代码审查代理剧本（含 AI 辅助审查）
- `skills/qa/SKILL.md` — 测试代理剧本（含 AI 辅助测试生成）
- `skills/dp/SKILL.md` — 发布预检、恢复建议与交付报告剧本（最终发布由用户或授权方执行）
- `skills/sync-with-rebase/SKILL.md` — 提交、变基同步与受控推送流程
- `skills/grill-with-docs/SKILL.md` — grill-me 替代方案，结合文档上下文做决策树追问

## 维护原则

- 新增标准时，保持与现有文件格式一致
- 跨语言通用的规则优先放在 `std/general.md`
- 框架特定的规则放在 `std/<framework>.md`
- 语言标准文件引用通用标准，避免重复描述
- 技能文件保持精炼，完整流程以 `skills/survey-corps/SKILL.md` 为准
