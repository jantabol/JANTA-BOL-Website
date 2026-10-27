// T070 G19: LOCAL FAKE DATA ONLY, real GoTrue + Storage HTTP runtime test.
// Runs on disposable GitHub Actions Docker stack, with NO production data or keys.
// Never output local service-role/anon keys or HTTP bodies (may contain tokens).
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const hold=x=>{throw Error('T070_LOCAL_RUNTIME_HOLD_'+x)};
const statusFile=process.argv[2];
if(!statusFile||process.argv.length!==3)hold('LOCAL_STATUS_FILE_REQUIRED');
const scopeVars=['SUPABASE_DB_PASSWORD','JB_B11_SERVICE_ROLE_KEY','JB_BACKUP_B2_APPLICATION_KEY',
'JB_BACKUP_AGE_RECIPIENT','JB_BACKUP_B2_KEY_ID','SUPABASE_ACCESS_TOKEN','SUPABASE_SERVICE_ROLE_KEY'];
for(const k of scopeVars)if(process.env[k])hold('PRODUCTION_CREDENTIAL_PRESENT');
if(process.env.GITHUB_REPOSITORY!=='jantabol/JANTA-BOL-Website'||
 process.env.T070_G19_LOCAL_ONLY!=='YES')hold('LOCAL_SCOPE_REQUIRED');
const raw=JSON.parse(readFileSync(statusFile,'utf8'));
const env=raw||{};
const pick=(...keys)=>keys.map(k=>env[k]??env[k.toLowerCase()]).find(x=>typeof x==='string'&&x.length);
const url=pick('API_URL','api_url');
const anon=pick('ANON_KEY','anon_key','PUBLISHABLE_KEY');
const service=pick('SERVICE_ROLE_KEY','service_role_key','SECRET_KEY');
if(!url||!anon||!service)hold('LOCAL_STATUS_MISSING');
const u=new URL(url);
if(!['127.0.0.1','localhost','::1'].includes(u.hostname)||u.protocol!=='http:')
 hold('NON_LOCAL_TARGET');
const local=url.replace(/\/$/,'');
const requester=async(path,token,{method='GET',headers={},body,timeout=7000,apiKey}={})=>{
 const reply=await fetch(local+path,{method,headers:{
  ...(token?{apikey:apiKey||token,Authorization:'Bearer '+token}:{}),...headers},
  body,signal:AbortSignal.timeout(timeout)});
 return {response:reply,body:await reply.text()};
};
const expected=(ok,code)=>{if(!ok)hold(code)};
const health=await requester('/auth/v1/health',anon);
expected(health.response.status===200,'GOTRUE_HEALTH');
const noUser=await requester('/auth/v1/user',anon);
expected([401,403].includes(noUser.response.status),'UNAUTHENTICATED_USER_WAS_NOT_DENIED');
console.log('T070_LOCAL_SYNTHETIC_GOTRUE_HEALTH=PASS');
console.log('T070_LOCAL_SYNTHETIC_AUTH_NO_USER_DENIAL=PASS');
// Create TWO brand-new LOCAL fake users and prove positive owner vs negative
// unrelated-account access. Never print passwords, session/refresh JWTs, emails or UUIDs.
const password=randomBytes(24).toString('base64url')+'A1!';
const createFake=async n=>{
 const fake='t070-g19-'+n+'-'+String(process.env.GITHUB_RUN_ID||'local')+'@example.invalid';
 const r=await requester('/auth/v1/admin/users',service,{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({email:fake,password,email_confirm:true})
 });
 expected([200,201].includes(r.response.status),'LOCAL_ADMIN_CREATE_SYNTHETIC_USER');
 let data;
 try{data=JSON.parse(r.body)}catch{hold('LOCAL_ADMIN_RESULT_NOT_JSON')}
 expected(typeof data.id==='string'&&/^[0-9a-f-]{36}$/.test(data.id),'LOCAL_ADMIN_UID_NOT_VALID');
 return {fake,id:data.id};
};
const ownerUser=await createFake('owner'), intruder=await createFake('other');
const signIn=async(email,pass)=>{
 const r=await requester('/auth/v1/token?grant_type=password',anon,{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({email,password:pass})
 });
 if(r.response.status!==200)return {ok:false};
 let d;
 try{d=JSON.parse(r.body)}catch{hold('LOCAL_SIGNIN_MALFORMED')}
 expected(typeof d.access_token==='string'&&typeof d.refresh_token==='string',
  'LOCAL_LOGIN_TOKENS_NOT_PRESENT');
 return {ok:true,jwt:d.access_token,refresh:d.refresh_token};
};
const ownerLogin=await signIn(ownerUser.fake,password);
const wrongLogin=await signIn(ownerUser.fake,password+'invalid');
const otherLogin=await signIn(intruder.fake,password);
expected(ownerLogin.ok&&otherLogin.ok,'LOCAL_SYNTHETIC_LOGIN_FAILED');
expected(!wrongLogin.ok,'LOCAL_BAD_PASSWORD_WAS_NOT_DENIED');
const me=await requester('/auth/v1/user',ownerLogin.jwt,{apiKey:anon});
expected(me.response.status===200,'LOCAL_AUTH_SIGNED_USER_NOT_ALLOWED');
let who;
try{who=JSON.parse(me.body)}catch{hold('LOCAL_USER_INFO_MALFORMED')}
expected(who.id===ownerUser.id,'LOCAL_AUTH_USER_ID_MISMATCH');
const forbiddenAdmin=await requester('/auth/v1/admin/users',ownerLogin.jwt,{apiKey:anon});
expected([401,403].includes(forbiddenAdmin.response.status),'NON_ADMIN_LIST_USERS_WAS_ALLOWED');
console.log('T070_LOCAL_SYNTHETIC_REAL_USER_LOGIN_AND_UID=PASS');
console.log('T070_LOCAL_SYNTHETIC_BAD_PASSWORD_AND_NONADMIN_NEGATIVES=PASS');
const bucket='t070-g19-private-fixture';
const key=ownerUser.id+'/synthetic-evidence-only.txt';
const bytes='T070_2026_LOCAL_FAKE_DATA_ONLY_0123456789';
const created=await requester('/storage/v1/bucket',service,{method:'POST',
 headers:{'Content-Type':'application/json'},
 body:JSON.stringify({id:bucket,name:bucket,public:false})});
expected([200,201].includes(created.response.status),'SYNTHETIC_PRIVATE_BUCKET_CREATION');
const up=await requester('/storage/v1/object/'+bucket+'/'+key,service,{
 method:'POST',headers:{'Content-Type':'text/plain','x-upsert':'false'},body:bytes});
expected([200,201].includes(up.response.status),'SYNTHETIC_OBJECT_UPLOAD');
const owner=await requester('/storage/v1/object/authenticated/'+bucket+'/'+key,service);
expected(owner.response.status===200 && owner.body===bytes,'LOCAL_OBJECT_EXISTENCE_AND_BYTE_PARITY');
const signedOwner=await requester('/storage/v1/object/authenticated/'+bucket+'/'+key,ownerLogin.jwt,{apiKey:anon});
expected(signedOwner.response.status===200&&signedOwner.body===bytes,'SIGNED_OWNER_STORAGE_READ_DENIED');
const signedOther=await requester('/storage/v1/object/authenticated/'+bucket+'/'+key,otherLogin.jwt,{apiKey:anon});
expected(signedOther.response.status!==200&&signedOther.body!==bytes,'NONOWNER_PRIVATE_OBJECT_LEAKED');
const naked=await requester('/storage/v1/object/authenticated/'+bucket+'/'+key,anon);
expected(naked.response.status!==200 && naked.body!==bytes,
 'ANON_PRIVATE_OBJECT_CONTENT_LEAKED');
const pub=await requester('/storage/v1/object/public/'+bucket+'/'+key,anon);
expected(pub.response.status!==200&&pub.body!==bytes,'PRIVATE_BUCKET_PUBLIC_URL_EXPOSED');
console.log('T070_LOCAL_SYNTHETIC_STORAGE_OWNER_OBJECT_BYTES=PASS');
console.log('T070_LOCAL_SYNTHETIC_PRIVATE_STORAGE_ANON_NEGATIVE=PASS');
console.log('T070_LOCAL_SYNTHETIC_PRIVATE_BUCKET_PUBLIC_ENDPOINT_NEGATIVE=PASS');
console.log('T070_LOCAL_SYNTHETIC_OWNER_POSITIVE_AND_NONOWNER_DENIAL=PASS');
const logout=await requester('/auth/v1/logout',ownerLogin.jwt,{apiKey:anon,method:'POST'});
expected([200,204].includes(logout.response.status),'LOCAL_AUTH_LOGOUT_ERROR');
const revoked=await requester('/auth/v1/token?grant_type=refresh_token',anon,{
 method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({refresh_token:ownerLogin.refresh})
});
expected([400,401,403,422].includes(revoked.response.status),'REVOKED_REFRESH_TOKEN_WORKED');
console.log('T070_LOCAL_SYNTHETIC_LOGOUT_REFRESH_TOKEN_REVOKED=PASS');
console.log('T070_PRODUCTION_DATA_TESTED_IN_THIS_JOB=false');
console.log('T070_LIVE_AUTH_MFA_EDGE_VERCEL_CONFIG_RECONSTRUCTED=false');
console.log('T070_ORIGINAL_AUTH_USER_SESSIONS_RESTORED=false');
console.log('T070_G19_FINAL_E8=HOLD');
console.log('T070_FINAL_LOCK=HOLD');
