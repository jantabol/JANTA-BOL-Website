// Official T084 precheck ONLY (never final RUN-15).
// Protect 109 original IDs, all status rows and the exact old register prefix.
// This job is source/documentary only and must not simulate production/E8.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const base='51b3f5fa46708bfeb357b0b61076583e19b04383';
const regPath='JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md';
const reg=readFileSync(regPath,'utf8');
const original=execFileSync('git',['show',base+':'+regPath],{encoding:'utf8',timeout:12000,maxBuffer:2*1024*1024});
const marker='## 2026-11-01 — B12/B13 REAL LIVE/CI SUPPLEMENT (REVIEW BRANCH ONLY)';
const official=reg.split('\n## Register\n')[1]?.split('\n## B0 evidence ledger')[0] || '';
const rowPattern=/^\| P4-T(\d{3}) \|[^\n]*$/gm;

test('T084-preflight: immutable original register preserved without deleting/renaming earlier evidence',()=>{
 assert(reg.startsWith(original),'OLD_REGISTER_CHANGED_OR_REMOVED');
 assert.equal(reg.split(marker).length,2,'NOV01_SUPPLEMENT_MUST_EXIST_ONCE');
 assert(reg.indexOf(marker)>=original.length,'SUPPLEMENT_MUST_BE_APPEND_ONLY');
});
test('T084-preflight: each of the original 109 distinct test numbers present exactly once in official index',()=>{
 const ids=[...official.matchAll(rowPattern)].map(m=>Number(m[1]));
 assert.equal(ids.length,109,'INDEX_MUST_CONTAIN_109_TEST_ROWS');
 const seen=new Set(ids);
 assert.equal(seen.size,109,'DUPLICATE_OR_MISSING_REGISTER_IDS');
 for(let i=1;i<=109;i++)assert(seen.has(i),'MISSING_P4_T'+String(i).padStart(3,'0'));
});
test('T084-preflight: original B13 eight FINAL rows remain NOT RUN, no synthetic PASS',()=>{
 for(let i=84;i<=91;i++){
  const id='P4-T'+String(i).padStart(3,'0');
  const line=official.split('\n').find(x=>x.startsWith('| '+id+' |'));
  assert(line && /\| B13 \| NOT RUN — FINAL \|$/.test(line),'MISCLASSIFIED_'+id);
 }
});
test('T084-preflight: existing genuine Founder governance/source chronology kept, not auto completed',()=>{
 assert.match(reg,/P4-T001–P4-T083 -> P4-T092–P4-T109 -> P4-T084–P4-T091 FINAL CLOSURE/);
 assert(reg.includes('B12 FINAL LOCK=HOLD'));
 assert(reg.includes('T085 FORMAL RUN-15 REQUIRED E1+E2+E4+E5 NOT_RUN'));
 assert(reg.includes('B13 T084–T091'));
 assert(reg.includes('FORMAL NOT_RUN / FINAL HOLD'));
});
test('T084-preflight: original full Phase3 DB transactional is explicitly NOT proven',()=>{
 assert(reg.includes('13 Supabase transactional DB checks were NOT_RUN'));
 assert(reg.includes('Do not label all protected Phase3 CI GREEN'));
 assert(reg.includes('644 old IDs mapped, 59 manual-only IDs never auto-PASS'));
 assert(reg.includes('41287679359'));
});
test('T084-preflight: live older source vs review protected preview identity truth',()=>{
 assert(reg.includes('dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF'));
 assert(reg.includes('dpl_D89qkkR5TdjX2GNfB1fsKybXf9ve'));
 assert(reg.includes('T080 REAL PRODUCTION/FOUNDER ANDROID interrupted network E3/E5 NOT RUN'));
 assert(reg.includes('T081 FULL HOLD'));
 assert(reg.includes('T082 FULL HOLD'));
});
test('T084-preflight: B8 eight original formal tests not spuriously approved',()=>{
 for(let i=92;i<=99;i++){
  const id='P4-T'+String(i).padStart(3,'0');
  const line=official.split('\n').find(x=>x.startsWith('| '+id+' |'));
  assert(line && /\| B8 \| NOT RUN \|$/.test(line),'FALSE_B8_FORMAL_PASS_'+id);
 }
 assert(reg.includes('T092–T099 **0/8 official final lock**'));
});
test('T084-preflight: original source-only status crosswalk does not mislabel E8 PASS',()=>{
 assert(reg.includes('FULL FINAL PASS+LOCK HOLD'));
 assert(reg.includes('T081 FULL HOLD'));
 assert(reg.includes('T082 FULL HOLD'));
 assert(reg.includes('B12 FINAL LOCK=HOLD'));
 assert(reg.includes('T091 is the absolute last evidence-backed release gate'));
});
