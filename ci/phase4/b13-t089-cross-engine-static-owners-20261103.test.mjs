// T089 E7: actual static source-of-truth/duplicate-engine boundary review.
// Strict source-only contract. Absence of detected lexical duplicates != full
// semantic duplication/orphan or hosted production proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const srcNames=fs.readdirSync(root).filter(x=>x.endsWith('.js')).sort();
const htmlNames=fs.readdirSync(root).filter(x=>x.endsWith('.html')).sort();
const src=Object.fromEntries(srcNames.map(n=>[n,fs.readFileSync(root+n,'utf8')]));
const html=Object.fromEntries(htmlNames.map(n=>[n,fs.readFileSync(root+n,'utf8')]));
const mat=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T089_CROSS_ENGINE_STATIC_SOURCE_AUTHORITY_MATRIX_20261103.json','utf8'));
const owners=(needle)=>srcNames.filter(n=>src[n].includes(needle));
const scripts=(n)=>[...html[n].matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(x=>x[1].split(/[?#]/)[0]);
test('T089-D01 audited 32 HTML/32 JS original product graph, no accidental source count drift',()=>{
 assert.equal(srcNames.length,32);
 assert.equal(htmlNames.length,32);
 assert.equal(new Set(srcNames).size,32);
});
test('T089-D02 no second direct private article table engine in canonical JS sources',()=>{
 const direct=srcNames.filter(n=>/\.from\s*\(\s*["']articles["']\s*\)/g.test(src[n]));
 assert.deepEqual(direct,['backend-client.js']);
 assert.ok(src['backend-client.js'].includes('requireOwner()'));
 assert.ok(src['backend-client.js'].includes(".from('articles')"));
});
test('T089-D03 C1 published-only is a single audited public RPC adapter, with two non-authoritative consumers',()=>{
 assert.deepEqual(owners("rpc('jb_c1_public_articles'"),['public-c1-projection.js']);
 assert.ok(src['public-c1-projection.js'].includes("row.status !== 'published'"));
 assert.ok(src['website-v3.js'].includes('JBPublicC1.list('));
 assert.ok(src['script.js'].includes('window.JBPublicC1.list('));
 assert.equal(src['website-v3.js'].includes(".from('articles')"),false);
 assert.equal(src['script.js'].includes(".from('articles')"),false);
 const homepage=scripts('index.html');
 assert.ok(homepage.includes('public-c1-projection.js'));
 assert.ok(homepage.includes('website-v3.js'));
 assert.ok(homepage.includes('script.js'));
});
test('T089-D04 no second direct Team/Records/Live Edge command gateway in canonical JavaScript',()=>{
 for(const [slug,file] of [
  ['jb-team-api','phase4-team-client.js'],
  ['jb-records-api','phase4-records-client.js'],
  ['jb-live-api','phase3a-live-client.js']
 ]){
  const callers=srcNames.filter(n=>src[n].includes("functions.invoke('"+slug+"'"));
  assert.deepEqual(callers,[file],'SECOND_DIRECT_EDGE_GATEWAY_'+slug);
 }
});
test('T089-D05 B8 distinct Staff/Public source homes and Owner retry connector retained',()=>{
 const staff=scripts('b8-accountability.html');
 const pub=scripts('accountability-public.html');
 assert.ok(staff.includes('b8-accountability-ui.js'));
 assert.ok(pub.includes('b8-public-case-ui.js'));
 assert.ok(src['b8-accountability-ui.js'].includes('b8-accountability-client.js'));
 assert.ok(src['b8-accountability-ui.js'].includes('b8-owner-idempotency-client.js'));
 assert.ok(src['b8-public-case-ui.js'].includes('b8-public-case-client.js'));
});
test('T089-D06 B9 read-only client and public Ads feed are not shadow article engines',()=>{
 assert.ok(scripts('b9-search.html').includes('b9-client.js'));
 assert.ok(scripts('b9-search.html').includes('b9-search-ui.js'));
 assert.ok(src['b9-client.js'].includes('.rpc('));
 assert.deepEqual(owners("rpc('jb_ad_public_feed'"),['public-ads.js']);
 for(const n of ['b9-client.js','b9-search-ui.js','b9-article-ui.js','public-ads.js']){
  assert.equal(src[n].includes(".from('articles')"),false,'UNAUTHORIZED_PRIVATE_ARTICLE_READ_'+n);
 }
});
test('T089-D07 repeated Grievance/Compliance READ wrappers detected and explicitly kept for semantic review',()=>{
 const p2=src['phase2-client.js'],p4=src['phase4-domain-client.js'];
 assert.ok(p2.includes(".from('grievances')"));
 assert.ok(p4.includes(".from('grievances')"));
 assert.ok(p2.includes(".from('compliance_tasks')"));
 assert.ok(p4.includes(".from('compliance_tasks')"));
 const compScripts=scripts('compliance.html');
 assert.ok(compScripts.includes('phase2-client.js'));
 assert.ok(compScripts.includes('phase4-domain-client.js'));
 assert.ok(mat.unresolved.some(x=>x.id==='DUPLICATE_READ_WRAPPERS'&&x.status==='REVIEW_NOT_AUTO_FAIL'));
});
test('T089-D08 duplicate legacy root static UI, staged ad modules and dummy preview handlers classified, not called production proof',()=>{
 const oldRoot=fs.readFileSync('index.html','utf8');
 const oldJs=fs.readFileSync('script.js','utf8');
 const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 assert.ok(vercel.redirects.some(x=>x.source==='/'&&x.destination==='/JANTA_BOL_PHASE_3C_WORKING/index.html'));
 assert.notEqual(oldRoot,html['index.html']);
 assert.equal(oldJs.includes('createClient('),false);
 assert.equal(oldJs.includes(".from('articles')"),false);
 assert.ok(src['script.js'].includes('शिवपुरी में भारी बारिश'));
 assert.ok(src['script.js'].includes('T080: published-only geographic coverage'));
 assert.equal(html['index.html'].includes('top-story-open'),false,'OLD_PREVIEW_BUTTON_RETURNED');
 assert.ok(mat.unresolved.some(x=>x.id==='LEGACY_STATIC_PREVIEW_ROOT'&&x.status==='CONFIRMED_P1_HOSTED_LEGACY_ROUTE'));
 assert.ok(mat.unresolved.some(x=>x.id==='OLD_PREVIEW_HANDLERS'&&x.status==='REVIEW_NOT_AUTO_FAIL'));
});
test('T089-D10 confirmed source-integrity P1: old direct grievance UPDATE bypass vs existing backend FSM remain explicit until deployed',()=>{
 assert.ok(src['phase2-client.js'].includes(".from('grievances').update("));
 assert.ok(html['grievances.html'].includes('JBPhase2.setGrievanceStatus('));
 assert.ok(src['phase4-domain-client.js'].includes("rpc('jb_grievance_transition_internal'"));
 const issue=mat.unresolved.find(x=>x.id==='LEGACY_GRIEVANCE_DIRECT_STATUS_MUTATION');
 assert.ok(issue&&issue.status==='CONFIRMED_P1_SOURCE_RLS_FSM_DIVERGENCE');
 assert.equal(mat.database_readonly_authority_proof.grievances_rls_on,true);
 assert.equal(mat.database_readonly_authority_proof.authenticated_update_grant,true);
 assert.equal(mat.database_readonly_authority_proof.noninternal_grievance_table_triggers,0);
 assert.equal(mat.database_readonly_authority_proof.approved_rpc_validates_fsm,true);
 assert.equal(mat.database_readonly_authority_proof.approved_rpc_emits_case_event,true);
});
test('T089-D11 live root P1 and two narrow production-source PRs are documented as staged-only, not false deployed proof',()=>{
 const issue=mat.unresolved.find(x=>x.id==='LEGACY_STATIC_PREVIEW_ROOT');
 assert.equal(issue.status,'CONFIRMED_P1_HOSTED_LEGACY_ROUTE');
 assert.deepEqual(mat.live_http_readonly_proof.endpoints.slice(0,2).map(x=>x.status),[200,200]);
 assert.equal(mat.live_http_readonly_proof.endpoints[0].canonical_c1,true);
 assert.equal(mat.live_http_readonly_proof.endpoints[1].canonical_c1,false);
 assert.deepEqual(mat.isolated_fix_candidates.map(x=>x.pr),[115,116]);
 assert.ok(mat.isolated_fix_candidates.every(x=>x.ci==='SUCCESS'&&x.status==='DRAFT_UNMERGED_NOT_DEPLOYED'));
 assert.match(mat.original_t089_final,/HOLD/);
});

test('T089-D09 scoped audit cannot be misreported as complete semantic source authority or original T089 PASS',()=>{
 assert.equal(mat.scope,'STATIC_SOURCE_E7_ONLY');
 assert.equal(mat.all_module_semantic_uniqueness_proven,false);
 assert.equal(mat.production_binary_parity_proven,false);
 assert.equal(mat.requirement_sections_1_to_339_fully_semantic_proven,false);
 assert.match(mat.original_t089_final,/HOLD/);
 assert.equal(mat.unresolved.length>=3,true);
});
console.log('T089_SOURCE_OWNER_ARTICLE_C1_TEAM_RECORDS_LIVE_B8_B9_ADS=PASS_SCOPED');
console.log('T089_SEMANTIC_DUPLICATE_GRIEVANCE_COMPLIANCE_LEGACY_PREVIEW=REVIEW_REQUIRED');
console.log('T089_ORIGINAL_FULL_E7_AND_FINAL_PASS_LOCK=HOLD');
