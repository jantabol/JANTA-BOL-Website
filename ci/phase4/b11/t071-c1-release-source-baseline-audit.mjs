// JANTA BOL P4-T071 C1 exact source+deployment E1 integrity gate.
// Source and Vercel/Supabase observations collected READ-ONLY separately.
// This checker cannot and MUST NOT turn absent runtime proof into E1 PASS.
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base='ci/phase4/b11/';
const no=path=>!existsSync(path);
const yes=path=>existsSync(path);
const read=path=>readFileSync(path,'utf8');

export function auditC1(m,{
productionRepo='t071-c1-production-source',
newsCandidateRepo='t071-c1-news-candidate',
reviewRepo='.'
}={}) {
 assert.equal(m.schema,'JANTA_BOL_P4_T071_C1_READONLY_RELEASE_SOURCE_BASELINE_V1');
 assert.equal(m.test,'P4-T071'); assert.equal(m.subgate,'C1');
 assert.equal(m.master.page,304);assert.equal(m.master.recov,'RECOV-019..RECOV-026');
 assert.equal(m.repo,'jantabol/JANTA-BOL-Website');
 assert.equal(m.production.git_sha,'f447231c0677644ca5a44cc19f12cf0314ff38ea');
 assert.equal(m.production.deployed_sha,m.production.git_sha);
 assert.equal(m.production.vercel_id,'dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C');
 assert.equal(m.production.state,'READY');
 assert.equal(m.pr45.branch,'codex/b11-t071-failure-isolation-preflight-20261027');
 assert.equal(m.pr45.head_sha_at_audit,'685eac2b615ceedc32cb08ec318228e82fc9832b');
 assert.equal(m.pr46.head_sha,'b509c60fceb053a51686f67e587d4922a40fa6f4');
 assert.equal(m.pr46.preview_sha,'cebc088d38e6bddcbb163ef5d84852dafdeb3f28');
 assert.equal(m.pr46.preview_is_current_head,false);
 assert.equal(m.pr45.preview_is_current_head,false);
 assert.equal(m.production.root_http,200);
 assert.equal(m.production.article_http,404);
 assert.equal(m.production.live_http,404);
 assert.equal(m.production.search_http,404);
 assert.equal(m.pr45.preview_root_http,200);
 assert.equal(m.pr45.preview_article_http,404);
 assert.equal(m.pr45.preview_live_http,404);
 assert.equal(m.pr45.preview_search_http,404);
 assert.equal(m.pr46.preview_root_http,200);
 assert.equal(m.pr46.preview_article_http,200);
 assert.equal(m.pr46.preview_live_http,200);
 assert.equal(m.pr46.preview_search_http,200);
 const pc=join(productionRepo,'index.html'),rc=join(reviewRepo,'index.html');
 assert(yes(pc)&&yes(rc),'ROOT_MISSING');
 assert(no(join(productionRepo,'JANTA_BOL_PHASE_3C_WORKING/article.html')),'PROD_TREE_MISLABELED');
 assert(no(join(productionRepo,'article.html')),'PROD_ARTICLE_SUDDENLY_PRESENT_REFRESH_CHECK');
 assert(no(join(productionRepo,'live.html')),'PROD_LIVE_SUDDENLY_PRESENT_REFRESH_CHECK');
 assert(no(join(productionRepo,'b9-search.html')),'PROD_SEARCH_SUDDENLY_PRESENT_REFRESH_CHECK');
 assert(no(join(productionRepo,'vercel.json')),'PROD_CONFIG_SUDDENLY_CHANGED');
 assert(no(join(reviewRepo,'JANTA_BOL_PHASE_3C_WORKING/article.html')),'REVIEW_C1_ROOT_TREE_ASSUMPTION_DRIFT');
 const html=read(pc);
 assert(html.includes('class="live-badge"'),'PROD_OLD_STATIC_LIVE_UNCONFIRMED_SOURCE');
 assert(html.includes('शिवपुरी अस्पताल में भ्रष्टाचार का आरोप'),'PROD_STATIC_STORY_SOURCE_DRIFT_REVIEW');
 const dir=join(newsCandidateRepo,'JANTA_BOL_PHASE_3C_WORKING');
 for(const f of ['index.html','article.html','live.html','b9-search.html','backend-client.js']){
   assert(yes(join(dir,f)),'PR46_CANDIDATE_FILE_MISSING_'+f);
 }
 const vc=JSON.parse(read(join(newsCandidateRepo,'vercel.json')));
 assert(vc.redirects?.some(x=>x.source==='/'&&x.destination==='/JANTA_BOL_PHASE_3C_WORKING/index.html'),
        'PR46_ROOT_MAPPING_UNKNOWN');
 const client=read(join(dir,'backend-client.js'));
 assert(client.includes("async function listPublishedPublic(limit=20)"),'CANDIDATE_PUBLIC_LIST_FUNCTION_DRIFT');
 assert(client.includes(".from('articles')"),'CANDIDATE_DIRECT_TABLE_READ_DRIFT');
 assert.equal(m.database.project,'vrffsnkycvjithwtiylt');
 assert.equal(m.database.published_not_deleted,16);
 assert.equal(m.database.draft_not_deleted,15);
 assert.equal(m.database.live_session_public_OFF,16);
 assert.equal(m.database.public_live_feed_OFF,7);
 assert.equal(m.database.public_anon_articles_select,false);
 assert.equal(m.database.auth_articles_select,true);
 assert.equal(m.database.rls_public_tables,100);
 assert.equal(m.database.public_tables,100);
 assert.equal(m.database.anon_b9_search_T032_visible_items,1);
 assert.equal(m.baseline_evidence.public_purl_article_read,'NOT_PROVEN_ARTICLE_ROUTE_404');
 assert.equal(m.baseline_evidence.publishing_authorized_owner_aal2_true_runtime_e2e,
 'NOT_EXECUTED_NO_PRODUCTION_WRITE');
 assert.equal(m.baseline_evidence.live_current_truth,
 'DATABASE_OFF_BUT_PUBLIC_HOME_STATIC_LIVE_BADGE');
 assert.equal(m.baseline_evidence.same_candidate_complete_core_release_baseline,'NOT_ESTABLISHED');
 assert.equal(m.c1_e1_source_scope_review,'COMPLETE_WITH_GAPS_DOCUMENTED');
 assert.equal(m.c1_production_usable_article_and_truthful_live_baseline,'HOLD');
 assert.equal(m.c1_final_pass,false);
 assert.equal(m.t071_final_lock,false);
 assert.equal(m.domain_jantaboli_in,'DUE_SEPARATE');
 return Object.freeze({
  scope:'C1_SOURCE_AND_PRE_DEPLOY_READONLY_AUDIT_ONLY',
  source_identity_production_git_matches_vercel:'VERIFIED',
  old_static_production_missing_article_live_search_routes:'VERIFIED_READ_ONLY_404',
  new_candidate_html_source_files:'VERIFIED_IN_PINNED_BRANCH',
  new_candidate_latest_deployed_shares_exact_commit:false,
  direct_anonymous_article_table_grant:false,
  public_b9_search_rpc:'READ_ONLY_RETURNS_ONE_SAMPLE',
  live_database_public_state:'OFF',
  public_home_claims_live_static_badge:true,
  core_news_publish_authorized_real_E2E:'NOT_RUN',
  source_B9_release_preview_same_candidate:'NO',
  source_status:'E1_IDENTITY_DOCUMENTED',
  c1_full_product_baseline:'HOLD',
  c1_final_pass:false,
  t071_final_lock:false,
  production_modified:false
 });
}
if(process.argv[1]?.endsWith('t071-c1-release-source-baseline-audit.mjs')){
  try {
   const m=JSON.parse(read(base+'t071-c1-release-source-baseline-evidence-20261027.json'));
   const verdict=auditC1(m);
   console.log('T071_C1_SOURCE_IDENTITY_AND_DEPLOYMENT_MISMATCH=VERIFIED');
   console.log('T071_C1_PROD_ARTICLE_LIVE_SEARCH_HTTP=404');
   console.log('T071_C1_SUPABASE_LIVE_SESSIONS=OFF');
   console.log('T071_C1_PR46_SOURCE_FULL_PREVIEW_SHA_STALE=VERIFIED');
   console.log('T071_C1_REAL_OWNER_PUBLISH_E2E=NOT_RUN');
   console.log('T071_C1_FINAL=HOLD');
   console.log(JSON.stringify(verdict));
  }catch(err){console.error('T071_C1_AUDIT_ERROR='+String(err.message).slice(0,160));process.exitCode=3}
}
