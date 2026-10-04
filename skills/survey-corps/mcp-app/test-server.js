"use strict";
const { spawn } = require("node:child_process");
const path = require("node:path");
const server = spawn(process.execPath, [path.join(__dirname, "server.js")], { stdio: ["pipe", "pipe", "pipe"] });
let buffer = ""; const replies = [];
server.stdout.on("data", data => { buffer += data; let end; while ((end = buffer.indexOf("\n")) >= 0) { replies.push(JSON.parse(buffer.slice(0, end))); buffer = buffer.slice(end + 1); if (replies.length === 3) finish(); } });
server.stderr.on("data", data => { throw new Error(data.toString()); });
function send(id, method, params) { server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`); }
function finish() { try { if (replies[0].result.serverInfo.name !== "survey-corps-task-view") throw new Error("initialize failed"); if (replies[1].result.tools[0]._meta.ui.resourceUri !== "ui://survey-corps/task-view" || replies[2].result.structuredContent.snapshot.work_unit.work_unit_id !== "demo-unit") throw new Error("MCP App tool result is incomplete"); console.log("MCP App stdio smoke test passed."); } finally { server.kill(); } }
send(1, "initialize", { protocolVersion: "2025-03-26" });
send(2, "tools/list");
send(3, "tools/call", { name: "show_sc_task_view", arguments: { snapshot: { state: "planned", work_unit: { work_unit_id: "demo-unit", target: "demo", roles: ["req"], risks: [], evidence: [], verified_scope: [], unverified_scope: [] }, handoffs: [] } } });
