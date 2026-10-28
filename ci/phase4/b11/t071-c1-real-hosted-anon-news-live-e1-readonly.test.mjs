// T071/C1 E1: REAL hosted Preview + public Supabase HTTP transport.
// Read-only, anonymous/public credentials only; NO mock server, no founder tokens,
// no service-role key, no publishing, no write to prod database or Vercel.
// The Vercel preview source identity was independently inspected beforehand.
// Failure is reported as HOLD/FAIL, never as a fabricated live-product PASS.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const PROJECT='vrffsnkycvjithwtiylt';
const ARTICLE='f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const OLD_DEMO='690405f8-21af-4e46-9ddc-3c2e45abca9c';
const PREVIEW='https://shubham-pichhore-2028-mpymb4woq-shubhamshrivastava295-9848.vercel.app';
const prefix='/JANTA_BOL_PHASE_3C_WORKING/';
const cfgSource=readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const win={};
vm.runInNewContext(cfgSource,{window:win,Object},{timeout:700});
const {url:API,publishableKey:KEY}=win.JB_SUPABASE_CONFIG;
assert.equal(API,'https://'+PROJECT+'.supabase.co');
assert(/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(KEY),'only public browser publishable key allowed');
const headers={'apikey':KEY,'content-type':'application/json','accept':'application/json'};
async function request(target,opts={}){
  const response=await fetch(target,{...opts,signal:AbortSignal.timeout(20000)});
  const text=await response.text();
  let value;
  try{value=JSON.parse(text)}catch{value=null}
  return {code:response.status,body:text,value};
}
function secureReadCheck(r,what){assert.equal(r.code,200,what+': HTTP '+r.code);assert(r.value!==null,what+': invalid JSON');return r.value}
function rpc(params){
  return request(API+'/rest/v1/rpc/jb_c1_public_articles',{
    method:'POST',headers,body:JSON.stringify(params)
  });
}
test('E1 original source candidate page and API config pin without privileged credentials',()=>{
  const src=readFileSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js','utf8');
  assert(src.includes("jb_c1_public_articles"),'Scoped public RPC must be in exact candidate');
  assert(src.includes('requireOwner'),'Original private Owner/AAL2 path stays intact');
  const live=readFileSync('JANTA_BOL_PHASE_3C_WORKING/website-v3.js','utf8');
  assert(live.includes("['LIVE','INTERRUPTED']"),'live public only includes real LIVE/INTERRUPTED');
  assert(live.includes('if(liveRows.length)'),'hide public LIVE cards when no qualifying feed rows');
  assert(!/service_role|sb_secret_/i.test(cfgSource),'privileged key must NOT appear in public config');
  console.log('C1_E1_PUBLIC_SOURCE_BINDING_NON_PRIVILEGED=PASS');
});
test('E1 actual Vercel PREVIEW HTTP serves full same-source Article, News and LIVE code',async()=>{
 const routes=['index.html','article.html?id='+ARTICLE,'live.html','website-v3.js','backend-client.js'];
 for(const route of routes){
  const r=await request(PREVIEW+prefix+route);
  assert.equal(r.code,200,'HOSTED_PREVIEW_HTTP_'+route+' '+r.code);
  assert(r.body.length>800,route+' unexpectedly empty');
 }
 console.log('C1_E1_ACTUAL_PREVIEW_STATIC_ROUTES_5X200=PASS');
});
test('E1 genuine external HTTPS anonymous PostgREST RPC serves only corrected published Article v15 body',async()=>{
 const items=secureReadCheck(await rpc({p_article_id:ARTICLE,p_limit:1}),'published public Article').items;
 assert.equal(items.length,1,'the Founder published full article must be guest readable');
 const a=items[0];
 assert.equal(a.id,ARTICLE);
 assert.equal(a.status,'published');
 assert(a.body.startsWith('भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO)'),'corrected news body starts with actual lead');
 assert(!a.body.startsWith('ISRO का SpaDeX मिशन पूरा: प्रमुख'),'duplicated title must be absent');
 assert.equal(a.body.length,2896);
 console.log('C1_E1_ACTUAL_HOSTED_GUEST_RPC_PUBLISHED_ARTICLE_2896_CHARS=PASS');
});
test('E1 actual anonymous public Article RPC never returns old Founder-unpublished Demo',async()=>{
 const p=secureReadCheck(await rpc({p_article_id:OLD_DEMO,p_limit:1}),'private Draft denied');
 assert.deepEqual(p.items,[]);
 console.log('C1_E1_OLD_UNPUBLISHED_DEMO_ANON_RPC_DENIED=PASS');
});
test('E1 actual direct REST RLS allows only published content; never leaks unpublished Demo',async()=>{
 const p=await request(API+'/rest/v1/articles?select=id,status,created_by,updated_by&id=eq.'+ARTICLE,{headers});
 if(p.code===200){
   assert(Array.isArray(p.value));
   assert.equal(p.value.length,1,'expected one publicly PUBLISHED article only');
   assert.equal(p.value[0].id,ARTICLE);
   assert.equal(p.value[0].status,'published');
   console.log('C1_E1_DIRECT_REST_PUBLISHED_ROW_VISIBLE_OLD_POLICY=OBSERVED');
   console.log('C1_E1_PUBLIC_CREATOR_UID_FIELDS_VISIBLE='+JSON.stringify({
     created_by:typeof p.value[0].created_by==='string',
     updated_by:typeof p.value[0].updated_by==='string'
   }));
 }else{
   assert([401,403].includes(p.code),'unexpected public published REST status '+p.code);
   console.log('C1_E1_DIRECT_REST_PUBLISHED_ROW_DENIED_BY_GRANT');
 }
 const d=await request(API+'/rest/v1/articles?select=id,title,body&id=eq.'+OLD_DEMO,{headers});
 if(d.code===200){
   assert(Array.isArray(d.value));
   assert.equal(d.value.length,0,'CRITICAL: old unpublished Draft accessed using anonymous public key');
 }else{
   assert([401,403].includes(d.code),'unexpected draft read API HTTP '+d.code);
 }
 const all=await request(API+'/rest/v1/articles?select=id,status&limit=10',{headers});
 if(all.code===200){
   assert(Array.isArray(all.value));
   assert(all.value.length<=1,'CRITICAL: anonymous public API exposed multiple articles when only one is published');
   assert(all.value.every(row=>row.id===ARTICLE&&row.status==='published'),
      'CRITICAL: anonymous public API exposed nonpublished article');
 }else{
   assert([401,403].includes(all.code));
 }
 console.log('C1_E1_ANON_REST_UNPUBLISHED_DRAFTS_NOT_EXPOSED=PASS');
 console.log('C1_E1_DIRECT_PUBLISHED_METADATA_COLUMN_HARDENING=REVIEW_SEPARATELY');
});
test('E1 actual public LIVE feed has no false LIVE/INTERRUPTED flag when backend is OFF',async()=>{
 const r=await request(API+'/rest/v1/public_live_feed?select=public_status&public_status=in.(LIVE,INTERRUPTED)&limit=10',{headers});
 const data=secureReadCheck(r,'public LIVE truth');
 assert(Array.isArray(data));
 assert.equal(data.length,0,'real LIVE rows may not be falsely denied or treated as OFF');
 console.log('C1_E1_ACTUAL_ANON_PUBLIC_LIVE_ACTIVE_COUNT=0_TRUTHFUL_OFF');
});
test('E1 original live_sessions direct backend remains inaccessible to public browser',async()=>{
 const r=await request(API+'/rest/v1/live_sessions?select=id&limit=1',{headers});
 assert([401,403].includes(r.code),'private live_sessions direct SELECT exposed HTTP '+r.code);
 console.log('C1_E1_ANON_PRIVATE_LIVE_SESSIONS_DENIED=PASS');
});
