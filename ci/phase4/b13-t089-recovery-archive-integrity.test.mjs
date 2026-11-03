// T089 E7 review-only recovered Edge sources, original protected CODEX_CURRENT_SUPABASE never changed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const m=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T089_REVIEW_ONLY_EDGE_5_FUNCTION_8_FILE_MANIFEST_20261103.json','utf8'));
const expected={"JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-recovery-delete-mfa/index.ts":"29bd3c2ded6a5de0ade7a6bb9dd6fdd8a384d50f","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-grievance-assets/index.ts":"852cf9f3e101ee4a18e73ee1d58391d99dbe7a34","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-b11-t069-media-backup/index.ts":"cf49127cad97a84d695e296fb58ccdc61e84ac99","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-b11-t069-media-backup/t069-b2-s3-transport.mjs":"5ffcc9f08d5f19bf62f4ff06566bbfce5d7872ad","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-b11-t069-media-backup/t069-media-age-b2-roundtrip.mjs":"754a71f29b64b0366ffa5f61271768f135fc4942","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-b11-t069-media-backup/t069-owner-supabase-media-source.mjs":"049c8935044e00199e411b5acee6d65dabc16025","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-youtube-oauth-health/index.ts":"1b99435d78d1615412acf53f3c50d83ff2a245ad","JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/jb-youtube-video-preflight/index.ts":"baa866d5b7b284e5adb74143f7215e1d917b7c4e"};
const root='JANTA_BOL_PHASE_4_WORKING/review/T089_EDGE_SOURCE_REVIEW_ONLY_20261103/';
const sha=buf=>createHash('sha1').update(Buffer.from('blob '+buf.length+String.fromCharCode(0))).update(buf).digest('hex');
test('T089-R01 five functions eight source file snapshots have exact immutable original Git byte identity',()=>{
 assert.equal(Object.keys(m.five_live_function_versions).length,5);
 assert.equal(Object.keys(m.file_blobs).length,8);
 assert.deepEqual(m.file_blobs,expected);
 for(const [p,digest] of Object.entries(expected)){
  assert.ok(p.startsWith(root));
  const data=fs.readFileSync(p);
  assert.equal(sha(data),digest,'review archive source bytes changed '+p);
 }
});
test('T089-R02 safe review-only archive is not an unapproved production function rewrite',()=>{
 assert.equal(m.old_protected_supabase_source_changed,false);
 assert.equal(m.existing_prod_version_changed,false);
 assert.match(m.scoped_to,/NOT_PRODUCTION_DEPLOYABLE_FOLDER/);
 assert.match(m.original_t089_final,/HOLD/);
});
test('T089-R03 no obvious literal token/private key/email in review archive',()=>{
 const pattern=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sb_secret_[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{28,}|AKIA[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{28,}|eyJ[A-Za-z0-9_-]{35,}\.[A-Za-z0-9_-]{35,}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
 for(const p of Object.keys(expected))assert.equal(pattern.test(fs.readFileSync(p,'utf8')),false,'POTENTIAL_INLINE_SECRET '+p);
});
console.log('T089_5_EDGE_FUNCTIONS_8_EXACT_SOURCE_ARCHIVE_FILES=PASS_SCOPED');
console.log('T089_ORIGINAL_FULL_E7_AND_FINAL_LOCK=HOLD');
