"use strict";

const assert = require("node:assert/strict");
const { setTimeout: delay } = require("node:timers/promises");
const { startServer } = require("./test-stdio-helper");

// User requirement (P1): only selected roles with running status accrue time; global stops take precedence.
// Observe the public stdio tool, independently of the tracker's injected-clock unit tests.
const clients = [];
function client() {
  let nextId = 0;
  const pending = new Map();
  const session = startServer({
    timeoutMs: 15000,
    onReply(reply) {
      assert.ok(pending.has(reply.id), "unexpected stdio response");
      pending.get(reply.id).resolve(reply);
      pending.delete(reply.id);
    },
    onFailure(error) {
      for (const request of pending.values()) request.reject(error);
      pending.clear();
      console.error(error);
      process.exitCode = 1;
    },
  });
  const request = (args, customId) => new Promise((resolve, reject) => {
    const id = customId ?? ++nextId;
    pending.set(id, { resolve, reject });
    session.server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name: "show_sc_task_view", arguments: args } })}\n`);
  });
  const show = async snapshot => {
    const reply = await request(snapshot ? { snapshot } : {});
    assert.equal(reply.error, undefined, JSON.stringify(reply.error));
    return reply.result.structuredContent.snapshot;
  };
  const result = { request, show, complete: session.complete };
  clients.push(result);
  return result;
}

function task(viewId, state, statuses, metrics) {
  return {
    view_id: viewId,
    state,
    work_unit: { roles: ["dev", "qa"], ...(metrics ? { metrics } : {}) },
    role_details: Object.fromEntries(Object.entries(statuses).map(([role, status]) => [role, { status }])),
  };
}
const elapsed = snapshot => snapshot.work_unit.metrics.elapsed_ms;
const roleElapsed = (snapshot, role) => snapshot.role_details[role].metrics.elapsed_ms;

async function main() {
  const first = client();
  const knownViews = new Set();
  async function show(snapshot) {
    const result = await first.show(snapshot);
    if (snapshot?.work_unit) knownViews.add(snapshot.view_id);
    return result;
  }
  const a = "qa-elapsed-a";
  const planned = await show(task(a, "planned", { dev: "pending", qa: "pending" }));
  assert.equal(elapsed(planned), 0, "planned tasks automatically start at zero");
  assert.equal(roleElapsed(planned, "dev"), 0);

  await show(task(a, "dev_in_progress", { dev: "running", qa: "running" }));
  await delay(60);
  const concurrent = await show();
  assert.ok(elapsed(concurrent) >= 20, "restoring an active view must sample the running server clock");
  assert.equal(elapsed(concurrent), roleElapsed(concurrent, "dev"));
  assert.equal(elapsed(concurrent), roleElapsed(concurrent, "qa"), "parallel role time must not be summed as task time");

  const waiting = await show(task(a, "needs_user_confirm", { dev: "running", qa: "running" }));
  await delay(60);
  assert.deepEqual(await show(), waiting, "global user confirmation must freeze even stale running role statuses");

  const resumed = task(a, "dev_in_progress", { dev: "running", qa: "completed" }, { elapsed_ms: 9000000, total_tokens: 1234 });
  resumed.role_details.dev.metrics = { elapsed_ms: 8000000, total_tokens: 321 };
  const resumeSample = await show(resumed);
  assert.equal(elapsed(resumeSample), elapsed(waiting), "echoed or stale elapsed values must not overwrite tracked time");
  await delay(60);
  const paused = await show(task(a, "dev_in_progress", { dev: "paused", qa: "completed" }));
  assert.ok(elapsed(paused) >= elapsed(waiting) + 20, "resuming work must add a new measured interval");
  assert.equal(roleElapsed(paused, "qa"), roleElapsed(waiting, "qa"), "completed parallel roles must stay frozen");
  await delay(60);
  assert.deepEqual(await show(), paused, "a paused role must not keep its task timer active");
  const finished = await show(task(a, "workflow_ready", { dev: "running", qa: "running" }));
  await delay(60);
  assert.deepEqual(await show(), finished, "completed task state must override stale active roles");

  const b = "qa-elapsed-b";
  const baseline = task(b, "planned", { dev: "pending", qa: "pending" }, { elapsed_ms: 500, total_tokens: 999 });
  baseline.role_details.dev.metrics = { elapsed_ms: 200 };
  const seeded = await show(baseline);
  assert.equal(elapsed(seeded), 500, "first valid elapsed input remains a compatibility baseline");
  assert.equal(roleElapsed(seeded, "dev"), 200);
  const bRunning = task(b, "dev_in_progress", { dev: " RUNNING ", qa: "pending" });
  bRunning.work_unit.roles = [" DEV ", "dev", "qa"];
  await show(bRunning);
  await delay(60);
  assert.equal(elapsed(await show(task(a, "workflow_ready", { dev: "completed", qa: "completed" }))), elapsed(finished), "switching views must preserve the first task's timer");
  const bStopped = await show(task(b, "paused", { dev: "running", qa: "pending" }));
  assert.ok(elapsed(bStopped) >= 520, "another view must continue accumulating while it is not the latest snapshot");
  assert.equal(elapsed(bStopped) - roleElapsed(bStopped, "dev"), 300, "normalized duplicate role names must not count twice");

  // P1 regression: a stale task-level DEV state must not activate DEV while only QA is running.
  for (const [index, missing] of [undefined, null, ""].entries()) {
    const id = "qa-elapsed-explicit-qa-" + index;
    await show(task(id, "dev_in_progress", { dev: missing, qa: "running" }));
    await delay(60);
    const qaOnly = await show();
    assert.equal(roleElapsed(qaOnly, "dev"), 0, "missing DEV status must not inherit task-level activity");
    assert.ok(roleElapsed(qaOnly, "qa") >= 20, "explicit QA running must accrue time");
    assert.equal(elapsed(qaOnly), roleElapsed(qaOnly, "qa"));
    const stopped = await show(task(id, "dev_in_progress", { dev: missing, qa: "pending" }));
    await delay(60);
    assert.deepEqual(await show(), stopped, "leaving running must freeze both task and roles");
  }

  // P1 regression: UI activity aliases must not start timers; only running may resume them.
  const aliasId = "qa-elapsed-non-running";
  for (const status of ["preparing", "in_progress", "working", "active", "started", "started_working"]) {
    await show(task(aliasId, "dev_in_progress", { dev: status, qa: "pending" }));
    await delay(60);
    const idle = await show();
    assert.equal(elapsed(idle), 0, "non-running alias must not activate task time: " + status);
    assert.equal(roleElapsed(idle, "dev"), 0, "non-running alias must not activate role time: " + status);
  }
  await show(task(aliasId, "dev_in_progress", { dev: "running", qa: "pending" }));
  await delay(60);
  const aliasStopped = await show(task(aliasId, "dev_in_progress", { dev: "working", qa: "pending" }));
  assert.ok(roleElapsed(aliasStopped, "dev") >= 20, "running must resume after inactive aliases");
  assert.equal(elapsed(aliasStopped), roleElapsed(aliasStopped, "dev"));
  await delay(60);
  assert.deepEqual(await show(), aliasStopped, "running to an activity alias must settle and stop time");
  await show(task(aliasId, "dev_in_progress", { dev: "running", qa: "pending" }));
  await delay(60);
  const aliasResumed = await show(task(aliasId, "paused", { dev: "running", qa: "pending" }));
  assert.ok(elapsed(aliasResumed) >= elapsed(aliasStopped) + 20, "running must add a fresh interval after an alias stopped it");

  const excluded = task("qa-elapsed-excluded", "planned", { req: "running", dev: "pending" });
  excluded.work_unit.roles = ["dev"];
  await show(excluded);
  await delay(60);
  assert.equal(elapsed(await show()), 0, "unselected running roles must not activate a task timer");
  const unknown = task("qa-elapsed-unknown", "future_state", { dev: "future_status" });
  await show(unknown);
  await delay(60);
  assert.equal(elapsed(await show()), 0, "unknown statuses must not invent active work");

  for (const state of ["cr_blocked", "qa_failed", "qa_conditional"]) {
    const repairId = `qa-elapsed-repair-${state}`;
    await show(task(repairId, state, { dev: "running", qa: "pending" }));
    await delay(60);
    const repairing = await show();
    assert.ok(elapsed(repairing) >= 20, `${state} must count explicitly active repair work`);
    assert.equal(elapsed(repairing), roleElapsed(repairing, "dev"));
    const repairWaiting = await show(task(repairId, state, { dev: "pending", qa: "pending" }));
    await delay(60);
    assert.deepEqual(await show(), repairWaiting, `${state} must remain frozen when no repair role is active`);
  }

  const pureId = "qa-elapsed-pure-pause";
  await show(task(pureId, "dev_in_progress", { dev: "running" }));
  const beforePurePause = performance.now();
  const purePause = { view_id: pureId, state: "paused" };
  assert.deepEqual(await show(purePause), purePause, "a pure pause snapshot must retain its original shape");
  const pauseRoundTrip = performance.now() - beforePurePause;
  await delay(Math.max(100, pauseRoundTrip * 4));
  const afterPurePause = await show(task(pureId, "planned", { dev: "pending" }));
  assert.ok(elapsed(afterPurePause) < pauseRoundTrip * 2 + 50, "a pure pause must stop an existing timer before the waiting interval");
  assert.deepEqual(await show({ view_id: pureId, state: "dev_in_progress" }), { view_id: pureId, state: "dev_in_progress" });
  await delay(60);
  assert.equal(elapsed(await show(task(pureId, "planned", { dev: "pending" }))), elapsed(afterPurePause), "pure active snapshots must not invent a role or restart a timer");

  const beforeOversized = await show();
  const oversized = task("qa-elapsed-oversized", "dev_in_progress", { dev: "running" });
  oversized.padding = "x".repeat(200 * 1024 - Buffer.byteLength(JSON.stringify({ ...oversized, padding: "" }), "utf8"));
  assert.equal(Buffer.byteLength(JSON.stringify(oversized), "utf8"), 200 * 1024);
  const rejectedOversized = await first.request({ snapshot: oversized });
  assert.equal(rejectedOversized.error?.code, -32602, "elapsed enrichment must not exceed the public snapshot size limit");
  assert.match(rejectedOversized.error.message, /200 KiB/);
  assert.deepEqual(await show(), beforeOversized, "a rejected oversized update must not replace the latest snapshot");

  const nearFrame = task("qa-elapsed-frame-limit", "planned", {}, { elapsed_ms: 0 });
  nearFrame.work_unit.roles = [];
  nearFrame.padding = "x".repeat(200 * 1024 - 200 - Buffer.byteLength(JSON.stringify({ ...nearFrame, padding: "" }), "utf8"));
  const frameRequest = { jsonrpc: "2.0", id: "", method: "tools/call", params: { name: "show_sc_task_view", arguments: { snapshot: nearFrame } } };
  const longId = "r".repeat(256 * 1024 - 1 - Buffer.byteLength(JSON.stringify(frameRequest), "utf8"));
  frameRequest.id = longId;
  assert.ok(Buffer.byteLength(JSON.stringify(frameRequest), "utf8") < 256 * 1024, "response limit case must be a valid-sized request");
  const candidateFrame = { jsonrpc: "2.0", id: longId, result: { content: [{ type: "text", text: "SC Agent Tree 已更新。" }], structuredContent: { snapshot: nearFrame } } };
  assert.ok(Buffer.byteLength(JSON.stringify(candidateFrame) + "\n", "utf8") > 256 * 1024, "response envelope must exceed the frame limit independently of snapshot size");
  const rejectedFrame = await first.request({ snapshot: nearFrame }, longId);
  assert.equal(rejectedFrame.error?.code, -32603, "oversized tool responses must reject before committing timer state");
  assert.match(rejectedFrame.error.message, /256 KiB/);
  assert.deepEqual(await show(), beforeOversized, "an oversized response must not replace the latest snapshot");

  let last;
  while (knownViews.size < 128) last = await show(task(`qa-elapsed-capacity-${knownViews.size}`, "planned", {}));
  const rejected = await first.request({ snapshot: task("qa-elapsed-over-capacity", "planned", {}) });
  assert.equal(rejected.error?.code, -32000, "a full timer session must reject new views explicitly");
  assert.match(rejected.error.message, /capacity/i);
  assert.deepEqual(await show(), last, "a rejected view must not replace the previous snapshot");
  assert.equal(elapsed(await show(task(a, "workflow_ready", {}))), elapsed(finished), "capacity rejection must preserve existing timer records");

  const second = client();
  const restarted = await second.show(task(a, "planned", {}));
  assert.equal(elapsed(restarted), 0, "a fresh server session must not claim to restore the old session's time");
  for (const session of clients) session.complete();
  console.log("SC automatic elapsed stdio integration passed (pause, resume, parallel roles, view isolation, compatibility and capacity).");
}

main().catch(error => {
  for (const session of clients) session.complete();
  console.error(error);
  process.exitCode = 1;
});
