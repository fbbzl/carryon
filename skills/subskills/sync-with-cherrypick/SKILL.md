---
name: sync-with-cherrypick
description: "Use when the user explicitly authorizes copying one or more existing clean commits onto another branch with git cherry-pick. Do not use for uncommitted changes, whole-branch synchronization, merge commits, or automatic conflict resolution."
metadata:
  version: 1.0.0
  type: agent-skill
  scope: software-engineering
  tags: [git, cherry-pick, sync, dp, workflow]
  author: coding-skill
---

# sync-with-cherrypick

把已经提交且粒度干净的改动精确搬运到目标分支。该流程用于跨分支复制提交，不表示发布授权，不创建 merge commit，也不替代 rebase 或 stash 的适用场景。

## 必要输入

- 源分支、目标分支和按顺序排列的提交 SHA 列表。
- 每个提交的目的、影响范围、是否包含 merge commit，以及目标分支是否已包含等价改动。
- 允许执行的验证命令；commit/push 仍需用户单独明确授权。

## 安全流程

1. 读取 `git status`、当前分支和远端配置；工作树不干净或存在进行中的 merge/rebase/cherry-pick/bisect 时停止。
2. 用 `git show --stat <sha>` 或等价只读命令核对提交范围；包含 merge commit、回滚提交、版本发布提交或无关混合改动时停止并请用户拆分或改用其他流程。
3. 切到目标分支并按用户授权更新目标分支；受保护分支需额外确认。
4. 按用户给定顺序执行 `git cherry-pick <sha>`；多个提交保持原顺序，不压缩、不重写提交信息，除非用户明确要求。
5. 每个提交应用后检查状态；全部完成后运行 `git diff --check` 和用户授权的构建/检查命令。

## 冲突与退出条件

- 出现冲突、空 cherry-pick、目标分支已有等价改动或验证失败时立即停止；保留现场并报告当前提交、冲突文件、已完成提交和 `--continue`、`--abort` 等可选后续动作。
- 成功时记录目标分支、新提交 SHA、源提交 SHA、验证结果和未覆盖风险。
- 不执行 merge、rebase、reset --hard、自动解冲突、强制推送、删除分支或任何生产发布动作。
