import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {exportStorageBytes,guardManual,verifyStorageExportReceipt,REF,BUCKETS,HOST} from './storage-readonly-export.mjs';
const token='FAKE_TEST_TOKEN_NEVER_A_SUPABASE_SECRET_0'.repeat(2);
function fakeApi({drift=false,missing=false,mutate=false}={}){
 const calls=[];let scans=0;
 const files={
  'grievance-private':{'proof/one.pdf':'GRIEVANCE_PRIVATE_1','proof/two.pdf':'GRIEVANCE_PRIVATE_2'},
  'private-editorial':{'report.pdf':'PRIVATE_EDITORIAL'},
  'public-media':{'cover.jpg':'PUBLIC_IMAGE','photo/cover.png':'PUBLIC_IMAGE_2'}
 };
 async function fake(url,opts){
  calls.push({url,method:opts.method,token_provided:opts.headers?.authorization==='Bearer '+token});
  assert.ok(url.startsWith(HOST+'/storage/v1/'));
  assert.equal(opts.headers?.authorization,'Bearer '+token);
  if(opts.method==='POST'&&url.includes('/object/list/')){
   const bucket=decodeURIComponent(url.split('/').at(-1));
   const v=JSON.parse(opts.body);
   assert.equal(v.limit,100);
   const all=Object.entries(files[bucket]??{});
   const folders=[...new Set(all.map(([path])=>path.includes('/')?path.split('/')[0]:null).filter(Boolean))];
   let entries=[];
   if(v.prefix===''){
    entries=[...folders.map(name=>({name,id:null})),
    ...all.filter(([name])=>!name.includes('/')).map(([name,txt])=>({
      name,id:'dummy-'+name,updated_at:'2026-10-24T00:00:00Z',metadata:{size:txt.length}
    }))];
   }else{
    const pref=v.prefix;
    entries=all.filter(([name])=>name.startsWith(pref)&&!name.slice(pref.length).includes('/'))
     .map(([name,txt])=>({name:name.slice(pref.length),id:'dummy-'+name,
      updated_at:drift&&scans>5?'2026-10-25T00:00:00Z':'2026-10-24T00:00:00Z',metadata:{size:txt.length}}));
   }
   scans++;
   return new Response(JSON.stringify(entries.slice(v.offset,v.offset+100)),{status:200,headers:{'content-type':'application/json'}});
  }
  if(opts.method==='GET'&&url.includes('/object/authenticated/')){
   let loc=url.split('/object/authenticated/')[1].split('/').map(decodeURIComponent);
   const bucket=loc.shift(),key=loc.join('/');
   if(missing&&key==='cover.jpg')return new Response('not found',{status:404});
   const bytes=files[bucket]?.[key];
   return new Response(bytes?new TextEncoder().encode(mutate?'MALICIOUS':bytes):null,
    {status:bytes?200:404});
  }
  throw Error('unexpected call');
 }
 return {fake,calls};
}
function temp(){const dir=mkdtempSync(join(tmpdir(),'jb-b11-export-'));return {dir,clean(){rmSync(dir,{recursive:true,force:true})}}}
test('T074 actual private Storage export pipeline supports fixed 3 real JANTA BOL buckets, nested paths and bytes',async()=>{
 const t=temp(),api=fakeApi();try{
  const result=await exportStorageBytes({outDir:t.dir,fetchImpl:api.fake,token,manual:false});
  assert.deepEqual(result.buckets,BUCKETS);
  assert.equal(result.project_ref,REF);
  assert.equal(result.object_count,5);
  assert.equal(result.db_snapshot_bound,false);
  assert.equal(result.stable_double_listing,true);
  assert.equal(readFileSync(join(t.dir,'storage/grievance-private/proof/one.pdf'),'utf8'),'GRIEVANCE_PRIVATE_1');
  assert.equal(readFileSync(join(t.dir,'storage/private-editorial/report.pdf'),'utf8'),'PRIVATE_EDITORIAL');
  assert.equal(readFileSync(join(t.dir,'storage/public-media/photo/cover.png'),'utf8'),'PUBLIC_IMAGE_2');
  assert.equal(api.calls.every(x=>['POST','GET'].includes(x.method)),true);
  assert.equal(api.calls.every(x=>x.token_provided),true);
 }finally{t.clean()}
});
test('T074 cannot claim media/DB consistent point-in-time while source enumeration changes',async()=>{
 const t=temp(),api=fakeApi({drift:true});
 try{
  // Fake server drifts after enough list calls, including nested paths.
  await assert.rejects(exportStorageBytes({outDir:t.dir,fetchImpl:api.fake,token,manual:false}),/SOURCE_CHANGED_DURING_EXPORT/);
  assert.equal(existsSync(join(t.dir,'storage')),false);
  assert.equal(readdirSync(t.dir).length,0);
 }finally{t.clean()}
});
test('T073 fake deletion or storage 404 fails closed without partial staged data',async()=>{
 const t=temp(),api=fakeApi({missing:true});try{
  await assert.rejects(exportStorageBytes({outDir:t.dir,fetchImpl:api.fake,token,manual:false}),/REMOTE_RETRIEVAL_OR_AUTH_DENIED_404/);
  assert.equal(readdirSync(t.dir).length,0);
 }finally{t.clean()}
});
test('T073 corrupt storage byte count fails closed without false success',async()=>{
 const t=temp(),api=fakeApi({mutate:true});try{
  await assert.rejects(exportStorageBytes({outDir:t.dir,fetchImpl:api.fake,token,manual:false}),/OBJECT_LENGTH_CHANGED/);
  assert.equal(readdirSync(t.dir).length,0);
 }finally{t.clean()}
});
test('T074 no real Supabase calls without exact Founder main manual workflow',async()=>{
 const t=temp(),api=fakeApi();try{
  await assert.rejects(exportStorageBytes({outDir:t.dir,fetchImpl:api.fake,token,manual:true,env:{}}),/FOUNDER_EXACT_MANUAL_APPROVAL_REQUIRED/);
  assert.equal(api.calls.length,0);
 }finally{t.clean()}
});
test('T074 separate Cricket project/user-supplied remote host never selectable',()=>{
 assert.equal(HOST,'https://vrffsnkycvjithwtiylt.supabase.co');
 assert.notEqual(HOST,'https://hriakdazkcvplsdwgfle.supabase.co');
 assert.throws(()=>guardManual({GITHUB_ACTOR:'attacker'}),/FOUNDER_EXACT_MANUAL_APPROVAL_REQUIRED/);
});

test('T074 media bytes receipt rejects tampered media even when exporter already completed',async()=>{
 const t=temp(),api=fakeApi();try{
  const r=await exportStorageBytes({outDir:t.dir,fetchImpl:api.fake,token,manual:false});
  mkdirSync(join(t.dir,'config'),{recursive:true});
  writeFileSync(join(t.dir,'config/storage-export-readonly-summary.json'),JSON.stringify({
   schema:'janta-bol-b11-storage-readonly-receipt-v1',project_ref:REF,
   capture_method:'MANUAL_OWNER_SERVICE_ROLE_READ_ONLY',
   stable_double_listing:true,db_snapshot_bound:false,
   object_count:r.object_count,byte_count:r.byte_count,buckets:r.buckets,
   sha_records:r.storage_manifest_records
  }));
  assert.equal(verifyStorageExportReceipt(t.dir).file_count,5);
  writeFileSync(join(t.dir,'storage/public-media/cover.jpg'),'MALICIOUS_NEW_MEDIA');
  assert.throws(()=>verifyStorageExportReceipt(t.dir),/RECEIPT_STORAGE_BYTES_TAMPERED/);
 }finally{t.clean()}
});
