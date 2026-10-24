import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,renameSync,rmSync,symlinkSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {syntheticFixture,verify,seal,stageDisposable,evaluateHealth,recoveryDecision,
 safeRel,SCHEMA,PROJECT,MANIFEST,hash} from './recovery-engine.mjs';
function fresh(){
 const outer=mkdtempSync(join(tmpdir(),'jb-b11-test-'));
 const src=join(outer,'source'),dst=join(outer,'restored');
 syntheticFixture(src);
 return {outer,src,dst,clean(){rmSync(outer,{recursive:true,force:true})}};
}
test('T069 inventory: integrity-bound source identity, 2 storage byte objects, schema and project',()=>{
 const f=fresh();try{
  const m=verify(f.src);
  assert.equal(m.schema,SCHEMA);assert.equal(m.project_ref,PROJECT);
  assert.equal(m.storage_count,2);assert.equal(m.files.length,6);
  assert.equal(m.scope.full_postgres_restored,false);
  assert.equal(m.scope.encrypted_offsite_independent,false);
 }finally{f.clean()}
});
test('T069 fail closed: no approved RPO/RTO means HOLD, no imaginary target',()=>{
 const p=evaluateHealth({observed_at:'2026-10-24T09:00:00Z',last_backup_at:'2026-10-24T08:00:00Z',
 last_verified_restore_at:'2026-10-24T08:01:00Z',offsite_verified:true});
 assert.equal(p.status,'HOLD');assert.equal(p.targets_approved,false);
 assert.equal(p.checks.rpo_within_approved,false);
});
test('T069 stale backup and future-dated restore treated unhealthy',()=>{
 const p=evaluateHealth({observed_at:'2026-10-24T09:00:00Z',last_backup_at:'2026-10-24T07:00:00Z',
 last_verified_restore_at:'2026-10-25T09:00:00Z',approved_rpo_seconds:60,approved_rto_seconds:60,
 measured_rpo_seconds:40,measured_rto_seconds:50,offsite_verified:true,
 storage_bytes_verified:true,platform_config_verified:true});
 assert.equal(p.status,'HOLD');assert.equal(p.checks.recent_backup,false);
 assert.equal(p.checks.verified_restore,false);
});
test('T070 offline copy restores exact media bytes and stable Article URL / 3 corrections',()=>{
 const f=fresh();try{
  const result=stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'});
  assert.equal(result.state,'VERIFIED_DISPOSABLE_COPY');
  assert.equal(result.db_sql_restore_executed,false);
  const m=verify(f.dst);assert.equal(m.storage_count,2);
  const id=JSON.parse(readFileSync(join(f.dst,'identity/stable-ids.json'),'utf8'));
  assert.equal(id.articles[0].permanent_url,'/news/one-permanent-url');
  assert.equal(id.articles[0].version_count,3);
  assert.equal(readFileSync(join(f.dst,'storage/private-grievance/evidence.bin'),'utf8'),'FAKE_PRIVATE_EVIDENCE_BYTES_V1');
 }finally{f.clean()}
});
test('T070 idempotent replay safely rechecks existing identical dest',()=>{
 const f=fresh();try{
  stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'});
  const b=stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'});
  assert.equal(b.state,'ALREADY_VERIFIED');
 }finally{f.clean()}
});
test('T070 no write to existing unrelated dest',()=>{
 const f=fresh();try{
  mkdirSync(f.dst);writeFileSync(join(f.dst,'owner.txt'),'KEEP');
  assert.throws(()=>stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'}),/DEST_EXISTS/);
  assert.equal(readFileSync(join(f.dst,'owner.txt'),'utf8'),'KEEP');
 }finally{f.clean()}
});
test('T070 refuse restore anywhere outside OS temp or without explicit confirmation',()=>{
 const f=fresh();try{
  assert.throws(()=>stageDisposable(f.src,'/mnt/data/production',{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'}),/DEST_OUTSIDE/);
  assert.throws(()=>stageDisposable(f.src,f.dst,{}),/CONFIRMATION/);
 }finally{f.clean()}
});
test('T071 proved bounded RPO/RTO is positive only with actual measurements and verified coverage',()=>{
 const p=evaluateHealth({observed_at:'2026-10-24T09:00:00Z',
 last_backup_at:'2026-10-24T08:59:00Z',last_verified_restore_at:'2026-10-24T08:58:00Z',
 approved_rpo_seconds:120,approved_rto_seconds:600,measured_rpo_seconds:90,measured_rto_seconds:320,
 offsite_verified:true,storage_bytes_verified:true,platform_config_verified:true});
 assert.equal(p.status,'HEALTHY');assert.equal(p.no_automatic_restore,true);
 const weak=evaluateHealth({...{observed_at:'2026-10-24T09:00:00Z',
 last_backup_at:'2026-10-24T08:59:00Z',last_verified_restore_at:'2026-10-24T08:58:00Z',
 approved_rpo_seconds:120,approved_rto_seconds:600,measured_rpo_seconds:90,measured_rto_seconds:320,
 offsite_verified:true,storage_bytes_verified:true},platform_config_verified:false});
 assert.equal(weak.status,'HOLD');
});
test('T071 isolated social/media failure preserves Article path and blocks autonomous repair',()=>{
 const x=recoveryDecision('failed_storage');
 assert.equal(x.preserves_article_master_identity,true);
 assert.ok(x.steps.includes('PRESERVE_NEWSROOM_PUBLISHING'));
 assert.equal(x.automatic_destructive_action,false);
});
test('T072 partial mid-copy failure cleans staging; safe retry resumes from unmodified source',()=>{
 const f=fresh();try{
  assert.throws(()=>stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY',
   injectFailureAfter:2}),/INJECTED_PARTIAL_WRITE/);
  assert.ok(!readdirSync(f.outer).some(x=>x.includes('staging')));
  assert.equal(verify(f.src).files.length,6);
  assert.equal(stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'}).state,'VERIFIED_DISPOSABLE_COPY');
 }finally{f.clean()}
});
test('T072 detect post-restore alteration; never silently overwrite',()=>{
 const f=fresh();try{
  stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'});
  writeFileSync(join(f.dst,'storage/public-media/cover.jpg'),'CORRUPTED');
  assert.throws(()=>stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'}),/DEST_EXISTS_DIFFERENT_OR_CORRUPT/);
 }finally{f.clean()}
});
test('T072 changed source asset requires new immutable generation',()=>{
 const f=fresh();try{
  writeFileSync(join(f.src,'storage/public-media/cover.jpg'),'MODIFIED');
  assert.throws(()=>verify(f.src),/HASH_OR_IDENTITY_MISMATCH/);
  assert.throws(()=>seal(f.src),/EXISTING_MANIFEST_IMMUTABLE/);
 }finally{f.clean()}
});
test('T073 unknown bucket traversal and absolute paths rejected',()=>{
 for(const p of ['storage/../../secret','/tmp/file','db//data','storage\\evil','config/.env','storage/secret/key','../auth'])
 assert.throws(()=>safeRel(p),/UNSAFE_RELATIVE_PATH/);
});
test('T073 corruption cannot be relabelled as valid by editing SHA inside manifest',()=>{
 const f=fresh();try{
  const file=join(f.src,MANIFEST),m=JSON.parse(readFileSync(file,'utf8'));
  m.files[0].sha256='a'.repeat(64);writeFileSync(file,JSON.stringify(m));
  assert.throws(()=>verify(f.src),/FILE_HASH_OR_IDENTITY_MISMATCH/);
 }finally{f.clean()}
});
test('T073 symlink source / escaped file rejected before data access',()=>{
 const f=fresh();try{
  const original=join(f.src,'storage/public-media/cover.jpg');
  renameSync(original,original+'.orig');symlinkSync('/etc/passwd',original);
  assert.throws(()=>verify(f.src),/SYMLINK_REJECTED/);
 }finally{f.clean()}
});
test('T073 wrong project origin rejected even if manifest hashes could be regenerated',()=>{
 const f=fresh();try{
  const file=join(f.src,'identity/stable-ids.json');
  const id=JSON.parse(readFileSync(file,'utf8'));
  id.project_ref='hriakdazkcvplsdwgfle';writeFileSync(file,JSON.stringify(id));
  assert.throws(()=>verify(f.src),/WRONG_PROJECT/);
 }finally{f.clean()}
});
test('T073 secrets in public config references rejected with positive heading',()=>{
 const f=fresh();try{
  const file=join(f.src,'config/deployment-refs.json');
  const cfg=JSON.parse(readFileSync(file,'utf8'));cfg.password='DUMMY';
  writeFileSync(file,JSON.stringify(cfg));
  assert.throws(()=>verify(f.src),/CONFIG_SECRET_CONTENT/);
 }finally{f.clean()}
});
test('T074 no spoofed actual archive full DB restore from synthetic bytes',()=>{
 const f=fresh();try{
  const m=verify(f.src);
  assert.equal(m.scope.full_postgres_restored,false);
  assert.equal(m.scope.platform_config_restored,false);
  const a=stageDisposable(f.src,f.dst,{confirmation:'JANTA_BOL_DISPOSABLE_ONLY'});
  assert.equal(a.db_sql_restore_executed,false);
 }finally{f.clean()}
});
test('T074 Founder lost-device incident fail-closed when no known-clean factor',()=>{
 const x=recoveryDecision('lost_founder_device');
 assert.equal(x.decision,'HOLD_FOR_SAFE_EVIDENCE');
 assert.equal(x.automatic_session_reset,false);
 assert.equal(recoveryDecision('lost_founder_device',{known_clean_device:true}).decision,
 'FOUNDER_APPROVAL_REQUIRED');
});
test('T075 incidents are decision trees only, never mutate secrets, DB, content or sessions',()=>{
 for(const fault of ['compromised_session','corrupt_backup','deleted_article','lost_founder_device',
 'failed_storage','credential_compromise','partial_database_write']){
  const x=recoveryDecision(fault);
  assert.equal(x.automatic_destructive_action,false);
  assert.equal(x.preserves_article_master_identity,true);
 }
 assert.throws(()=>recoveryDecision('DROP_LIVE_DATABASE'),/UNKNOWN_INCIDENT/);
});
test('T075 corrupt / missing file forces HOLD, not silent healthy recovery',()=>{
 const f=fresh();try{
  rmSync(join(f.src,'storage/private-grievance/evidence.bin'));
  assert.throws(()=>verify(f.src),/ADDED_OR_DELETED_FILE/);
 }finally{f.clean()}
});
