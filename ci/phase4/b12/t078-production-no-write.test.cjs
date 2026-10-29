'use strict';
/* B12/T078: source-side NO-WRITE release gate. Does NOT connect to LIVE DB.
 * GitHub job validates existing source checks; live SQL/catalog and historical
 * original backup job are separate, explicitly scoped manual evidence.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const sqlPath='ci/phase4/b12/t078-production-catalog-readonly.sql';
const truthPath='JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json';
const reportPath='JANTA_BOL_PHASE_4_WORKING/b12/P4_T078_REAL_PRODUCTION_NO_WRITE_PREFLIGHT_20261029.md';

function assertCatalogSelectOnly(sql) {
 const actual=sql.replace(/--[^\n]*/g,'').trim();
 const statements=actual.split(';').map(x=>x.trim()).filter(Boolean);
 assert.equal(statements.length,1,'catalog must contain exactly one SELECT');
 assert.match(statements[0],/^SELECT\s/i);
 assert.doesNotMatch(statements[0],/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COPY|DO|CALL|EXECUTE|SET|BEGIN)\b/i);
}
test('T078 E1 source SQL is one catalog SELECT and no DDL/DML',()=>{
 const sql=read(sqlPath); assertCatalogSelectOnly(sql);
 for (const item of ['public_base_tables','public_rls_enabled','public_functions','public_tables_without_rls','proposed_t072_idempotent_rpc_deployed'])assert.ok(sql.includes(item),item);
});
test('T078 reject destructive SQL mutation by negative controls',()=>{
 for (const bad of ['SELECT 1; DELETE FROM public.articles;','UPDATE public.articles SET status=\'draft\';','CREATE TABLE danger(id int);','GRANT ALL ON public.articles TO anon;']){
  assert.throws(()=>assertCatalogSelectOnly(bad),/one SELECT|exactly one SELECT|did not match|match/i);
 }
});
test('T078 no false pass: E8 and genuine recovery required',()=>{
 const doc=JSON.parse(read(truthPath));
 assert.equal(doc.git_repository,'jantabol/JANTA-BOL-Website');
 assert.equal(doc.supabase_project,'vrffsnkycvjithwtiylt');
 assert.equal(doc.zero_paid,true);
 assert.equal(doc.b11_full_recovery_locked,false);
 assert.equal(doc.b11_t072_real_production_idempotency_closed,false);
 const item=doc.tests['P4-T078'];
 assert.equal(item.status,'IN_PROGRESS');
 assert.notEqual(item.status,'PASS');
 assert.deepEqual(item.evidence,[]);
});
test('T078 report explicitly discloses live no-migration and E8 HOLD',()=>{
 const text=read(reportPath);
 for(const phrase of ['100/100','188','40869372490','40452402698','NO automatic production migration','FINAL LOCK = HOLD','no-write','every **5 seconds**','13 JANTA BOL Supabase Edge Functions','not proof it can be rebuilt']){
  assert.ok(text.includes(phrase),phrase);
 }
});
