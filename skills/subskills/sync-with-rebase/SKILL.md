---
name: sync-with-rebase
description: "Use when dp needs to rebase the current working branch onto a specified upstream baseline. Do not use to merge independent histories, move selected commits or uncommitted files, push directly to the baseline branch, or resolve conflicts automatically."
metadata:
  version: 1.2.1
  type: agent-skill
  scope: software-engineering
  tags: [git, rebase, sync, dp, workflow]
  author: carryon
---

# sync-with-rebase

仅由 `dp` 选择本 Skill，将当前工作分支 rebase 到用户指定的同源基线。它可在请求明确包含 commit 时先提交当前分支自身的范围内改动，但不把未提交文件搬到另一分支；请求包含 push 时才推送当前分支。它不构成发布授权，也不向基线分支直接写入。

## 图示对齐

当当前分支、上游基线或历史重写影响难以线性说明时，可用 Mermaid 或 ASCII 字符图辅助对齐；图示不替代基线核对、冲突处理或验证结果。

## 必要输入

- 当前工作分支、基线远端 `<baseline-remote>` 和目标分支；请求包含 push 时再提供推送远端或 upstream。
- 工作树存在本地改动时，请求必须明确授权先提交并提供精确文件范围和符合项目约定的信息；否则停止。
- 请求包含 push 时明确推送目标；远端历史重写仍需单独授权 `--force-with-lease`。

## 安全流程

1. 读取 `git status`、当前分支和远端配置。当前分支为 `main`、`master` 或其他受保护分支时停止，除非用户明确要求且项目规则允许。
2. 工作树有改动时，只在请求明确包含 commit 时暂存指定文件、运行 `git diff --check` 并创建提交；否则停止。
3. 执行 `git fetch <baseline-remote> <target-branch>`，确认 `<baseline-remote>/<target-branch>` 存在且没有进行中的 merge、rebase、cherry-pick 或 bisect。
4. 在当前工作分支执行 `git rebase <baseline-remote>/<target-branch>`。指定分支只作为同步基线，不检出、不修改、不向其推送。
5. rebase 成功后运行本地验证。请求包含 push 时再向指定远端或当前 upstream 推送；若因历史重写被拒绝，停止并说明差异，只有取得单独授权后才使用 `git push --force-with-lease`，绝不使用 `--force`。

## 冲突与退出条件

- 出现冲突、远端分支不存在、工作树含未授权改动或状态异常时立即停止；保留现场并报告当前状态、冲突文件或阻塞原因，以及 `--continue`、`--abort` 等可选后续动作。不得自行选择冲突语义。
- 成功时记录当前分支、目标基线、rebase 前后 SHA、验证结果和 push 状态。
- 不执行 merge、reset --hard、强制推送、删除分支或任何生产发布动作。
