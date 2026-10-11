const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appTemplate = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");

assert.doesNotMatch(appTemplate, /is-entering|is-connection-entering|is-handoff-flow|is-state-updated/, "view, connector and state updates must not animate automatically");
assert.match(appTemplate, /activeRoleStates=new Set\(\["running","preparing","in_progress"/, "active role states must include the required statuses");
for (const status of ["running", "preparing", "in_progress", "working", "active", "started", "started_working"]) assert.match(appTemplate, new RegExp(`activeRoleStates=new Set\\(\\[[^\\]]*"${status}"`), `${status} must keep a role card active`);
assert.match(appTemplate, /details\[data-sc-role\]\.is-active \{[^}]*animation:sc-running-pulse 1\.8s ease-in-out infinite/, "an active role card must visibly pulse continuously");
assert.match(appTemplate, /@keyframes sc-running-pulse \{[^}]*box-shadow:[^}]*color-mix/s, "the active role pulse must animate a visible card shadow");
assert.match(appTemplate, /details\[data-sc-role\]\.is-active::before[^}]*animation:sc-thinking-border 8s linear infinite/, "only an active role may have a slow, subdued thinking border");
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

console.log("SC task view motion contract passed.");
