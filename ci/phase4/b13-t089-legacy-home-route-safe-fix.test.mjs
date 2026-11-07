// B13/T089 FIX-P1: safe source-only Vercel legacy /index.html correction.
// All previously reviewed production redirects, security headers, article PURL
// and private no-store paths must remain byte-for-byte JSON identical in meaning.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const parent='e7bd5822328d95057b3519c1d155c2a2caf51d1c';
const before=JSON.parse(execFileSync('git',['show',parent+':vercel.json'],{encoding:'utf8'}));
const after=JSON.parse(readFileSync('vercel.json','utf8'));
const canonical='/JANTA_BOL_PHASE_3C_WORKING/index.html';
const added={source:'/index.html',destination:canonical,permanent:false};
test('T089-R01 current root nonpermanent redirect stays canonical',()=>{
 assert.ok(before.redirects.some(x=>x.source==='/'&&x.destination===canonical&&x.permanent===false));
 assert.ok(after.redirects.some(x=>x.source==='/'&&x.destination===canonical&&x.permanent===false));
});
test('T089-R02 only NEW legacy /index.html redirect added; no unrelated Vercel config change',()=>{
 assert.deepEqual(after,{...before,redirects:[...before.redirects,added]});
 assert.equal(after.redirects.filter(x=>x.source==='/index.html').length,1);
 assert.equal(after.redirects.length,new Set(after.redirects.map(x=>x.source)).size);
 assert.equal(added.destination.startsWith('/'),true);
 assert.equal(added.permanent,false);
});
test('T089-R03 all original privacy/security/no-store headers remain exactly preserved',()=>{
 assert.deepEqual(after.headers,before.headers);
 const all=JSON.stringify(after.headers);
 assert.ok(all.includes('X-Content-Type-Options'));
 assert.ok(all.includes('Referrer-Policy'));
 assert.ok(all.includes('X-Frame-Options'));
 assert.ok(all.includes('Cache-Control'));
 assert.ok(all.includes('private, no-store, max-age=0'));
});
test('T089-R04 legacy HTML is alternate static-only prototype, not a new backend engine',()=>{
 const legacy=readFileSync('index.html','utf8');
 const canonicalHtml=readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
 const legacyJs=readFileSync('script.js','utf8');
 assert.notEqual(legacy,canonicalHtml);
 assert.match(legacy,/🔴 LIVE/);
 assert.equal(legacyJs.includes('createClient('),false);
 assert.equal(legacyJs.includes(".from('articles')"),false);
 assert.ok(canonicalHtml.includes('public-c1-projection.js'));
});
test('T089-R05 published canonical Article PURL path not redirected',()=>{
 assert.ok(after.redirects.every(x=>x.source!=='/JANTA_BOL_PHASE_3C_WORKING/article.html'));
 assert.ok(after.redirects.every(x=>!x.destination.includes('?id=')));
 const files=execFileSync('git',['diff','--name-only',parent,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allow=new Set(['vercel.json','ci/phase4/b13-t089-legacy-home-route-safe-fix.test.mjs',
 '.github/workflows/b13-t089-legacy-home-route-safe-fix-20261103.yml',
 'JANTA_BOL_PHASE_4_WORKING/review/P4_T089_LEGACY_ROOT_ROUTE_MINIMUM_FIX_20261103.md']);
 assert.ok(files.every(x=>allow.has(x)),'Unauthorized old product or backend source change: '+files.join(','));
});
console.log('T089_LEGACY_INDEX_HTML_ROUTE_SAFE_SOURCE_FIX=PASS_SCOPED_CANDIDATE');
console.log('T089_VERCEL_REAL_PRODUCTION_ALIAS_DEPLOYED_WITH_FIX=NO');
console.log('T089_ORIGINAL_E7_FINAL_PASS_LOCK=HOLD_UNTIL_SAFE_REVIEW');
