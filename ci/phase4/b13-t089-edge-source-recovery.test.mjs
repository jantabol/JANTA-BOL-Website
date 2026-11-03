// JANTA BOL T089 E7 — Five previously deployed-only Supabase Edge source homes.
// Checks byte-exact Git source snapshots, drift, no new runtime deploy claims.
// Source copies are candidate code-control evidence, not a production restoration test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T089_EDGE_SOURCE_RECOVERY_MANIFEST_20261103.json','utf8'));
const expectedBlob={"CODEX_CURRENT_SUPABASE/functions/jb-recovery-delete-mfa/index.ts":"29bd3c2ded6a5de0ade7a6bb9dd6fdd8a384d50f","CODEX_CURRENT_SUPABASE/functions/jb-grievance-assets/index.ts":"852cf9f3e101ee4a18e73ee1d58391d99dbe7a34","CODEX_CURRENT_SUPABASE/functions/jb-b11-t069-media-backup/index.ts":"cf49127cad97a84d695e296fb58ccdc61e84ac99","CODEX_CURRENT_SUPABASE/functions/jb-b11-t069-media-backup/t069-b2-s3-transport.mjs":"5ffcc9f08d5f19bf62f4ff06566bbfce5d7872ad","CODEX_CURRENT_SUPABASE/functions/jb-b11-t069-media-backup/t069-media-age-b2-roundtrip.mjs":"754a71f29b64b0366ffa5f61271768f135fc4942","CODEX_CURRENT_SUPABASE/functions/jb-b11-t069-media-backup/t069-owner-supabase-media-source.mjs":"049c8935044e00199e411b5acee6d65dabc16025","CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-health/index.ts":"1b99435d78d1615412acf53f3c50d83ff2a245ad","CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-preflight/index.ts":"baa866d5b7b284e5adb74143f7215e1d917b7c4e"};
const requiredSlugs=["jb-recovery-delete-mfa","jb-grievance-assets","jb-b11-t069-media-backup","jb-youtube-oauth-health","jb-youtube-video-preflight"];
const names=Object.keys(expectedBlob);
const gitBlobSha=data=>createHash('sha1').update(Buffer.from('blob '+data.length+String.fromCharCode(0))).update(data).digest('hex');
test('T089-L01 five exact active Edge function source homes; all original 8 files present',()=>{
 assert.equal(manifest.live_project,'vrffsnkycvjithwtiylt');
 assert.equal(manifest.previously_untracked_active_live_functions_recovered,5);
 assert.equal(manifest.exact_source_file_count,8);
 assert.deepEqual(manifest.functions.map(f=>f.slug),requiredSlugs);
 assert.equal(manifest.functions.reduce((n,f)=>n+f.files.length,0),8);
 const fromManifest=manifest.functions.flatMap(f=>f.files.map(name=>'CODEX_CURRENT_SUPABASE/functions/'+f.slug+'/'+name)).sort();
 assert.deepEqual(fromManifest,names.slice().sort());
 assert.deepEqual(manifest.git_blob_sha1_by_path,expectedBlob);
});
test('T089-L02 exactly deployed-source candidate Git byte identities, fail if any source drifts',()=>{
 for(const path of names){
  assert.equal(fs.existsSync(path),true,'MISSING_EXPORTED_EDGE_SOURCE: '+path);
  const raw=fs.readFileSync(path);
  assert.equal(gitBlobSha(raw),expectedBlob[path],'EXPORTED_EDGE_SOURCE_BYTES_DRIFTED: '+path);
 }
});
test('T089-L03 no obvious hardcoded keys, PEM material, email addresses or access JWT in exported sources',()=>{
 const literalSecret=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sb_secret_[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{28,}|AKIA[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{28,}|eyJ[A-Za-z0-9_-]{35,}\.[A-Za-z0-9_-]{35,}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
 for(const path of names){assert.equal(literalSecret.test(fs.readFileSync(path,'utf8')),false,'POTENTIAL_EXPOSED_SECRET_OR_EMAIL '+path);}
});
test('T089-L04 no fake full restoration, source-only record remains original final HOLD',()=>{
 assert.equal(manifest.no_prod_deployment_or_db_mutation,true);
 assert.equal(manifest.source_release_status,'DRAFT_UNMERGED_RECOVERY_CANDIDATE');
 assert.match(manifest.full_t089_final,/HOLD/);
});
console.log('T089_5_EDGE_SOURCE_HOMES_8_FILES_ACTUAL_BLOBS=PASS_SCOPED');
console.log('T089_5_EDGE_SOURCE_CONTROL_RECOVERY_ORIGINAL_FINAL=HOLD');
