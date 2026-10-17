'use strict';
/* P4-T042 CP03 — Release authority/source READ-ONLY audit.
 * Source drift recognition is NOT a release PASS, and this deliberately
 * does not modify existing website, live Supabase, Vercel or billing.
 * GitHub CI checkout must fetch origin/main for the comparison.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const file=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const run=(...args)=>spawnSync('git',args,{encoding:'utf8'});
const pfx='JANTA_BOL_PHASE_3C_WORKING/';
const manifest=JSON.parse(file('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json'));

test('CP03 repo/main authority: old main lacks nested News Article code, candidate has it (E7 HOLD)',()=>{
 assert.ok(exists(pfx+'index.html')&&exists(pfx+'article.html')&&exists(pfx+'compliance.html'),
  'CANDIDATE_NESTED_NEWS_SOURCE_MISSING');
 let ref=run('rev-parse','--verify','refs/remotes/origin/main');
 assert.equal(ref.status,0,'GIT_MAIN_REF_NOT_FETCHED');
 for(const p of ['index.html','article.html','compliance.html']){
  const result=run('cat-file','-e','refs/remotes/origin/main:'+pfx+p);
  assert.notEqual(result.status,0,'MAIN_NOW_CONTAINS_NEWS_CODE_RECHECK_RELEASE_REPORT_'+p);
 }
 console.log('CP03 SOURCE DRIFT CONFIRMED: main lacks the nested B6/News site; preview-only branch is NOT production E7');
});
test('CP03 original News Article master identity and grievance/contact-only links survive E1',()=>{
 const article=file(pfx+'article.html'),home=file(pfx+'index.html');
 assert.match(article,/id=params\.get\('id'\)/);
 assert.match(article,/new URL\('article\.html',location\.href\)/);
 assert.match(article,/u\.searchParams\.set\('id',item\.id\)/);
 assert.match(article,/status!=='published'/);
 assert.match(article,/href="grievance-submit\.html"/);
 assert.match(article,/advertise-request\.html\?origin=article&id=/);
 assert.match(home,/advertise-request\.html\?origin=homepage/);
 assert.ok(!exists('article.html'),'ROOT_ARTICLE_NOW_EXISTS_RECHECK_STALE_PREVIEW_404');
});
test('CP03 B6 compliance same local News source; internal approval cannot mean government or public publish',()=>{
 const s=file(pfx+'compliance.html');
 assert.match(s,/jb_compliance_/);
 assert.match(s,/compliance_monthly_reports/);
 assert.match(s,/सरकारी submission या public publishing नहीं करता/);
 assert.match(s,/public publish अलग backend authority action है/);
 assert.match(s,/live_notifications/);
 // This only establishes versioned candidate source, NOT equality with B6 ZIP.
});
test('CP03 final B7 9/60 original evidence authority still DUE, no B6 ZIP invented',()=>{
 assert.equal(manifest.final_zip_status,'BLOCKED');
 assert.equal(manifest.canonical_tests.length,9);
 assert.equal(manifest.ads.length,60);
 assert.deepEqual(manifest.canonical_tests[8].required_evidence,['E1','E3','E7']);
 assert.equal(manifest.canonical_tests[8].final_status,'DUE');
 assert.ok(manifest.canonical_tests.every(c=>c.final_status==='DUE'&&c.owner_signoff===null));
 assert.ok(manifest.ads.every(a=>a.final_status==='DUE'));
 console.log('CP03 ADS058 E7 HOLD: Original Founder-supplied B6 ZIP SHA256 NOT ESTABLISHED in this audit. No substitute version allowed.');
});
test('CP03 no fake first-paid-ad gate from contact-only Android PASS',()=>{
 const request=file(pfx+'advertise-request.html');
 assert.match(request,/यह केवल संपर्क अनुरोध है; विज्ञापन स्वीकृत या LIVE नहीं होगा/);
 assert.match(request,/id="adConsent"[^>]*required/);
 assert.match(request,/id="adName"[^>]*required/);
 assert.match(request,/id="adWhatsApp"[^>]*required/);
 assert.match(request,/jb_ad_public_enquiry/);
 assert.match(request,/form\.reportValidity\(\)/);
 assert.doesNotMatch(request,/\bconfirm_payment\b|stripe_checkout_session/);
 console.log('CP03 CONTACT-ONLY E1: never implies paid LIVE or Owner approval; first commercial activation HOLD.');
});
