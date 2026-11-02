// P4-T086 B13 — Founder A2 read-only strict post-MFA return to Published News correction.
// No real login, secrets, network requests, database writes, deploy or publication.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const read=p=>readFileSync(p,'utf8');
const nav=read(root+'b12-safe-nav.js');
const login=read(root+'admin-login.html');
const auth=read(root+'admin-auth.js');
const published=read(root+'published.html');
const add=read(root+'add-news.html');
const current=read('ci/phase4/b12/v3-c1-public-integration.test.cjs');
const a1=read('ci/phase4/b12/history/v3-c1-public-integration-20261102-founder-a-v1.cjs');
const original=read('ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs');
const doc=read('JANTA_BOL_PHASE_4_WORKING/review/P4_T086_OWNER_CORRECTION_POST_MFA_SAFE_NAV_CANDIDATE_20261102.md');
const UUID='f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const oldNavCommit='1a60b7ac9b141e7027ce071ab5e60c0343ca2424';
const show=(commit,path)=>execFileSync('git',['show',commit+':'+path],{encoding:'utf8'});
const blob=p=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
function fn(){
 const ctx={window:{},URLSearchParams};
 runInNewContext(nav,ctx,{timeout:1000});
 return ctx.window.JBProdSafeNav.target;
}
function loginTarget(next){
 const src=login;
 const start=src.indexOf('function safeNextPage(){');
 const end=src.indexOf('\nif(q.get(\'locked\'))',start);
 assert(start>0&&end>start,'actual Admin Login safeNextPage must be source inspected');
 const ctx={q:new URLSearchParams('next='+encodeURIComponent(next)),window:{JBProdSafeNav:{target:fn()}}};
 runInNewContext(src.slice(start,end)+'\nglobalThis.result=safeNextPage();',ctx,{timeout:1000});
 return ctx.result;
}
const target='add-news.html?edit='+UUID+'&from=published';
test('T086-R01 reviewed current A1 baseline exact SHA and immutable 2026-10-29 original',()=>{
 assert.equal(blob('ci/phase4/b12/history/v3-c1-public-integration-20261102-founder-a-v1.cjs'),
  '474ff764ae65850863b8142318083964086d4e4e');
 assert.equal(blob('ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs'),
  '47452e35d880b3123ff0782f00564d849f5a06ba');
 assert.equal(a1,show(oldNavCommit,'ci/phase4/b12/v3-c1-public-integration.test.cjs'));
 assert.equal(original,show('5d5fa9bd703607f890851b7a6d5aad3e80e3285e',
  'ci/phase4/b12/v3-c1-public-integration.test.cjs'));
});
test('T086-R02 A2 original ten named public/security tests remain same exact cases',()=>{
 const names=s=>[...s.matchAll(/^test\('([^']+)'/gm)].map(x=>x[1]);
 assert.equal(names(current).length,10);
 assert.deepEqual(names(current),names(a1));
 assert.deepEqual(names(current),names(original));
});
test('T086-R03 V3 A2 canonical original ten-case body differs from A1 by ONE pinned SHA only',()=>{
 const expected=a1.replace("'b12-safe-nav.js':'a2107140321c2e099e785c678213ad278cbcfd5f'",
 "'b12-safe-nav.js':'d2d2742e46d3d373f6a6dd549f9d7b0fe684b862'");
 assert.notEqual(expected,a1);
 assert.equal(current,expected);
 assert.equal(blob('JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js'),
  'd2d2742e46d3d373f6a6dd549f9d7b0fe684b862');
});
test('T086-R04 exact A1→A2 nav source diff is ONLY published whitelist and strict correction exception',()=>{
 const previous=show(oldNavCommit,'JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js');
 assert.equal(blob('ci/phase4/b12/v3-c1-public-integration.test.cjs'),
  'ba03508b617ec6388bed458d986758383ba60943');
 const oldPages="'admin.html', 'add-news.html', 'admin-security.html',";
 const newPages="'admin.html', 'add-news.html', 'published.html', 'admin-security.html',";
 assert.equal(previous.split(oldPages).length,2);
 const oldParse="    if (params.size !== 1) return DEFAULT;\n    const key=[...params.keys()][0];";
 const newParse=[
    '    // T086 / Founder-only published correction post-MFA return.',
    '    // This is a destination parser, NOT authority to edit or publish; admin-auth.js',
    '    // still requires Owner session + verified AAL2 and a valid server session.',
    '    // Permit exactly two query fields for this one reviewed editor deep link.',
    "    if (part === 'add-news.html' && params.size === 2) {",
    "      if (params.getAll('edit').length !== 1 ||",
    "          params.getAll('from').length !== 1 ||",
    "          [...params.keys()].some(k => k !== 'edit' && k !== 'from')) return DEFAULT;",
    "      const edit = params.get('edit'), from = params.get('from');",
    "      return UUID.test(edit || '') && from === 'published'",
    "        ? part + '?edit=' + encodeURIComponent(edit) + '&from=published'",
    "        : DEFAULT;",
    "    }",
    "    if (params.size !== 1) return DEFAULT;",
    "    const key=[...params.keys()][0];"
 ].join('\n');
 assert.equal(previous.split(oldParse).length,2);
 assert.equal(nav,previous.replace(oldPages,newPages).replace(oldParse,newParse));
});
test('T086-R05 whitelist admits Founder published list with NO query',()=>{
 assert.equal(fn()('published.html'),'published.html');
 assert.equal(loginTarget('published.html'),'published.html');
});
test('T086-R06 exact previously published Article ID returns to correction editor post MFA',()=>{
 assert.equal(fn()(target),target);
 assert.equal(loginTarget(target),target);
});
test('T086-R07 reverse order of two legitimate query keys canonicalizes without new authority',()=>{
 const reverse='add-news.html?from=published&edit='+UUID;
 assert.equal(fn()(reverse),target);
 assert.equal(loginTarget(reverse),target);
});
test('T086-R08 existing one-key Article preview ID, B8 and B9 Admin routes untouched',()=>{
 const routes=[
 'admin.html','admin-security.html','youtube-oauth-health.html','b8-accountability.html',
 'grievances.html?tab=inbox','b9-analytics.html?range=30','add-news.html?id='+UUID
 ];
 for(const x of routes)assert.equal(fn()(x),x,x);
});
test('T086-R09 previously insecure multi-key query shapes remain denied for EVERY other page',()=>{
 for(const x of [
 'admin.html?x=1&y=2','published.html?edit='+UUID,
 'published.html?next=admin.html','admin-security.html?edit='+UUID+'&from=published',
 'b9-analytics.html?range=7&from=published',
 'grievances.html?tab=open&from=published','add-news.html?id='+UUID+'&from=published',
 'add-news.html?edit='+UUID+'&from=draft&x=1'
 ])assert.equal(fn()(x),'admin.html',x);
});
test('T086-R10 correction route fails closed for missing/duplicate/extra query keys',()=>{
 for(const x of [
 'add-news.html?edit='+UUID,'add-news.html?from=published',
 target+'&x=1',target+'&edit='+UUID,target+'&from=published',
 'add-news.html?from=published&from=published&edit='+UUID,
 'add-news.html?edit='+UUID+'&from=published&x=',
 'add-news.html?edit='+UUID+'&from=published&edit=',
 'add-news.html?edit='+UUID+'&from=published?foo'
 ])assert.equal(fn()(x),'admin.html',x);
});
test('T086-R11 correction link cannot switch source or spoof from state',()=>{
 for(const x of [
 'add-news.html?edit='+UUID+'&from=draft',
 'add-news.html?edit='+UUID+'&from=Published',
 'add-news.html?edit='+UUID+'&from=trash',
 'add-news.html?edit='+UUID+'&from=unpublished',
 'add-news.html?edit='+UUID+'&from=%20published',
 'add-news.html?edit='+UUID+'&from=published%26admin%3Dtrue',
 'add-news.html?edit='+UUID+'&from=published#unsafe'
 ])assert.equal(fn()(x),'admin.html',x);
});
test('T086-R12 malformed UUID, object key and encoded query forgery denied',()=>{
 for(const x of [
 'add-news.html?edit=bad-id&from=published',
 'add-news.html?edit=..%2Fadmin.html&from=published',
 'add-news.html?edit='+UUID.slice(0,-1)+'&from=published',
 'add-news.html?edit='+UUID+'%00&from=published',
 'add-news.html?edit%0a='+UUID+'&from=published',
 'add-news.html?edit='+UUID+'&FROM=published',
 'add-news.html?%65dit='+UUID+'&fr%6fm=published&admin=1',
 'add-news.html?edit='+UUID+'&from%00=published'
 ])assert.equal(fn()(x),'admin.html',x);
});
test('T086-R13 external redirect, traversal, encoded slashes, control bytes stay blocked',()=>{
 for(const x of [
 'https://evil.example/add-news.html?edit='+UUID+'&from=published',
 '//evil.example/add-news.html?edit='+UUID+'&from=published',
 '../add-news.html?edit='+UUID+'&from=published',
 '/add-news.html?edit='+UUID+'&from=published',
 '%2fadd-news.html?edit='+UUID+'&from=published',
 'add-news.html%2f?edit='+UUID+'&from=published',
 'add-news.html\\?edit='+UUID+'&from=published',
 'add-news.html?edit='+UUID+'&from=published%0a',
 'javascript:alert(1)','data:text/html,hello',
 '',null,undefined, 'A'.repeat(513)
 ])assert.equal(fn()(x),'admin.html',String(x));
});
test('T086-R14 only exact allowed two unique keys are canonicalized; no arbitrary query injection',()=>{
 for(const x of [
 target+'&next=https%3A%2F%2Fevil.example',
 target+'&redirect=admin-security.html',
 'add-news.html?edit='+UUID+'&edit='+UUID+'&from=published',
 'add-news.html?edit='+UUID+'&from=published&from=draft'
 ])assert.equal(loginTarget(x),'admin.html',x);
});
test('T086-R15 admin auth requires Owner, AAL2 and real server session BEFORE page ready',()=>{
 for(const x of [
 "if(r!=='owner')return {kind:'role'",
 "aal?.currentLevel!=='aal2'",
 'JBBackend.serverSessionValid()',
 'LOCK_MS=LOCK_MINUTES*60*1000',
 'admin-login.html?reason=aal2&next=',
 'admin-login.html?reason=session&next='
 ])assert(auth.includes(x),x);
 assert.equal(blob(root+'admin-auth.js'),'e0c751cbaa6582aa00ffd82d23f03c01956142f7');
});
test('T086-R16 trusted Admin Login preserves MFA and device unlock security before redirect',()=>{
 for(const x of [
 'function safeNextPage()','window.JBProdSafeNav.target(target)',
 'location.replace(safeNextPage())',
 "if(r!=='owner')", "aal?.currentLevel!=='aal2'",
 'verifyMfa.onclick=async()=>','unlockWithDevice'
 ])assert(login.includes(x),x);
 assert.equal(blob(root+'admin-login.html'),'2254f94ce40d49cda0ed0076311d511685036fc3');
});
test('T086-R17 Published News edit link uses original server ID with exact two keys',()=>{
 assert(published.includes("function editItem(id){location.href='add-news.html?edit='+encodeURIComponent(id)+'&from=published'}"));
 assert(published.includes('Edit / Correction'));
 assert.equal(blob(root+'published.html'),'39fb346dee0e2046f8a833dcd652dd743b911777');
});
test('T086-R18 corrected page still loads original item and saves no public edits automatically',()=>{
 for(const x of [
 "if(editId){",'await JBBackend.getArticle(editId,{privateData:true})',
 "from==='published'?'published':'draft'",
 'LOCAL CORRECTION SAVED • NOT SYNCED',
 'Final Review → Confirm Publish',
 "editing && editing.status==='published'"
 ])assert(add.includes(x),x);
 assert.equal(blob(root+'add-news.html'),'813d00fbf96b31214cce1f4147d14615c3de4be1');
});
test('T086-R19 no new public write, open redirect or Live auth capability in navigation source',()=>{
 for(const needle of ['supabase','service_role','location.href=','location.replace=','fetch(','XMLHttpRequest','iframe','localStorage','sessionStorage','http://','https://']){
  assert(!nav.includes(needle),'unexpected capability in safe navigation code: '+needle);
 }
 assert(!nav.includes('target(input)=>'));
});
test('T086-R20 real Founder Android E3, unchanged article correction E4 and Live E5 NEVER inferred from mock',()=>{
 for(const mark of [
 'T086_PHYSICAL_POST_MFA_ANDROID_ROUTE_E3=NOT_RUN',
 'T086_REAL_ARTICLE_EDIT_CORRECT_UNPUBLISH_REPUBLISH_E4=NOT_RUN',
 'T086_REAL_LIVE_PROVIDER_START_STOP_VIEWER_E5=NOT_RUN',
 'T086_OFFICIAL_FINAL_PASS_LOCK=HOLD'
 ])assert(doc.includes(mark),mark);
 assert(!doc.includes('T086_OFFICIAL_FINAL_PASS_LOCK=PASS'));
});
