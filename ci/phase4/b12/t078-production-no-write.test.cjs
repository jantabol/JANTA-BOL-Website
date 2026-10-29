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
 assert.equal(item.status,'BLOCKED');
 assert.notEqual(item.status,'PASS');
 assert.deepEqual(item.evidence,[]);
});
test('T078 report explicitly discloses live no-migration and E8 HOLD',()=>{
 const text=read(reportPath);
 for(const phrase of ['FINAL T078 adjudication','100/100','188','40869372490','40452402698','NO automatic production migration','FINAL LOCK = HOLD','no-write','every **5 seconds**','13 JANTA BOL Supabase Edge Functions','not proof it can be rebuilt']){
  assert.ok(text.includes(phrase),phrase);
 }
});

// Current-live NO-OP scoped attestation. This is *not* official T078 PASS.
test('T078 current-live NO-OP proof is pinned and cannot authorize a migration',()=>{
 const m=JSON.parse(read('ci/phase4/b12/t078-current-live-noop-evidence.json'));
 assert.equal(m.project,'vrffsnkycvjithwtiylt');
 assert.equal(m.database_project,'vrffsnkycvjithwtiylt');
 assert.equal(m.release_scope,'CURRENT_DEPLOYED_PRODUCTION_SHA_ONLY');
 assert.equal(m.production_commit,'c1a5f1065f1c3aa64cd09bcd9c8ef1cca1054a3c');
 assert.equal(m.previous_production_commit,'532261e335a235dbdaf9697ccdbfe274122a8580');
 assert.deepEqual(m.changed_paths,[
  '.github/workflows/t077-e6-publishable-rotation-candidate.yml',
  'JANTA_BOL_PHASE_3C_WORKING/supabase-config.js'
 ]);
 assert.equal(m.production_sql_migration_delta_count,0);
 assert.equal(m.controlled_schema_migration,'NOT_REQUIRED_FOR_THIS_DEPLOYMENT');
 assert.equal(m.no_live_db_ddl_dml_run_by_this_test,true);
 assert.equal(m.db_migration_count,188);
 assert.equal(m.public_tables,100);
 assert.equal(m.rls_enabled_tables,100);
 assert.equal(m.anonymous_private_storage_visible,0);
 assert.equal(m.published_article_public_rpc_rows,1);
 assert.equal(m.draft_article_public_rpc_rows,0);
 assert.equal(m.e8_historical_original_restore.run,40452402698);
 assert.equal(m.e8_historical_original_restore.postgres17_full_source_db_restored,true);
 assert.equal(m.e8_historical_original_restore.five_original_media_restored,true);
 assert.equal(m.b11_full_platform_restore_proven,false);
 assert.equal(m.current_point_in_time_restore_proven,false);
 assert.equal(m.future_schema_change_requires_fresh_t078,true);
 assert.equal(m.dangerous_rollback_allowed,false);
 assert.equal(m.t081_full_backup_rollback_cutover_status,'HOLD');
 assert.equal(m.acceptance_kind,'PASS_SCOPED_ONLY_CURRENT_LIVE_ZERO_MIGRATION');
});
test('T078 final no-op decision is scoped, original E8 remains BLOCKED',()=>{
 const txt=read('JANTA_BOL_PHASE_4_WORKING/b12/P4_T078_FINAL_CURRENT_PROD_NOOP_PASS_SCOPE_20261029.md');
 for(const marker of ['official T078 = BLOCKED','T081','production_sql_migration_delta_count=0','40452402698','T070_FINAL_INDEPENDENT_E8=NOT_RUN']){
  assert.ok(txt.includes(marker),marker);
 }
 const t=JSON.parse(read(truthPath)).tests['P4-T078'];
 assert.equal(t.status,'BLOCKED');
 assert.equal(t.evidence.length,0);
});
