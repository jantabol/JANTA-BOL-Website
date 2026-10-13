import {assert,assertEquals} from 'jsr:@std/assert@1.0.14';
import {handleB7InternalImageIngest,B7_IMAGE_INGRESS_BODY_CAP} from
 '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-image-worker-ingress.ts';

// SYNTHETIC internal gateway and worker receipt — E1 only, NOT live E3/E5.
const ownerToken='x'.repeat(100);
const creative='22222222-2222-4222-8222-222222222222';
const asset='44444444-4444-4444-8444-444444444444';
const goodReceipt=()=>({assetId:asset,creativeId:creative,version:2,
 state:'VERIFIED_PRIVATE_EVIDENCE_ONLY',approved:false,publishable:false});
function deps(override:Record<string,unknown>={}){
 let calls=0;
 const config={
  verifyInternalCommand:async()=>true,
  executeImageJob:async(_input:unknown)=>{calls++;return goodReceipt();},
  ...override
 };
 return {config:config as Parameters<typeof handleB7InternalImageIngest>[1],
  get calls(){return calls;}};
}
async function request(fields:Array<[string,string|File]>=[
 ['creative_id',creative],['file',new File([new Uint8Array(48)],'photo.png',
  {type:'image/png'})]],header:Record<string,string>={}){
 const form=new FormData();
 for(const [key,value] of fields)form.append(key,value);
 const req=new Request('https://private-worker.invalid/ingest',{
  method:'POST',headers:{Authorization:'Bearer '+ownerToken,...header},body:form
 });
 req.headers.set('content-length',String((await req.clone().arrayBuffer()).byteLength));
 return req;
}
Deno.test('internal command + Owner bearer + canonical file yields PRIVATE receipt, no public URL',async()=>{
 const got:Record<string,unknown>[]=[];
 const d=deps({executeImageJob:async(value:Record<string,unknown>)=>{
  got.push(value);return goodReceipt();
 }});
 const res=await handleB7InternalImageIngest(await request(),d.config);
 assertEquals(res.status,200);
 const body=await res.json();
 assertEquals(body.state,'PRIVATE_QUARANTINED');
 assertEquals(body.approved,false);assertEquals(body.publishable,false);
 assertEquals(body.asset_id,asset);assertEquals(body.creative_version,2);
 assertEquals(res.headers.has('access-control-allow-origin'),false);
 assertEquals(res.headers.get('cache-control'),'no-store, private');
 assertEquals(JSON.stringify(body).includes(ownerToken),false);
 assertEquals(JSON.stringify(body).includes('url'),false);
 assertEquals(got[0]?.token,ownerToken);assertEquals(got[0]?.creativeId,creative);
 assertEquals(got[0]?.name,'photo.png');assertEquals(got[0]?.mime,'image/png');
 assert((got[0]?.bytes as Uint8Array).byteLength===48);
});
Deno.test('no private gateway attestation => deny BEFORE reading Owner or bytes',async()=>{
 const d=deps({verifyInternalCommand:async()=>false});
 const bad=await request();
 const res=await handleB7InternalImageIngest(bad,d.config);
 assertEquals(res.status,403);assertEquals(d.calls,0);
 assertEquals(bad.bodyUsed,false);
});
Deno.test('missing internal verifier/worker is fail-closed and never invokes a job',async()=>{
 const res=await handleB7InternalImageIngest(await request(),{
  verifyInternalCommand:async()=>true,
  executeImageJob:undefined
 } as unknown as Parameters<typeof handleB7InternalImageIngest>[1]);
 assertEquals(res.status,503);
});
Deno.test('bad method, Owner auth and untrusted content-length never process media',async()=>{
 const d=deps();
 assertEquals((await handleB7InternalImageIngest(new Request('https://x.invalid'),d.config)).status,405);
 const missing=await request();missing.headers.delete('authorization');
 assertEquals((await handleB7InternalImageIngest(missing,d.config)).status,401);
 const oversized=await request();oversized.headers.set('content-length',String(B7_IMAGE_INGRESS_BODY_CAP+1));
 assertEquals((await handleB7InternalImageIngest(oversized,d.config)).status,413);
 const low=await request();low.headers.set('content-length','1');
 assertEquals((await handleB7InternalImageIngest(low,d.config)).status,400);
 const high=await request();high.headers.set('content-length','999999');
 assertEquals((await handleB7InternalImageIngest(high,d.config)).status,400);
 assertEquals(d.calls,0);
});
Deno.test('forged short Content-Length with oversized body fails before worker',async()=>{
 const d=deps();
 const giant=new Request('https://private-worker.invalid/ingest',{
  method:'POST',headers:{
   Authorization:'Bearer '+ownerToken,
   'Content-Type':'multipart/form-data; boundary=fake',
   'Content-Length':'1'
  },body:new Uint8Array(B7_IMAGE_INGRESS_BODY_CAP+1)
 });
 const res=await handleB7InternalImageIngest(giant,d.config);
 assertEquals(res.status,413);assertEquals(d.calls,0);
});
Deno.test('duplicate fields, forged owner_id, malicious file or bad creative denied',async()=>{
 const sample=new File([new Uint8Array(48)],'photo.png',{type:'image/png'});
 const invalid:Array<Array<[string,string|File]>>=[
  [['creative_id',creative],['creative_id',creative],['file',sample]],
  [['creative_id',creative],['file',sample],['owner_id',asset]],
  [['creative_id','invalid'],['file',sample]],
  [['creative_id',creative],['file',new File([new Uint8Array(48)],'fake.svg',{type:'image/png'})]],
  [['creative_id',creative],['file',new File([new Uint8Array(48)],'fake.mp4',{type:'video/mp4'})]]
 ];
 const d=deps();
 for(const f of invalid){
  const r=await handleB7InternalImageIngest(await request(f),d.config);
  assert(r.status!==200);
 }
 assertEquals(d.calls,0);
});
Deno.test('worker failure or fabricated approved/public result never becomes a private receipt',async()=>{
 for(const exec of [
  async()=>{throw Error('do not leak private worker stack or client key')},
  async()=>({...goodReceipt(),approved:true}),
  async()=>({...goodReceipt(),publishable:true}),
  async()=>({...goodReceipt(),assetId:'forged'}),
  async()=>({...goodReceipt(),creativeId:asset}),
  async()=>({...goodReceipt(),state:'LIVE'})
 ]){
  const d=deps({executeImageJob:exec});
  const r=await handleB7InternalImageIngest(await request(),d.config);
  assert(r.status===422||r.status===502);
  assertEquals((await r.text()).includes('client key'),false);
 }
});
