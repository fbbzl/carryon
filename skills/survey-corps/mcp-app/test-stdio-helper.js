"use strict";
const { spawn } = require("node:child_process");
const path = require("node:path");

// A test passes only after its assertions explicitly complete, never on child exit.
function startServer({ onReply, onFailure, timeoutMs = 5000 }) {
  const server = spawn(process.execPath, [path.join(__dirname, "server.js")], { stdio: ["pipe", "pipe", "pipe"] });
  let finished = false, buffer = "";
  const timer = setTimeout(() => fail(new Error("MCP test timed out before all checks completed")), timeoutMs);
  function complete() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    server.kill();
  }
  function fail(error) {
    if (finished) return;
    complete();
    if (onFailure) onFailure(error);
    else { console.error(error); process.exitCode = 1; }
  }
  server.on("error", fail);
  server.on("close", (code, signal) => fail(new Error(
    "MCP server closed before all checks completed (code=" + code + ", signal=" + signal + ")")));
  server.stdin.on("error", fail);
  server.stdout.on("error", fail);
  server.stderr.on("error", fail);
  server.stderr.on("data", data => fail(new Error(data.toString())));
  server.stdout.on("data", data => {
    if (finished) return;
    buffer += data;
    let end;
    try {
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        onReply(JSON.parse(line));
        if (finished) break;
      }
    } catch (error) { fail(error); }
  });
  return { server, complete, fail };
}
module.exports = { startServer };
