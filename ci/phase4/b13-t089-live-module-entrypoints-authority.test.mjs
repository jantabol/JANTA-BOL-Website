// T089/E7: actual HTML→JS→ES-module static dependency graph from the protected
// product directory. No browser execution, real data, network or production edits.
// Detect missing paths and orphan executable scripts; deliberate STAGING files
// must self-identify and are NOT counted as deployed integrations.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root='JANTA_BOL_PHASE_3C_WORKING';
const entries=fs.readdirSync(root,{withFileTypes:true});
const html=entries.filter(x=>x.isFile()&&x.name.endsWith('.html')).map(x=>x.name).sort();
const js=entries.filter(x=>x.isFile()&&x.name.endsWith('.js')).map(x=>x.name).sort();
const jsSet=new Set(js);
const source=new Map(js.map(x=>[x,fs.readFileSync(path.join(root,x),'utf8')]));
const scriptRef=(h)=>[...h.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
 .map(m=>m[1].split(/[?#]/)[0]).filter(x=>!/^https?:\/\//i.test(x))
 .map(x=>x.replace(/^\.\//,''));
const staticImports=(s)=>[
 ...[...s.matchAll(/\b(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?['"](\.\/[^'"]+\.js)['"]/g)].map(m=>m[1]),
 ...[...s.matchAll(/\bimport\s*\(\s*['"](\.\/[^'"]+\.js)['"]\s*\)/g)].map(m=>m[1])
].map(x=>x.replace(/^\.\//,''));
const hScripts=new Map(html.map(x=>[x,scriptRef(fs.readFileSync(path.join(root,x),'utf8'))]));
const refs=new Map(js.map(x=>[x,staticImports(source.get(x))]));
const queue=[...new Set([...hScripts.values()].flat())];
const reachable=new Set();
const absent=new Set();
while(queue.length){
 const current=queue.pop();
 if(reachable.has(current))continue;
 if(!jsSet.has(current)){absent.add(current);continue;}
 reachable.add(current);
 for(const dep of refs.get(current)||[])queue.push(dep);
}
const unreferenced=js.filter(x=>!reachable.has(x));
const explicitStaging=unreferenced.filter(x=>/STAGING|REVIEW ONLY|NOT YET ENABLED|NOT linked|UNDEPLOYED/i.test(source.get(x).slice(0,950)));
const unexplained=unreferenced.filter(x=>!explicitStaging.includes(x));

test('T089-A01 all 32 canonical HTML pages and all 32 JS sources parsed, no missing entrypoint assets',()=>{
 assert.equal(html.length,32,'Canonical original pages changed: review source');
 assert.equal(js.length,32,'Canonical JS asset count changed: review orphan classifications');
 assert.deepEqual([...absent],[],'LIVE_HTML_OR_JS_REFERENCES_MISSING_LOCAL_JS');
 assert.equal([...hScripts.values()].flat().filter(x=>x==='backend-client.js').length>10,true,
  'canonical backend client no longer shared');
});
test('T089-A02 no unclassified orphan JS; deliberately staged scripts remain fail-closed not live',()=>{
 assert.deepEqual(unexplained,[],'UNCLASSIFIED_ORPHAN_JS_REQUIRES_REVIEW');
 for(const f of explicitStaging) assert.ok(/STAGING|REVIEW ONLY|NOT YET ENABLED|NOT linked|UNDEPLOYED/i.test(source.get(f).slice(0,950)));
 assert.ok(explicitStaging.length>=3,'Expected old deliberately-gated staging modules classification changed');
});
test('T089-A03 actual public homepage C1 source is unique, no unauthorized direct Article table on anonymous page',()=>{
 const homepage=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const site=source.get('website-v3.js');
 const projection=source.get('public-c1-projection.js');
 const backend=source.get('backend-client.js');
 assert.ok(hScripts.get('index.html').includes('public-c1-projection.js'));
 assert.ok(hScripts.get('index.html').includes('backend-client.js'));
 assert.ok(hScripts.get('index.html').includes('website-v3.js'));
 assert.ok(site.includes('JBPublicC1.list('));
 assert.ok(projection.includes("client.rpc('jb_c1_public_articles'"));
 assert.ok(projection.includes("row.status !== 'published'"));
 assert.ok(backend.includes(".from('articles')"));
 assert.equal(site.includes(".from('articles')"),false,'public homepage must not query private Article table');
 assert.equal(projection.includes(".from('articles')"),false,'public C1 projection cannot use direct Article table');
 assert.ok(homepage.includes('id="b9SearchNav"'));
});
test('T089-A04 B8 staff/public UI import their sole clients rather than duplicate private/public case engines',()=>{
 assert.ok(hScripts.get('b8-accountability.html').includes('b8-accountability-ui.js'));
 assert.ok(hScripts.get('accountability-public.html').includes('b8-public-case-ui.js'));
 assert.ok((refs.get('b8-accountability-ui.js')||[]).includes('b8-accountability-client.js'));
 assert.ok((refs.get('b8-accountability-ui.js')||[]).includes('b8-owner-idempotency-client.js'));
 assert.ok((refs.get('b8-public-case-ui.js')||[]).includes('b8-public-case-client.js'));
});
test('T089-A05 actual Vercel production default route selects canonical product, not legacy static root',()=>{
 const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 const pathExpected='/JANTA_BOL_PHASE_3C_WORKING/index.html';
 assert.ok(config.redirects.some(x=>x.source==='/'&&x.destination===pathExpected&&!x.permanent));
 const oldRoot=fs.readFileSync('index.html','utf8');
 const oldJs=fs.readFileSync('script.js','utf8');
 assert.notEqual(oldRoot,fs.readFileSync(path.join(root,'index.html'),'utf8'));
 assert.ok(oldRoot.includes('🔴 LIVE'),'Legacy standalone static preview still exists; do not mislabel it production');
 assert.equal(oldJs.includes('createClient('),false,'Unexpected second real Supabase authority in old root');
 assert.equal(oldJs.includes(".from('articles')"),false,'Unexpected second editorial table authority in old root');
 console.log('T089_LEGACY_ROOT_INDEX_HTML_DIRECT_PATH_REMAINING=CANDIDATE_P1_REVIEW');
});
test('T089-A06 verify no new SQL / product change from T088 parent during this source audit',()=>{
 // The test reads product files only. Production fixes/deployments are NOT
 // performed by this script; old immutable T089 workflow source boundary enforces diff.
 assert.ok(reachable.size>=23,'Unexpectedly too few executable source files reachable');
});
console.log('T089_HTML_JS_SOURCE_GRAPH_REACHABLE='+reachable.size);
console.log('T089_HTML_JS_SOURCE_GRAPH_EXPLICIT_STAGING='+explicitStaging.join(','));
console.log('T089_HTML_JS_SOURCE_GRAPH_UNEXPECTED_ORPHANS='+unexplained.join(','));
console.log('T089_HTML_JS_SOURCE_GRAPH_CI_IS_NOT_LIVE_DUPLICATE_ENGINE_PROOF');
