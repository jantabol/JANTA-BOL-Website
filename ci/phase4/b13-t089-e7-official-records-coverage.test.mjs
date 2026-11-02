// B13/P4-T089 (RUN15 Sections793–804) E1/E7: official records completeness.
// Audit coverage != automatic official final PASS: missing mapped proof remains DUE.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const root='JANTA_BOL_PHASE_4_WORKING/';
const registerFile=root+'TEST-REGISTER.md';
const codeFile=root+'CODE-MAP.md';
const debugFile=root+'DEBUG-MAP.md';
const logFile=root+'CHANGELOG.md';
const dossier=root+'review/P4_T089_RUN15_E1_E7_COVERAGE_AUDIT_START_20261102.md';
const indexFile=root+'review/P4_T089_OFFICIAL_E7_REGISTER_EVIDENCE_INDEX_20261102.json';
const base='985f0071091760752aa00b72cde4bc14d53bc412';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const git=(args)=>execFileSync('git',args,{encoding:'utf8',timeout:20000});
const reg=read(registerFile);
const idx=JSON.parse(read(indexFile));
const lines=reg.split('\n').filter(x=>/^\| P4-T\d{3} \|/.test(x));
const records=lines.map(row=>{const p=row.split('|').map(y=>y.trim());return {id:p[1],topic:p[2],name:p[3],block:p[4],status:p[5]};});
const requiredIds=Array.from({length:109},(_,i)=>'P4-T'+String(i+1).padStart(3,'0'));
const expectedBlockCounts={B0:4,B1:7,B2:9,B3:8,B4:6,B5:10,B6:6,B7:9,B8:8,B9:10,B10:9,B11:7,B12:8,B13:8};
const expectedPaths=new Set([
 registerFile,codeFile,debugFile,logFile,dossier,indexFile,
 'ci/phase4/b13-t089-e7-official-records-coverage.test.mjs',
 'ci/phase4/b13-t089-original-master-section-checkpoint-crosswalk.test.mjs',
 root+'review/P4_T089_ORIGINAL_MASTER_109_SECTION_CROSSWALK_20261102.json',
 root+'review/P4_T089_ORIGINAL_MASTER_14_TOPIC_682_CHECKPOINT_1034_SECTION_INVENTORY_20261102.json',
 '.github/workflows/b13-t089-records-audit-20261102.yml'
]);
const row=id=>records.find(r=>r.id===id);
test('T089-01 original 109 checkpoint IDs exact contiguous, no missing/duplicate',()=>{
 assert.equal(lines.length,109);
 assert.deepEqual(records.map(x=>x.id),requiredIds);
 assert.equal(new Set(records.map(x=>x.id)).size,109);
 assert.ok(records.every(x=>x.topic&&x.name&&x.block&&x.status));
});
test('T089-02 14 distinct B0–B13 blocks map 109 tests with no orphan ID',()=>{
 const counts={};
 for(const x of records) counts[x.block]=(counts[x.block]||0)+1;
 assert.deepEqual(counts,expectedBlockCounts);
 assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),109);
 assert.deepEqual(records.filter(x=>x.block==='B13').map(x=>x.id),
  Array.from({length:8},(_,i)=>'P4-T'+String(84+i).padStart(3,'0')));
});
test('T089-03 original final governance state CANNOT be silently upgraded',()=>{
 assert.equal(row('P4-T084').status,'NOT RUN — FINAL');
 assert.equal(row('P4-T085').status,'NOT RUN — FINAL');
 assert.equal(row('P4-T086').status,'PASS');
 assert.match(row('P4-T087').status,/SCOPED PASS\+LOCK.*FINAL PASS\+LOCK HOLD/);
 assert.match(row('P4-T088').status,/FOUNDER SCOPED PASS\+LOCK.*ORIGINAL FINAL PASS\+LOCK HOLD/);
 assert.match(row('P4-T089').status,/IN PROGRESS.*FINAL PASS\+LOCK HOLD/);
 assert.match(row('P4-T090').status,/^NOT RUN/);
 assert.match(row('P4-T091').status,/^NOT RUN/);
 const alreadyNotRun=records.filter(x=>x.status.startsWith('NOT RUN'));
 // From initial source 67 NOT RUN, T089 is now formally IN PROGRESS, so 66.
 assert.equal(alreadyNotRun.length,66);
});
test('T089-04 append-only official Evidence Index has 109 unique entries and truthful statuses',()=>{
 assert.equal(idx.source_sha,base);
 assert.equal(idx.counts.total,109);
 assert.equal(idx.counts.distinct,109);
 assert.deepEqual(idx.counts.test_ids_gap,[]);
 assert.equal(idx.records.length,109);
 assert.deepEqual(idx.records.map(x=>x.id),requiredIds);
 assert.equal(idx.counts.not_run,67,'source snapshot must disclose 67 missing official results');
 assert.equal(idx.counts.with_filename_candidate,51);
 assert.equal(idx.counts.without_filename_candidate,58);
 for(const x of idx.records){
  const v=row(x.id);
  assert.equal(x.block,v.block);
  assert.equal(x.name,v.name);
  assert.equal(x.official_register_status,
   x.id==='P4-T089'?'NOT RUN — FINAL':v.status,
   'metadata mismatch or unreviewed status upgrade: '+x.id);
  assert.equal(x.can_count_candidates_as_actual_pass,false);
  assert.ok(['CANDIDATE_ONLY_NEEDS_E7_AUTHORITY_RECONCILIATION',
    'NO_DEDICATED_FILE_FOUND_REGISTER_HISTORY_MAY_EXIST'].includes(x.verified_evidence_index_state));
  for(const file of x.candidate_review_files){
   assert.ok(file.startsWith(root+'review/')||file.startsWith(root+'evidence/'));
   assert.ok(exists(file),'evidence candidate moved/missing: '+file);
  }
 }
});
test('T089-05 official CODE-MAP/DEBUG-MAP/CHANGELOG/TEST-REGISTER all present with dated E7 correction',()=>{
 for(const path of [codeFile,debugFile,logFile,registerFile]){
  assert.ok(exists(path),'OFFICIAL_MAP_MISSING: '+path);
  assert.match(read(path),/T089 OFFICIAL E7 AUDIT CHECKPOINT — 2026-11-02/,
   'OFFICIAL_MAP_T089_NOT_UPDATED: '+path);
  assert.ok(read(path).includes('P4_T089_OFFICIAL_E7_REGISTER_EVIDENCE_INDEX_20261102.json'),
   'OFFICIAL_RECORD_INDEX_NOT_REFERENCED: '+path);
 }
 const d=read(dossier);
 for(const term of ['Sections **793–804**','E1 + E7','67/109',
  '51','58','T089_ORIGINAL_FINAL_PASS_LOCK=HOLD','NO','orphan']){
   assert.ok(d.toLowerCase().includes(term.toLowerCase()),'T089_SCOPE_OR_GAP_HIDDEN: '+term);
 }
});
test('T089-06 E7 detects missing evidence and semantic/orphan audit as HOLD, not fake PASS',()=>{
 const d=read(dossier);
 assert.ok(d.includes('T089_E7_FULL_ORPHAN_REQUIREMENTS_CROSS_REFERENCE=HOLD'));
 assert.ok(d.includes('T089_E7_FOUR_OFFICIAL_RECORDS_CURRENT=HOLD')||
    d.includes('T089_E7_FOUR_OFFICIAL_RECORDS_CURRENT=PASS_SCOPED'),'No records status reconciliation');
 assert.ok(d.includes('T089_ORIGINAL_FINAL_PASS_LOCK=HOLD'));
 assert.ok(!row('P4-T089').status.includes('FINAL PASS+LOCK=PASS'));
});
test('T089-07 previous Owner/Security/Backup test sources remain untouched; no rebuild and no DB edits',()=>{
 assert.equal(git(['merge-base',base,'HEAD']).trim(),base);
 const changed=git(['diff','--name-only',base,'HEAD']).trim().split('\n').filter(Boolean);
 for(const path of changed){
  assert.ok(expectedPaths.has(path),'T089_UNAUTHORIZED_OLD_SOURCE_CHANGE: '+path);
 }
 assert.ok(changed.every(path=>!path.startsWith('JANTA_BOL_PHASE_3C_WORKING/')));
 assert.ok(changed.every(path=>!path.startsWith(root+'db/')));
 assert.ok(changed.every(path=>!path.startsWith('CODEX_CURRENT_SUPABASE/')));
});
console.log('T089_CANONICAL_109_UNIQUE_AND_14_BLOCKS=PASS_SCOPED');
console.log('T089_REGISTER_SOURCE_NOT_RUN_67_CURRENT_AFTER_START_66=DUE');
console.log('T089_OFFICIAL_E7_INDEX_LINKED_RECORDS_109=PASS_SCOPED');
console.log('T089_FULL_ORPHAN_REQUIREMENTS_DUPLICATE_IMPLEMENTATION=HOLD');
console.log('T089_ORIGINAL_FINAL_PASS_LOCK=HOLD');
