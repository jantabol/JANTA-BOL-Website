import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync('ci/phase4/b11/t069-keyless-policy-asof-20261024.json','utf8'));
const media=readFileSync('.github/workflows/b11-storage-media-MANUAL.yml','utf8');
test('T069 source project is JANTA BOL, not separate Cricket',()=>{
 assert.equal(x.project_ref,'vrffsnkycvjithwtiylt');
 assert.notEqual(x.project_ref,'hriakdazkcvplsdwgfle');
 assert.equal(x.cricket_modified,false);
});
test('T069 Grievance objects cannot bypass restrictive B5 private gateway with ordinary authenticated JWT',()=>{
 const p=x.storage_rls_policies.find(p=>p.name==='b5_private_gateway_only');
 assert.equal(p.mode,'RESTRICTIVE');assert.equal(p.operation,'ALL');
 assert.ok(p.roles.includes('authenticated'));assert.equal(p.deny_bucket,'grievance-private');
 assert.equal(x.bucket_inventory['grievance-private'].owner_id_missing,2);
 assert.equal(x.keyless_direct_full_backup_possible_under_locked_rls,false);
});
test('T069 owner AAL2 can be allowed private editorial, but is not allowed to bypass grievance restriction',()=>{
 assert.equal(x.bucket_inventory['private-editorial'].objects,1);
 assert.equal(x.storage_rls_policies.find(p=>p.name==='owner_read_private_editorial').requires,
  'private.current_owner_aal2()');
 assert.equal(x.storage_rls_policies.find(p=>p.name==='b5_private_gateway_only').mode,'RESTRICTIVE');
});
test('T069 pre-existing grievance gateway has individual export path, not bulk all-buckets export',()=>{
 assert.equal(x.existing_gateway.slug,'jb-grievance-assets');
 assert.equal(x.existing_gateway.verify_jwt,true);
 assert.equal(x.existing_gateway.requires_case_and_evidence_ids,true);
 assert.ok(x.existing_gateway.actions.includes('export'));
});
test('T069 current approved media workflow requires additional highly privileged credential and is manual-only',()=>{
 assert.ok(media.includes('secrets.JB_B11_SERVICE_ROLE_KEY'));
 assert.ok(media.includes('janta-bol-production-backup'));
 assert.ok(media.includes('github.ref == \'refs/heads/main\''));
 assert.match(media,/^on:\n  workflow_dispatch:/m);
 assert.doesNotMatch(media,/^  (push|schedule|pull_request):/m);
});
test('T069 read-only snapshot cannot certify real original storage bytes or final recovery LOCK',()=>{
 assert.equal(Object.values(x.bucket_inventory).reduce((a,b)=>a+b.objects,0),5);
 assert.equal(x.current_original_5_file_byte_backup_verified,false);
 assert.equal(x.live_environment_modified,false);
});
