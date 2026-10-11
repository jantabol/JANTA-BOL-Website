import {assert,assertEquals} from 'jsr:@std/assert@1.0.14';
import {verifyAdMediaOwner} from
 '../../CODEX_CURRENT_SUPABASE/functions/jb-ad-media-preview/owner-auth.ts';
const base='https://vrffsnkycvjithwtiylt.supabase.co';
const token='x'.repeat(100),anonKey='PUBLIC_ANON_FIXTURE';
const id='11111111-1111-4111-8111-111111111111';
const okUser=()=>new Response(JSON.stringify({id}),{
 status:200,headers:{'Content-Type':'application/json'}});
const okCap=()=>new Response(JSON.stringify('B7_DRAFT_THEN_EXPLICIT_APPROVE_V1'),{
 status:200,headers:{'Content-Type':'application/json'}});
const settings={baseUrl:base,anonKey};
Deno.test('Synthetic Owner check requires BOTH Auth user and canonical backend AAL2 capability',async()=>{
 const calls:{url:string,method:string,token:string,apikey:string,redirect:RequestRedirect,body:string}[]=[];
 const request=async(url:string|URL|Request,init:RequestInit={})=>{
  const h=new Headers(init.headers);
  calls.push({url:String(url),method:init.method||'',token:h.get('Authorization')||'',
   apikey:h.get('apikey')||'',redirect:init.redirect||'follow',body:String(init.body||'')});
  return calls.length===1?okUser():okCap();
 };
 const accepted=await verifyAdMediaOwner(token,{...settings,request:request as typeof fetch});
 assertEquals(accepted,true);assertEquals(calls.length,2);
 assert(calls[0].url.endsWith('/auth/v1/user'));
 assert(calls[1].url.endsWith('/rest/v1/rpc/jb_ad_creative_workflow_capability_internal'));
 assertEquals(calls[0].method,'GET');assertEquals(calls[1].method,'POST');
 assertEquals(calls[0].redirect,'error');assertEquals(calls[1].redirect,'error');
 assertEquals(calls[0].token,'Bearer '+token);
 assertEquals(calls[1].token,'Bearer '+token);
 assertEquals(calls[0].apikey,anonKey);
 assertEquals(calls[1].apikey,anonKey);
 assertEquals(calls[1].body,'{}');
});
Deno.test('Absent/invalid session, no Owner capability, revoked AAL2 or wrong RPC response ALWAYS denied',async()=>{
 for(const variant of ['invalid_user','revoked','aal1','cap404','wrong_cap','service_error','malformed']){
  let calls=0;
  const request=async()=>{
   calls++;
   if(calls===1){
    if(variant==='invalid_user')return new Response('{}',{status:401});
    if(variant==='malformed')return new Response(JSON.stringify({id:'x'}),{status:200});
    return okUser();
   }
   if(variant==='revoked'||variant==='aal1')return new Response('{}',{status:403});
   if(variant==='cap404')return new Response('{}',{status:404});
   if(variant==='service_error')throw Error('network details not leaked');
   if(variant==='wrong_cap')return new Response(JSON.stringify('APPROVED'),{status:200});
   return okCap();
  };
  assertEquals(await verifyAdMediaOwner(token,{...settings,request:request as typeof fetch}),false,variant);
  assertEquals(calls,variant==='invalid_user'||variant==='malformed'?1:2);
 }
});
Deno.test('No accidental proxy, insecure domain, URL username, or bogus token can call backend',async()=>{
 for(const [badToken,badUrl] of [
  [token,'http://vrffsnkycvjithwtiylt.supabase.co'],
  [token,'https://vrffsnkycvjithwtiylt.supabase.co.evil.test'],
  [token,'https://user@vrffsnkycvjithwtiylt.supabase.co'],
  [token,'https://vrffsnkycvjithwtiylt.supabase.co:4443'],
  ['short',base]
 ]){
  let requests=0;
  assertEquals(await verifyAdMediaOwner(badToken,{
   ...settings,baseUrl:badUrl,request:(async()=>{requests++;return okUser();}) as typeof fetch
  }),false);
  assertEquals(requests,0);
 }
});
