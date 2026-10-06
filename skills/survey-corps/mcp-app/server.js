#!/usr/bin/env node
"use strict";

// Minimal, dependency-free MCP stdio server for the SC task view.
const fs = require("node:fs");
const path = require("node:path");

const APP_URI = "ui://survey-corps/task-view";
const APP_MIME = "text/html;profile=mcp-app";
const TEMPLATE_PATH = path.join(__dirname, "assets", "sc-task-view.html");
const MAX_FRAME_BYTES = 256 * 1024;
const MAX_SNAPSHOT_BYTES = 200 * 1024;
const SUPPORTED_PROTOCOL_VERSIONS = new Set(["2025-03-26", "2025-06-18", "2025-11-25"]);
const SNAPSHOT_SCHEMA = { type: "object", required: ["view_id"], properties: { view_id: { type: "string", minLength: 1, description: "Stable logical view identifier; displayed as text and never used as a path or resource URI." } } };

function send(message) { const line=`${JSON.stringify(message)}\n`; if (Buffer.byteLength(line,"utf8") > MAX_FRAME_BYTES) return process.stdout.write(`${JSON.stringify({jsonrpc:"2.0",id:message.id??null,error:{code:-32603,message:"Response exceeds 256 KiB"}})}\n`); process.stdout.write(line); }
function failure(id, code, message) { send({ jsonrpc: "2.0", id, error: { code, message } }); }
function readTemplate() { return fs.readFileSync(TEMPLATE_PATH, "utf8"); }
function appHtml() {
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><main id="sc-task-view-root">${readTemplate()}</main><script>(()=>{const root=document.getElementById("sc-task-view-root"),render=snapshot=>window.renderSurveyCorpsTaskView(root,snapshot),initId="sc-ui-init",parentWindow=window.parent;let ready=false;render({});window.addEventListener("message",event=>{if(event.source!==parentWindow)return;const message=event.data;if(!message||message.jsonrpc!=="2.0")return;if(message.id===initId&&("result" in message||"error" in message)){parentWindow.postMessage({jsonrpc:"2.0",method:"ui/notifications/initialized",params:{}},"*");ready=!message.error;return;}if(message.method==="ui/notifications/initialized"){ready=true;return;}if(!ready||message.method!=="ui/notifications/tool-result")return;const result=message.params?.result??message.params;const snapshot=result?.structuredContent?.snapshot;if(snapshot&&typeof snapshot==="object"&&!Array.isArray(snapshot))render(snapshot);});parentWindow.postMessage({jsonrpc:"2.0",id:initId,method:"ui/initialize",params:{}},"*");})();</script></body></html>`;
}
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function resource(text) { return { uri: APP_URI, mimeType: APP_MIME, text }; }
function handle(id, method, params) {
  if (method === "initialize") { const protocolVersion=params?.protocolVersion; if (!SUPPORTED_PROTOCOL_VERSIONS.has(protocolVersion)) return failure(id, -32602, "Unsupported protocol version"); return send({ jsonrpc: "2.0", id, result: { protocolVersion, capabilities: { tools: {}, resources: {} }, serverInfo: { name: "survey-corps-task-view", version: "0.1.4" } } }); }
  if (method === "notifications/initialized") return;
  if (method === "resources/list") return send({ jsonrpc: "2.0", id, result: { resources: [{ uri: APP_URI, name: "SC Agent Tree", description: "Survey Corps task view MCP App", mimeType: APP_MIME }] } });
  if (method === "resources/read") { if (params?.uri !== APP_URI) return failure(id, -32602, "Unknown resource URI"); return send({ jsonrpc: "2.0", id, result: { contents: [resource(appHtml())] } }); }
  if (method === "tools/list") return send({ jsonrpc: "2.0", id, result: { tools: [{ name: "show_sc_task_view", title: "Open SC task view", description: "Render a read-only Survey Corps task view from a supplied snapshot.", annotations: { readOnlyHint: true, openWorldHint: false }, inputSchema: { type: "object", additionalProperties: false, required: ["snapshot"], properties: { snapshot: { ...SNAPSHOT_SCHEMA, description: "SC work-unit snapshot; rendered as text only." } } }, outputSchema: { type: "object", additionalProperties: false, required: ["snapshot"], properties: { snapshot: { ...SNAPSHOT_SCHEMA, description: "The accepted SC work-unit snapshot." } } }, _meta: { ui: { resourceUri: APP_URI }, "openai/ui": { entrypoints: [{ type: "thread" }] } } }] } });
  if (method === "tools/call") {
    if (params?.name !== "show_sc_task_view" || !isObject(params?.arguments?.snapshot)) return failure(id, -32602, "show_sc_task_view requires an object snapshot");
    const snapshot = params.arguments.snapshot;
    if (typeof snapshot.view_id !== "string" || snapshot.view_id.trim() === "") return failure(id, -32602, "snapshot.view_id must be a non-empty string");
    if (Buffer.byteLength(JSON.stringify(snapshot), "utf8") > MAX_SNAPSHOT_BYTES) return failure(id, -32602, "snapshot exceeds 256 KiB");
    return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: "SC Agent Tree 已更新。" }], structuredContent: { snapshot } } });
  }
  failure(id, -32601, `Method not found: ${method}`);
}
let frame=Buffer.alloc(0),discard=false;
function consume(line) { let request; try { request=JSON.parse(line.toString("utf8")); } catch { return failure(null,-32700,"Parse error"); } if (!isObject(request)||request.jsonrpc!=="2.0"||typeof request.method!=="string") return failure(request?.id??null,-32600,"Invalid request"); try { handle(request.id,request.method,request.params); } catch (error) { failure(request.id??null,-32603,error instanceof Error?error.message:"Internal error"); } }
process.stdin.on("data",chunk=>{ let offset=0; while(offset<chunk.length){ const newline=chunk.indexOf(10,offset); const end=newline<0?chunk.length:newline; const part=chunk.subarray(offset,end); offset=newline<0?chunk.length:newline+1; if(discard){ if(newline>=0) discard=false; continue; } if(frame.length+part.length>MAX_FRAME_BYTES){ frame=Buffer.alloc(0); discard=newline<0; failure(null,-32600,"Request frame exceeds 256 KiB"); continue; } frame=Buffer.concat([frame,part]); if(newline>=0){ const line=frame; frame=Buffer.alloc(0); consume(line); } } });
