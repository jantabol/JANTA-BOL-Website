import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guardManual} from './storage-readonly-export.mjs';
const db=readFileSync('ci/backup/jb-free-offsite-backup.sh','utf8');
const wf=readFileSync('.github/workflows/b11-t070-real-joint-restore-MANUAL.yml','utf8');
const exporter=readFileSync('ci/phase4/b11/storage-readonly-export.mjs','utf8');
const exact='jantabol/JANTA-BOL-Website/.github/workflows/b11-t070-real-joint-restore-MANUAL.yml@refs/heads/main';
const ctx={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website',GITHUB_ACTOR:'jantabol',GITHUB_REF:'refs/heads/main',GITHUB_RUN_ATTEMPT:'1'};
test('T070 requires separate exact Founder/main/manual workflow, not public push or PR',()=>{
 assert.equal(guardManual({...ctx,GITHUB_WORKFLOW_REF:exact,B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_T070_JOINT_EXPORT_ONLY',JB_T034_DUAL_RESTORE_PROBE:'1',JB_T070_JOINT_PROBE:'1'}),true);
 for(const patch of [{GITHUB_ACTOR:'attacker'},{GITHUB_REF:'refs/heads/test'},{GITHUB_EVENT_NAME:'push'},{JB_T034_DUAL_RESTORE_PROBE:'0'},{JB_T070_JOINT_PROBE:'0'},{B11_MEDIA_EXPORT_CONFIRMATION:'BAD'},{GITHUB_WORKFLOW_REF:'nonexistent'}]){
  assert.throws(()=>guardManual({...ctx,GITHUB_WORKFLOW_REF:exact,B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_T070_JOINT_EXPORT_ONLY',JB_T034_DUAL_RESTORE_PROBE:'1',JB_T070_JOINT_PROBE:'1',...patch}),/FOUNDER_EXACT_MANUAL_APPROVAL_REQUIRED/);
 }
});
test('T069 original exact legacy manual media guard remains permitted independently',()=>{
 assert.equal(guardManual({...ctx,GITHUB_WORKFLOW_REF:'jantabol/JANTA-BOL-Website/.github/workflows/b11-storage-media-MANUAL.yml@refs/heads/main',B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_MEDIA_EXPORT_ONLY'}),true);
});
test('T034 old dual recipient path still accepted in unchanged non-joint mode',()=>{
 assert.match(db,/JB_T070_JOINT_PROBE:-0/);
 assert.match(db,/\$joint" == 0 \|\| "\$dual" == 1/);
 assert.match(db,/legacy T034 manual workflow identity required/);
 assert.match(db,/\.github\/workflows\/b7-t034-dual-recipient-real-MANUAL\.yml@refs\/heads\/main/);
});
test('T070 source original Storage files bound inside PG raw dumped MVCC transaction',()=>{
 const sql='ci/phase4/b11/t070-joint-storage-snapshot-identity.sql';
 assert.match(db,/jb_t034_snapshot_query ci\/phase4\/b11\/t070-joint-storage-snapshot-identity\.sql/);
 assert.match(db,/node ci\/phase4\/b11\/storage-media-manual-cli\.mjs export-manual/);
 assert.ok(db.indexOf('t070-joint-storage-snapshot-identity.sql')<db.indexOf("  jb_t034_snapshot_finish\n  printf"));
 assert.ok(db.includes('bundle+=(t070_snapshot_storage.json t070_post_media_current_storage.json t070_representative_identity.txt t070_post_media_representative_identity.txt media)'));
 assert.match(db,/source_db_identity\.json/);
 assert.match(db,/READ COMMITTED, READ ONLY/);
 assert.match(db,/t070_post_media_current_storage\.json/);
 assert.match(readFileSync(sql,'utf8'),/FROM storage\.objects o/);
});
test('T070 restores one B2 ciphertext before asserting genuine source DB/media sample',()=>{
 assert.match(db,/age -d -i "\$work\/ephemeral-restore.identity"/);
 assert.match(db,/bash ci\/backup\/jb-t034-offline-full-pg-restore\.sh/);
 assert.match(db,/verify-offline[\s\S]*--root "\$work\/recovered\/media"/);
 assert.match(db,/T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS/);
 assert.match(db,/T070_FINAL_LOCK=HOLD/);
 assert.doesNotMatch(db,/\bsupabase db reset\b|\bpg_restore .*(?:DB_URI|pooler\.supabase\.com)/);
});
test('T070 original source Storage UUIDs confirmed against the ACTUAL restored PG17 clone before its teardown',()=>{
 const script=readFileSync('ci/backup/jb-t034-offline-full-pg-restore.sh','utf8');
 assert.match(script,/if \[\[ "\$\{JB_T070_JOINT_PROBE:-0\}" == 1 \]\]; then/);
 assert.match(script,/t070-joint-storage-snapshot-identity\.sql/);
 assert.match(script,/\$src\/t070_snapshot_storage\.json/);
 assert.match(script,/T070_RESTORED_PG17_AND_ORIGINAL_FIVE_FILE_UUIDS_METADATA=EXACT_MATCH/);
 assert.match(script,/GITHUB_EVENT_NAME:-\}" == workflow_dispatch/);
});
test('T070 protected release cannot auto read public source and never uses founder AGE private key',()=>{
 assert.match(wf,/workflow_dispatch:/);
 assert.match(wf,/github\.actor == 'jantabol'/);
 assert.match(wf,/github\.ref == 'refs\/heads\/main'/);
 assert.match(wf,/github\.event\.inputs\.reviewed_sha == github\.sha/);
 assert.match(wf,/environment: janta-bol-production-backup/);
 assert.match(wf,/concurrency:\n  group: janta-bol-free-backup/);
 assert.match(wf,/JB_B11_SERVICE_ROLE_KEY: \$\{\{ secrets\.JB_B11_SERVICE_ROLE_KEY \}\}/);
 assert.match(wf,/JB_T034_DUAL_RESTORE_PROBE: '1'/);
 assert.match(wf,/JB_T070_JOINT_PROBE: '1'/);
 assert.doesNotMatch(wf,/AGE_PRIVATE|AGE_IDENTITY|CRICKET/);
 assert.doesNotMatch(exporter,/method\s*:\s*['\"](?:PUT|DELETE|PATCH)['\"]/);
});

test('T070 representative Article/PURL, Grievance, LIVE, Ads and Auth source identity proof is joint-only and AGE sealed',()=>{
 const q=readFileSync('ci/phase4/b11/t070-representative-identity.sql','utf8');
 const clone=readFileSync('ci/backup/jb-t034-offline-full-pg-restore.sh','utf8');
 const names=['public.articles','public.article_versions','public.grievances',
 'public.grievance_history','public.grievance_evidence','public.live_sessions',
 'public.live_operations','public.ad_campaigns','public.ad_payments',
 'public.audit_logs','auth.users','public.user_roles','storage.objects'];
 for(const table of names)assert.ok(q.includes('FROM '+table+' t'),'T070 missing '+table);
 assert.equal(q.split(" AS metric").length-1,25);
 for(const forbidden of ['INSERT INTO','UPDATE public.','DELETE FROM','DROP TABLE','ALTER TABLE'])
  assert.ok(!q.toUpperCase().includes(forbidden.toUpperCase()),'T070 SQL is not read-only');
 assert.ok(db.includes('jb_t034_snapshot_query ci/phase4/b11/t070-representative-identity.sql'));
 assert.ok(db.includes('bundle+=(t070_snapshot_storage.json t070_post_media_current_storage.json t070_representative_identity.txt t070_post_media_representative_identity.txt media)'));
 assert.ok(db.includes('cmp -s "$work/plain/t070_representative_identity.txt"'));
 assert.ok(clone.includes('T070_REPRESENTATIVE_ARTICLE_PURL_GRIEVANCE_LIVE_ADS_AUTH_IDENTITIES=EXACT_MATCH'));
 assert.ok(clone.includes('T070_RESTORED_REAL_AD_PAYMENT_SAMPLE_PRESENT=false'));
 assert.ok(clone.includes('cmp -s "$src/t070_representative_identity.txt"'));
 assert.ok(clone.includes('for n in 19 20 21 22 23 24 25'));
 assert.ok(wf.includes('workflow_dispatch:'));
});

test('T070 source representative MVCC identity MUST equal fresh read-only post-media source before encryption and remain exact after isolated readback',()=>{
 const source = 't070_representative_identity.txt';
 const post = 't070_post_media_representative_identity.txt';
 assert.ok(db.includes("cat ci/phase4/b11/t070-representative-identity.sql"));
 assert.ok(db.includes('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED, READ ONLY;'));
 assert.ok(db.includes('> "$work/plain/'+post+'"'));
 assert.ok(db.includes('cmp -s "$work/plain/'+source+'"'));
 assert.ok(db.includes('"$work/plain/'+post+'"'));
 assert.ok(db.includes("fail 'source Article/Grievance/LIVE/Ads/Auth changed during joint media acquisition'"));
 assert.ok(db.includes("T070_FRESH_PG_POST_MEDIA_25_IDENTITY_FAMILIES=STABLE"));
 assert.ok(db.includes('bundle+=(t070_snapshot_storage.json t070_post_media_current_storage.json t070_representative_identity.txt t070_post_media_representative_identity.txt media)'));
 assert.ok(db.includes('cmp -s "$work/recovered/'+source+'"'));
 assert.ok(db.includes('"$work/recovered/'+post+'"'));
 const pre = db.indexOf("jb_t034_snapshot_query ci/phase4/b11/t070-representative-identity.sql");
 const postread = db.indexOf('> "$work/plain/'+post+'"');
 const apiCheck = db.indexOf('node ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs');
 const tar = db.indexOf('tar -C "$work/plain"');
 assert.ok(pre>=0&&postread>pre&&apiCheck>postread&&tar>apiCheck);
 assert.ok(db.indexOf('T070_FRESH_PG_POST_MEDIA_25_IDENTITY_FAMILIES=STABLE')<db.indexOf('  jb_t034_snapshot_finish\n  printf'));
});
