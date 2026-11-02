// ORIGINAL V3/C1 locked gate stays UNCHANGED and runs separately.
// These tests diagnose whether newer reviewed T077/T080 sources retain their safety behavior.
// A passing compatibility check DOES NOT turn the failing original locked gate green.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';

const root='JANTA_BOL_PHASE_3C_WORKING/';
const read=p=>readFileSync(p,'utf8');
const blob=p=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
const index=read(root+'index.html');
const auth=read(root+'admin-auth.js');
const login=read(root+'admin-login.html');
const nav=read(root+'b12-safe-nav.js');
const backend=read(root+'backend-client.js');
const vc=JSON.parse(read('vercel.json'));
function currentNav(){
 const context={window:{},URLSearchParams};
 runInNewContext(nav,context,{timeout:1000});
 return context.window.JBProdSafeNav.target;
}
const UUID='f17f6507-02a3-4881-ad37-0b02cadf3d3f';

test('T086-L01 old original locked V3/C1 regression is present and UNEDITED (pinned)',()=>{
 assert.equal(blob('ci/phase4/b12/v3-c1-public-integration.test.cjs'),
 '72991403713ca5646eda847ff8f4ad886e4713b3',
 'If original locked test changed, STOP and audit');
});
test('T086-L02 original public reporter/citizen demo forms are both hidden AND inert',()=>{
 assert.match(index,/<form class="citizen-news-form" id="citizen-news-form" hidden inert style="display:none" aria-hidden="true">/);
 assert.match(index,/<form id="official-reporter-form" class="official-reporter-form" hidden inert style="display:none" aria-hidden="true">/);
 assert.match(index,/#citizen-news-form,#official-reporter-form,#top-story\[hidden\]\{display:none!important\}/);
});
test('T086-L03 new breaking-news hidden rule only strengthens old two-form CSS behavior',()=>{
 assert.doesNotMatch(index,/#citizen-news-form,#official-reporter-form\{display:none!important\}/);
 assert.match(index,/<section class="breaking-news" id="top-story" hidden aria-live="polite">/);
 assert.match(index,/#citizen-news-form,#official-reporter-form,#top-story\[hidden\]\{display:none!important\}/);
});
test('T086-L04 old locked Founder Login, Admin Auth, Security page PINs remain unchanged',()=>{
 assert.equal(blob(root+'admin-auth.js'),'e0c751cbaa6582aa00ffd82d23f03c01956142f7');
 assert.equal(blob(root+'admin-login.html'),'2254f94ce40d49cda0ed0076311d511685036fc3');
 assert.equal(blob(root+'admin-security.html'),'b4dcaf30fb4a64a4848e772928a3bb8d15415534');
});
test('T086-L05 newer T077 nav PIN differs by exactly one reviewed youtube health page',()=>{
 assert.equal(blob(root+'b12-safe-nav.js'),'a2107140321c2e099e785c678213ad278cbcfd5f');
 const old="    'live.html', 'admin-password.html', 'b8-accountability.html', 'b9-analytics.html'";
 const newLine="    'live.html', 'youtube-oauth-health.html', 'admin-password.html', 'b8-accountability.html', 'b9-analytics.html'";
 assert(nav.includes(newLine));
 assert.equal(nav.replace(newLine,old),read('JANTA_BOL_PHASE_4_WORKING/review/P4_T086_B13_OLD_NAV_BASELINE_20261102.txt'),
 'Reviewed safety nav code must be byte-equivalent to old except one allowed page');
});
test('T086-L06 safe navigation accepts only specifically allowed local pages',()=>{
 const fn=currentNav();
 for(const u of ['admin.html','youtube-oauth-health.html','b8-accountability.html','b9-analytics.html?range=7',
   'grievances.html?tab=inbox','add-news.html?id='+UUID]) assert.equal(fn(u),u,u);
});
test('T086-L07 safe navigation rejects malicious external/encoded/multiple/deceptive paths',()=>{
 const fn=currentNav();
 for(const u of ['https://evil.example','//evil.example','../admin.html','%2fadmin.html',
   'admin.html?next=https%3A%2F%2Fevil.example','add-news.html?id=bad-id',
   'add-news.html?id='+UUID+'&x=y','grievances.html?tab=inbox&tab=closed',
   'b9-analytics.html?range=999','a.html%00','javascript:alert(1)',null,'','admin.html?x=1'])
   assert.equal(fn(u),'admin.html',String(u));
});
test('T086-L08 observed MFA post-login deep-link limitation is recorded, NOT misclassified PASS',()=>{
 const fn=currentNav();
 assert.equal(fn('published.html'),'admin.html');
 assert.equal(fn('add-news.html?edit='+UUID+'&from=published'),'admin.html');
 const report=read('JANTA_BOL_PHASE_4_WORKING/review/P4_T086_B13_CORE_ARTICLE_LIVE_BACKEND_PREFLIGHT_20261102.md');
 assert(report.includes('does **not currently allow**'));
});
test('T086-L09 Founder Login returns to an allowlisted destination only after MFA check',()=>{
 assert(login.includes('window.JBProdSafeNav.target(target)'));
 assert(login.includes('function safeNextPage()'));
 assert(auth.includes("admin-login.html?reason=session&next="));
});
test('T086-L10 newer T080 Article backend pin differs from old but is under CAS/lost ACK guard',()=>{
 assert.equal(blob(root+'backend-client.js'),'fb2c60d241ef772d4990536b577acc3c7d70fad7');
 for(const k of ['CREATE_INTENT','reserveCreateIntent()','markCreateIntentAttempt(newCreateId)',
 'VERSION_CONFLICT','async function saveDraft(','async function publish(',
 ".eq('id',working.id)",".eq('version',expectedVersion)",
 'const confirmed=await getArticle(out.id'])assert(backend.includes(k),k);
});
test('T086-L11 Vercel header route new published page is only route expansion',()=>{
 const hdr=vc.headers.find(h=>String(h.source).includes('admin-login|admin|admin-security'));
 assert(hdr);
 const oldPath='/JANTA_BOL_PHASE_3C_WORKING/(admin-login|admin|admin-security|admin-recovery|admin-recovery-setup|add-news|article).html';
 const newPath='/JANTA_BOL_PHASE_3C_WORKING/(admin-login|admin|admin-security|admin-recovery|admin-recovery-setup|add-news|published|article).html';
 assert.equal(hdr.source,newPath);
 assert.equal(hdr.source.replace('|published|','|'),oldPath);
 assert.equal(blob('vercel.json'),'ae086ea344cc704d279973740defe4d9374c6b6b');
 const names=hdr.headers.map(x=>x.key);
 assert(names.includes('X-Content-Type-Options'));
 assert(names.includes('Referrer-Policy') || names.includes('Cache-Control'));
});
test('T086-L12 newer compatibility probes never override old mandatory FAIL/RED STOP',()=>{
 const report=read('JANTA_BOL_PHASE_4_WORKING/review/P4_T086_B13_CORE_ARTICLE_LIVE_BACKEND_PREFLIGHT_20261102.md');
 for(const marker of [
 'T086_OLD_PROTECTED_V3_REGRESSION=FAIL_RED_STOP',
 'T086_OFFICIAL_FINAL_PASS_LOCK=HOLD',
 'T086_E3_REAL_ANDROID_FULL_CREATE_TO_REPUBLISH=NOT_RUN'
 ])assert(report.includes(marker),marker);
});
