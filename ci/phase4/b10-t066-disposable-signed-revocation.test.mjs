// P4-T066 synthetic signed HTTP revocation and isolation regression, PG17 ONLY.
// RED: prove legacy advertiser JWT can read after matching session disappears.
// GREEN: repair and verify denial + active positive + cross-owner/suspension.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const key=process.env.JB_T066_DISPOSABLE_JWT_SECRET;
const phase=process.argv[2];
assert.ok(['red','green'].includes(phase),'expected red/green');
assert.equal(process.env.PGDATABASE,'jb_b10_disposable','never target LIVE');
assert.ok(key&&key.length>=32,'isolated signing secret absent');
const uid={A:'55555555-5555-4555-8555-555555555555',
 B:'66666666-6666-4666-8666-666666666666',
 Suspended:'77777777-7777-4777-8777-777777777777',
 Owner:'11111111-1111-1111-1111-111111111111'};
const sid={ARevoked:'55000000-0000-4000-8000-000000000067',
 B:'66000000-0000-4000-8000-000000000067',
 Suspended:'77000000-0000-4000-8000-000000000067',
 Owner:'10000000-0000-4000-8000-000000000063'};
const ad={A:'55000000-0000-4000-8000-000000000065',
 B:'66000000-0000-4000-8000-000000000065'};
const now=Math.floor(Date.now()/1000);
function jwt(sub,session_id,extra={},secret=key){
 const hdr={alg:'HS256',typ:'JWT'};
 const payload={aud:'authenticated',role:'authenticated',sub,session_id,
  aal:'aal1',iat:now,exp:now+600,iss:'JB_T066_THROWAWAY_PG17',...extra};
 const p=[hdr,payload].map(o=>Buffer.from(JSON.stringify(o)).toString('base64url')).join('.');
 return p+'.'+crypto.createHmac('sha256',secret).update(p).digest('base64url');
}
const t={
 A:jwt(uid.A,sid.ARevoked),
 B:jwt(uid.B,sid.B),
 ABorrowB:jwt(uid.A,sid.B),
 AClaimOwner:jwt(uid.A,sid.ARevoked,{app_metadata:{role:'owner'},user_metadata:{role:'owner'},aal:'aal2'}),
 Owner:jwt(uid.Owner,sid.Owner,{aal:'aal2'}),
 Suspended:jwt(uid.Suspended,sid.Suspended,{app_metadata:{role:'owner'},aal:'aal2'}),
 Invalid:jwt(uid.Owner,sid.Owner,{aal:'aal2'},'invalid-hmac'),
};
let count=0;
async function request(path,token){
 const res=await fetch('http://127.0.0.1:3000'+path,{redirect:'manual',
  signal:AbortSignal.timeout(10000),headers:{accept:'application/json',...(token?{authorization:'Bearer '+token}:{})}});
 const raw=await res.text();
 assert.ok(raw.length<20000,'unexpectedly large result');
 return {status:res.status,body:raw?JSON.parse(raw):null};
}
async function rows(token,expectedId,label){
 const r=await request('/rpc/jb_ad_my_campaigns',token);
 assert.equal(r.status,200,label+' status '+r.status);
 assert.ok(Array.isArray(r.body),label+' non-array');
 assert.deepEqual(r.body.map(x=>x.id),expectedId?[expectedId]:[],label);
 console.log('PASS T066 '+phase+': '+label);
 count++;
}
async function state(token,expect,label){
 const r=await request('/rpc/jb_t066_ci_actor_state',token);
 assert.equal(r.status,200,label+' status');
 for(const [k,v] of Object.entries(expect))assert.equal(r.body?.[k],v,label+' '+k);
 console.log('PASS T066 '+phase+': '+label);count++;
}
if(phase==='red'){
 await state(t.A,{active_session:false,owner_aal2:false},'revoked advertiser backend session missing');
 await rows(t.A,ad.A,'EXPECTED RED original function exposed campaign after revocation');
 await rows(t.B,ad.B,'legitimate active advertiser remains readable');
 console.log('T066 RED evidence: legacy signed JWT read confirmed ONLY on disposable PG17.');
}else{
 await rows(t.A,null,'revoked advertiser JWT cannot read own campaign');
 await rows(t.B,ad.B,'active advertiser B reads ONLY own campaign');
 await rows(t.ABorrowB,null,'advertiser A cannot borrow B session_id');
 await rows(t.AClaimOwner,null,'revoked advertiser metadata/aal claim no promotion');
 await rows(t.Owner,null,'Owner has no advertiser linkage; never cross-account');
 await state(t.Owner,{owner_aal2:true,active_session:true,app_role:'owner'},'real synthetic Owner AAL2 current session');
 await state(t.Suspended,{owner_aal2:null,active_session:true,app_role:null},'suspended Reporter loses backend application role despite Owner claim');
 await state(t.AClaimOwner,{owner_aal2:false,active_session:false,app_role:null},'revoked advertiser cannot become Founder via JWT metadata');
 const anon=await request('/rpc/jb_ad_my_campaigns');
 assert.ok([401,403].includes(anon.status),'anonymous advertiser API must be denied');count++;
 const fake=await request('/rpc/jb_ad_my_campaigns',t.Invalid);
 assert.equal(fake.status,401,'invalid signature must be rejected');count++;
 const p=await request('/rpc/jb_b9_search?p_id=dddddddd-dddd-4ddd-8ddd-dddddddddddd',t.Suspended);
 assert.equal(p.status,200,'suspended account public search must remain public-safe');
 assert.deepEqual(p.body?.items,[],'private draft leaked through public search');count++;
 const published=await request('/rpc/jb_b9_search?p_limit=3');
 assert.equal(published.status,200,'public search not available');
 assert.equal(published.body?.items?.length,3,'published articles regressed');count++;
 console.log('T066 GREEN isolated signed HTTP '+count+'/'+count+' PASS; hosted authenticated E5 and LIVE deployment NOT asserted.');
}
