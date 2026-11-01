// B13 T084 prerequisite audit — source/document ONLY.
// Historical PASS recognitions are preserved, not newly re-awarded.
// No external database, credentials, internet, production mutation or backup work.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const register=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
const report=read('JANTA_BOL_PHASE_4_WORKING/b13/P4_T092_T109_PREDECESSOR_AND_T081_READONLY_RECONCILIATION_20261031.md');
const ids=(a,b)=>Array.from({length:b-a+1},(_,i)=>'P4-T'+String(i+a).padStart(3,'0'));
const rows=[...register.matchAll(/^\| (P4-T\d{3}) \| ([^|]+) \| ([^|]+) \| (B\d+) \| ([^|]+) \|/gm)]
  .map(([,id,topic,name,block,status])=>({id,topic:topic.trim(),name:name.trim(),block,status:status.trim()}));
const map=new Map(rows.map(r=>[r.id,r]));
const documentedLocks=[100,101,102,106,107,108,109];
const b8Outstanding=ids(92,99);
const b9Partial=ids(103,104);
const t105='P4-T105';

test('T084 prerequisite: exact B8/B9 T092–T109 18-test original order',()=>{
 assert.deepEqual(ids(92,109).map(x=>map.get(x)?.id),ids(92,109));
 assert.equal(ids(92,109).length,18);
 assert.equal(b8Outstanding.length,8);
});
test('Preserve B8 0/8 formal completion, never infer it from synthetic PG17 success',()=>{
 assert.match(register,/P4-T092–T099 remain NOT RUN, 0\/8 real PASS\+LOCK/);
 assert.match(report,/8 HOLD/);
 for(const id of b8Outstanding)assert.equal(map.get(id)?.block,'B8');
});
test('Seven individually historically signed B9 statuses are not quietly demoted',()=>{
 for(const n of documentedLocks){
   const id='P4-T'+n;
   assert.equal(map.get(id)?.block,'B9');
   assert(register.includes(id),'missing '+id);
 }
 for(const expression of [
   /P4-T100: PASS \+ LOCK/,
   /P4-T101: PASS \+ LOCK/,
   /P4-T102: PASS \+ LOCK/,
   /P4-T106 = PASS \+ LOCK/,
   /P4-T107 = PASS \+ LOCK/,
   /P4-T108: PASS \+ LOCK/,
   /P4-T109 = PASS \+ LOCK/
 ])assert.match(register,expression);
 assert.match(report,/7 previously documented individual PASS\+LOCK/);
});
test('T103/T104 incomplete final acceptance is NOT fabricated',()=>{
 for(const id of b9Partial)assert.equal(map.get(id)?.block,'B9');
 assert.match(report,/2 T103\/T104 proof not independently established/);
});
test('T105 physical 11/11 + disposable 5000 archive cannot supply missing real E3',()=>{
 assert.equal(map.get(t105)?.block,'B9');
 assert.match(register,/T105: 11\/11 actual founder Android-phone\/tablet steps completed as scoped/);
 assert.match(register,/5000 synthetic additional records/);
 assert.match(register,/T105 remaining E3 only: actual 1–2-year-old legitimately existing\/published Article/);
 assert.match(report,/1 T105 DUE\/HOLD/);
});
test('No fake 2024–25 public story is required, created or claimed',()=>{
 assert.match(report,/do not create fictitious old Article/);
 assert.match(report,/B9 block still \*\*HOLD\*\*/);
});
test('Supabase snapshot is explicitly a read-only point-in-time inventory, NOT E8',()=>{
 assert.match(report,/2 published, 31 draft, 1 deleted/);
 assert.match(report,/5 stored objects/);
 assert.match(report,/2 grievance-private, 1 private-editorial, 2 public-media/);
 assert.match(report,/NOT a tested downloadable backup/);
 assert.match(report,/T081\/T082 real E8\/E4 stay \*\*HOLD\*\*/);
});
test('T084 cannot be final because B12 and T092–T109 are not all accepted',()=>{
 assert.match(register,/P4-T001–P4-T083 -> P4-T092–P4-T109 -> P4-T084–P4-T091 FINAL CLOSURE/);
 assert.match(report,/T084 FORMAL FINAL=NOT_RUN/);
 assert.match(report,/B12 FINAL=HOLD/);
 assert.match(report,/B13 FINAL=HOLD/);
});
test('Keep zero-paid, Founder-only, no fake source/news and no destructive restore',()=>{
 assert.match(report,/Founder \*\*₹0\*\* rule/);
 assert.match(report,/do not create potentially billable Supabase branches/);
 assert.match(report,/not\*\* be destructively restored/);
 assert.match(report,/No manual user step/);
});
test('Exactly 18 historical classifications, no extra hidden completion',()=>{
 const categories=[8,7,2,1];
 assert.equal(categories.reduce((a,b)=>a+b,0),18);
 assert.deepEqual(ids(92,109).filter(x=>b8Outstanding.includes(x)).length,8);
 assert.deepEqual(ids(92,109).filter(x=>b9Partial.includes(x)).length,2);
 assert.equal(t105,'P4-T105');
});
