#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');

const root=process.cwd();
const dir=path.join(root,'ci','phase3-regression');
const out=path.join(root,'ci-results');
fs.mkdirSync(out,{recursive:true});

const manifest=fs.readFileSync(path.join(dir,'classification.csv'),'utf8').trim().split(/\r?\n/);
const header=manifest.shift().split(',');
const rows=manifest.map(line=>{
  const [test_id,phase,classification]=line.split(',');
  return {test_id,phase,classification};
});
const byId=new Map(rows.map(r=>[r.test_id,r]));

if(rows.length!==705) throw new Error('CLASSIFICATION_MANIFEST_MUST_HAVE_705_TESTS');

const suiteFiles=[
  'static-regression.cjs',
  'db-regression.sql',
  'db-schema-regression.sql',
  'db-flow-regression.sql',
  'db-access-regression.sql',
  'db-function-security-regression.sql',
  'db-editorial-regression.sql',
  'db-retention-regression.sql'
];

const implemented=new Map();
const idRe=/3A-P[1-4]-T\d{3}|\bT\d{3}\b/g;

for(const file of suiteFiles){
  const text=fs.readFileSync(path.join(dir,file),'utf8');
  const ids=[...text.matchAll(idRe)].map(m=>m[0]);
  for(const id of ids){
    if(!byId.has(id)) throw new Error(`UNKNOWN_TEST_ID_IN_SUITE: ${id} in ${file}`);
    if(!implemented.has(id)) implemented.set(id,new Set());
    implemented.get(id).add(file);
  }
}

const manualImplemented=[];
for(const [id] of implemented){
  if(byId.get(id).classification==='real-device/manual only') manualImplemented.push(id);
}
if(manualImplemented.length){
  throw new Error('MANUAL_ONLY_TEST_MAPPED_AS_AUTOMATED: '+manualImplemented.join(', '));
}

const byClass={};
for(const r of rows){
  byClass[r.classification]??={total:0,implemented:0};
  byClass[r.classification].total++;
  if(implemented.has(r.test_id)) byClass[r.classification].implemented++;
}

const automatable=rows.filter(r=>r.classification!=='real-device/manual only');
const automatableImplemented=automatable.filter(r=>implemented.has(r.test_id));
const manual=rows.filter(r=>r.classification==='real-device/manual only');
const remainingAutomatable=automatable.filter(r=>!implemented.has(r.test_id));

const payload={
  generated_at:new Date().toISOString(),
  source_tests:rows.length,
  automated_suite_test_ids:implemented.size,
  automatable_total:automatable.length,
  automatable_implemented:automatableImplemented.length,
  automatable_remaining:remainingAutomatable.length,
  manual_device_total:manual.length,
  classification:byClass,
  implemented:[...implemented.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([test_id,files])=>({
    test_id,
    classification:byId.get(test_id).classification,
    suites:[...files].sort()
  })),
  remaining_automatable:remainingAutomatable.map(r=>r.test_id),
  manual_device:manual.map(r=>r.test_id)
};

fs.writeFileSync(path.join(out,'coverage-audit.json'),JSON.stringify(payload,null,2));

let md='# Phase 3 CI coverage audit\n\n';
md+=`- Source register tests audited: **${payload.source_tests}**\n`;
md+=`- Automatable by classification: **${payload.automatable_total}**\n`;
md+=`- Exact register IDs currently implemented in CI suites: **${payload.automated_suite_test_ids}**\n`;
md+=`- Automatable IDs remaining to implement: **${payload.automatable_remaining}**\n`;
md+=`- Real-device/manual-only: **${payload.manual_device_total}**\n\n`;
md+='| Classification | Total | Implemented now |\n|---|---:|---:|\n';
for(const [name,v] of Object.entries(byClass)) md+=`| ${name} | ${v.total} | ${v.implemented} |\n`;
md+='\nClassification is feasibility only. Implemented means an exact source test ID has a checker; PASS still depends on the checker actually succeeding in this CI run.\n';
fs.writeFileSync(path.join(out,'coverage-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);

console.log(`PASS [CI-COVERAGE-AUDIT] ${payload.automated_suite_test_ids} exact register IDs mapped; ${payload.manual_device_total} manual-only IDs protected from automated PASS.`);
