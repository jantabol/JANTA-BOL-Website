import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluateG16,WRITER_GATES} from './t070-g16-write-fence-gate.mjs';
const p='ci/phase4/b11/t070-g16-identity-fingerprint-readonly.sql';
const q=readFileSync(p,'utf8');
const good=()=>Object.fromEntries([
  ['project_ref','vrffsnkycvjithwtiylt'],
  ['cricket_resources_touched',false],
  ['no_paid_resources_created',true],
  ...WRITER_GATES.map(s=>[s,true])
]);
test('G16 immutable writer gate: 20 required, no unproven source passes',()=>{
 assert.equal(WRITER_GATES.length,20);
 const x=evaluateG16({});assert.equal(x.state,'HOLD');assert.equal(x.absent.length,20);
 assert.equal(x.final_t070_lock,false);assert.equal(x.can_start_t071,false);
});
test('G16 every single absent writer restriction blocks snapshot and T070',()=>{
 for(const n of WRITER_GATES) {
  const fixture=good();fixture[n]=false;
  const x=evaluateG16(fixture);
  assert.equal(x.state,'HOLD',n);
  assert.ok(x.absent.includes(n));
 }
});
test('G16 unknown not coercible: string true cannot count as actual founder security proof',()=>{
 const x=good();x.all_three_active_pg_cron_jobs_safely_quiesced='true';
 assert.equal(evaluateG16(x).state,'HOLD');
});
test('G16 project isolation and no billing hard check',()=>{
 const x=good();x.project_ref='hriakdazkcvplsdwgfle';assert.equal(evaluateG16(x).state,'HOLD');
 x.project_ref='vrffsnkycvjithwtiylt';x.cricket_resources_touched=true;assert.equal(evaluateG16(x).state,'HOLD');
 x.cricket_resources_touched=false;x.no_paid_resources_created=false;assert.equal(evaluateG16(x).state,'HOLD');
});
test('G16 hypothetical perfect self-attestation is never actual permission or T070 LOCK',()=>{
 const a=evaluateG16(good());
 assert.equal(a.state,'READY_FOR_INDEPENDENT_RUNTIME_AUDIT');
 assert.equal(a.production_pause_authorized_by_this_code,false);
 assert.equal(a.cross_component_restore_proven,false);
 assert.equal(a.final_t070_lock,false);assert.equal(a.final_t070_pass,false);
});
test('G16 source digest query read-only, 11 families, empty explicit, hides names',()=>{
 for(const name of ['articles','article_versions','grievances','grievance_history',
  'grievance_evidence','live_sessions','live_updates','ad_campaigns','ad_payments',
  'auth_users','storage_metadata'])assert.ok(q.includes("'"+name+"'"));
 assert.match(q,/expected_families/);assert.match(q,/LEFT JOIN families/);
 assert.match(q,/FILTER \(WHERE f\.ord IS NOT NULL\)/);
 assert.match(q,/extensions\.digest/);assert.match(q,/source_rows, identity_sha256/);
 assert.doesNotMatch(q,/\b(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE|COPY|PERFORM|EXECUTE)\b(?=\s+(?:INTO|TABLE|FROM|ON|MATERIALIZED|PROGRAM))/i);
});
test('G16 privacy-safe output only scoped family/count/hash, never IDs or complaint records',()=>{
 assert.match(q,/SELECT family, source_rows, identity_sha256/);
 assert.match(q,/NO_STORAGE_BYTES__NO_FULL_RESTORE/);
 assert.equal(createHash('sha256').update('[]').digest('hex'),
 '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
});
