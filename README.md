# carryon

本仓库是集体的编码纪律、工程标准和 AI 子代理协作剧本的知识库。

## 目录说明

> 注意：`skills/` 目录仅保留本仓库自研 skill。每个 skill 占一个子目录，以 `SKILL.md` 为入口，并使用 YAML frontmatter 描述元数据。

| 目录 | 用途 |
|---|---|
| `init/` | 重装后恢复 D 盘开发环境，并在末尾启动 Windows 系统优化 |
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

## Codex 安装入口

将本仓库的 GitHub URL 交给支持仓库安装的 Codex 安装器，并要求：`安装 codex-install.json 中声明的所有 skills 和 MCP Apps`。安装器应按 `codex-install.json` 发现 `skills/**/SKILL.md`，再从 `.agents/plugins/marketplace.json` 安装 `survey-corps-task-view@carryon-local`。两步都需要用户授权；安装完成后重启 Codex（如客户端要求）。

清单路径：`codex-install.json`。它是本仓库的唯一安装入口，不依赖固定的本机绝对路径。无法读取该清单的客户端，可回退到从 `.agents/plugins/marketplace.json` 手动安装本地插件。

## Windows 重装后初始化

以管理员身份运行：

```powershell
cd D:\workspace\carryon\init
.\setup.ps1
```

脚本先恢复 D 盘开发工具与配置，再将 `init/windows-system-optimization/` 安装到 Codex skills 目录，并启动交互式 Codex 执行系统优化。系统修改会在会话中逐项确认。

- 只安装指定工具：`.\setup.ps1 -Tools @("git", "java", "maven", "vscode")`
- 跳过已有工具或 skill 更新：`.\setup.ps1 -SkipExisting`
- 只恢复开发环境：`.\setup.ps1 -SkipSystemOptimization`

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
- `skills/skill-eval/SKILL.md` — 按 B/E/C/S/V 标准对其他 skill 进行证据化评分
- `skills/create-apidocs/SKILL.md` — 从代码生成项目专属 API 文档
- `skills/humanity-tech-docs/SKILL.md` — 技术文档准确性审查与语言清理
- `skills/subskills/align-with-visuals/SKILL.md` — 需求可视化对齐流程
- `skills/subskills/bugfix/SKILL.md` — 已登记 Bug 的修复流程
- `skills/subskills/bug-cause/SKILL.md` — 已登记 Bug 的证据化根因分析流程
- `skills/subskills/grill-with-docs/SKILL.md` — 基于文档的高风险问题澄清
- `skills/subskills/optimize/SKILL.md` — 已审查优化项的实现流程
- `skills/subskills/refactor-with-goal/SKILL.md` — 高阶行为保持重构与等价证明流程
- `skills/subskills/review-with-goal/SKILL.md` — 单一优化目标的代码或设计审查流程
- `skills/subskills/test-with-goal/SKILL.md` — 单一行为或风险目标的测试流程
- `skills/subskills/tech-select/SKILL.md` — 技术选型与用户对齐流程

## 维护原则

- 新增标准时，保持与现有文件格式一致
- 跨语言通用的规则优先放在 `std/general.std`
- 框架特定的规则放在 `std/<framework>.std`
- 语言标准文件引用通用标准，避免重复描述
- 技能文件保持精炼，完整流程以 `skills/survey-corps/SKILL.md` 为准

## Skill 校验

修改 Skill 后运行：`pwsh -File skills/validate-skills.ps1`。
