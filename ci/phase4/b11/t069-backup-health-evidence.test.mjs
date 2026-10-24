import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const entry='ci/phase4/b11/t069-backup-health-evidence.mjs';
const observation=JSON.parse(readFileSync('ci/phase4/b11/t069-readonly-observation-20261024.json'));
const run=(...args)=>spawnSync(process.execPath,[entry,...args],{encoding:'utf8'});
test('T069 live read-only and historical real offsite baseline attributable but not real backup-currentness',()=>{
 const v=run();assert.equal(v.status,0,v.stderr);
 const r=JSON.parse(v.stdout);
 assert.equal(r.test_id,'P4-T069');
 assert.deepEqual(r.evidence_passed,['original_git_source_layer_sha256_zip_verified','live_db_security_readonly_snapshot','historical_actual_encrypted_B2_DB_restore']);
 assert.equal(r.production_backup_dispatched,false);
 assert.equal(r.real_b2_object_read_now,false);
 assert.equal(r.final_t069,'HOLD');
 assert.equal(r.can_unlock_b11,false);
});
test('T069: absence of fresh B2 and media bytes cannot be treated as final green even if app healthy',()=>{
 const r=JSON.parse(run().stdout);
 assert.ok(r.evidence_missing.includes('current_B2_ciphertxt_readback'));
 assert.ok(r.evidence_missing.includes('all_three_storage_bucket_file_bytes_offsite'));
 assert.equal(r.backup_recency_target_seconds,null);
});
test('T069: development CI explicitly fails closed on request to claim original final release',()=>{
 const p=run('--require-lock');
 assert.equal(p.status,3);assert.match(p.stderr,/T069_FINAL_HOLD/);
});
test('T069: independently replaying as-of clock reports correct nonnegative backup age without new download',()=>{
 const p=run('--as-of','2026-10-24T12:00:00Z');
 const r=JSON.parse(p.stdout);
 assert.equal(p.status,0,p.stderr);
 assert.equal(r.historic_database_encrypted_backup_age_seconds,Math.round(
 (Date.parse('2026-10-24T12:00:00Z')-Date.parse('2026-10-21T12:59:33Z'))/1000));
});
test('T069: timestamp and source evidence do not expose credentials, JWT, personal row values',()=>{
 const b=readFileSync('ci/phase4/b11/t069-readonly-observation-20261024.json','utf8');
 assert.ok(!/(?:service_role_key|access_token|bearer\s+eyJ|password|private_key)/i.test(b));
 assert.equal(observation.source_rows_exported,false);
 assert.equal(observation.production_mutation_performed,false);
});

test('T069: newest 21 Oct real B2 ciphertext witness replaces stale 15 Oct as latest proved restore',()=>{
 const r=JSON.parse(run('--as-of','2026-10-24T12:00:00Z').stdout);
 assert.equal(observation.historic_b2_real_workflow_run,39602669748);
 assert.equal(r.known_last_verified_real_database_backup,'2026-10-21T12:59:33Z');
 assert.equal(r.historical_b2_ciphertext_sha256,'3f919708e4e0683d1be5f7433da1d3abf848a68fc41a850c6ebe039958d17233');
 assert.equal(r.historic_database_encrypted_backup_age_seconds,Math.round((Date.parse('2026-10-24T12:00:00Z')-Date.parse('2026-10-21T12:59:33Z'))/1000));
 assert.equal(r.real_b2_object_read_now,false);
 assert.equal(r.final_t069,'HOLD');
});
