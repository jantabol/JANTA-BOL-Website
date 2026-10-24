import test from 'node:test';
import assert from 'node:assert/strict';
import * as age from 'age-encryption';
import {createOwnerAAL2Source} from './t069-owner-supabase-media-source.mjs';
import {encryptedB2MediaRoundTrip} from './t069-media-age-b2-roundtrip.mjs';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const rows=[
 ['grievance-private','case/e1.pdf','proof-one',id(1)],
 ['grievance-private','case/e2.pdf','proof-two',id(2)],
 ['private-editorial','draft/original.png','private-source',id(3)],
 ['public-media','news/cover.jpg','public-media',id(4)],
 ['public-media','news/thumb.jpg','public-thumbnail',id(5)]
];
function fixture({owner=true,alter=false,downloadError=false}={}){
 let services=0,downloads=0,users=0,lists=0;
 const s={storage:{from(bucket){
  return {
   list:async(prefix,{offset=0})=>{
    lists++;
    const chosen=rows.filter(r=>r[0]===bucket&&r[1].startsWith(prefix));
    const folders=[...new Set(chosen.filter(r=>r[1].slice(prefix.length).includes('/')).map(r=>r[1].slice(prefix.length).split('/')[0]))];
    const direct=chosen.filter(r=>!r[1].slice(prefix.length).includes('/')).map(r=>({
     name:r[1].slice(prefix.length),id:r[3],
     updated_at:'2026-10-24T14:00:00Z',metadata:{size:r[2].length}
    }));
    return {data:[...folders.map(name=>({name,id:null})),...direct].slice(offset,offset+100),error:null}
   },
   download:async(path)=>{
    downloads++;
    if(downloadError)return {error:'STORAGE_DENIED'};
    const item=rows.find(r=>r[0]===bucket&&r[1]===path);
    return item?{data:new Blob([alter?'DIFFERENT-ORIGINAL-DATA':item[2]]),error:null}:{data:null,error:'NOT_FOUND'}
   }
  }
 }}};
 const input={
 authorization:'Bearer LIVE_SESSION_TEST_ONLY_123456',
 getUserClient:()=>({
   auth:{getUser:async()=>{users++;return owner?{data:{user:{id:id(99)}},error:null}:{error:{message:'revoked'},data:{user:null}}}},
   rpc:async name=>{assert.equal(name,'jb_owner_list_sessions');return owner?{data:[{session_id:id(98)}],error:null}:{data:null,error:{message:'OWNER_AAL2_REQUIRED'}}}
 }),
 getServiceClient:()=>{services++;return s}
 };
 return {source:createOwnerAAL2Source(input),get stats(){return {services,downloads,users,lists}}};
}
test('T069 source adapter denies even metadata inventory before live Owner AAL2 auth',async()=>{
 const x=fixture();
 await assert.rejects(x.source.inventory(),/T069_PRIVATE_SOURCE_DENIED/);
 assert.equal(x.stats.services,0);
});
test('T069 revoked owner denied before privileged storage client exists',async()=>{
 const x=fixture({owner:false});
 assert.equal(await x.source.authorizeFounder(),false);
 await assert.rejects(x.source.inventory(),/T069_PRIVATE_SOURCE_DENIED/);
 assert.equal(x.stats.services,0);
});
test('T069 only audited Owner session RPC allows exact five 3-bucket objects and raw bytes',async()=>{
 const x=fixture();
 assert.equal(await x.source.authorizeFounder(),true);
 const all=await x.source.inventory();
 assert.equal(all.length,5);
 assert.equal(new Set(all.map(x=>x.bucket)).size,3);
 const raw=await x.source.readOriginal(all[0]);
 assert.ok(raw.length>0);
 assert.equal(x.stats.downloads,1);
});
test('T069 changed original bytes reject before any B2 write',async()=>{
 const x=fixture({alter:true});
 assert.equal(await x.source.authorizeFounder(),true);
 const all=await x.source.inventory();
 await assert.rejects(x.source.readOriginal(all[0]),/T069_PRIVATE_SOURCE_DENIED/);
});
test('T069 source download error refuses bytes without false proof',async()=>{
 const x=fixture({downloadError:true});
 assert.equal(await x.source.authorizeFounder(),true);
 const all=await x.source.inventory();
 await assert.rejects(x.source.readOriginal(all[0]),/T069_PRIVATE_SOURCE_DENIED/);
});
test('T069 source + real AGE + in-memory remote B2 full 5-object roundtrip',async()=>{
 const x=fixture();const founder=await age.generateIdentity();
 const recipient=await age.identityToRecipient(founder);
 const map=new Map();
 const result=await encryptedB2MediaRoundTrip({
  ...x.source,age,founderRecipient:recipient,
  b2:{put:async(key,val)=>{map.set(key,new Uint8Array(val))},
      get:async key=>map.get(key)},
  now:()=>new Date('2026-10-24T14:00:00Z'),uuid:()=>id(77)
 });
 assert.equal(result.objects,5);
 assert.equal(result.status,'OFFSITE_ENCRYPTED_ORIGINAL_BYTES_RESTORED');
 assert.equal(x.stats.downloads,5);
 const decryptor=new age.Decrypter();decryptor.addIdentity(founder);
 const raw=await decryptor.decrypt(map.get(result.b2_object_key));
 assert.equal(new TextDecoder().decode(raw.subarray(0,8)),'JBT06901');
});
