---
name: sync-with-merge
description: "Use when the user explicitly authorizes merging two independently evolved branch lines and preserving their branch topology. Do not use for same-line synchronization, clean commit transfer, uncommitted file transfer, or automatic conflict resolution."
metadata:
  version: 1.0.1
  type: agent-skill
  scope: software-engineering
  tags: [git, merge, sync, dp, workflow]
  author: coding-skill
---

# sync-with-merge

把两条独立演进的分支线合流，并保留分叉拓扑。该流程只用于异源分支合并，不是同源追上游、精确提交搬运、本地未提交改动搬运或发布授权。

## 必要输入

- 当前分支、目标分支、来源分支，以及为什么必须保留分叉拓扑。
- 合并范围、已知冲突风险、允许执行的验证命令，以及是否允许后续 commit/push 的单独授权。
- 若目标分支是 `main`、`master` 或其他受保护分支，必须有额外明确授权。

## 安全流程

1. 读取 `git status`、当前分支和远端配置；merge 前要求工作树干净，且不存在进行中的 merge/rebase/cherry-pick/bisect。
2. 执行只读检查确认来源分支与目标分支不是同源上下游同步场景；若可以用 cherry-pick、stash 或 rebase 达成目标，优先改用对应 Skill。
3. 按用户授权 fetch 来源与目标分支，确认两边分支存在且没有被保护策略禁止本地合并。
4. 切到目标分支，确认其指向用户指定基线；需要更新目标分支时先按项目规则取得授权。
5. 执行 `git merge --no-ff <source-branch>`，保留分叉拓扑和来源分支上下文；不得为省事使用 merge 处理同源追上游。
6. 合并成功后运行 `git diff --check` 和用户授权的构建/检查命令；push 仍需用户单独明确授权。

## 冲突与退出条件

- 出现冲突、分支关系不清、目标分支不在指定基线、验证失败或保护策略阻断时立即停止；保留现场并报告当前分支、来源分支、冲突文件、已完成状态和 `--continue`、`--abort` 等可选后续动作。
- 成功时记录目标分支、来源分支、merge commit SHA、验证结果、保留拓扑的理由和未覆盖风险。
- 不执行 rebase、cherry-pick、stash、reset --hard、自动解冲突、强制推送、删除分支或任何生产发布动作。
