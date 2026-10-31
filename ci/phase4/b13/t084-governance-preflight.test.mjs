// JANTA BOL Phase 4 / Block13 T084 — DOCUMENTARY / SOURCE PRECHECK ONLY.
// Official T084 final acceptance is forbidden while current B12 E4/E8 and
// Phase4 T092–T109 predecessor real proofs are outstanding.
// No external secrets, network calls, deploy, SQL write, news mutation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p=>readFileSync(p,'utf8');
const register=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
const map=read('JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md');
const b12=read('JANTA_BOL_PHASE_4_WORKING/b12/P4_T083_FOUR_LEGACY_CI_CURRENT_SOURCE_RECONCILIATION_20261031.md');
const preflight=read('JANTA_BOL_PHASE_4_WORKING/b13/P4_T084_GOVERNANCE_PREFLIGHT_20261031.md');
const ids=(lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>'P4-T'+String(i+lo).padStart(3,'0'));
const parse=(content)=>[...content.matchAll(/^\| (P4-T\d{3}) \| ([^|]+) \| ([^|]+) \| (B\d+) \| ([^|]+) \|/gm)]
   .map(([,id,topic,name,block,status])=>({id,topic:topic.trim(),name:name.trim(),block,status:status.trim()}));
const items=parse(register);
const mapping=new Map(items.map(row=>[row.id,row]));
function readyForB13Final({b12Complete=false,predecessorsComplete=false,currentE8=false,
  founderSigned=false,completeCurrentProtectedCi=false}={}){
 return b12Complete&&predecessorsComplete&&currentE8&&founderSigned&&completeCurrentProtectedCi;
}
test('1: official master order demands T092–T109 before B13 final T084–T091',()=>{
 assert.match(register,/P4-T001–P4-T083 -> P4-T092–P4-T109 -> P4-T084–P4-T091 FINAL CLOSURE/);
 assert.match(preflight,/T092–T109/);
});
test('2: exactly eight B13 final tests, no new hidden closure test',()=>{
 const out=items.filter(row=>row.block==='B13');
 assert.deepEqual(out.map(x=>x.id),ids(84,91));
 assert.equal(out.length,8);
});
test('3: predecessor T092–T109 all 18 enumerated and not silently excluded',()=>{
 const out=ids(92,109);
 assert.equal(out.length,18);
 for(const id of out)assert(mapping.has(id),'MISSING_PHASE4_PREDECESSOR_TEST:'+id);
});
test('4: T084 governance is status integrity, not unrelated feature engine',()=>{
 assert.match(mapping.get('P4-T084').name,/Governance.*Status Integrity/);
 assert.match(map,/\| B13 \| Final Closure \| No feature engine \|/);
});
test('5: final T091 requires production closure and post-lock change control',()=>{
 assert.match(mapping.get('P4-T091').name,/Production Closure Report.*Final Lock.*Post-Lock Change Rule/);
});
test('6: historical B12 provenance shows all four fixed with 120/120 selected source CI only',()=>{
 assert.match(b12,/120\/120 PASS/);
 assert.match(b12,/41222111812/);
 assert.match(b12,/B12 FINAL PASS \+ LOCK = HOLD/);
 assert.match(b12,/T081 real current-point coherent DB\+Storage\+Auth\+Edge\+Vercel recovery/);
});
test('7: no fake B13 complete from documentary review or source CI',()=>{
 assert.equal(readyForB13Final(),false);
 assert.equal(readyForB13Final({b12Complete:true}),false);
 assert.equal(readyForB13Final({b12Complete:true,predecessorsComplete:true}),false);
 assert.equal(readyForB13Final({b12Complete:true,predecessorsComplete:true,currentE8:true}),false);
 assert.equal(readyForB13Final({b12Complete:true,predecessorsComplete:true,currentE8:true,completeCurrentProtectedCi:true}),false);
});
test('8: predecessor status is from history not proof of current runtime',()=>{
 for(const id of ids(92,109))assert(mapping.get(id).status.length>0);
 assert.match(preflight,/historical and do not automatically reflect newer real Founder execution/);
});
test('9: Founder-only authority, no paid infra, no public QA article',()=>{
 assert.match(preflight,/Founder\/AAL2/);
 assert.match(preflight,/₹0 new services/);
 assert.match(preflight,/no public QA article/);
});
test('10: final verdict cannot be elevated by registry text',()=>{
 assert.match(preflight,/B12_FINAL_LOCK=HOLD/);
 assert.match(preflight,/Absent proof = HOLD/);
 assert.match(preflight,/Manual Founder action: NONE/);
 assert(!/B13_FINAL_LOCK=PASS/.test(preflight));
});
