---
name: sync-with-rebase
description: "Use when dp needs to rebase the current working branch onto a specified upstream baseline. Do not use to merge independent histories, move selected commits or uncommitted files, push directly to the baseline branch, or resolve conflicts automatically."
metadata:
  version: 1.2.2
  type: agent-skill
  scope: software-engineering
  tags: [git, rebase, sync, dp, workflow]
  author: carryon
---

# sync-with-rebase

仅由 `dp` 选择本 Skill，将当前工作分支 rebase 到用户指定的同源基线。它可在请求明确包含 commit 时先提交当前分支自身的范围内改动，但不把未提交文件搬到另一分支；请求包含 push 时才推送当前分支。它不构成发布授权，也不向基线分支直接写入。

## 必要输入

- 当前工作分支、基线远端 `<baseline-remote>` 和目标分支；请求包含 push 时再提供推送远端或 upstream。
- 工作树存在本地改动时，请求必须明确授权先提交并提供精确文件范围和符合项目约定的信息；否则停止。
- 请求包含 push 时明确推送目标；远端历史重写仍需单独授权 `--force-with-lease`。

## 安全流程

1. 读取 `git status`、当前分支和远端配置；存在进行中的 merge/rebase/cherry-pick/bisect 时停止。当前分支为受保护分支时停止，除非用户明确要求且项目规则允许。
2. 工作树有改动时，只在请求明确包含 commit 且全部改动属于授权范围时暂存精确文件，检查暂存差异、运行 `git diff --cached --check` 和相关开发验证后提交；否则停止。记录 rebase 前 `<before-sha>`。
3. fetch 基线及本次涉及的已发布分支，解析最新 `<baseline-sha>`，用 `git merge-base <before-sha> <baseline-sha>` 记录 `<old-base>`；基线不存在、分叉点不唯一或待重放范围含 merge commit 时停止并交回 `dp` 选路。核对待重写提交的发布和依赖情况：已发布且他人依赖的历史禁止 rebase；无法确定依赖情况时停止确认，不把远端未包含当作无人依赖的证明。
4. 在当前工作分支执行 `git rebase <baseline-sha>`。基线只用于同步，不检出、不修改、不向其推送。
5. 用 `git range-diff <old-base>..<before-sha> <baseline-sha>..HEAD` 核对重放提交，逐个检查新提交的父子差异并运行本地验证；提交丢失或意外变化时停止。请求包含 push 时才推送；历史重写需单独授权并记录预期远端 SHA，使用 `git push --force-with-lease=<ref>:<expected-sha>`；远端变化或验证失败时停止。

## 冲突与退出条件

- 出现冲突、远端分支不存在、工作树含未授权改动或状态异常时立即停止；保留现场并报告当前状态、冲突文件或阻塞原因，以及 `--continue`、`--abort` 等可选后续动作。不得自行选择冲突语义。
- 成功时记录当前分支、目标基线、rebase 前后 SHA、验证结果和 push 状态。
- 不执行 merge、reset --hard、未经上述授权和显式 lease 保护的强制推送、删除分支或任何生产发布动作。
