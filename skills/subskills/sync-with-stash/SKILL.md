---
name: sync-with-stash
description: "Use when dp needs to move scoped uncommitted local changes to another branch with a named git stash package. Do not use for committed changes, merge commits, stash pop, or automatic conflict resolution."
metadata:
  version: 1.3.1
  type: agent-skill
  scope: software-engineering
  tags: [git, stash, sync, dp, workflow]
  author: carryon
---

# sync-with-stash

仅由 `dp` 选择本 Skill，用本地任务包把未提交改动按精确文件同步到目标分支。stash 只是搬运载体，不是备份策略、合并历史或发布授权；commit 或 push 只有包含在用户请求中才执行。

## 图示对齐

当来源、目标与文件搬运边界难以线性说明时，可用 Mermaid 或 ASCII 字符图辅助对齐；图示不替代精确文件核对、冲突处理或验证结果。

## 必要输入

- 源分支、目标分支、精确文件列表、文件数量，以及每个文件的 tracked/untracked 状态。
- 规范 stash message：`type(scope): task=<任务号或需求名> | source=<源分支> | target=<目标分支> | files=N | purpose=<一句话目的>`。
- 目标分支是否允许 fast-forward 更新、与改动风险相称的本地验证，以及请求是否包含后续 commit 或 push。

## 安全流程

1. 读取 `git status`、当前分支和远端配置；当前分支或目标分支为受保护分支时停止，除非用户明确要求且项目规则允许。
2. 核对已授权文件与数量。无关改动或未跟踪文件可以保留，但必须与搬运文件不重叠，且已证明不会被切换目标分支覆盖或阻断；路径不清、存在重叠、无法证明安全，或有进行中的 merge/rebase/cherry-pick/bisect 时停止。
3. 仅含 tracked 文件时执行 `git stash push -m "<规范 message>" -- <精确文件列表>`；包含已授权 untracked 文件时加 `-u`。两种情况都使用精确 pathspec，禁止 `stash pop`。
4. 用 `git stash show -u --name-only '<stash>'` 核对文件数量与文件名；不一致时停止并保留 stash。
5. 切到目标分支；请求包含更新且能 fast-forward 时再更新。需要 rebase、merge 或其他历史整合时停止并交回 `dp` 重新选路，本 Skill 不嵌套其他同步流程。
6. 执行 `git stash apply '<stash>'`，随后对本次搬运文件运行 `git diff --check -- <精确文件列表>` 和与改动风险相称的本地验证，不把无关改动的结果归入本任务结论。

## 冲突与退出条件

- apply 冲突、目标分支不存在、文件数量不一致、工作树异常或验证失败时立即停止；报告当前分支、stash 名称、冲突文件、已应用状态和可选后续动作。
- 成功时记录源分支、目标分支、stash 名称、搬运文件、验证结果和是否仍保留 stash。
- 只有用户确认搬运无误后，才考虑 `git stash drop '<stash>'`；删除前再次说明将删除的 stash。
- 不执行 merge、reset --hard、stash pop、自动解冲突、强制推送、删除分支或任何生产发布动作。
