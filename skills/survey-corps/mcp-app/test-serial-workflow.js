"use strict";
const assert = require("node:assert/strict");
const { startServer } = require("./test-stdio-helper");
const base = { view_id: "serial-regression", state: "dev_in_progress", work_unit: { roles: ["dev", "cr", "qa"] }, role_details: { dev: { status: "running" }, cr: { status: "pending" }, qa: { status: "pending" } } };
const next = { ...base, state: "ready_for_cr", role_details: { dev: { status: "passed" }, cr: { status: "running" }, qa: { status: "pending" } } };
const conflict = { ...base, role_details: { dev: { status: "running" }, cr: { status: "running" }, qa: { status: "pending" } } };
const qa = { ...base, state: "needs_user_confirm", role_details: { dev: { status: "passed" }, cr: { status: "passed" }, qa: { status: "running" } } };
const snapshots = [{ snapshot: base }, { snapshot: next }, { snapshot: qa }, { snapshot: conflict, error: /only one active role/ }, {}];
for (const status of ["pending", "running", "blocked", "needs_user_confirm", undefined]) {
  snapshots.push({ snapshot: { ...qa, role_details: { dev: { status: "passed" }, cr: status === undefined ? {} : { status }, qa: { status: "running" } } }, error: status === "running" ? /only one active role/ : /QA can run only when selected CR has passed/ }, {});
}
for (const roles of [["dev", "qa"], ["qa"], "qa"]) {
  snapshots.push({ snapshot: { ...qa, work_unit: { roles } }, error: /QA can run only when selected CR has passed/ }, {});
}
snapshots.push({ snapshot: { ...qa, role_details: { dev: { status: "passed" }, qa: { status: "running" } } }, error: /QA can run only when selected CR has passed/ }, {});
let step = 0;
let latest;
const { server, complete } = startServer({ onReply(reply) {
  const current = snapshots[step];
  if (current.error) {
    assert.equal(reply.error.code, -32602);
    assert.match(reply.error.message, current.error);
  } else if (current.snapshot) {
    assert.ok(reply.result);
    latest = reply.result.structuredContent.snapshot;
  } else {
    assert.deepEqual(reply.result.structuredContent.snapshot, latest, "rejected role transitions must preserve the last valid snapshot and all elapsed metrics");
  }
  if (++step === snapshots.length) {
    complete();
    console.log("Serial workflow handoff, CR prerequisite rejection and preserved snapshot passed.");
    return;
  }
  send();
} });
function send() {
  const current = snapshots[step];
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: step, method: "tools/call", params: { name: "show_sc_task_view", arguments: current.snapshot ? { snapshot: current.snapshot } : {} } }) + String.fromCharCode(10));
}
send();
