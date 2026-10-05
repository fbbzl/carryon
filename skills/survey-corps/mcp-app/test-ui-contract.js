"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appTemplate = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
const skill = fs.readFileSync(path.join(__dirname, "..", "SKILL.md"), "utf8");
const stateRoleLiteral = appTemplate.match(/const stateRole=\{([^}]*)\}/)?.[1] || "";

assert.match(appTemplate, /const roles=\["req","dev","cr","qa"\]/, "task flow must keep the fixed REQ -> DEV -> CR -> QA order");
assert.match(appTemplate, /data-sc-exit>QA · 唯一任务出口</, "QA must be the unique task exit");
assert.doesNotMatch(appTemplate, /data-sc-tree-gate|回到 SC|data-sc-state-reference|sc-task-view__console|data-sc-events|Session log/, "nonessential or post-QA views must not be rendered");
assert.match(appTemplate, /const explicit=roles\.filter\(role=>isActiveRoleStatus\(asObject\(details\[role\]\)\.status\)\); return explicit\.length\?explicit\.at\(-1\):\(stateRole\[state\]\|\|null\)/, "active role status must take precedence over the state mapping");
assert.match(appTemplate, /node\.open=active/, "only the resolved active role may be auto-expanded");
assert.match(appTemplate, /const active=role===activeRole/, "role cards must compare against one resolved active role");
assert.match(appTemplate, /querySelectorAll\("details\[data-sc-role\]\[open\]"\).*if \(node!==opened\) node\.open=false/, "opening one role must close every other role");
assert.match(appTemplate, /stateRole=\{dev_in_progress:"dev",ready_for_cr:"cr",ready_for_qa:"qa"\}/, "only uniquely attributable workflow states may map to an active role");
for (const state of ["confirmed", "planned", "cr_blocked", "qa_failed", "qa_conditional", "qa_passed", "workflow_ready", "needs_user_confirm", "needs_revalidation", "needs_revision", "blocked"]) {
  assert.doesNotMatch(stateRoleLiteral, new RegExp(`(?:^|,)${state}:`), `${state} must not guess an active role`);
}
assert.match(appTemplate, /detailField\(body,"摘要".*detailField\(body,"必要证据".*detailField\(body,"风险".*detailField\(body,"下一步"/, "role cards must contain only the compact task fields");
assert.doesNotMatch(appTemplate, /data-sc-field="resume_state"|data-sc-state-reference|复验入口/, "minimal UI must not render the state machine or resume_state");
assert.match(skill, /不展示状态机、状态参考集、复验入口或 `resume_state`/, "skill must keep resume_state authoritative but out of the UI");
assert.doesNotMatch(skill, /needs_revalidation` 时必须展示 `resume_state`/, "skill must not require resume_state rendering");
assert.match(skill, /handoffs: \[\].*权威交接记录.*仅用于状态或 handoff 更新动画 fingerprint.*不逐条展示/, "skill must keep handoffs authoritative but out of the minimal UI");
assert.doesNotMatch(skill, /handoffs: \[\].*每条均展示|handoffs?.*(session log|Session log|逐条展示其自身)/, "skill must not require handoff or session-log rendering");

console.log("SC minimal task-flow UI contract passed.");
