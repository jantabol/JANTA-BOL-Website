import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const f=JSON.parse(readFileSync('ci/phase4/b11/t070-g18-live-edge-version-inventory.json','utf8'));
test('G18 only authorized JANTA BOL source and all thirteen Edge versions inventoried',()=>{
 assert.equal(f.project_ref,'vrffsnkycvjithwtiylt');
 assert.equal(f.deployed_function_count,13);assert.equal(f.list.length,13);
 assert.equal(new Set(f.list.map(x=>x.slug)).size,13);
});
test('G18 all deployed bundles tracked by explicit 64 hex digest and version',()=>{
 for(const e of f.list){
  assert.match(e.slug,/^jb-[a-z0-9-]+$/);
  assert.ok(Number.isInteger(e.version)&&e.version>0);
  assert.equal(e.status,'ACTIVE');
  assert.match(e.source_bundle_sha256,/^[0-9a-f]{64}$/);
  assert.equal(typeof e.verify_jwt,'boolean');
 }
});
test('G18 inventory cannot be confused with recovered Edge runtime or platform keys',()=>{
 assert.equal(f.edge_runtime_restored,false);
 assert.equal(f.platform_secrets_recovered,false);
 assert.equal(f.vercel_config_recovered,false);
 assert.equal(f.full_t070_pass,false);
 assert.match(f.scope,/NO_CONFIG_SECRETS_OR_RESTORED_RUNTIME/);
});
test('G18 no function source or secret values exposed in public metadata file',()=>{
 for(const x of f.list) assert.deepEqual(Object.keys(x).sort(),['slug','source_bundle_sha256','status','verify_jwt','version'].sort());
 assert.ok(!JSON.stringify(f).includes('AGE-SECRET-KEY'));
 assert.ok(!JSON.stringify(f).includes('service_role'));
});
