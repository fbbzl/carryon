"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const chrome = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].find(fs.existsSync);
assert.ok(chrome, "Chrome is required for the SC UI behavior regression test");

const template = fs.readFileSync(path.join(__dirname, "assets", "sc-task-view.html"), "utf8");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-ui-behavior-"));
const page = path.join(temp, "test.html");
const profile = path.join(temp, "chrome-profile");
const snapshot = {
  view_id: "sc-task-view:QA-SC-MOTION-001",
  state: "ready_for_cr",
  work_unit: { work_unit_id: "QA-SC-MOTION-001", target: "accordion rerender", reference_version: "748c46b" },
  role_details: { req: { status: "completed", progress: "25" }, cr: { status: "running", progress: 120 }, qa: { status: "not_started", progress: -25 } },
  handoffs: [],
};
const harness = `<!doctype html><html><body><main id="root">${template}</main><script>
const root=document.getElementById("root");
let toggleAdds=0,toggleRemoves=0;
const add=root.addEventListener.bind(root),remove=root.removeEventListener.bind(root);
root.addEventListener=(type,listener,options)=>{if(type==="toggle")toggleAdds++;return add(type,listener,options)};
root.removeEventListener=(type,listener,options)=>{if(type==="toggle")toggleRemoves++;return remove(type,listener,options)};
const snapshot=${JSON.stringify(snapshot)};
const openRoles=()=>[...root.querySelectorAll("details[data-sc-role][open]")].map(node=>node.dataset.scRole);
const hasProgress=role=>!!root.querySelector('details[data-sc-role="'+role+'"] [role="progressbar"]');
window.renderSurveyCorpsTaskView(root,snapshot);
const initial=openRoles(),progress={req:hasProgress("req"),dev:hasProgress("dev"),cr:hasProgress("cr"),qa:hasProgress("qa")};
const waitingSnapshot=structuredClone(snapshot);waitingSnapshot.state="ready_for_qa";waitingSnapshot.role_details={req:{status:"completed"},dev:{status:"completed"},cr:{status:"pending"},qa:{status:"pending"}};window.renderSurveyCorpsTaskView(root,waitingSnapshot);const waitingActive=[...root.querySelectorAll('details[data-sc-role].is-active')].map(node=>node.dataset.scRole);window.renderSurveyCorpsTaskView(root,snapshot);
const finishedDev=structuredClone(waitingSnapshot);finishedDev.state="dev_in_progress";window.renderSurveyCorpsTaskView(root,finishedDev);const finishedDevActive=[...root.querySelectorAll('details[data-sc-role].is-active')].map(node=>node.dataset.scRole);window.renderSurveyCorpsTaskView(root,snapshot);
const flow={roles:[...root.querySelectorAll("details[data-sc-role]")].map(node=>node.dataset.scRole),titles:[...root.querySelectorAll("details[data-sc-role] summary .sc-task-view__role-name > span:first-child")].map(node=>node.textContent),lastRole:root.querySelector("[data-sc-roles]").lastElementChild?.dataset.scRole,extraExitNodes:root.querySelectorAll("[data-sc-exit], .sc-task-view__exit").length,exitTextCount:root.querySelector("[data-sc-roles]").textContent.split("任务出口").length-1,connectorCount:root.querySelectorAll("[data-sc-connector], .sc-task-view__connector").length};
const defaults={summary:root.querySelector('[data-sc-task-summary]').textContent,selected:root.querySelector('[data-sc-selected-roles]').textContent,contextRemoved:!root.querySelector('[data-sc-context]'),namesRemoved:!root.querySelector('[data-sc-agent-name]'),debugHidden:root.querySelector('[data-sc-play-animation]').hidden,autoMotion:root.querySelector('.sc-task-view').classList.contains('is-entering'),connectorGeometry:[...root.querySelectorAll('.sc-task-view__connector')].map(node=>({before:getComputedStyle(node,"::before").content,after:getComputedStyle(node,"::after").content,afterTransform:getComputedStyle(node,"::after").transform}))};
root.querySelector('details[data-sc-role="cr"]').open=false;
root.querySelector('details[data-sc-role="req"]').open=true;
window.renderSurveyCorpsTaskView(root,snapshot);
const sameSnapshot=openRoles();
const next=structuredClone(snapshot);next.state="ready_for_qa";next.role_details.cr.status="completed";next.role_details.qa.status="running";
window.renderSurveyCorpsTaskView(root,next,{debug:true});
const changedActive=openRoles(),stateBefore=root.querySelector('[data-sc-field="state"]').textContent;
root.querySelector("[data-sc-play-animation]").click();
const afterReplay=openRoles(),stateAfter=root.querySelector('[data-sc-field="state"]').textContent;
const activeToggleListeners=toggleAdds-toggleRemoves;
const debugTrue={hidden:root.querySelector('[data-sc-play-animation]').hidden,replay:root.querySelector('details.is-active').classList.contains('is-manual-replay')};
window.renderSurveyCorpsTaskView(root,next,{debug:'true'});
root.querySelector('[data-sc-play-animation]').click();
const debugString={hidden:root.querySelector('[data-sc-play-animation]').hidden,replay:!!root.querySelector('.is-manual-replay')};
window.renderSurveyCorpsTaskView(root,next);
root.querySelector('[data-sc-play-animation]').click();
const debugDefault={hidden:root.querySelector('[data-sc-play-animation]').hidden,replay:!!root.querySelector('.is-manual-replay')};
window.renderSurveyCorpsTaskView(root,next,{debug:false});root.querySelector('[data-sc-play-animation]').click();
const debugFalse={hidden:root.querySelector('[data-sc-play-animation]').hidden,replay:!!root.querySelector('.is-manual-replay')};
const snapshotDebug=structuredClone(next);snapshotDebug.debug=true;window.renderSurveyCorpsTaskView(root,snapshotDebug);root.querySelector('[data-sc-play-animation]').click();
const debugInSnapshot={hidden:root.querySelector('[data-sc-play-animation]').hidden,replay:!!root.querySelector('.is-manual-replay')};
const supplied=structuredClone(next),payload='<img src=x onerror="window.qaInjected=true">';
supplied.work_unit={project_name:'carryon',target:'明确目标',task_type:'界面调整',roles:['dev','qa'],role_selection_reason:'仅实现和验收',summary:payload,scope:['当前任务视图'],acceptance:['QA 唯一出口'],environment:'Windows Chrome'};
supplied.role_details.req.agent_name='req-agent';supplied.role_details.dev={agent_name:'dev-agent'};supplied.role_details.cr.agent_name='cr-agent';
supplied.role_details.qa.agent_name=payload;
window.renderSurveyCorpsTaskView(root,supplied);
const summary=root.querySelector('[data-sc-task-summary]');
const provided={headerText:root.querySelector('.sc-task-view__header').innerText,taskType:root.querySelector('[data-sc-field=task_type]').textContent,selected:root.querySelector('[data-sc-selected-roles]').textContent,reason:root.querySelector('[data-sc-field=role_selection_reason]').textContent,summary:summary.textContent,summaryOutsideFlow:!summary.closest('[data-sc-flow]'),summaryAfterQA:!!(root.querySelector('[data-sc-role=qa]').compareDocumentPosition(summary)&Node.DOCUMENT_POSITION_FOLLOWING),roleCount:root.querySelectorAll('details[data-sc-role]').length,contextRemoved:!root.querySelector('[data-sc-context]'),namesRemoved:!root.querySelector('[data-sc-agent-name]'),injectedElements:root.querySelectorAll('img').length};
delete supplied.role_details.qa.agent_name;delete supplied.work_unit.summary;window.renderSurveyCorpsTaskView(root,supplied);
const removed={headerText:root.querySelector('.sc-task-view__header').innerText,contextRemoved:!root.querySelector('[data-sc-context]'),namesRemoved:!root.querySelector('[data-sc-agent-name]'),summary:root.querySelector('[data-sc-task-summary]').textContent,summaryClass:root.querySelector('[data-sc-task-summary]').className};
const roleCases={pending:'待开始',not_started:'待开始',running:'进行中',preparing:'进行中',in_progress:'进行中',working:'进行中',active:'进行中',started:'进行中',started_working:'进行中',completed:'已完成',complete:'已完成',done:'已完成',success:'已完成',successful:'已完成',succeeded:'已完成',passed:'已通过',qa_passed:'已通过',qa_success:'已通过',workflow_ready:'已通过',failed:'失败',blocked:'已阻断',paused:'已暂停',cancelled:'已取消',canceled:'已取消',skipped:'已跳过',waiting:'等待中'};
const roleStatuses={};const roleStatusClasses={};for(const status of Object.keys(roleCases)){supplied.role_details.qa.status=status;window.renderSurveyCorpsTaskView(root,supplied);const node=root.querySelector('[data-sc-role=qa] .sc-task-view__role-state');roleStatuses[status]=node.textContent;roleStatusClasses[status]=node.className;}
const globalCases={confirmed:'已确认',planned:'计划',dev_in_progress:'开发中',ready_for_cr:'等待审查',cr_blocked:'审查阻断',ready_for_qa:'等待测试',qa_failed:'测试失败',qa_conditional:'测试条件通过',qa_passed:'测试通过',workflow_ready:'工作流就绪',completed:'已完成',success:'已完成',succeeded:'已完成',needs_user_confirm:'等待用户确认',needs_revalidation:'需要重新验证',needs_revision:'需要修订',blocked:'已阻断'};
const globalStatuses={};const globalStatusClasses={};for(const state of Object.keys(globalCases)){supplied.state=state;window.renderSurveyCorpsTaskView(root,supplied);const node=root.querySelector('[data-sc-field=state]');globalStatuses[state]=node.textContent;globalStatusClasses[state]=node.className;}
supplied.state=payload;supplied.role_details.qa.status=payload;window.renderSurveyCorpsTaskView(root,supplied);
const unknown={global:root.querySelector('[data-sc-field=state]').textContent,role:root.querySelector('[data-sc-role=qa] .sc-task-view__role-state').textContent,img:root.querySelectorAll('img').length};
const prototypeFallbacks=[];for(const status of ['constructor','__proto__','toString']){supplied.role_details.qa.status=status;window.renderSurveyCorpsTaskView(root,supplied);prototypeFallbacks.push(root.querySelector('[data-sc-role=qa] .sc-task-view__role-state').textContent);}
const legacySubskills=root.querySelectorAll('[data-sc-subskills]').length;
const skillSnapshot=structuredClone(next);
skillSnapshot.role_details.req={status:'completed',subskills:[{name:'align-with-visuals',status:'completed',goal:'对齐页面',result:'对齐记录'},{name:'grill-with-docs',status:'needs_user_confirm',question:payload,options:[payload,'方案 B'],evidence:[payload]}]};
skillSnapshot.role_details.dev={status:'pending',subskills:[{name:'tech-select',status:'needs_user_confirm',goal:payload,summary:payload,question:payload,options:[payload,'方案 B'],evidence:[payload],result:payload}]};
skillSnapshot.role_details.cr={status:'completed',subskills:[{name:'review-with-goal',status:'completed',summary:'审查记录'}]};
skillSnapshot.role_details.qa={status:'running',subskills:[{name:'test-with-goal',status:'running',summary:'测试记录'}]};
const skillBefore=JSON.stringify(skillSnapshot);window.renderSurveyCorpsTaskView(root,skillSnapshot);
const skills=[...root.querySelectorAll('[data-sc-subskill]')].map(node=>({role:node.closest('[data-sc-role]').dataset.scRole,name:node.dataset.scSubskill,open:node.open,summary:node.querySelector('summary').textContent}));
const devSkill=root.querySelector('[data-sc-role=dev] [data-sc-subskill]');
const skillFields={};for(const field of ['goal','summary','question','options','evidence','result'])skillFields[field]=devSkill.querySelector('[data-sc-subskill-field='+field+']')?.textContent;
const skillSafety={forbidden:root.querySelectorAll('[data-sc-subskills] button,[data-sc-subskills] input,[data-sc-subskills] select,[data-sc-subskills] a,img').length,hint:devSkill.textContent.includes('请在当前会话中回复'),unchanged:JSON.stringify(skillSnapshot)===skillBefore};
const qaSkill=root.querySelector('[data-sc-role=qa] [data-sc-subskill]');qaSkill.open=true;qaSkill.dispatchEvent(new Event('toggle'));
const nestedOpen={roles:openRoles(),childOpen:qaSkill.open};
root.querySelector('[data-sc-role=dev]').open=true;root.querySelector('[data-sc-role=dev]').dispatchEvent(new Event('toggle'));
const outerAfterNested=openRoles();
skillSnapshot.role_details.dev.subskills[0].summary='更新的技术方案';window.renderSurveyCorpsTaskView(root,skillSnapshot);
const skillUpdated=root.querySelector('[data-sc-role=dev] [data-sc-subskill-field=summary]').textContent;
const invalidSkills=[];
for(const input of [undefined,null,{},'tech-select',[],[null,[],42,{}, {name:'tech-select'}, {name:'tech-select',status:'running'}, {name:'tech-select',options:['仅候选项']}],[{name:'align-with-visuals',summary:'wrong role'},{name:'constructor',summary:'prototype'},{name:'__proto__',summary:'prototype'},{name:'unknown',summary:'unknown'}]]){
 const invalid=structuredClone(next);invalid.role_details.dev={status:'pending',subskills:input};window.renderSurveyCorpsTaskView(root,invalid);invalidSkills.push(root.querySelectorAll('[data-sc-subskills]').length);
}
const invalidFields=structuredClone(next);invalidFields.role_details.dev={status:'pending',subskills:[{name:'tech-select',summary:'有效记录',goal:{bad:true},question:42,options:[payload],evidence:'not an array',result:['not string']}]};window.renderSurveyCorpsTaskView(root,invalidFields);
const fieldFiltering={fields:[...root.querySelectorAll('[data-sc-role=dev] [data-sc-subskill-field]')].map(node=>node.dataset.scSubskillField),hint:root.querySelector('[data-sc-role=dev] [data-sc-subskills]').textContent.includes('请在当前会话中回复')};
invalidFields.role_details.dev.subskills[0]={name:'tech-select',question:'选择方案',options:[payload,23,null,'','  ','安全选项'],evidence:[23,'','  ',payload]};window.renderSurveyCorpsTaskView(root,invalidFields);
const validListFiltering={options:[...root.querySelectorAll('[data-sc-subskill-field=options] li')].map(node=>node.textContent),evidence:[...root.querySelectorAll('[data-sc-subskill-field=evidence] li')].map(node=>node.textContent)};
const subskillUnknown=[];for(const status of ['constructor','__proto__','unknown']){invalidFields.role_details.dev.subskills[0].status=status;window.renderSurveyCorpsTaskView(root,invalidFields);subskillUnknown.push(root.querySelector('[data-sc-subskill] > summary').textContent.includes('未知状态'));}
delete invalidFields.role_details.dev.subskills;window.renderSurveyCorpsTaskView(root,invalidFields);const subskillsRemoved=root.querySelectorAll('[data-sc-subskills]').length;
const result={initial,sameSnapshot,changedActive,afterReplay,stateBefore,stateAfter,progress,waitingActive,finishedDevActive,flow,defaults,debugTrue,debugString,debugDefault,debugFalse,debugInSnapshot,provided,payload,removed,roleCases,roleStatuses,roleStatusClasses,globalCases,globalStatuses,globalStatusClasses,unknown,prototypeFallbacks,legacySubskills,skills,skillFields,skillSafety,nestedOpen,outerAfterNested,skillUpdated,invalidSkills,fieldFiltering,validListFiltering,subskillUnknown,subskillsRemoved,toggleAdds,toggleRemoves,activeToggleListeners};
document.body.dataset.scTestResult=JSON.stringify(result);
</script></body></html>`;

const visualHarness = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="root">${template}</main><script>
const root=document.getElementById('root'),snapshot=${JSON.stringify(snapshot)};
const roleTones={pending:'pending',not_started:'pending',running:'active',preparing:'active',in_progress:'active',working:'active',active:'active',started:'active',started_working:'active',completed:'completed',complete:'completed',done:'completed',success:'completed',successful:'completed',succeeded:'completed',passed:'passed',qa_passed:'passed',qa_success:'passed',workflow_ready:'passed',failed:'danger',blocked:'danger',paused:'waiting',cancelled:'pending',canceled:'pending',skipped:'pending',waiting:'waiting',needs_user_confirm:'waiting',needs_revision:'revision',constructor:'unknown',['__proto__']:'unknown',toString:'unknown',unrecognized:'unknown'};
const globalTones={confirmed:'completed',planned:'pending',dev_in_progress:'active',ready_for_cr:'waiting',cr_blocked:'danger',ready_for_qa:'waiting',qa_failed:'danger',qa_conditional:'revision',qa_passed:'passed',workflow_ready:'passed',completed:'completed',success:'completed',succeeded:'completed',needs_user_confirm:'waiting',needs_revalidation:'revision',needs_revision:'revision',blocked:'danger'};
const sample=node=>({className:node.className,color:getComputedStyle(node).color});
const roleColors=Object.create(null),globalColors=Object.create(null),subskillColors=Object.create(null);
for(const status of Object.keys(roleTones)){snapshot.role_details.qa={status,subskills:[{name:'test-with-goal',status,summary:'QA 记录'}]};window.renderSurveyCorpsTaskView(root,snapshot);roleColors[status]=sample(root.querySelector('[data-sc-role=qa] > summary .sc-task-view__role-state'));subskillColors[status]=sample(root.querySelector('[data-sc-role=qa] [data-sc-subskill] > summary .sc-task-view__role-state'));}
for(const state of Object.keys(globalTones)){snapshot.state=state;window.renderSurveyCorpsTaskView(root,snapshot);globalColors[state]=sample(root.querySelector('[data-sc-field=state]'));}
snapshot.state='ready_for_qa';snapshot.role_details.qa.status='running';window.renderSurveyCorpsTaskView(root,snapshot,{debug:true});root.querySelector('[data-sc-play-animation]').click();
const connectors=[...root.querySelectorAll('.sc-task-view__connector')].map(node=>{const stem=getComputedStyle(node,'::before'),head=getComputedStyle(node,'::after');return {width:node.offsetWidth,height:node.offsetHeight,stemWidth:stem.width,stemHeight:stem.height,headWidth:head.width,headHeight:head.height,headTransform:head.transform,right:head.borderRightWidth,bottom:head.borderBottomWidth,hidden:node.getAttribute('aria-hidden'),next:node.nextElementSibling.dataset.scRole,animation:getComputedStyle(node).animationName};});
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,view=root.querySelector('.sc-task-view'),active=root.querySelector('details.is-active');
const header=root.querySelector('.sc-task-view__header'),status=root.querySelector('[data-sc-field=state]'),headerRect=header.getBoundingClientRect(),statusRect=status.getBoundingClientRect();
const statusLayout={centerOffset:Math.abs((statusRect.left+statusRect.right)/2-(headerRect.left+headerRect.right)/2),fontSize:getComputedStyle(status).fontSize,eyebrowCount:root.querySelectorAll('.sc-task-view__root > .sc-task-view__muted').length};
const idle=root.querySelector('[data-sc-role=req]');const result={roleTones,globalTones,roleColors,subskillColors,globalColors,connectors,statusLayout,reduced,viewAnimation:getComputedStyle(view).animationName,activeAnimation:getComputedStyle(active,'::before').animationName,idleAnimation:getComputedStyle(idle,'::before').animationName,replay:active.classList.contains('is-manual-replay'),viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth};parent.postMessage({scVisualResult:result},'*');
</script></body></html>`;

function readChromeResult(pagePath, profilePath, width, reduced = false) {
  const args = ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profilePath}`, `--window-size=${Math.max(width,600)},900`, "--virtual-time-budget=2000", "--dump-dom"];
  if (reduced) args.push("--force-prefers-reduced-motion");
  args.push(new URL(`file:///${pagePath.replaceAll("\\", "/")}`).href);
  const run = spawnSync(chrome, args, { encoding: "utf8", timeout: 30000 });
  assert.equal(run.status, 0, run.stderr || "Chrome visual-state test failed");
  const encoded = run.stdout.match(/data-sc-test-result="([^"]+)"/)?.[1];
  assert.ok(encoded, "Chrome did not emit the visual-state result");
  return JSON.parse(encoded.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
}

try {
  fs.writeFileSync(page, harness, "utf8");
  const run = spawnSync(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, "--window-size=360,900", "--dump-dom", new URL(`file:///${page.replaceAll("\\", "/")}`).href], { encoding: "utf8", timeout: 30000 });
  assert.equal(run.status, 0, run.stderr || "Chrome behavior test failed");
  const encoded = run.stdout.match(/data-sc-test-result="([^"]+)"/)?.[1];
  assert.ok(encoded, "Chrome did not emit the SC behavior result");
  const result = JSON.parse(encoded.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  assert.deepEqual(result.flow, { roles: ["req", "dev", "cr", "qa"], titles: ["REQ", "DEV", "CR", "QA"], lastRole: "qa", extraExitNodes: 0, exitTextCount: 0, connectorCount: 4 }, "four role cards must end at QA without a separate exit label");
  assert.equal(result.defaults.connectorGeometry.length, 4, "every role card must have a connector");
  assert.ok(result.defaults.connectorGeometry.every(({before,after,afterTransform})=>before!=="none"&&after!=="none"&&afterTransform!=="none"), "connectors must expose a visible stem and arrowhead in the browser");
  const {connectorGeometry,...defaultValues}=result.defaults;
  assert.deepEqual(defaultValues, { summary: "暂无总结", selected: "尚未选择", contextRemoved: true, namesRemoved: true, debugHidden: true, autoMotion: false }, "task context, agent names and automatic entrance motion must remain absent");
  assert.deepEqual(result.debugTrue, { hidden: false, replay: true }, "strict debug true must expose and enable replay");
  for (const mode of [result.debugString, result.debugDefault, result.debugFalse, result.debugInSnapshot]) assert.deepEqual(mode, { hidden: true, replay: false }, "only options.debug true may enable replay; nondebug programmatic clicks must not replay");
  assert.equal(result.provided.headerText.includes("SURVEY CORPS"), false, "header must omit the removed metadata row");
  assert.equal(result.provided.headerText.includes("carryon"), false, "project metadata must not render in the header");
  assert.equal(result.provided.headerText.includes("sc-task-view:"), false, "view identifiers must not render in the header");
  assert.equal(result.provided.taskType, "界面调整");
  assert.equal(result.provided.selected, "DEV → QA", "selection must come from the orchestrator rather than all cards");
  assert.equal(result.provided.reason, "仅实现和验收");
  assert.equal(result.provided.summary, result.payload, "task summary must preserve supplied text safely");
  assert.equal(result.provided.summaryOutsideFlow, true);
  assert.equal(result.provided.summaryAfterQA, true);
  assert.equal(result.provided.roleCount, 2, "task summary must not create an extra flow card");
  assert.equal(result.provided.contextRemoved, true);
  assert.equal(result.provided.namesRemoved, true);
  assert.equal(result.provided.injectedElements, 0, "task summary must not inject HTML");
  assert.deepEqual(result.removed, { headerText: "SC TASK FLOW\n等待测试", contextRemoved: true, namesRemoved: true, summary: "暂无总结", summaryClass: "sc-task-view__placeholder" }, "removed metadata must stay absent while optional values update");
  assert.deepEqual(result.roleStatuses, result.roleCases, "all supported role statuses must display Chinese");
  assert.notEqual(result.roleStatusClasses.running, result.roleStatusClasses.completed, "running and completed roles must use different semantic color classes");
  assert.notEqual(result.roleStatusClasses.completed, result.roleStatusClasses.failed, "completed and failed roles must use different semantic color classes");
  assert.deepEqual(result.globalStatuses, result.globalCases, "all supported global statuses must display Chinese without codes");
  assert.notEqual(result.globalStatusClasses.qa_passed, result.globalStatusClasses.qa_failed, "passed and failed workflow states must use different semantic color classes");
  assert.deepEqual(result.unknown, { global: "未知状态", role: "未知状态", img: 0 }, "unknown statuses must use a safe Chinese fallback");
  assert.deepEqual(result.prototypeFallbacks, ["未知状态", "未知状态", "未知状态"], "prototype property names must not bypass the unknown-status fallback");
  assert.equal(result.legacySubskills, 0, "old snapshots must not list unused subskills");
  assert.deepEqual(result.skills.map(({role,name,open})=>({role,name,open})), [{role:'req',name:'align-with-visuals',open:false},{role:'req',name:'grill-with-docs',open:false},{role:'dev',name:'tech-select',open:false},{role:'cr',name:'review-with-goal',open:false},{role:'qa',name:'test-with-goal',open:false}], "only explicitly called role-owned subskills must appear collapsed inside their roles");
  assert.ok(result.skills[2].summary.includes("等待用户确认"));
  for (const field of ["goal", "summary", "question", "options", "evidence", "result"]) assert.ok(result.skillFields[field].includes(result.payload), `${field} must preserve safe text`);
  assert.deepEqual(result.skillSafety,{forbidden:0,hint:true,unchanged:true}, "records are read-only and must not mutate snapshot or create interactive approval controls");
  assert.deepEqual(result.nestedOpen,{roles:["qa"],childOpen:true}, "nested details must not enter outer role accordion selection");
  assert.deepEqual(result.outerAfterNested,["dev"], "outer role accordion still permits one role after nested details open");
  assert.equal(result.skillUpdated,"更新的技术方案");
  assert.ok(result.invalidSkills.every(count=>count===0), "invalid subskills, empty records, wrong-role and prototype names must remain hidden");
  assert.deepEqual(result.fieldFiltering,{fields:["summary"],hint:false}, "invalid field types and questionless options must not render");
  assert.deepEqual(result.validListFiltering,{options:[result.payload,"安全选项"],evidence:[result.payload]}, "list fields accept only nonempty strings");
  assert.deepEqual(result.subskillUnknown,[true,true,true]);
  assert.equal(result.subskillsRemoved,0, "subskill removal must remove stale records");
  assert.deepEqual(result.initial, ["cr"], "initial render must open the resolved CR role");
  assert.deepEqual(result.sameSnapshot, ["req"], "same snapshot must preserve the user's REQ selection");
  assert.deepEqual(result.changedActive, ["qa"], "changed active role must switch the open card to QA");
  assert.deepEqual(result.afterReplay, ["qa"], "animation replay must not change the accordion");
  assert.equal(result.stateAfter, result.stateBefore, "animation replay must not change task state");
  assert.equal(result.activeToggleListeners, 1, "rerender must leave exactly one accordion toggle listener");
  assert.deepEqual(result.progress, {req:false,dev:false,cr:false,qa:false}, "role cards must not render progress bars or percentages");
  assert.deepEqual(result.waitingActive, [], "waiting workflow states must not mark a role as actively animating");
  assert.deepEqual(result.finishedDevActive, [], "a completed DEV status must suppress a stale global in-progress fallback");
  const toneColors={pending:"rgb(149, 163, 181)",active:"rgb(70, 184, 238)",completed:"rgb(39, 201, 176)",passed:"rgb(75, 216, 130)",danger:"rgb(237, 117, 137)",waiting:"rgb(233, 200, 92)",revision:"rgb(236, 155, 79)",unknown:"rgb(255, 255, 255)"};
  for(const mode of [{width:360,reduced:false},{width:960,reduced:false},{width:360,reduced:true}]) {
    const srcdoc=visualHarness.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
    // A fixed iframe viewport avoids Chrome's desktop-window minimum width.
    const wrapper=`<!doctype html><html><body><script>window.addEventListener('message',event=>{if(event.source===document.querySelector('iframe').contentWindow&&event.data.scVisualResult)document.body.dataset.scTestResult=JSON.stringify(event.data.scVisualResult)});</script><iframe style="border:0;width:${mode.width}px;height:900px" srcdoc="${srcdoc}"></iframe></body></html>`;
    fs.writeFileSync(page,wrapper,"utf8");
    const observed=readChromeResult(page,path.join(temp,`visual-${mode.width}-${mode.reduced}`),mode.width,mode.reduced);
    assert.equal(observed.viewport,mode.width,"responsive cases must run at the exact requested iframe viewport");
    assert.ok(observed.statusLayout.centerOffset<=1,"global status must remain centered in the header");
    assert.equal(observed.statusLayout.fontSize,"18px","global status must use enlarged type");
    assert.equal(observed.statusLayout.eyebrowCount,0,"work unit eyebrow must not render");
    assert.ok(Object.hasOwn(observed.roleColors,"__proto__")&&Object.hasOwn(observed.subskillColors,"__proto__"),"prototype-name color cases must be executed and retained");
    for(const [status,tone] of Object.entries(observed.roleTones)) {
      for(const item of [observed.roleColors[status],observed.subskillColors[status]]) {
        assert.ok(item.className.includes(`sc-task-view__state--${tone}`), `${status} must carry the ${tone} semantic class`);
        assert.equal(item.color,toneColors[tone],`${status} must render the ${tone} color in roles and subskills`);
      }
    }
    for(const [state,tone] of Object.entries(observed.globalTones)) assert.equal(observed.globalColors[state].color,toneColors[tone],`${state} must render the ${tone} workflow color`);
    assert.deepEqual(observed.connectors.map(item=>item.next),["req","dev","cr","qa"],"every downward connector must lead to the next role without adding a node after QA");
    for(const item of observed.connectors) {
      assert.ok(item.width>=8&&item.height>=22,"arrowheads must fit inside visible connectors");
      assert.equal(item.stemWidth,"2px");assert.ok(parseFloat(item.stemHeight)>0);
      assert.equal(item.headWidth,"8px");assert.equal(item.headHeight,"8px");
      assert.equal(item.right,"2px");assert.equal(item.bottom,"2px");
      assert.match(item.headTransform,/matrix\(0\.707107, 0\.707107, -0\.707107, 0\.707107/,"right and bottom borders rotated 45 degrees must point down");
      assert.equal(item.hidden,"true","decorative arrows must remain hidden from assistive technologies");
      assert.equal(item.animation,"none","workflow connectors must not animate automatically");
    }
    assert.equal(observed.reduced,mode.reduced,"reduced-motion test must use the intended browser preference");
    assert.equal(observed.replay,!mode.reduced,"manual replay must respect reduced motion");
    assert.equal(observed.viewAnimation,"none","opening a task view must not animate when no role is actively working");
    assert.equal(observed.activeAnimation,mode.reduced?"none":"sc-thinking-border","only the active role border may animate");
    assert.equal(observed.idleAnimation,"none","idle role borders must remain static");
    assert.ok(observed.scrollWidth<=observed.viewport,"role states and arrow connectors must not cause horizontal overflow");
  }
  console.log("SC task view Chrome behavior regression passed.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
