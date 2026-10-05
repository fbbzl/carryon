const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appTemplate = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
const fallbackTemplate = fs.readFileSync(path.join(__dirname, "..", "sc-task-view.html"), "utf8");

assert.equal(appTemplate, fallbackTemplate, "MCP App and fallback templates must stay identical");
assert.match(appTemplate, /if \(!previous\) playEntranceEffects\(root,cleanups\)/, "first render must trigger entrance effects");
assert.match(appTemplate, /root\.matches\("\.sc-task-view"\)\?root:root\.querySelector\("\.sc-task-view"\)/, "entrance effects must target the view in both fallback and MCP wrappers");
assert.match(appTemplate, /previous\.state!==state/, "snapshot state changes must trigger an update effect");
assert.match(appTemplate, /previous\.handoffs!==current\.handoffs/, "handoff changes must trigger a flow effect");
assert.match(appTemplate, /activeRoleStates=new Set\(\["running","preparing","in_progress"/, "active role states must include the required statuses");
assert.match(appTemplate, /details\.is-active \{ animation:sc-active-role/, "active roles must have a persistent visual effect");
assert.match(appTemplate, /@media \(prefers-reduced-motion:reduce\).*animation:none !important; transition:none !important;/, "reduced motion must disable animation and transitions");
assert.match(appTemplate, /pathLength="1"/, "connector paths must expose normalized length for drawing animation");

console.log("SC task view motion contract passed.");
