"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { startServer } = require("./test-stdio-helper");

const template = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
const script = template.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = { window: {} };
vm.runInNewContext(script.replace(/\}\)\(\);\s*$/, "window.serialUnits={roleStatusText,resolveActiveRole};})();"), context);
const { roleStatusText, resolveActiveRole } = context.window.serialUnits;

assert.equal(roleStatusText("running"), "进行中");
assert.equal(roleStatusText(" RUNNING "), "进行中");
assert.equal(roleStatusText("waiting"), "等待中");
assert.equal(roleStatusText("pending"), "待开始");
assert.doesNotMatch(template, /rolePhases|rolePhaseText|预审中|测试准备中|等待审查通过|测试中/);
assert.match(template, /status\.textContent=roleStatusText\(detail\.status\)/, "role title must render from status only");

const details = { dev: { status: "completed" }, cr: { status: "running" }, qa: { status: "pending" } };
assert.equal(resolveActiveRole(details, "ready_for_cr", ["dev", "cr", "qa"]), "cr");
details.qa = { status: "working" };
assert.equal(resolveActiveRole(details, "ready_for_cr", ["dev", "cr", "qa"]), null, "multiple active roles must not be highlighted");
details.qa = { status: "pending" };
details.cr = { status: "pending" };
details.dev = {};
assert.equal(resolveActiveRole(details, "dev_in_progress", ["dev", "cr", "qa"]), "dev", "only the established DEV workflow state may supply a fallback");

const accepted = {
  view_id: "serial-status-regression",
  state: "ready_for_cr",
  work_unit: { work_unit_id: "serial-status-regression", roles: ["dev", "cr", "qa"] },
  role_details: { dev: { status: "completed" }, cr: { status: "running", summary: "CR active" }, qa: { status: "pending" } },
};
const conflict = structuredClone(accepted);
conflict.role_details.qa.status = "working";

async function serverContract() {
  let requestId = 0;
  const pending = new Map();
  const session = startServer({ timeoutMs: 5000, onReply(reply) {
    const request = pending.get(reply.id);
    assert.ok(request, "unexpected stdio response");
    pending.delete(reply.id);
    request.resolve(reply);
  } });
  const call = args => {
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      session.server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name: "show_sc_task_view", arguments: args } }) + "\n");
    });
  };
  try {
    const first = await call({ snapshot: accepted });
    assert.equal(first.error, undefined);
    const rejected = await call({ snapshot: conflict });
    assert.equal(rejected.error.code, -32602);
    assert.match(rejected.error.message, /only one active role/);
    const restored = await call({});
    const snapshot = restored.result.structuredContent.snapshot;
    assert.equal(snapshot.state, accepted.state);
    assert.equal(snapshot.role_details.cr.status, "running");
    assert.equal(snapshot.role_details.cr.summary, "CR active");
    assert.equal(snapshot.role_details.qa.status, "pending");
    console.log("Serial status units and conflict snapshot preservation passed.");
  } finally {
    session.complete();
    for (const request of pending.values()) request.reject(new Error("test session ended"));
  }
}

serverContract().catch(error => { console.error(error); process.exitCode = 1; });
