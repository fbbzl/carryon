# carryon

团队共用的工程标准和 AI 协作 Skill。

## 内容

| 目录 | 用途 |
|---|---|
| `std/` | 通用、语言、框架和专项工程规范 |
| `skills/` | 本仓库维护的 AI 协作 Skill |

规则冲突时，按以下优先级处理：

```
项目规则 / 用户指令 / AGENTS.md > std/ > 通用工程常识
```

## 常用入口

- 开发项目：从 `std/general.std` 开始，再按语言和框架选择对应文件。
- 设计 API：`std/api-design.std`。
- 分析需求、开发、审查、测试：依次使用 `skills/req/`、`skills/dev/`、`skills/cr/`、`skills/qa/`。
- 执行完整协作流程：`skills/survey-corps/SKILL.md`。

`skills/` 中每个 Skill 都以带 YAML frontmatter 的 `SKILL.md` 为入口。标准与 Skill 的完整列表直接浏览对应目录即可。

## 安装到 Codex

将以下提示词粘贴给 Codex：

> 请从 `https://github.com/fbbzl/carryon` 安装 `codex-install.json` 中声明的所有 Skills 和 MCP Apps，并按提示完成授权与重新加载。

`codex-install.json` 是完整安装清单。

## 维护

- 跨语言规则放在 `std/general.std`，语言或框架规则放在各自文件中。
- 新增 Skill 时，保持一个目录对应一个 `SKILL.md` 的结构。
- 修改 Skill 后运行：`pwsh -File skills/validate-skills.ps1`。
