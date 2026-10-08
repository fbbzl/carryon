"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appTemplate = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
const skill = fs.readFileSync(path.join(__dirname, "..", "SKILL.md"), "utf8");
const stateRoleLiteral = appTemplate.match(/const stateRole=\{([^}]*)\}/)?.[1] || "";

assert.match(appTemplate, /const roles=\["req","dev","cr","qa"\]/, "task flow must retain the canonical role set");
assert.match(appTemplate, /selectedRoles\.length\?selectedRoles:roles/, "task flow must render selected roles in declared order");
assert.doesNotMatch(appTemplate, /data-sc-exit|sc-task-view__exit|QA · 唯一任务出口/, "QA exit must not render a separate node or retain its styles");
assert.match(appTemplate, /roleName\.textContent=roleLabels\[role\]/, "role titles must use the plain role label without a QA exit suffix");
assert.match(appTemplate, /data-sc-task-summary>暂无总结</, "task summary must default to no supplied summary");
assert.doesNotMatch(appTemplate, /任务上下文|data-sc-context/, "the task context panel must be removed from the view");
assert.match(appTemplate, /data-sc-selected-roles>尚未选择</, "the view must not infer all roles as selected");
assert.doesNotMatch(appTemplate, /sc-task-view__eyebrow|data-sc-field="project_name"|data-sc-field="view_id"|SURVEY CORPS \/|view_id:input\.view_id/, "the top metadata row and its project/view identifiers must not render");
assert.doesNotMatch(appTemplate, /SC \/ WORK UNIT/, "the work unit eyebrow must not render");
assert.match(appTemplate, /grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/, "the global status must occupy the center header column");
assert.match(appTemplate, /\.sc-task-view__status \{[^}]*font-size:18px/, "the global status must use larger type");
assert.match(appTemplate, /data-sc-field="state" aria-live="polite"[\s\S]*?header-controls/, "the global state must be a separate centered header item from debug controls");
assert.match(appTemplate, /@media \(max-width:560px\)[\s\S]*?\.sc-task-view__header \{ grid-template-columns:minmax\(0,1fr\)/, "the header must keep a responsive single-column layout on narrow screens");
assert.match(skill, /project_name:\s+# 可选；当前 Codex 会话所属项目名称，UI 不展示，不得猜测/, "the optional project name must remain in the snapshot contract without rendering");
assert.doesNotMatch(appTemplate, /data-sc-agent-name|sc-task-view__agent-name/, "subagent names must not render in role cards");
assert.match(appTemplate, /data-sc-play-animation hidden/, "animation replay is a hidden debug control by default");
assert.match(appTemplate, /data-sc-subskill-field|dataset\.scSubskillField/, "called subskills must expose their read-only fields");
assert.doesNotMatch(appTemplate, /data-sc-subskill-submit|data-sc-subskill-approve|data-sc-subskill-choice/, "subskill records must not imply a reply or approval channel");
assert.doesNotMatch(appTemplate, /data-sc-tree-gate|回到 SC|data-sc-state-reference|sc-task-view__console|data-sc-events|Session log/, "nonessential or post-QA views must not be rendered");
assert.match(appTemplate, /const explicit=roles\.filter\(role=>isActiveRoleStatus\(asObject\(details\[role\]\)\.status\)\); if \(explicit\.length\) return explicit\.at\(-1\); const mapped=stateRole\[state\]; return mapped&&!missing\(asObject\(details\[mapped\]\)\.status\)\?null:mapped\|\|null/, "explicit activity and completed role status must take precedence over the global state mapping");
assert.match(appTemplate, /node\.open=role===openRole/, "role expansion must follow the preserved or newly resolved open role");
assert.match(appTemplate, /const active=role===activeRole/, "role cards must compare against one resolved active role");
assert.match(appTemplate, /querySelectorAll\("details\[data-sc-role\]\[open\]"\).*if \(node!==opened\) node\.open=false/, "opening one role must close every other role");
assert.match(appTemplate, /userOpenRole=root\.querySelector\("details\[data-sc-role\]\[open\]"\)\?\.dataset\.scRole/, "rerender must capture the user's currently open role before replacing nodes");
assert.match(appTemplate, /root\.__scResolvedActiveRole===activeRole\?userOpenRole:activeRole/, "same active role must preserve the user's selection while a changed active role must follow the new snapshot");
assert.match(appTemplate, /root\.__scResolvedActiveRole=activeRole/, "rerender must remember the resolved active role for the next snapshot");
assert.match(appTemplate, /stateRole=\{dev_in_progress:"dev"\}/, "only an actively executing workflow state may map to an active role");
for (const state of ["confirmed", "planned", "ready_for_cr", "ready_for_qa", "cr_blocked", "qa_failed", "qa_conditional", "qa_passed", "workflow_ready", "needs_user_confirm", "needs_revalidation", "needs_revision", "blocked"]) {
  assert.doesNotMatch(stateRoleLiteral, new RegExp(`(?:^|,)${state}:`), `${state} must not guess an active role`);
}
assert.match(appTemplate, /detailField\(body,"摘要".*detailField\(body,"必要证据".*detailField\(body,"风险".*detailField\(body,"下一步"/, "role cards must contain only the compact task fields");
assert.doesNotMatch(appTemplate, /data-sc-field="resume_state"|data-sc-state-reference|复验入口/, "minimal UI must not render the state machine or resume_state");
assert.match(skill, /不展示状态机、状态参考集、复验入口或 `resume_state`/, "skill must keep resume_state authoritative but out of the UI");
assert.doesNotMatch(skill, /needs_revalidation` 时必须展示 `resume_state`/, "skill must not require resume_state rendering");
assert.match(skill, /handoffs: \[\].*权威交接记录.*不在 UI 中逐条展示/, "skill must keep handoffs authoritative but out of the minimal UI");
assert.doesNotMatch(skill, /handoffs: \[\].*每条均展示|handoffs?.*(session log|Session log|逐条展示其自身)/, "skill must not require handoff or session-log rendering");

for (const tone of ["pending", "active", "completed", "passed", "danger", "waiting", "revision", "unknown"]) assert.match(appTemplate, new RegExp(`sc-task-view__state--${tone} \\{[^}]*color:`), `${tone} must define a semantic status color`);
assert.match(appTemplate, /--unknown:#fff/, "unknown and missing status text must be white");
assert.match(appTemplate, /\.sc-task-view__empty \{ color:#fff/, "empty placeholders must be white");
assert.match(appTemplate, /\.sc-task-view__placeholder \{ color:#fff/, "all missing metadata must be white");
assert.match(appTemplate, /sc-task-view__connector::before/, "role connectors must retain an explicit vertical stem");
assert.match(appTemplate, /sc-task-view__connector::after/, "role connectors must render a downward arrowhead");
assert.match(appTemplate, /transform:rotate\(45deg\)/, "connector arrowhead must point downward");
assert.doesNotMatch(appTemplate, /sc-task-view__progress|role="progressbar"|任务进度：|progress-label/, "role cards must not render progress bars or percentages");
assert.match(appTemplate, /\.sc-task-view details\[data-sc-role\]\.is-active::before[^}]*animation:sc-thinking-border 8s linear infinite/, "only active role cards may show the subdued thinking border");
assert.match(appTemplate, /workflow_ready:"已通过"/, "the completed QA workflow state must display as passed in role cards");

console.log("SC minimal task-flow UI contract passed.");
