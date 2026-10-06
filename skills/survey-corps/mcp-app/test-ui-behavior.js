"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const chrome = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].find(fs.existsSync);
assert.ok(chrome, "Chrome is required for the SC UI behavior regression test");

const template = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-ui-behavior-"));
const page = path.join(temp, "test.html");
const profile = path.join(temp, "chrome-profile");
const snapshot = {
  view_id: "sc-task-view:QA-SC-MOTION-001",
  state: "ready_for_cr",
  work_unit: { work_unit_id: "QA-SC-MOTION-001", target: "accordion rerender", reference_version: "748c46b" },
  role_details: { req: { status: "completed" }, cr: { status: "running" }, qa: { status: "not_started" } },
  handoffs: [],
};
const harness = `<!doctype html><html><body><main id="root">${template}</main><script>
const root=document.getElementById("root");
let toggleAdds=0,toggleRemoves=0;
const add=root.addEventListener.bind(root),remove=root.removeEventListener.bind(root);
root.addEventListener=(type,listener,options)=>{if(type==="toggle")toggleAdds++;return add(type,listener,options)};
root.removeEventListener=(type,listener,options)=>{if(type==="toggle")toggleRemoves++;return remove(type,listener,options)};
const snapshot=${JSON.stringify(snapshot)};
const openRoles=()=>[...root.querySelectorAll("details[data-sc-role][open]")].map(node=>node.dataset.scRole);
window.renderSurveyCorpsTaskView(root,snapshot);
const initial=openRoles();
root.querySelector('details[data-sc-role="cr"]').open=false;
root.querySelector('details[data-sc-role="req"]').open=true;
window.renderSurveyCorpsTaskView(root,snapshot);
const sameSnapshot=openRoles();
const next=structuredClone(snapshot);next.state="ready_for_qa";next.role_details.cr.status="completed";next.role_details.qa.status="running";
window.renderSurveyCorpsTaskView(root,next);
const changedActive=openRoles(),stateBefore=root.querySelector('[data-sc-field="state"]').textContent;
root.querySelector("[data-sc-play-animation]").click();
const afterReplay=openRoles(),stateAfter=root.querySelector('[data-sc-field="state"]').textContent;
const result={initial,sameSnapshot,changedActive,afterReplay,stateBefore,stateAfter,toggleAdds,toggleRemoves,activeToggleListeners:toggleAdds-toggleRemoves};
document.body.dataset.scTestResult=JSON.stringify(result);
</script></body></html>`;

try {
  fs.writeFileSync(page, harness, "utf8");
  const run = spawnSync(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, "--window-size=360,900", "--dump-dom", new URL(`file:///${page.replaceAll("\\", "/")}`).href], { encoding: "utf8", timeout: 30000 });
  assert.equal(run.status, 0, run.stderr || "Chrome behavior test failed");
  const encoded = run.stdout.match(/data-sc-test-result="([^"]+)"/)?.[1];
  assert.ok(encoded, "Chrome did not emit the SC behavior result");
  const result = JSON.parse(encoded.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  assert.deepEqual(result.initial, ["cr"], "initial render must open the resolved CR role");
  assert.deepEqual(result.sameSnapshot, ["req"], "same snapshot must preserve the user's REQ selection");
  assert.deepEqual(result.changedActive, ["qa"], "changed active role must switch the open card to QA");
  assert.deepEqual(result.afterReplay, ["qa"], "animation replay must not change the accordion");
  assert.equal(result.stateAfter, result.stateBefore, "animation replay must not change task state");
  assert.equal(result.activeToggleListeners, 1, "rerender must leave exactly one accordion toggle listener");
  console.log("SC task view Chrome behavior regression passed.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
