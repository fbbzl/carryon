"use strict";

const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const server = spawn(process.execPath, [path.join(__dirname, "server.js")], { stdio: ["pipe", "pipe", "pipe"] });
let buffer = "";
const checks = new Map();
let finished = false;

function finish(error) {
  if (finished) return;
  finished = true;
  server.kill();
  if (error) {
    console.error(error);
    process.exitCode = 1;
  } else {
    console.log("MCP App thread entrypoint contract test passed.");
  }
}

function request(id, params, check) {
  checks.set(id, check);
  server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params })}\n`);
}

server.stdout.on("data", data => {
  buffer += data;
  let end;
  while ((end = buffer.indexOf("\n")) >= 0) {
    const reply = JSON.parse(buffer.slice(0, end));
    buffer = buffer.slice(end + 1);
    const check = checks.get(reply.id);
    if (!check) return finish(new Error(`unexpected reply ${reply.id}`));
    checks.delete(reply.id);
    try { check(reply); } catch (error) { return finish(error); }
    if (!checks.size) finish();
  }
});
server.stderr.on("data", data => finish(new Error(data.toString())));
server.on("error", finish);

request(1, { name: "show_sc_task_view", arguments: {} }, reply => {
  assert.equal(reply.result.structuredContent.snapshot.view_id, "sc-task-view:empty");
  assert.equal(reply.result.structuredContent.snapshot.state, "unknown");
  assert.equal(reply.result.content[0].text, "SC Agent Tree 尚未收到任务快照。");
});
request(2, { name: "show_sc_task_view", arguments: { snapshot: { view_id: "sc-task-view:entry", state: "planned" } } }, reply => {
  assert.equal(reply.result.structuredContent.snapshot.view_id, "sc-task-view:entry");
  assert.equal(reply.result.structuredContent.snapshot.state, "planned");
});
request(3, { name: "show_sc_task_view", arguments: {} }, reply => {
  assert.deepEqual(reply.result.structuredContent.snapshot, { view_id: "sc-task-view:empty", state: "unknown" });
  assert.equal(reply.result.content[0].text, "SC Agent Tree 尚未收到任务快照。");
});
request(4, { name: "show_sc_task_view", arguments: { snapshot: { state: "planned" } } }, reply => {
  assert.equal(reply.error.code, -32602);
  assert.match(reply.error.message, /snapshot\.view_id/);
});
request(5, { name: "show_sc_task_view", arguments: null }, reply => {
  assert.equal(reply.error.code, -32602);
  assert.match(reply.error.message, /arguments must be an object/);
});
request(6, { name: "show_sc_task_view", arguments: { unexpected: true } }, reply => {
  assert.equal(reply.error.code, -32602);
  assert.match(reply.error.message, /unknown/);
});
request(7, { name: "show_sc_task_view", arguments: {} }, reply => {
  assert.deepEqual(reply.result.structuredContent.snapshot, { view_id: "sc-task-view:empty", state: "unknown" });
  assert.equal(reply.result.content[0].text, "SC Agent Tree 尚未收到任务快照。");
});
