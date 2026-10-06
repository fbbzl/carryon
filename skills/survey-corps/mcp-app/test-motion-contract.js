const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appTemplate = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");

assert.match(appTemplate, /if \(!previous\) playEntranceEffects\(root,cleanups\)/, "first render must trigger entrance effects");
assert.match(appTemplate, /root\.matches\("\.sc-task-view"\)\?root:root\.querySelector\("\.sc-task-view"\)/, "entrance effects must target the MCP App view root");
assert.match(appTemplate, /previous\.state!==state/, "snapshot state changes must trigger an update effect");
assert.match(appTemplate, /previous\.handoffs!==current\.handoffs/, "handoff changes must trigger a flow effect");
assert.match(appTemplate, /activeRoleStates=new Set\(\["running","preparing","in_progress"/, "active role states must include the required statuses");
assert.match(appTemplate, /details\.is-active \{[^}]*animation:sc-active-role/, "active roles must have a persistent visual effect");
assert.match(appTemplate, /details\.sc-task-view__node\.is-manual-replay \{[^}]*animation:sc-manual-role/, "manual replay must outrank active role animation by selector specificity");
assert.match(appTemplate, /@media \(prefers-reduced-motion:reduce\).*animation:none !important; transition:none !important;/, "reduced motion must disable animation and transitions");
assert.match(appTemplate, /is-connection-entering \.sc-task-view__connector \{ animation:sc-connection-enter/, "fixed-flow connectors must animate on entrance");
assert.match(appTemplate, /\.sc-task-view__connector::before[^}]*background:currentColor/, "connector stem must follow the flow color");
assert.match(appTemplate, /\.sc-task-view__connector::after[^}]*transform:rotate\(45deg\)/, "connector arrowhead must point down");
assert.match(appTemplate, /data-sc-play-animation[^>]*aria-label="播放任务视图动画"/, "task view must expose an accessible animation replay button");
assert.match(appTemplate, /button\.addEventListener\("click",onClick\)/, "animation replay button must have a click handler");
assert.match(appTemplate, /prefersReducedMotion\(\)\) return;.*playEntranceEffects\(root,cleanups\).*is-manual-replay/s, "manual replay must respect reduced motion and replay the flow plus active role effect");
assert.match(appTemplate, /root\.__scManualMotionCleanup\?\.\(\); root\.__scManualMotionCleanup=undefined;/, "manual replay must cancel the previous replay before starting");
assert.match(appTemplate, /view\?\.classList\.remove\("is-entering"\); flow\?\.classList\.remove\("is-connection-entering"\); void root\.offsetWidth; view\?\.classList\.add\("is-entering"\); flow\?\.classList\.add\("is-connection-entering"\)/, "replayed entrance effects must restart after forcing layout");

console.log("SC task view motion contract passed.");
