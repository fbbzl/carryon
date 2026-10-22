const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appTemplate = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");

assert.doesNotMatch(appTemplate, /is-entering|is-connection-entering|is-handoff-flow|is-state-updated/, "view, connector and state updates must not animate automatically");
assert.match(appTemplate, /activeRoleStates=new Set\(\["running","preparing","in_progress"/, "active role states must include the required statuses");
for (const status of ["running", "preparing", "in_progress", "working", "active", "started", "started_working"]) assert.match(appTemplate, new RegExp(`activeRoleStates=new Set\\(\\[[^\\]]*"${status}"`), `${status} must keep a role card active`);
assert.match(appTemplate, /details\[data-sc-role\]\.is-active \{[^}]*animation:sc-running-pulse 1\.6s ease-in-out infinite/, "an active role card must visibly pulse continuously at the requested faster cadence");
assert.match(appTemplate, /@keyframes sc-running-pulse \{[^}]*box-shadow:0 0 0 1px[^}]*/s, "the active role pulse must retain a visible resting glow");
assert.match(appTemplate, /50% \{ box-shadow:0 0 0 5px[^}]*0 0 26px/s, "the active role pulse must reach a pronounced card glow");
assert.doesNotMatch(appTemplate, /sc-thinking-border|details\[data-sc-role\]\.is-active::before/, "role cards must not render a rotating geometric border effect");
assert.doesNotMatch(appTemplate, /details\[data-sc-role\]::before[^}]*animation:/, "idle roles must not animate");
assert.match(appTemplate, /details\.sc-task-view__node\.is-manual-replay \{[^}]*animation:sc-manual-role/, "debug replay must be scoped to a role card");
assert.match(appTemplate, /@media \(prefers-reduced-motion:reduce\).*animation:none !important; transition:none !important;/, "reduced motion must disable animation and transitions");
assert.doesNotMatch(appTemplate, /\.sc-task-view__connector[^}]*animation:/, "flow connectors must not animate automatically");
assert.match(appTemplate, /\.sc-task-view__connector::before[^}]*background:currentColor/, "connector stem must follow the flow color");
assert.match(appTemplate, /\.sc-task-view__connector::after[^}]*transform:rotate\(45deg\)/, "connector arrowhead must point down");
assert.match(appTemplate, /data-sc-play-animation[^>]*aria-label="播放任务视图动画"/, "task view must expose an accessible animation replay button");
assert.match(appTemplate, /button\.addEventListener\("click",onClick\)/, "animation replay button must have a click handler");
assert.match(appTemplate, /prefersReducedMotion\(\)\) return;.*animateOnce\(root\.querySelector\("details\.is-active"\),"is-manual-replay"/s, "debug replay must respect reduced motion and target only an active role");
assert.match(appTemplate, /root\.__scManualMotionCleanup\?\.\(\); root\.__scManualMotionCleanup=undefined;/, "manual replay must cancel the previous replay before starting");
assert.match(appTemplate, /\.sc-task-view__node \{[^}]*transition:box-shadow 160ms ease,transform 160ms ease/, "cards must use a short hover transition");
assert.match(appTemplate, /\.sc-task-view summary \{[^}]*transition:background-color 160ms ease/, "summaries must transition their hover state");
assert.match(appTemplate, /border-radius:6px/, "card corners must remain restrained");

console.log("SC task view motion contract passed.");
