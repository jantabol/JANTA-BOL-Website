// P4-T065 official E2: actual HTTPS/WIRE anonymous negative test.
// Active PRODUCTION JANTA BOL Supabase / Vercel Preview: GET only plus PostgREST
// read-only STABLE RPC. No authenticated tokens, service key, mutations or private rows.
// Unlike SQL role emulation, these requests exercise actual HTTP API edge.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const cfg=readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const u=cfg.match(/url:\s*'([^']+)'/)?.[1];
const k=cfg.match(/publishableKey:\s*'([^']+)'/)?.[1];
assert.equal(u,'https://vrffsnkycvjithwtiylt.supabase.co',
 'Never run T065 public HTTP E2 against Cricket or unknown backend.');
assert.ok(k?.startsWith('sb_publishable_'),'Only a public publishable key is allowed.');
const preview='https://shubham-pichhore-2028-2c7un9e7b-shubhamshrivastava295-9848.vercel.app';
const headers={apikey:k,accept:'application/json'};
let checks=0;
const get=async(url,opts={})=>{
 const r=await fetch(url,{redirect:'manual',...opts,signal:AbortSignal.timeout(16000)});
 const text=await r.text();
 if(text.length>1000000) throw Error('ABNORMAL_OVERSIZED_HTTP_RESPONSE');
 return {code:r.status,body:text,head:r.headers};
};
const requireNoPrivate=(res,label)=>{
 assert.ok([200,401,403,404].includes(res.code),
  label+' unexpected status '+res.code);
 if(res.code===200){
  const v=JSON.parse(res.body);
  assert.ok(Array.isArray(v)&&v.length===0,label+' revealed row data');
 }
 console.log('PASS HTTP anon '+label+' (no private records disclosed)');
 checks++;
};
// T077 E6 intentional hardening protects immutable old Preview deployments.
const previewProbe=await get(preview+'/',{redirect:'manual'});
assert.ok([301,302,303,307,308,401,403].includes(previewProbe.code),
  'old Preview should be protected, not public: HTTP '+previewProbe.code);
if([301,302,303,307,308].includes(previewProbe.code)){
  const dst=new URL(previewProbe.head.get('location')||'',preview);
  assert(dst.hostname==='vercel.com'||dst.hostname.endsWith('.vercel.com')||
    /(?:sso|auth|login|protect)/i.test(dst.pathname),
    'old Preview must redirect to authentication');
}
console.log('PASS historical Vercel Preview blocked for anonymous request');
checks++;
// Preserve the original public-site and seven private-row + four RPC invariants.
const page=await get('https://jantabol.in/JANTA_BOL_PHASE_3C_WORKING/index.html');
assert.equal(page.code,200,'Canonical JANTA BOL site must be public over HTTPS');
assert.match(page.body,/JANTA\s*BOL|JANTA-BOL/i);
console.log('PASS real canonical production public HTTP GET /JANTA_BOL_PHASE_3C_WORKING/index.html');
checks++;

for(const [label,relative] of [
 ['private unpublished articles','/rest/v1/articles?select=id&status=eq.draft&limit=1'],
 ['source identities','/rest/v1/article_sources?select=article_id&limit=1'],
 ['role directory','/rest/v1/user_roles?select=user_id&limit=1'],
 ['ad campaign private records','/rest/v1/ad_campaigns?select=id&limit=1'],
 ['grievance private identity','/rest/v1/grievance_private_identity?select=grievance_id&limit=1'],
 ['audit logs','/rest/v1/audit_logs?select=id&limit=1'],
 ['Article historical versions','/rest/v1/article_versions?select=article_id&limit=1']
]){
 const res=await get(u+relative,{headers});
 requireNoPrivate(res,label);
}
const rpc=async(fn,arg)=>{
 const res=await get(u+'/rest/v1/rpc/'+fn,{
   method:'POST',headers:{...headers,'content-type':'application/json'},
   body:JSON.stringify(arg)
 });
 assert.equal(res.code,200,fn+' unexpected status '+res.code);
 return JSON.parse(res.body);
};
const guessed='90000000-0000-4000-8000-000000000065';
const s=await rpc('jb_b9_search',{p_id:guessed});
assert.deepEqual(s.items,[]);
console.log('PASS actual HTTP unknown article ID search does not enumerate private data');
checks++;
const metrics=await rpc('jb_b9_public_metrics',{p_article_id:guessed});
assert.equal(metrics,null);
console.log('PASS actual HTTP private metrics RPC absent on unknown ID');
checks++;
const author=await rpc('jb_b9_public_article_author',{p_article:guessed});
assert.equal(author,null);
console.log('PASS actual HTTP author RPC absent on unknown ID');
checks++;
const related=await rpc('jb_b9_related_news',{p_article_id:guessed,p_limit:5});
assert.ok(related===null||(Array.isArray(related)&&related.length===0));
console.log('PASS actual HTTP unknown article related-news empty');
checks++;
console.log('T065 REAL PUBLIC WIRE HTTP '+checks+' CHECKS PASS; authenticated signed cross-account wire proof remains separate HOLD.');
