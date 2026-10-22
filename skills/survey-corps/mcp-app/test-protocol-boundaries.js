"use strict";
const assert = require("node:assert/strict");
const { startServer } = require("./test-stdio-helper");
const checks = [];
const { server, complete } = startServer({ onReply: reply => {
  const check = checks.shift();
  assert.ok(check, "unexpected response (possibly a notification reply)");
  check(reply);
  if (!checks.length) { console.log("MCP protocol and byte boundaries passed."); complete(); }
} });
let id = 0;
function request(method, params, check) {
  const requestId = ++id;
  checks.push(reply => { assert.equal(reply.id, requestId); check(reply); });
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }) + "\n");
}
const call = (snapshot, check) => request("tools/call", { name: "show_sc_task_view", arguments: { snapshot } }, check);
const error = reply => assert.equal(reply.error.code, -32602);
request("ping", undefined, reply => assert.deepEqual(reply.result, {}));
const longIdBase = { jsonrpc: "2.0", id: "", method: "unknown" };
const longId = "x".repeat(256 * 1024 - Buffer.byteLength(JSON.stringify(longIdBase)));
checks.push(reply => { assert.equal(reply.id, null); assert.equal(reply.error.code, -32603); });
server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: longId, method: "unknown" }) + "\n");
call({ view_id: "stable", state: "planned" }, reply => assert.equal(reply.result.structuredContent.snapshot.view_id, "stable"));
for (const method of ["notifications/initialized", "notifications/cancelled", "unknown", "tools/call"]) {
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params: { name: "show_sc_task_view", arguments: { snapshot: { view_id: "ignored" } } } }) + "\n");
}
for (const state of [null, [], {}, { toString: null }, 4, false]) call({ view_id: "bad", state }, error);
request("tools/call", { name: "show_sc_task_view" }, reply => assert.equal(reply.result.structuredContent.snapshot.view_id, "stable"));
const sized = bytes => {
  const snapshot = { view_id: "boundary", summary: "中" };
  snapshot.summary += "x".repeat(bytes - Buffer.byteLength(JSON.stringify(snapshot)));
  assert.equal(Buffer.byteLength(JSON.stringify(snapshot)), bytes);
  return snapshot;
};
call(sized(200 * 1024), reply => assert.equal(Buffer.byteLength(JSON.stringify(reply.result.structuredContent.snapshot)), 200 * 1024));
call(sized(200 * 1024 + 1), reply => { error(reply); assert.match(reply.error.message, /200 KiB/); });
request("tools/list", undefined, reply => assert.equal(reply.result.tools[0].inputSchema.properties.snapshot.properties.state.type, "string"));
for (const invalid of ["{bad}", JSON.stringify({ jsonrpc: "2.0", id: {}, method: "ping" })]) {
  checks.push(reply => { assert.equal(reply.id, null); assert.equal(reply.error.code, invalid === "{bad}" ? -32700 : -32600); });
  server.stdin.write(invalid + "\n");
}
const frameId = ++id;
const frame = JSON.stringify({ jsonrpc: "2.0", id: frameId, method: "ping", params: { padding: "" } });
checks.push(reply => { assert.equal(reply.id, frameId); assert.deepEqual(reply.result, {}); });
server.stdin.write(frame.replace('"padding":""', '"padding":"' + "x".repeat(256 * 1024 - Buffer.byteLength(frame)) + '"') + "\n");
checks.push(reply => assert.equal(reply.error.code, -32600));
server.stdin.write("x".repeat(256 * 1024 + 1));
server.stdin.write("discarded\n");
// The final reply also proves frame recovery and that notifications produced no replies.
request("ping", undefined, reply => assert.deepEqual(reply.result, {}));
