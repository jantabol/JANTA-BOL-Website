#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');

function read(rel){
  return fs.readFileSync(path.join(ROOT,rel),'utf8');
}
function exists(rel){
  return fs.existsSync(path.join(ROOT,rel));
}
function assert(ok,msg){
  if(!ok){
    console.error('FAIL '+msg);
    process.exitCode=1;
  }else{
    console.log('PASS '+msg);
  }
}

const required=[
  'JANTA_BOL_PHASE_4_WORKING/README.md',
  'JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md',
  'JANTA_BOL_PHASE_4_WORKING/AFFECTED-FILES.md',
  'JANTA_BOL_PHASE_4_WORKING/CHANGELOG.md',
  'JANTA_BOL_PHASE_4_WORKING/DEBUG-MAP.md',
  'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md'
];

for(const f of required) assert(exists(f),'required B0 record exists: '+f);

const workflow=read('.github/workflows/phase3-regression.yml');
assert(workflow.includes('phase4-execution-2026-10-01'),'protected workflow covers Phase-4 execution branch');

const pushBlock=(workflow.match(/push:\n([\s\S]*?)pull_request:/)||[])[1]||'';
assert(!/\n\s+paths:\s*\n/.test(pushBlock),'Phase-4 branch has no push path filter that could bypass protected CI');
assert(workflow.includes('node ci/phase4/governance-b0.cjs'),'protected workflow executes the Phase-4 B0 governance checker');

const readme=read('JANTA_BOL_PHASE_4_WORKING/README.md');
for(const token of ['1–1034','682','P4-T001–P4-T109','15']){
  assert(readme.includes(token),'source summary contains '+token);
}
assert(readme.includes('NO FAKE PASS'),'no-fake-pass rule is explicit');
assert(readme.includes('RED STOP'),'Phase-3 regression stop rule is explicit');

const map=read('JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md');
for(const token of ['Article / publishing identity','Auth / Founder authority / sessions','Phase-3 Live','Audit / history','Recovery / failure isolation']){
  assert(map.includes(token),'authoritative home mapped: '+token);
}

const register=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
const ids=[...register.matchAll(/\bP4-T(\d{3})\b/g)].map(m=>m[0]);
const unique=[...new Set(ids)].sort();
const expected=Array.from({length:109},(_,i)=>'P4-T'+String(i+1).padStart(3,'0'));
const missing=expected.filter(x=>!unique.includes(x));
const extra=unique.filter(x=>!expected.includes(x));
assert(unique.length===109,'109 unique Phase-4 Test IDs are present');
assert(missing.length===0,'no Phase-4 Test ID gaps');
assert(extra.length===0,'no out-of-range Phase-4 Test IDs');

const rows=register.split('\n').filter(l=>/^\| P4-T\d{3} \|/.test(l));
assert(rows.length===109,'register has exactly 109 test rows');

const allowed=['NOT RUN','IN PROGRESS','PASS','FAIL','DUE','BLOCKED'];
for(const row of rows){
  const status=row.split('|')[5]?.trim()||'';
  assert(allowed.some(x=>status.startsWith(x)),'legal status: '+row.split('|')[1].trim()+' -> '+status);
}

const manualRow=rows.find(x=>x.includes('| P4-T004 |'))||'';
const manualPass=manualRow.includes('| PASS |');
assert(
  manualRow.includes('NOT RUN') || (manualPass && register.includes('Founder real-device screenshot 2026-10-01')),
  'P4-T004 is NOT RUN or has explicit real-device evidence before PASS'
);
const external38=rows.find(x=>x.includes('| P4-T038 |'))||'';
const external79=rows.find(x=>x.includes('| P4-T079 |'))||'';
assert(external38.includes('NOT RUN') && external79.includes('NOT RUN'),'external tests begin as NOT RUN, not fake PASS');

if(process.exitCode){
  process.exit(process.exitCode);
}
console.log('B0 governance checker complete.');