"use strict";
const { spawn } = require("node:child_process");
const path = require("node:path");
const server = spawn(process.execPath, [path.join(__dirname, "server.js")], { stdio: ["pipe", "pipe", "pipe"] });
const expected = new Map(); const nullChecks = []; let buffer = "";
function assert(condition, message) { if (!condition) throw new Error(message); }
function done() { if (expected.size !== 0 || nullChecks.length !== 0) return; console.log("MCP Apps CR contract test passed."); server.kill(); }
function verify(reply) {
  const check = reply.id === null ? nullChecks.shift() : expected.get(reply.id); assert(check, `unexpected reply ${reply.id}`); if (reply.id !== null) expected.delete(reply.id); check(reply); done();
}
server.stdout.on("data", data => { buffer += data; let end; while ((end = buffer.indexOf("\n")) >= 0) { const line = buffer.slice(0, end); buffer = buffer.slice(end + 1); verify(JSON.parse(line)); } });
server.stderr.on("data", data => { throw new Error(data.toString()); });
function request(id, method, params, check) { expected.set(id, check); server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`); }
request(1, "initialize", { protocolVersion: "2025-03-26" }, reply => assert(reply.result.protocolVersion === "2025-03-26", "protocol version was not fixed"));
request(2, "tools/list", {}, reply => assert(reply.result.tools[0]._meta.ui.resourceUri === "ui://survey-corps/task-view", "missing UI resource binding"));
request(3, "resources/read", { uri: "ui://survey-corps/task-view" }, reply => { const resource=reply.result.contents[0]; assert(resource.mimeType === "text/html;profile=mcp-app", "invalid app MIME type"); assert(resource.text.includes("ui/initialize") && resource.text.includes("ui/notifications/initialized") && resource.text.includes("event.source!==parentWindow") && resource.text.includes("ui/notifications/tool-result"), "bridge lifecycle missing"); });
request(4, "tools/call", { name: "show_sc_task_view", arguments: { snapshot: { state: "planned", work_unit: { work_unit_id: "demo-unit" } } } }, reply => assert(reply.result.structuredContent.snapshot.work_unit.work_unit_id === "demo-unit", "structured snapshot missing"));
request(5, "initialize", { protocolVersion: "not-supported" }, reply => assert(reply.error.code === -32602, "unsupported protocol was accepted"));
nullChecks.push(reply => assert(reply.error.code === -32700, "invalid JSON was not rejected")); server.stdin.write("{not-json}\n");
nullChecks.push(reply => assert(reply.error.code === -32600, "oversized frame was not rejected")); server.stdin.write(`${"x".repeat(256 * 1024 + 1)}\n`);
nullChecks.push(reply => assert(reply.error.code === -32600, "unterminated oversized frame was not rejected")); server.stdin.write("x".repeat(256 * 1024 + 1));
