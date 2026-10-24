// Signed HTTP actors against disposable GitHub Actions PostgREST and PG17 ONLY.
// This cannot prove an independent hosted Vercel Preview staging Supabase exists.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base='http://127.0.0.1:3000';
const key=process.env.JB_T065_DISPOSABLE_JWT_SECRET;
assert.ok(key && key.length >= 32,'Missing disposable JWT signing secret');
assert.equal(process.env.PGDATABASE,'jb_b10_disposable','refuse tests against non-disposable DB');
const uid={
 A:'22222222-2222-2222-2222-222222222222',
 B:'44444444-4444-4444-8444-444444444444',
 Editor:'33333333-3333-3333-3333-333333333333',
 Owner:'11111111-1111-1111-1111-111111111111'
};
const sid={
 A:'20000000-0000-4000-8000-000000000063',
 B:'40000000-0000-4000-8000-000000000065',
 Editor:'30000000-0000-4000-8000-000000000065',
 Owner:'10000000-0000-4000-8000-000000000063',
 Wrong:'90000000-0000-4000-8000-000000000065'
};
const article={
 A:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
 B:'88888888-8888-4888-8888-888888888888',
 Owner:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
 Public:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
};
function signedJWT(sub,session_id,additional={},secret=key){
 const h={alg:'HS256',typ:'JWT'};
 const p={aud:'authenticated',role:'authenticated',sub,session_id,aal:'aal1',
   iss:'jb-t065-disposable-ci-only',iat:Math.floor(Date.now()/1000),
   exp:Math.floor(Date.now()/1000)+600,...additional};
 const a=[h,p].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const signature=crypto.createHmac('sha256',secret).update(a).digest('base64url');
 return a+'.'+signature;
}
const tokens={
 A:signedJWT(uid.A,sid.A),
 B:signedJWT(uid.B,sid.B),
 AStale:signedJWT(uid.A,sid.Wrong),
 AStolenBSession:signedJWT(uid.A,sid.B),
 AFakeOwner:signedJWT(uid.A,sid.A,{user_metadata:{role:'owner'},app_metadata:{role:'owner'},aal:'aal2'}),
 BStale:signedJWT(uid.B,sid.Wrong),
 Editor:signedJWT(uid.Editor,sid.Editor),
 EditorStale:signedJWT(uid.Editor,sid.Wrong),
 InvalidSignature:signedJWT(uid.Owner,sid.Owner,{aal:'aal2'},'wrong-signature-only-not-a-secret')
};
let n=0;
async function query(path,token,method='GET',body){
 const res=await fetch(base+path,{
  method,redirect:'manual',signal:AbortSignal.timeout(10000),
  headers:{accept:'application/json',...(token?{authorization:'Bearer '+token}:{}),
   ...(body?{'content-type':'application/json','prefer':'return=representation'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const raw=await res.text();
 assert.ok(raw.length<20000,'Unexpected oversized response');
 return {status:res.status,data:raw?JSON.parse(raw):null};
}
async function visible(id,token,expected,label){
 const r=await query('/articles?id=eq.'+id+'&select=id,status',token);
 if(r.status!==200)console.error('DISPOSABLE_SIGNED_HTTP_ERROR',label,r.status,r.data?.code, r.data?.message);
 assert.equal(r.status,200,label+' HTTP status');
 assert.ok(Array.isArray(r.data),label+' HTTP payload');
 assert.equal(r.data.length,expected,label+' RLS result count');
 console.log('PASS T065 signed HTTPS-style local HTTP: '+label);
 n++;
}
async function deniedRPC(token,label){
 const r=await query('/article_versions?select=article_id,article_version',token);
 assert.equal(r.status,200,label+' HTTP status');
 assert.deepEqual(r.data,[],label+' private versions visible');
 console.log('PASS T065 signed wire: '+label);
 n++;
}
await visible(article.A,null,0,'anonymous denied Reporter A draft');
await visible(article.B,null,0,'anonymous denied Reporter B draft');
await visible(article.Public,null,1,'anonymous published remains visible');
await visible(article.A,tokens.A,1,'Reporter A reads own draft');
await visible(article.B,tokens.A,0,'Reporter A cannot read Reporter B private draft');
await visible(article.Owner,tokens.A,0,'Reporter A cannot read Owner unpublished story');
await visible(article.B,tokens.B,1,'Reporter B reads own draft');
await visible(article.A,tokens.B,0,'Reporter B cannot read Reporter A private draft');
await visible(article.Owner,tokens.B,0,'Reporter B cannot read Owner unpublished story');
await visible(article.B,tokens.AStale,0,'revoked/missing-session A cannot read own private draft');
await visible(article.A,tokens.BStale,0,'revoked/missing-session B cannot read A draft');
await visible(article.A,tokens.AStolenBSession,0,'user A with B session mismatch denied');
await visible(article.Owner,tokens.AFakeOwner,0,'Reporter forge user/app metadata and aal2 denied');
await deniedRPC(tokens.A,'Reporter A cannot see private article versions');
await deniedRPC(tokens.B,'Reporter B cannot see private article versions');
const forged=await query('/articles?select=id&limit=1',tokens.InvalidSignature);
assert.equal(forged.status,401,'invalid JWT signature must be 401');
console.log('PASS T065 signed wire: untrusted JWT signature rejected');n++;
const anonWrite=await query('/articles?id=eq.'+article.Public+'&select=id,excerpt',undefined,'PATCH',{excerpt:'DONT_ALLOW'});
assert.ok([401,403].includes(anonWrite.status),'anon mutation must be rejected');n++;
console.log('PASS T065 signed wire: anon cannot mutate public Articles');
const staleWrite=await query('/articles?id=eq.'+article.Public+'&select=id,excerpt',tokens.EditorStale,'PATCH',{excerpt:'DONT_ALLOW'});
assert.ok([200,204].includes(staleWrite.status),'stale Editor update expected filtered out by RLS');
assert.ok(staleWrite.data===null||(Array.isArray(staleWrite.data)&&staleWrite.data.length===0),'stale Editor changed Article');
console.log('PASS T065 signed wire: revoked Editor direct PATCH returned 0 rows');n++;
const validEditor=await query('/articles?id=eq.'+article.Public+'&select=id,excerpt',tokens.Editor,'PATCH',{excerpt:'T065_CI_DISPOSABLE_EDITOR_EDIT'});
assert.equal(validEditor.status,200,'valid Editor PATCH failed');
assert.equal(validEditor.data?.length,1,'valid Editor expected 1 updated row');
assert.equal(validEditor.data[0].excerpt,'T065_CI_DISPOSABLE_EDITOR_EDIT','positive Editor edit incorrect');
console.log('PASS T065 signed wire: valid active Editor PATCH succeeds only in disposable fixture');n++;
console.log('T064/T065 disposable signed JWT real HTTP RLS '+n+'/'+n+' PASS. No live account, live token, paid staging or production mutations.');
