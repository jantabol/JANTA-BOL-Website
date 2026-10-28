// B0–B12 source reconciliation E7-only coding safety guard.
// Runs BEFORE the Founder starts T076–T083 real production tests one-by-one.
// Never marks any required final test PASS, never contacts Production or secrets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const v3='JANTA_BOL_PHASE_3C_WORKING/';
const truth=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json'));
test('P0 B0-B10 stable root immutable phase3 site baseline',()=>{
 const fs=requireClosure(); // avoid touching production
 const paths=['index.html','script.js','style.css','JANTA_BOL_PHASE_3C_WORKING/backend-client.js',
  'ci/phase4/b9-client-and-ui.test.mjs','ci/phase4/b10-whole-platform-security-source.test.mjs',
  '.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml'];
 for(const p of paths)assert(existsSync(p),'protected baseline missing '+p);
 const root=read('index.html');
 assert(root.includes('<title>JANTA BOL</title>'));
 assert(read('JANTA_BOL_PHASE_3C_WORKING/backend-client.js').includes('JBBackend'));
});
function requireClosure(){return Object.freeze({});}
test('P1 B12 safely patches original B10 T063 Owner MFA redirect, not replaces role/MFA authority',()=>{
 const s=read(v3+'admin-login.html');
 assert.match(s,/<script src="b12-safe-nav\.js"><\/script>/);
 assert.match(s,/function safeNextPage\(\)/);
 assert.match(s,/JBProdSafeNav\.target\(target\)/);
 assert.match(s,/const safeLocal=/);
 assert.match(s,/typeof window !== 'undefined'/);
 assert.match(s,/JBBackend\.mfaAAL/);
 assert.match(s,/finishAdminLogin/);
 assert.match(s,/location\.replace\(safeNextPage\(\)\)/);
});
test('P2 B12 same-dir navigation rejects all external/encoded/duplicate/unknown target',()=>{
 const context={window:{}, URLSearchParams};
 vm.runInNewContext(read(v3+'b12-safe-nav.js'),context,{timeout:500});
 const target=context.window.JBProdSafeNav.target;
 assert.equal(target('admin.html'),'admin.html');
 assert.equal(target('add-news.html?id=9b346776-7250-4c39-86bd-02c59525e6ed'),
   'add-news.html?id=9b346776-7250-4c39-86bd-02c59525e6ed');
 for(const x of [
  'https://evil.example/steal','//evil.example','../admin.html',
  '/admin.html','%2F%2Fevil.example','admin.html%0aref','admin.html?id=22',
  'admin-login.html','admin.html?id=9b346776-7250-4c39-86bd-02c59525e6ed',
  'add-news.html?id=oops','add-news.html?id=9b346776-7250-4c39-86bd-02c59525e6ed&id=oops',
  'add-news.html?admin=true','admin.html?redirect=https://evil.example',
  'admin.html\\evil','',null
 ])assert.equal(target(x),'admin.html','wrong redirect '+x);
});
test('P3 Article UUID/PURL canonical remains single-home and no raw DB errors',()=>{
 const s=read(v3+'article.html');
 assert.match(s,/requestedId=params\.get\('id'\)/);
 assert.match(s,/id=\/\^\[0-9a-f\]/);
 assert.match(s,/document\.querySelector\('link\[rel="canonical"\]'\)/);
 assert.match(s,/c\.href=shareUrl\(\)/);
 assert.match(s,/root\.textContent=adminPreview\?/);
 assert(!s.includes("JBBackend.esc(e.message)"));
 assert.match(s,/src="b9-client\.js"/);
 assert.match(s,/src="b9-article-ui\.js"/);
});
test('P4 Real public source never displays unverified sample news or false fixed view counts',()=>{
 const s=read(v3+'index.html');
 for(const term of ['शिवपुरी अस्पताल में भ्रष्टाचार का आरोप','picsum.photos','👁 28.4K']) {
  assert(!s.includes(term),'preexisting mock news still visible: '+term);
 }
 assert.match(s,/<section class="breaking-news" id="top-story" hidden/);
 assert.match(s,/<section class="latest-news-section" id="latest-news"/);
 assert.match(s,/b9-home-link\.js/);
 assert.match(s,/backend-client\.js/);
 assert.match(s,/public-ads\.js/);
 const js=read(v3+'website-v3.js');
 assert.match(js,/newsError=true/);
 assert.match(js,/breakingSection\.hidden=false/);
});
test('P5 Original Phase4 B9/B10 and B12 coding homes coexist, no duplicate privilege engine',()=>{
 for(const p of [
  'JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md',
  'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md',
  'ci/phase4/b9-client-and-ui.test.mjs',
  'ci/phase4/b10-whole-platform-security-source.test.mjs',
  'ci/phase4/b12/t078-production-catalog-readonly.sql',
  'ci/phase4/b12/t079-external-provider-failclosed.cjs',
  'ci/phase4/b12/t081-rollout-rollback-guard.cjs',
  'ci/phase4/b12/b12-release-gate.cjs'
 ])assert(existsSync(p),'missing protected coding home: '+p);
 const sql=read('ci/phase4/b12/t078-production-catalog-readonly.sql');
 assert(!/\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|GRANT|TRUNCATE)\s+(TABLE|POLICY|FUNCTION|INTO|PUBLIC|ROLE)\b/i.test(sql),'read-only catalog SQL changed');
});
test('P6 Vercel production preview config adds safe headers, no insecure proxy or paid domain',()=>{
 const v=JSON.parse(read('vercel.json'));
 assert(v.redirects?.some(x=>x.source==='/'&&x.destination==='/JANTA_BOL_PHASE_3C_WORKING/index.html'));
 const headers=JSON.stringify(v.headers);
 for(const x of ['nosniff','SAMEORIGIN','no-store'])assert(headers.includes(x));
 assert(!JSON.stringify(v).includes('apiKey'));
 assert(!JSON.stringify(v).includes('service_role'));
});
test('P7 B11 real recovery and T072 original duplicate P2 cannot be falsely cleared in B12',()=>{
 assert.equal(truth.zero_paid,true);
 assert.equal(truth.source_reconciliation_complete,false);
 assert.equal(truth.b11_full_recovery_locked,false);
 assert.equal(truth.b11_t072_real_production_idempotency_closed,false);
 assert.equal(truth.production_merged,false);
 assert.equal(truth.production_deployed,false);
 assert.equal(truth.release_mode,'REVIEW_ONLY_NOT_PRODUCTION');
 for(const [id,r] of Object.entries(truth.tests)) {
  assert(/^P4-T0(?:7[6-9]|8[0-3])$/.test(id));
  assert.equal(r.status,'NOT_RUN');
  assert.deepEqual(r.evidence,[]);
 }
 console.log('B12_B0_B12_CODING_SOURCE=REVIEW_ONLY');
 console.log('B12_B11_E8_AND_T072_PROD=HOLD');
 console.log('B12_T076_TO_T083_TESTING=NOT_STARTED');
});
