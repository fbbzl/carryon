"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "kyojin-lifecycle-"));
const ps5 = path.join(process.env.SystemRoot, "System32/WindowsPowerShell/v1.0/powershell.exe");
const ps7Home = spawnSync("pwsh", ["-NoProfile", "-Command", "$PSHOME"], { encoding: "utf8" });
assert.equal(ps7Home.status, 0, "PowerShell 7 is required");
const shells = [ps5, path.join(ps7Home.stdout.trim(), "pwsh.exe")];
const entry = { name: "survey-corps-task-view", source: { source: "local", path: "./skills/survey-corps/mcp-app" } };
const other = { name: "unrelated", source: { source: "local", path: "./other" } };
let metadata = { value: "preserve" };
for (let depth = 0; depth < 24; depth++) metadata = { child: metadata };
other.metadata = metadata;
let excessiveMetadata = { value: "preserve" };
for (let depth = 0; depth < 110; depth++) excessiveMetadata = { child: excessiveMetadata };
const excessiveOther = { ...other, metadata: excessiveMetadata };
let sequence = 0;
function fixture(plugins = [entry], name = "kyojin-local", full = false) {
  const dir = path.join(temp, String(++sequence));
  fs.mkdirSync(path.join(dir, ".agents/plugins"), { recursive: true });
  fs.mkdirSync(path.join(dir, "tools"));
  for (const file of ["codex-bootstrap.ps1", "codex-sctask-view.ps1"]) fs.copyFileSync(path.join(__dirname, file), path.join(dir, "tools", file));
  if (full) fs.cpSync(path.join(root, "skills/survey-corps/mcp-app"), path.join(dir, "skills/survey-corps/mcp-app"), { recursive: true });
  const marketplace = path.join(dir, ".agents/plugins/marketplace.json");
  fs.writeFileSync(marketplace, JSON.stringify({ name, plugins: [...plugins, other] }));
  return { dir, marketplace };
}
function run(shell, script, action, f, options = {}) {
  const key = script === "codex-bootstrap.ps1" ? "-InstallRoot" : "-RepositoryRoot";
  const quote = value => "'" + value.replaceAll("'", "''") + "'";
  const command = `& ${quote(path.join(f.dir, "tools", script))} -Action ${quote(action)} ${key} ${quote(f.dir)} -Confirm:$false${options.whatIf ? " -WhatIf" : ""}`;
  return spawnSync(shell, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", command], { encoding: "utf8", timeout: 15000, env: options.env || process.env });
}
function success(result) { assert.ifError(result.error); assert.equal(result.status, 0, result.stderr || result.stdout); }
function failure(result) { assert.ifError(result.error); assert.notEqual(result.status, 0, "must reject invalid registration or failed verification"); }
const fakeBin = path.join(temp, "fake-bin");
fs.mkdirSync(fakeBin);
fs.writeFileSync(path.join(fakeBin, "git.cmd"), '@echo invoked>"%~dp0called.txt"\r\n@exit /b 7\r\n');
const noDependencies = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "path")), PATH: fakeBin };
for (const shell of shells) {
  const normal = fixture([entry], "kyojin-local", true);
  success(run(shell, "codex-sctask-view.ps1", "Update", normal));
  const uninstall = fixture();
  success(run(shell, "codex-bootstrap.ps1", "Uninstall", uninstall, { env: noDependencies }));
  assert.deepEqual(JSON.parse(fs.readFileSync(uninstall.marketplace)).plugins, [other]);
  assert.ok(!fs.existsSync(path.join(fakeBin, "called.txt")), "uninstall must not invoke Git");
  success(run(shell, "codex-sctask-view.ps1", "Uninstall", uninstall, { env: noDependencies }));
  for (const action of ["Install", "Update", "Uninstall"]) {
    const dry = fixture();
    const before = fs.readFileSync(dry.marketplace);
    success(run(shell, "codex-bootstrap.ps1", action, dry, { whatIf: true, env: noDependencies }));
    assert.deepEqual(fs.readFileSync(dry.marketplace), before, "WhatIf must preserve marketplace");
    assert.ok(!fs.existsSync(path.join(fakeBin, "called.txt")), "WhatIf must not invoke Git");
  }
  const conflicts = [
    [{ ...entry, source: { source: "local", path: "./wrong" } }],
    [{ ...entry, source: { source: "remote", path: entry.source.path } }],
    [entry, entry],
  ];
  for (const plugins of conflicts) {
    const f = fixture(plugins);
    const before = fs.readFileSync(f.marketplace);
    for (const action of ["Install", "Update", "Uninstall"]) failure(run(shell, "codex-sctask-view.ps1", action, f));
    assert.deepEqual(fs.readFileSync(f.marketplace), before, "conflicts must not be overwritten");
  }
  failure(run(shell, "codex-sctask-view.ps1", "Install", fixture([entry], "wrong-marketplace")));
  const failed = fixture([], "kyojin-local", true);
  const server = path.join(failed.dir, "skills/survey-corps/mcp-app/server.js");
  fs.readFileSync(server, "utf8");
  fs.writeFileSync(server, 'process.stdin.once("data",()=>process.exit(0));');
  const before = fs.readFileSync(failed.marketplace);
  failure(run(shell, "codex-sctask-view.ps1", "Install", failed));
  assert.deepEqual(fs.readFileSync(failed.marketplace), before, "failed verification must not leave a registration");
  const excessive = fixture([entry, excessiveOther]);
  const excessiveBefore = fs.readFileSync(excessive.marketplace);
  failure(run(shell, "codex-sctask-view.ps1", "Uninstall", excessive));
  assert.deepEqual(fs.readFileSync(excessive.marketplace), excessiveBefore, "unsupported depth must fail without rewriting marketplace");
  console.log(`Lifecycle isolation checks passed: ${shell}`);
}
console.log(`Lifecycle fixtures retained at ${temp}`);
