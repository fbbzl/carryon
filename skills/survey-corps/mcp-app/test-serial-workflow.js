"use strict";
const assert = require("node:assert/strict");
const { startServer } = require("./test-stdio-helper");
const base = { view_id: "serial-regression", state: "dev_in_progress", work_unit: { roles: ["dev", "cr", "qa"] }, role_details: { dev: { status: "running" }, cr: { status: "pending" }, qa: { status: "pending" } } };
const next = { ...base, state: "ready_for_cr", role_details: { dev: { status: "completed" }, cr: { status: "running" }, qa: { status: "waiting" } } };
const conflict = { ...base, role_details: { dev: { status: " RUNNING " }, cr: { status: "in-progress" }, qa: { status: "working" } } };
const snapshots = [base, next, conflict];
let step = 0;
const { server, complete } = startServer({ onReply(reply) {
  if (step < 2) assert.ok(reply.result);
  else if (step === 2) {
    assert.equal(reply.error.code, -32602);
    assert.match(reply.error.message, /only one active role/);
  } else {
    assert.equal(reply.result.structuredContent.snapshot.role_details.cr.status, "running");
    assert.equal(reply.result.structuredContent.snapshot.role_details.qa.status, "waiting");
    complete();
    console.log("Serial workflow handoff, conflict rejection and preserved snapshot passed.");
    return;
  }
  step++;
  send();
} });
function send() {
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: step, method: "tools/call", params: { name: "show_sc_task_view", arguments: step < 3 ? { snapshot: snapshots[step] } : {} } }) + String.fromCharCode(10));
}
send();