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


test('T084-preflight: original T103 and T104 FINAL dossiers are present and Git-blob pinned',()=>{
 const dossiers=[
  ['JANTA_BOL_PHASE_4_WORKING/review/P4_T103_RUN13_FINAL_E1_E2_E3_E5_20261023.md','cc3a000c17210c987aa83739b3e1146d661a434a','39928234462','E1 + E2 + E3 + E5'],
  ['JANTA_BOL_PHASE_4_WORKING/review/P4_T104_RUN13_FINAL_E1_E2_E4_E5_20261023.md','c68d419eec5bff91215df4755ca761480cda4d4c','39934685177','E1 + E2 + E4 + E5'],
 ];
 for(const [path,sha,runId,codes] of dossiers){
  const actual=execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8',timeout:12000}).trim();
  assert.equal(actual,sha,'ORIGINAL_DOSSIER_SOURCE_DRIFT:'+path);
  const content=readFileSync(path,'utf8');
  assert.match(content,/PASS\s*\+\s*LOCK/,'ORIGINAL_FINAL_DOSSIER_MISSING_PASS_LOCK:'+path);
  assert(content.includes(runId),'ORIGINAL_FINAL_DOSSIER_MISSING_ACTUAL_CI:'+path);
  assert(content.includes(codes),'ORIGINAL_FINAL_DOSSIER_MISSING_EVIDENCE:'+path);
 }
});

test('T084-preflight: corrected 18 original predecessor statuses preserve 9 historical locks, 8 B8 HOLD and 1 T105 DUE',()=>{
 const crosswalk=readFileSync('JANTA_BOL_PHASE_4_WORKING/b13/P4_B13_MASTER_PDF_AUTHORITY_CROSSWALK_20261101.md','utf8');
 const current=crosswalk.split('## 2026-11-01 T084 original T103/T104 historical dossier verification — corrected predecessor evidence index')[1];
 assert(current,'LATEST_23OCT_T103_T104_CORRECTION_MISSING');
 for(const id of ['P4-T103','P4-T104','39928234462','39934685177']){
  assert(current.includes(id),'ORIGINAL_CI_DOSSIER_EVIDENCE_MISSING:'+id);
 }
 assert(current.includes('9 historical B9 individual PASS+LOCK'));
 assert(current.includes('8 B8 T092–T099 official formal HOLD'));
 assert(current.includes('1 B9 T105 authentic 1–2yr-old archive/Android scale DUE/HOLD'));
 assert(current.includes('T084_FORMAL_FINAL=NOT_RUN'));
 assert(current.includes('T084_FINAL_LOCK=HOLD'));
 assert(current.includes('Phase-3 13 transactional scripts still NOT_RUN'));
});
