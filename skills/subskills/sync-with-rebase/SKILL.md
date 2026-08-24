---
name: sync-with-rebase
description: "Use when the user explicitly authorizes committing scoped local work, rebasing the current working branch onto a specified remote branch, and pushing the current branch. Do not use to merge, push directly to the target branch, or resolve rebase conflicts automatically."
metadata:
  version: 1.0.0
  type: agent-skill
  scope: software-engineering
  tags: [git, rebase, sync, dp, workflow]
  author: coding-skill
---

# sync-with-rebase

将当前工作分支同步到用户指定的远端基线：提交已授权的本地改动，更新 `origin/<target-branch>`，将当前分支 rebase 到该基线，再推送当前分支。它是版本控制同步流程，不构成发布授权，也不向目标分支直接写入。

## 必要输入

- 当前工作分支与指定的目标分支。
- 本次允许提交的精确文件范围，以及符合项目约定的 Conventional Commit 信息。
- 对推送的明确授权；若当前分支已推送且 rebase 后需要重写历史，还需要对 `--force-with-lease` 的单独明确授权。

## 安全流程

1. 读取 `git status`、当前分支和远端配置。当前分支为 `main`、`master` 或其他受保护分支时停止，除非用户明确要求且项目规则允许。
2. 仅暂存已授权文件，执行 `git diff --check`，再创建本地提交；没有改动时不创建空提交。
3. 执行 `git fetch origin <target-branch>`，确认 `origin/<target-branch>` 存在且没有进行中的 merge、rebase、cherry-pick 或 bisect。
4. 在当前工作分支执行 `git rebase origin/<target-branch>`。指定分支只作为同步基线，不检出、不修改、不向其推送。
5. rebase 成功后先尝试正常推送当前分支。若因历史重写而被拒绝，停止并说明差异；只有取得单独授权后才使用 `git push --force-with-lease`，绝不使用 `--force`。

## 冲突与退出条件

- 出现冲突、远端分支不存在、工作树含未授权改动或状态异常时立即停止；保留现场并报告当前状态、冲突文件或阻塞原因，以及 `--continue`、`--abort` 等可选后续动作。不得自行选择冲突语义。
- 成功时记录当前分支、目标基线、提交 SHA、rebase 结果和推送结果。
- 不执行 merge、reset --hard、强制推送、删除分支或任何生产发布动作。
