import {assert,assertEquals} from 'jsr:@std/assert@1.0.14';
import {handlePrivateAdMediaPreview,MAX_IMAGE_MULTIPART_BYTES} from
 '../../CODEX_CURRENT_SUPABASE/functions/jb-ad-media-preview/handler.ts';
const bearer='Bearer '+'x'.repeat(80);
async function request(entries: Array<[string,string|File]>,headers:Record<string,string>={}){
 const form=new FormData();
 for(const [key,value] of entries)form.append(key,value);
 const req=new Request('https://example.test/media',{method:'POST',
  headers:{Authorization:bearer,...headers},body:form});
 const len=(await req.clone().arrayBuffer()).byteLength;
 req.headers.set('content-length',String(len));
 return req;
}
const file=(type='image/png')=>new File([new Uint8Array(60)],'ad.png',{type});
const image=(b:Uint8Array)=>({
 canApprove:false,canPublish:false,status:'PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED',
 privatePreviewPng:b
});
Deno.test('Unauthorized request is rejected BEFORE reading or decoding bytes',async()=>{
 let calls=0;
 const req=await request([['file',file()]]);
 const r=await handlePrivateAdMediaPreview(req,{authorize:async()=>false,convert:async()=>{calls++;return image(new Uint8Array(16));}});
 assertEquals(r.status,403);assertEquals(calls,0);
 assertEquals(r.headers.get('cache-control'),'no-store');
});
Deno.test('Header/body limits, bad methods and bad multipart form fail closed',async()=>{
 const deps={authorize:async()=>true,convert:async()=>image(new Uint8Array(32))};
 let r=await handlePrivateAdMediaPreview(new Request('https://example.test',{method:'GET'}),deps);
 assertEquals(r.status,405);
 const form=await request([['file',file()]]);
 form.headers.delete('content-length');
 r=await handlePrivateAdMediaPreview(form,deps);assertEquals(r.status,411);
 const giant=await request([['file',file()]]);giant.headers.set('content-length',String(MAX_IMAGE_MULTIPART_BYTES+1));
 r=await handlePrivateAdMediaPreview(giant,deps);assertEquals(r.status,413);
 const invalid=new Request('https://example.test',{method:'POST',
  headers:{Authorization:bearer,'content-length':'10','content-type':'text/html'},body:'malicious'});
 r=await handlePrivateAdMediaPreview(invalid,deps);assertEquals(r.status,415);
 const dup=await request([['file',file()],['file',file()]]);
 r=await handlePrivateAdMediaPreview(dup,deps);assertEquals(r.status,400);
});
Deno.test('Forged HTTP Content-Length smaller or larger than actual body is refused before decoding',async()=>{
 let decodeCount=0;
 const deps={authorize:async()=>true,convert:async()=>{
  decodeCount++;return image(new Uint8Array(32));
 }};
 const small=await request([['file',file()]]);
 small.headers.set('content-length','1');
 let r=await handlePrivateAdMediaPreview(small,deps);
 assertEquals(r.status,400);
 assertEquals((await r.json()).error,'DECLARED_BODY_LENGTH_MISMATCH');
 const big=await request([['file',file()]]);
 big.headers.set('content-length',String(Number(big.headers.get('content-length'))+1));
 r=await handlePrivateAdMediaPreview(big,deps);
 assertEquals(r.status,400);
 assertEquals(decodeCount,0);
});

Deno.test('Bounded stream rejects oversized bytes despite forged small declared header',async()=>{
 let decodeCount=0;
 const over=MAX_IMAGE_MULTIPART_BYTES+1;
 const body=new Uint8Array(over);
 const incoming=new Request('https://example.test/media',{
  method:'POST',
  headers:{'Authorization':bearer,'Content-Type':'multipart/form-data; boundary=fixture',
   'Content-Length':'1'},
  body
 });
 const r=await handlePrivateAdMediaPreview(incoming,{
  authorize:async()=>true,convert:async()=>{decodeCount++;return image(new Uint8Array(32));}
 });
 assertEquals(r.status,413);
 assertEquals(decodeCount,0);
});

Deno.test('Valid Owner preview responds image/png with strict no-store, no approval token or storage URL',async()=>{
 let authorized=false,converted=false;
 const imageBytes=Uint8Array.from({length:24},(_,i)=>i+1);
 const r=await handlePrivateAdMediaPreview(await request([['file',file()]]),{
  authorize:async t=>{authorized=t.length===80;return true;},
  convert:async (bytes,name,mime)=>{converted=true;assertEquals(name,'ad.png');
   assertEquals(mime,'image/png');assert(bytes.length===60);return image(imageBytes);}
 });
 assert(authorized&&converted);assertEquals(r.status,200);
 assertEquals(r.headers.get('x-jb-media-state'),'PRIVATE_PREVIEW_NOT_STORED_NOT_APPROVED');
 assertEquals(r.headers.get('cache-control'),'no-store, private');
 assertEquals(r.headers.get('content-type'),'image/png');
 assertEquals((await r.arrayBuffer()).byteLength,24);
 assertEquals(r.headers.has('access-control-allow-origin'),false);
});
Deno.test('Forged sanitizer claim or failed media decode never sends original pixels',async()=>{
 for(const convert of [
  async()=>({...image(new Uint8Array(30)),canApprove:true}),
  async()=>({...image(new Uint8Array(30)),status:'APPROVED'}),
  async()=>{throw Error('decoder stack details must be hidden');}
 ]){
  const r=await handlePrivateAdMediaPreview(await request([['file',file()]]),{
   authorize:async()=>true,convert});
  assertEquals(r.status,422);
  assertEquals((await r.text()).includes('decoder stack'),false);
 }
});
