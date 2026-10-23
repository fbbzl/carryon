"use strict";
const { performance } = require("node:perf_hooks");

const ROLES = new Set(["req", "dev", "cr", "qa"]);
const STOPPED = new Set(["needs_user_confirm", "paused", "waiting", "blocked", "qa_passed", "workflow_ready", "completed", "complete", "done", "success", "successful", "succeeded", "failed", "cancelled", "canceled"]);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const record = value => object(value) ? value : {};
const status = value => typeof value === "string" ? value.trim().toLowerCase().replace(/[ -]+/g, "_") : "";
const initialElapsed = metrics => Number.isSafeInteger(record(metrics).elapsed_ms) && metrics.elapsed_ms >= 0 ? metrics.elapsed_ms : 0;
const stopwatch = metrics => ({ elapsed: initialElapsed(metrics), active: false });
const selectedRoles = value => [...new Set((Array.isArray(value) ? value : [value]).filter(value => typeof value === "string").map(value => value.trim().toLowerCase()).filter(value => ROLES.has(value)))];

function activeRole(snapshot, selected) {
  if (STOPPED.has(status(snapshot.state))) return null;
  const details = record(snapshot.role_details);
  const active = selected.filter(role => record(details[role]).status === "running");
  if (active.length !== 1) return null;
  if (active[0] === "qa" && (!selected.includes("cr") || record(details.cr).status !== "passed")) return null;
  return active[0];
}
function advance(timer, delta) {
  if (timer.active) timer.elapsed = Math.min(Number.MAX_SAFE_INTEGER, timer.elapsed + delta);
}
function withElapsed(value, timer) {
  return { ...record(value), metrics: { ...record(record(value).metrics), elapsed_ms: Math.floor(timer.elapsed) } };
}
function settle(previous, observed) {
  const entry = { observed: Math.max(previous.observed, observed), task: { ...previous.task }, roles: new Map([...previous.roles].map(([role, timer]) => [role, { ...timer }])) };
  const delta = Math.max(0, observed - previous.observed);
  for (const timer of [entry.task, ...entry.roles.values()]) { advance(timer, delta); timer.active = false; }
  return entry;
}

function createElapsedTracker({ now = () => performance.now(), maxViews = 128 } = {}) {
  if (!Number.isSafeInteger(maxViews) || maxViews < 1) throw new TypeError("maxViews must be a positive safe integer");
  const views = new Map();
  function observedTime() {
    const observed = now();
    if (!Number.isFinite(observed)) throw new TypeError("Elapsed clock must return a finite number");
    return observed;
  }
  function updatePure(snapshot, acceptSnapshot) {
    const previous = views.get(snapshot.view_id);
    if (!acceptSnapshot(snapshot)) return null;
    if (previous && STOPPED.has(status(snapshot.state))) views.set(snapshot.view_id, settle(previous, observedTime()));
    return snapshot;
  }
  function update(snapshot, acceptSnapshot = () => true) {
    // Pure views stay structurally unchanged, but an explicit stop still ends an existing interval.
    if (!object(snapshot.work_unit)) return updatePure(snapshot, acceptSnapshot);
    const previous = views.get(snapshot.view_id);
    if (!previous && views.size >= maxViews) throw new RangeError(`SC elapsed timer capacity reached (${maxViews} views); restart the server or reuse an existing view_id`);
    const observed = observedTime();
    // Rejected transport output must not change either the elapsed value or activity.
    const entry = previous ? settle(previous, observed) : { observed, task: stopwatch(snapshot.work_unit.metrics), roles: new Map() };
    const selected = selectedRoles(snapshot.work_unit.roles), active = activeRole(snapshot, selected);
    const details = record(snapshot.role_details), outputDetails = { ...details };
    for (const role of selected) {
      if (!entry.roles.has(role)) entry.roles.set(role, stopwatch(record(details[role]).metrics));
      const timer = entry.roles.get(role);
      timer.active = role === active;
      outputDetails[role] = withElapsed(details[role], timer);
    }
    entry.task.active = active !== null;
    const output = { ...snapshot, work_unit: withElapsed(snapshot.work_unit, entry.task), role_details: outputDetails };
    if (!acceptSnapshot(output)) return null;
    views.set(snapshot.view_id, entry);
    return output;
  }
  return { update };
}

module.exports = { createElapsedTracker };
