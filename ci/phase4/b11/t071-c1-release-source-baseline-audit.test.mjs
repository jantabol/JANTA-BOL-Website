import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditC1} from './t071-c1-release-source-baseline-audit.mjs';
const saved=JSON.parse(readFileSync('ci/phase4/b11/t071-c1-release-source-baseline-evidence-20261027.json','utf8'));
const clone=()=>structuredClone(saved);
test('C1 real source/HTTP/anon LIVE observation reconciliation is verifiable but cannot pass current prod',()=>{
 const v=auditC1(clone());
 assert.equal(v.c1_full_product_baseline,'HOLD');
 assert.equal(v.c1_final_pass,false);
 assert.equal(v.t071_final_lock,false);
 assert.equal(v.live_database_public_state,'OFF');
 assert.equal(v.public_home_claims_live_static_badge,true);
 assert.equal(v.old_static_production_missing_article_live_search_routes,'VERIFIED_READ_ONLY_404');
 assert.equal(v.new_candidate_latest_deployed_shares_exact_commit,false);
 assert.equal(v.core_news_publish_authorized_real_E2E,'NOT_RUN');
 assert.equal(v.production_modified,false);
});
const negative=[
 ['wrong prod commit',x=>x.production.deployed_sha='0'.repeat(40)],
 ['wrong prod deploy id',x=>x.production.vercel_id='fake'],
 ['pretend prod Article route 200',x=>x.production.article_http=200],
 ['pretend prod LIVE route 200',x=>x.production.live_http=200],
 ['pretend prod Search route 200',x=>x.production.search_http=200],
 ['pretend PR45 preview routes work',x=>x.pr45.preview_article_http=200],
 ['pretend PR46 latest preview equals candidate HEAD',x=>x.pr46.preview_is_current_head=true],
 ['false anon table access',x=>x.database.public_anon_articles_select=true],
 ['false prod LIVE active',x=>x.database.live_session_public_OFF=0],
 ['false full public E2E article reading',x=>x.baseline_evidence.public_purl_article_read='PASS'],
 ['fake Founder Owner/AAL2 publish',x=>x.baseline_evidence.publishing_authorized_owner_aal2_true_runtime_e2e='PASS'],
 ['conceal fake LIVE static badge',x=>x.baseline_evidence.live_current_truth='PUBLIC_HOME_PROVEN_TRUTHFUL_OFF'],
 ['false C1 final pass',x=>x.c1_final_pass=true],
 ['false T071 final lock',x=>x.t071_final_lock=true],
 ['premature paid domain setup',x=>x.domain_jantaboli_in='READY'],
 ['pretend attached production tree changed',x=>x.production.root_http=404],
 ['wrong source from Cricket project',x=>x.repo='jantabol/Cricket-Prediction-Research']
];
for(const [name,mut] of negative)test('C1 rejects forged evidence: '+name,()=>{
 const m=clone();mut(m);assert.throws(()=>auditC1(m));
});
test('C1 has no authorization to merge/migrate, or operate LIVE',()=>{
 const r=auditC1(clone());
 assert.equal(r.production_modified,false);
 assert.equal(r.c1_final_pass,false);
 assert.equal(r.t071_final_lock,false);
});
