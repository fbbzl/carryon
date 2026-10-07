"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const { spawn } = require("node:child_process");

function readResource() {
  const server = spawn(process.execPath, [path.join(__dirname, "server.js")], { stdio: ["pipe", "pipe", "pipe"] });
  return new Promise((resolve, reject) => {
    let buffer = "";
    const finish = (error, html) => { server.kill(); error ? reject(error) : resolve(html); };
    server.stderr.on("data", data => finish(new Error(data.toString())));
    server.stdout.on("data", data => {
      buffer += data;
      const end = buffer.indexOf("\n");
      if (end < 0) return;
      try {
        const reply = JSON.parse(buffer.slice(0, end));
        if (reply.id !== 1) return finish(new Error("unexpected resource response"));
        finish(null, reply.result.contents[0].text);
      } catch (error) { finish(error); }
    });
    server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "resources/read", params: { uri: "ui://survey-corps/task-view" } })}\n`);
  });
}

function runBridge(script) {
  const messages = [];
  const rendered = [];
  const listeners = {};
  const parent = { postMessage: message => messages.push(message) };
  const window = {
    parent,
    addEventListener: (name, callback) => { listeners[name] = callback; },
    renderSurveyCorpsTaskView: (_root, snapshot) => rendered.push(snapshot),
  };
  vm.runInNewContext(script, { window, document: { getElementById: () => ({}) } });
  return { messages, rendered, receive: data => listeners.message({ source: parent, data }) };
}

const plain = value => JSON.parse(JSON.stringify(value));

async function main() {
  const html = await readResource();
  const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));
  const failed = runBridge(script);
  assert.deepEqual(plain(failed.messages[0]), {
    jsonrpc: "2.0", id: "sc-ui-init", method: "ui/initialize",
    params: {
      protocolVersion: "2026-01-26",
      appInfo: { name: "survey-corps-task-view", version: "0.1.4" },
      appCapabilities: {},
    },
  }, "ui/initialize must advertise the MCP App protocol contract");
  failed.receive({ jsonrpc: "2.0", id: "sc-ui-init", error: { code: -32602, message: "invalid params" } });
  assert.equal(failed.messages.length, 1, "initialization errors must not be acknowledged");
  failed.receive({ jsonrpc: "2.0", method: "ui/notifications/initialized" });
  failed.receive({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: { structuredContent: { snapshot: { view_id: "ignored" } } } });
  assert.equal(failed.rendered.length, 1, "tool results must stay blocked after initialization failure");

  const ready = runBridge(script);
  ready.receive({ jsonrpc: "2.0", id: "sc-ui-init", result: { protocolVersion: "2026-01-26" } });
  assert.deepEqual(plain(ready.messages[1]), { jsonrpc: "2.0", method: "ui/notifications/initialized" }, "successful initialization must be acknowledged");
  ready.receive({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: { structuredContent: { snapshot: { view_id: "sc-task-view:demo" } } } });
  assert.deepEqual(plain(ready.rendered[1]), { view_id: "sc-task-view:demo" }, "tool result must render after initialization");
  console.log("MCP App bridge contract test passed.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
