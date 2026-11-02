// B13/T088: NO production secrets or customer records. Ephemeral local Supabase
// Auth + PostgREST + Private Storage integration with two FAKE test identities.
// Never print JWTs/keys, emails, file paths, user ids, HTTP bodies or PII.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes,randomUUID} from 'node:crypto';
const cfg=JSON.parse(readFileSync(process.argv[2],'utf8'));
const base=cfg.API_URL||cfg.api_url||'http://127.0.0.1:54321';
const anon=cfg.ANON_KEY||cfg.anon_key;
const service=cfg.SERVICE_ROLE_KEY||cfg.service_role_key;
assert.ok(base==='http://127.0.0.1:54321' || base==='http://localhost:54321','T088_LOCAL_API_NOT_LOOPBACK');
assert.match(String(anon||''),/^eyJ/,'T088_LOCAL_ANON_KEY_MISSING');
assert.match(String(service||''),/^eyJ/,'T088_LOCAL_SERVICE_ROLE_MISSING');
assert.equal(process.env.SUPABASE_SERVICE_ROLE_KEY,undefined,'T088_LIVE_CRED_PRESENT');

const fakePass=()=>randomBytes(20).toString('hex')+'Z@6';
const headers=(key,token=key)=>({apikey:key,authorization:'Bearer '+token});
async function raw(path,opts={}){
 const res=await fetch(base+path,{redirect:'error',signal:AbortSignal.timeout(15000),...opts});
 return res;
}
async function json(path,options,valid){
 const r=await raw(path,options);
 assert.ok(valid.includes(r.status),'T088_LOCAL_HTTP_STATUS:'+path.split('?')[0]+':'+r.status);
 return await r.json();
}
const health=await raw('/auth/v1/health',{headers:{apikey:anon}});
assert.equal(health.status,200,'T088_LOCAL_REAL_GOTRUE_HEALTH');
const users=[];
for(const i of [0,1]){
 const email='t088-fake-'+randomUUID()+'@example.invalid';
 const password=fakePass();
 const created=await json('/auth/v1/admin/users',{
   method:'POST',headers:{...headers(service),'content-type':'application/json'},
   body:JSON.stringify({email,password,email_confirm:true})
 },[200,201]);
 assert.match(String(created.id||''),/^[0-9a-f-]{36}$/i,'T088_LOCAL_AUTH_ADMIN_CREATE');
 const token=await json('/auth/v1/token?grant_type=password',{
   method:'POST',headers:{...headers(anon),'content-type':'application/json'},
   body:JSON.stringify({email,password})
 },[200]);
 assert.ok(String(token.access_token||'').startsWith('eyJ'),'T088_LOCAL_REAL_SIGNIN_JWT');
 assert.equal(token.user?.id,created.id,'T088_LOCAL_AUTH_ID_PARITY');
 users.push({id:created.id,token:token.access_token});
}
// Actual local PostgREST RLS with real signed user JWTs, including positive control
// proving a FALSE negative isn't caused by a universally broken API.
const rowId=randomUUID();
const createdRow=await raw('/rest/v1/t088_recovery_fixture',{
 method:'POST',headers:{...headers(anon,users[0].token),'content-type':'application/json','prefer':'return=minimal'},
 body:JSON.stringify({id:rowId,owner_uid:users[0].id,content:'only fake local test content'})
});
assert.equal(createdRow.status,201,'T088_LOCAL_REAL_SIGNED_RLS_INSERT');
for(const [idx,actor] of users.entries()){
 const r=await json('/rest/v1/t088_recovery_fixture?select=id%2Cowner_uid',{
   headers:headers(anon,actor.token)
 },[200]);
 assert.equal(r.length,idx===0?1:0,'T088_LOCAL_CROSS_USER_POSTGREST_RLS_DENIAL');
 if(idx===0)assert.equal(r[0].id,rowId,'T088_LOCAL_POSTGREST_PRESERVED_ID');
}
const guest=await json('/rest/v1/t088_recovery_fixture?select=id',{
 headers:headers(anon)
},[200]);
assert.equal(guest.length,0,'T088_LOCAL_ANON_POSTGREST_RLS_DENIAL');
// Local Storage genuinely persists fake bytes behind user-scoped RLS.
await json('/storage/v1/bucket',{
 method:'POST',
 headers:{...headers(service),'content-type':'application/json'},
 body:JSON.stringify({id:'t088-private',name:'t088-private',public:false})
},[200,201]);
const filePath=users[0].id+'/synthetic-test.txt';
const original='T088_FAKE_PRIVATE_MEDIA_'+randomUUID();
const uploaded=await raw('/storage/v1/object/t088-private/'+filePath,{
 method:'POST',
 headers:{...headers(anon,users[0].token),'content-type':'text/plain'},
 body:original
});
assert.ok([200,201].includes(uploaded.status),'T088_LOCAL_REAL_PRIVATE_STORAGE_UPLOAD='+uploaded.status);
const own=await raw('/storage/v1/object/authenticated/t088-private/'+filePath,{
 headers:headers(anon,users[0].token)
});
assert.equal(own.status,200,'T088_LOCAL_REAL_STORAGE_OWNER_READ');
assert.equal(await own.text(),original,'T088_LOCAL_STORAGE_ORIGINAL_BYTES_DRIFT');
const other=await raw('/storage/v1/object/authenticated/t088-private/'+filePath,{
 headers:headers(anon,users[1].token)
});
assert.notEqual(other.status,200,'T088_LOCAL_PRIVATE_STORAGE_CROSS_USER_LEAK');
const anonymous=await raw('/storage/v1/object/authenticated/t088-private/'+filePath,{
 headers:headers(anon)
});
assert.notEqual(anonymous.status,200,'T088_LOCAL_PRIVATE_STORAGE_ANON_LEAK');
console.log('T088_LOCAL_REAL_FAKE_GOTRUE_SIGNIN=PASS_2_USERS');
console.log('T088_LOCAL_REAL_SIGNED_POSTGREST_RLS=PASS_OWNER_1_CROSS_0_ANON_0');
console.log('T088_LOCAL_REAL_STORAGE_ORIGINAL_BYTES=PASS_FAKE');
console.log('T088_LOCAL_REAL_PRIVATE_MEDIA_USER_CROSS_DENIAL=PASS');
console.log('T088_PRODUCTION_GO_TRUE_USERS_RESTORED=NO');
