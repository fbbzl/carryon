"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { startServer } = require("./test-stdio-helper");

// QA-SC-SERIAL-WORKFLOW: P1 UI and protocol contract.
// Oracle: one active role, ordered DEV -> CR -> QA; rejection retains last valid input.
const task = (viewId = "qa-serial-workflow") => ({
  view_id: viewId,
  state: "dev_in_progress",
  work_unit: { work_unit_id: "QA-SC-SERIAL-WORKFLOW", roles: ["dev", "cr", "qa"] },
  role_details: {
    dev: { status: "running" },
    cr: { status: "pending" },
    qa: { status: "pending" },
  },
});

function chromeBehavior() {
  const chrome = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find(fs.existsSync);
  assert.ok(chrome, "Chrome is required for independent UI behavior validation");
  const template = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-serial-workflow-"));
  const page = path.join(temp, "test.html");
  const harness = `<!doctype html><html><body><main id="root">${template}</main><script>
    const root=document.getElementById('root'), initial=${JSON.stringify(task())};
    window.onerror=message=>document.body.dataset.testError=String(message);
    const status=role=>root.querySelector('[data-sc-role="'+role+'"] .sc-task-view__role-state').textContent;
    const observe=()=>({
      active:[...root.querySelectorAll('[data-sc-role].is-active')].map(node=>node.dataset.scRole),
      open:[...root.querySelectorAll('[data-sc-role][open]')].map(node=>node.dataset.scRole),
      current:[...root.querySelectorAll('[data-sc-role][aria-current=step]')].map(node=>node.dataset.scRole)
    });
    const render=value=>window.renderSurveyCorpsTaskView(root,value);
    const result={};
    const beforeInitial=JSON.stringify(initial);render(initial);
    result.dev={dev:status('dev'),cr:status('cr'),qa:status('qa'),...observe(),unchanged:beforeInitial===JSON.stringify(initial)};
    initial.role_details.dev.phase='pre_review';
    initial.role_details.cr.phase='testing';
    initial.role_details.qa.phase='test_preparation';
    const beforePhase=JSON.stringify(initial);render(initial);
    result.phase={dev:status('dev'),cr:status('cr'),qa:status('qa'),...observe(),unchanged:beforePhase===JSON.stringify(initial)};
    const devNode=root.querySelector('[data-sc-role=dev]');devNode.open=false;
    const devSummary=devNode.querySelector(':scope > summary');devSummary.focus();render(initial);
    result.foldFocus={...observe(),focus:document.activeElement===root.querySelector('[data-sc-role=dev] > summary')};
    const crRunning=structuredClone(initial);
    crRunning.state='ready_for_cr';
    crRunning.role_details={dev:{status:'completed'},cr:{status:'running'},qa:{status:'waiting'}};
    const beforeCr=JSON.stringify(crRunning);render(crRunning);
    result.cr={dev:status('dev'),cr:status('cr'),qa:status('qa'),...observe(),unchanged:beforeCr===JSON.stringify(crRunning)};
    const qaRunning=structuredClone(crRunning);
    qaRunning.state='ready_for_qa';
    qaRunning.role_details={dev:{status:'completed'},cr:{status:'completed'},qa:{status:'running'}};
    const beforeQa=JSON.stringify(qaRunning);render(qaRunning);
    result.qa={dev:status('dev'),cr:status('cr'),qa:status('qa'),...observe(),unchanged:beforeQa===JSON.stringify(qaRunning)};
    const conflict=structuredClone(qaRunning);
    conflict.role_details={dev:{status:'running'},cr:{status:'in-progress'},qa:{status:'pending'}};
    const beforeConflict=JSON.stringify(conflict);render(conflict);
    result.conflict={...observe(),unchanged:beforeConflict===JSON.stringify(conflict)};
    document.body.dataset.testResult=JSON.stringify(result);
  </script></body></html>`;
  fs.writeFileSync(page, harness, "utf8");
  const run = spawnSync(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox",
    `--user-data-dir=${path.join(temp, "profile")}`, "--dump-dom",
    new URL(`file:///${page.replaceAll("\\", "/")}`).href],
  { encoding: "utf8", timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
  assert.equal(run.status, 0, run.stderr || "Chrome serial workflow harness failed");
  const encoded = run.stdout.match(/data-test-result="([^"]+)"/)?.[1];
  assert.ok(encoded, "Chrome must return completed behavioral observations");
  const result = JSON.parse(encoded.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  assert.deepEqual(result.dev, { dev: "进行中", cr: "待开始", qa: "待开始", active: ["dev"], open: ["dev"], current: ["dev"], unchanged: true });
  assert.deepEqual(result.phase, { dev: "进行中", cr: "待开始", qa: "待开始", active: ["dev"], open: ["dev"], current: ["dev"], unchanged: true });
  assert.deepEqual(result.foldFocus, { active: ["dev"], open: [], current: ["dev"], focus: true });
  assert.deepEqual(result.cr, { dev: "已完成", cr: "进行中", qa: "等待中", active: ["cr"], open: ["cr"], current: ["cr"], unchanged: true });
  assert.deepEqual(result.qa, { dev: "已完成", cr: "已完成", qa: "进行中", active: ["qa"], open: ["qa"], current: ["qa"], unchanged: true });
  assert.deepEqual(result.conflict, { active: [], open: [], current: [], unchanged: true });
  console.log(`Serial workflow Chrome behavior passed; browser evidence: ${page}`);
}

async function stdioContract() {
  let id = 0;
  const pending = new Map();
  const session = startServer({ timeoutMs: 15000, onReply(reply) {
    const request = pending.get(reply.id);
    assert.ok(request, "unexpected stdio response");
    pending.delete(reply.id);
    request.resolve(reply);
  }, onFailure(error) {
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    process.exitCode = 1;
  } });
  const call = async snapshot => {
    const requestId = ++id;
    const reply = await new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject });
      const args = snapshot === undefined ? {} : { snapshot };
      session.server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: requestId, method: "tools/call",
        params: { name: "show_sc_task_view", arguments: args } }) + "\n");
    });
    return reply;
  };
  const expectAccepted = async snapshot => {
    const reply = await call(snapshot);
    assert.equal(reply.error, undefined, JSON.stringify(reply.error));
    return reply.result.structuredContent.snapshot;
  };
  const latest = async () => (await expectAccepted()).role_details;
  try {
    const dev = task();
    const acceptedDev = await expectAccepted(dev);
    assert.equal(acceptedDev.role_details.dev.status, "running");
    assert.equal(acceptedDev.role_details.cr.status, "pending");
    assert.equal(acceptedDev.role_details.qa.status, "pending");

    const cr = structuredClone(dev);
    cr.state = "ready_for_cr";
    cr.role_details = { dev: { status: "completed" }, cr: { status: "running" }, qa: { status: "waiting" } };
    const acceptedCr = await expectAccepted(cr);
    assert.equal(acceptedCr.role_details.cr.status, "running");

    const qa = structuredClone(cr);
    qa.state = "ready_for_qa";
    qa.role_details = { dev: { status: "completed" }, cr: { status: "completed" }, qa: { status: "running" } };
    const acceptedQa = await expectAccepted(qa);
    assert.equal(acceptedQa.role_details.qa.status, "running");

    const activeAliases = ["preparing", "in-progress", "working", "active", "started", "started_working"];
    for (const [index, alias] of activeAliases.entries()) {
      const conflict = structuredClone(qa);
      conflict.role_details = {
        dev: { status: index % 2 ? " running " : "completed" },
        cr: { status: index % 2 ? "pending" : ` ${alias} ` },
        qa: { status: index % 2 ? ` ${alias} ` : " running " },
      };
      const rejected = await call(conflict);
      assert.equal(rejected.error?.code, -32602, `two active statuses must be rejected: ${alias}`);
      assert.match(rejected.error.message, /only one active role/i);
      const restored = await latest();
      assert.equal(restored.dev.status, "completed", "rejection must retain the latest valid DEV state");
      assert.equal(restored.cr.status, "completed", "rejection must retain the latest valid CR state");
      assert.equal(restored.qa.status, "running", "rejection must retain the latest valid QA state");
    }
    console.log(`Serial workflow stdio passed (DEV → CR → QA; ${activeAliases.length} alias conflict/recovery cases).`);
  } finally {
    session.complete();
  }
}

async function main() {
  chromeBehavior();
  await stdioContract();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
