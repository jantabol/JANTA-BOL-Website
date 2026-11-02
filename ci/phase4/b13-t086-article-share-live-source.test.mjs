// P4-T086 RUN-15 original Core Article / Share / Phase3 Live SOURCE gates.
// The original E5 is REAL AUDIT/HISTORY/LIFECYCLE, NOT external Live provider E6.
// The historical pre-lock source test is preserved byte-identically in ci/phase4/b13/history.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const paths={
 backend:root+'backend-client.js',
 add:root+'add-news.html',
 published:root+'published.html',
 article:root+'article.html',
 index:root+'index.html',
 feed:root+'website-v3.js',
 c1:root+'public-c1-projection.js',
 live:root+'phase3a-live-client.js',
 delivery:root+'phase3c-live-delivery.js',
 liveApi:'CODEX_CURRENT_SUPABASE/functions/jb-live-api/index.ts',
 report:'JANTA_BOL_PHASE_4_WORKING/review/P4_T086_B13_CORE_ARTICLE_LIVE_BACKEND_PREFLIGHT_20261102.md',
 finalReport:'JANTA_BOL_PHASE_4_WORKING/review/P4_T086_RUN15_EVIDENCE_GATE_20261102.md'
};
const v=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,readFileSync(p,'utf8')]));
const all=(source,needles)=>needles.forEach(t=>assert(source.includes(t),'T086_MISSING_GUARD: '+t));
const blob=p=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
test('T086-01 original B13 RUN15 final individual core PASS is E1+E3+E4+E5, not external provider E6',()=>{
 const row=readFileSync('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md','utf8').split('\n').find(x=>x.startsWith('| P4-T086 |'));
 assert(row?.includes('Core Article Lifecycle + Live Regression'));
 assert(row?.includes('| B13 | PASS |'));
 const evidence=readFileSync(paths.finalReport,'utf8');
 all(evidence,['RUN-15','Topic 12','765–772','E1 + E3 + E4 + E5',
 'E5 = audit / history / notification / lifecycle record.',
 'T086_CORE_RUN15_INDIVIDUAL_FINAL_LOCK=PASS+LOCK',
 'T086_LIVE_EXTERNAL_PROVIDER_RUNTIME=DUE']);
});
test('T086-02 old Article/Public/Live frontend source byte hashes unchanged',()=>{
 const pins={
 [paths.backend]:'fb2c60d241ef772d4990536b577acc3c7d70fad7',
 [paths.add]:'813d00fbf96b31214cce1f4147d14615c3de4be1',
 [paths.published]:'39fb346dee0e2046f8a833dcd652dd743b911777',
 [paths.article]:'98dca1e26f32846b6fba722731acd6d14f0aed41',
 [paths.index]:'b073e8053955f3c30b3fe8e3fcbc5bdb86ece1ff',
 [paths.feed]:'716f509578c35f0606eebc6e7292aa8cfcb7bf48',
 [paths.c1]:'5a09b9442d9ea93a2e06df8524c17fcd2021e62e',
 [paths.live]:'ec356beb65104d12c0c8571cb29ac08bde6050bb',
 [paths.delivery]:'70932e21e291254b10d0c7e783693ab719df2663'
 };
 for(const [p,sha] of Object.entries(pins))assert.equal(blob(p),sha,'old source changed: '+p);
});
test('T086-03 Create and Draft use stable intent UUID and acknowledged readback',()=>{
 all(v.backend,['reserveCreateIntent()','markCreateIntentAttempt(newCreateId)',
 'CREATE_INTENT_ALREADY_EXISTS',"status:'draft'",'const confirmed=await getArticle(saved.id',
 "throw new Error('VERSION_CONFLICT')"]);
});
test('T086-04 Final Review and Publish stay Owner-only and version CAS-protected',()=>{
 all(v.add,['confirmPublish','Final Review','Published Successfully',
 'writeOutcomeUnknown','await JBBackend.publish(']);
 const t=v.backend.slice(v.backend.indexOf('async function publish('),v.backend.indexOf('async function unpublish('));
 all(t,['await requireOwner()','const newlyCreated=!working.id',
 ".from('articles')",".update({","status:'published'",
 ".eq('id',working.id)",".eq('version',expectedVersion)",
 "throw new Error('VERSION_CONFLICT')"]);
 assert(!t.includes('.insert({'),'Existing Article publish MUST not create another');
});
test('T086-05 original Article correction opens same UUID and cannot silently Save Draft',()=>{
 all(v.published,["function editItem(id)","add-news.html?edit=",
 "'&from=published'","Edit / Correction"]);
 all(v.add,["Published News Correction","if(origin==='published')",
 'Final Review → Confirm Publish',
 'LOCAL CORRECTION SAVED • NOT SYNCED']);
});
test('T086-06 Unpublish to Draft and later Republish target SAME Article UUID',()=>{
 const t=v.backend.slice(v.backend.indexOf('async function unpublish('),v.backend.indexOf('async function softDelete('));
 all(t,['await requireOwner()',".from('articles')","status:'draft'",
 'published_at:null',".eq('id',id)",
 'VERSION_CONFLICT']);
 assert(/q=q\.eq\(\s*'version',\s*expectedVersion\s*\)/.test(t),'stale unpublish must enforce source version CAS');
 const p=v.backend.slice(v.backend.indexOf('async function publish('),v.backend.indexOf('async function unpublish('));
 assert(p.includes(".eq('id',working.id)"));
});
test('T086-07 Browser offline/lost-ACK/reload do not auto duplicate and protect draft',()=>{
 all(v.add,['RECOVERED LOCAL CORRECTION','OUTCOME UNKNOWN',
 'scheduleAutosave','WAITING FOR ARTICLE LOAD',
 'VERSION_CONFLICT','editing && editing.status===']);
 all(v.backend,['SHADOW','clearCreateIntent']);
});
test('T086-08 Public C1 published-only RPC and fixed safe field allowlist',()=>{
 all(v.c1,["jb_c1_public_articles","row.status !== 'published'",
 'p_article_id: id || null','PUBLIC_C1_RPC_UNAVAILABLE',
 'PUBLIC_C1_INVALID_PROJECTION',
 "internalSource: { publicAttribution:"]);
 assert(!v.c1.includes('service_role'));
});
test('T086-09 Article Public Open, canonical UUID, and WhatsApp sharing guarded',()=>{
 all(v.article,["params.get('id')","JBPublicC1.get(id)",
 "item.status!=='published'","function shareUrl()",
 "u.searchParams.set('id',item.id)",
 'async function shareArticle()','async function whatsappShare()',
 'if(!item||adminPreview)return']);
});
test('T086-10 Homepage published-only latest list and RPC-outage truth',()=>{
 all(v.feed,['JBPublicC1.list(30)','newsError=true',
 'v3-published-feed','खबरों का सर्वर अभी उपलब्ध नहीं है। पुनः प्रयास करें।']);
 all(v.index,['href="#latest-news"','id="latest-news"',
 'id="top-story" hidden']);
});
test('T086-11 Home category/district/navigation and B9 search not bypassed',()=>{
 all(v.feed,['categoryMap','Technology']);
 all(v.c1,['district: String(row.district || \'\')']);
 all(v.index,['href="b9-search.html"','समाचार खोज',
 'data-jb-ad-placement="homepage"']);
 const page=readFileSync(root+'b9-search.html','utf8');
 const search=readFileSync(root+'b9-search-ui.js','utf8');
 all(page,['id="b9District"','id="b9Category"','id="b9Location"']);
 all(search,['item.district','item.category','JBB9.search(']);
});
test('T086-12 Public Live only verified LIVE/INTERRUPTED feed states; no fabricated badge',()=>{
 all(v.feed,[".from('public_live_feed')",
 ".in('public_status',['LIVE','INTERRUPTED'])",
 'Live temporarily interrupted','v3-public-live-feed']);
 assert(!v.feed.includes('liveRows=[{'));
});
test('T086-13 Phase3 Reporter/Owner approval and stop remain server-controlled',()=>{
 all(v.live,["jb-live-api","reporter_submit_request",
 'admin_approve_request','admin_end_live','reporter_end_live',
 'client_action_id:approvalActionId(requestId,stateVersion)',
 'LIVE_API_UNAVAILABLE','LIVE_API_FAILED']);
 all(v.liveApi,['reporter_submit_request','admin_approve_request']);
});
test('T086-14 Provider camera launch and sharing fail closed; no auto-start',()=>{
 all(v.delivery,['prepareReporterCamera(sessionId)',
 'jb-encoder-launch','LIVE_CAMERA_NOT_READY',
 'NOT_AUTHORIZED','OFFLINE','LIVE_LINK_NOT_READY']);
});
test('T086-15 original Phase3 Live/News/Auth and T080/T083 suites still exist',()=>{
 for(const p of [
 'ci/phase3-regression/functional-live-evidence.cjs',
 'ci/phase3-regression/static-p3-final-p4-regression.cjs',
 'ci/phase4/b12/t080-durable-article-intent.test.mjs',
 'ci/phase4/b12/t080-android-reload-reconciliation.test.mjs',
 'ci/phase4/b12/t083-original-legacy-regression-recheck.cjs',
 'ci/phase4/b12/t083-current-live-public-truth-safety.test.mjs',
 'ci/phase4/b12/v3-c1-public-integration.test.cjs'
 ])assert(existsSync(p),'MISSING_OLD_TEST: '+p);
});
test('T086-16 no fake factual correction, external Live E6 or B13 whole-platform final PASS',()=>{
 const e=readFileSync(paths.finalReport,'utf8');
 all(e,['T086_LIVE_EXTERNAL_PROVIDER_RUNTIME=DUE',
 'T086_SYNTHETIC_FIXTURE_NOT_PUBLIC=YES',
 'T086_ACTUAL_FACTUAL_CONTENT_CORRECTION=NOT_CLAIMED',
 'T086_B13_GLOBAL_FINAL_CLOSURE=HOLD',
 'T086_POST_MFA_EXPIRED_SESSION_CORRECTION_DEEPLINK_REAL_DEVICE=DUE',
 'T086_CORE_RUN15_INDIVIDUAL_FINAL_LOCK=PASS+LOCK']);
 assert(!e.includes('T086_B13_GLOBAL_FINAL_CLOSURE=PASS'));
});
