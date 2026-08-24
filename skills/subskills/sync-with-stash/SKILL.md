---
name: sync-with-stash
description: "Use when the user explicitly authorizes moving scoped uncommitted local changes to another branch with a named git stash package. Do not use for committed changes, merge commits, stash pop, or automatic conflict resolution."
metadata:
  version: 1.0.0
  type: agent-skill
  scope: software-engineering
  tags: [git, stash, sync, dp, workflow]
  author: coding-skill
---

# sync-with-stash

用本地任务包把未提交改动按精确文件同步到目标分支。stash 只是搬运载体，不是备份策略、合并历史或发布授权；用户明确要求后才 commit 或 push。

## 必要输入

- 源分支、目标分支、本次允许搬运的精确文件列表和文件数量。
- 规范 stash message：`type(scope): task=<任务号或需求名> | source=<源分支> | target=<目标分支> | files=N | purpose=<一句话目的>`。
- 目标分支更新方式、允许执行的验证命令，以及是否允许后续 commit/push 的单独授权。

## 安全流程

1. 读取 `git status`、当前分支和远端配置；当前分支或目标分支为受保护分支时停止，除非用户明确要求且项目规则允许。
2. 核对工作树只包含已授权文件；存在未授权改动、未跟踪文件或进行中的 merge/rebase/cherry-pick/bisect 时停止。
3. 执行 `git stash push -m "<规范 message>" -- <精确文件列表>`，禁止使用 `git stash pop`。
4. 用 `git stash show --name-only '<stash>'` 核对文件数量与文件名；不一致时停止并保留 stash。
5. 切到目标分支，按用户授权获取远端更新；同源追上游优先使用 fast-forward 或 rebase，避免 merge commit。
6. 执行 `git stash apply '<stash>'`，随后运行 `git diff --check` 和用户授权的构建/检查命令。

## 冲突与退出条件

- apply 冲突、目标分支不存在、文件数量不一致、工作树异常或验证失败时立即停止；报告当前分支、stash 名称、冲突文件、已应用状态和可选后续动作。
- 成功时记录源分支、目标分支、stash 名称、搬运文件、验证结果和是否仍保留 stash。
- 只有用户确认搬运无误后，才考虑 `git stash drop '<stash>'`；删除前再次说明将删除的 stash。
- 不执行 merge、reset --hard、stash pop、自动解冲突、强制推送、删除分支或任何生产发布动作。
