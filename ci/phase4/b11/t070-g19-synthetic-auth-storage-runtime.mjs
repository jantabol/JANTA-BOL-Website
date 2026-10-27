// T070 G19: LOCAL FAKE DATA ONLY, real GoTrue + Storage HTTP runtime test.
// Runs on disposable GitHub Actions Docker stack, with NO production data or keys.
// Never output local service-role/anon keys or HTTP bodies (may contain tokens).
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
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
const requester=async(path,token,{method='GET',headers={},body,timeout=7000}={})=>{
 const reply=await fetch(local+path,{method,headers:{
  ...(token?{apikey:token,Authorization:'Bearer '+token}:{}),...headers},
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
const bucket='t070-g19-private-fixture';
const key='synthetic-evidence-only.txt';
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
const naked=await requester('/storage/v1/object/authenticated/'+bucket+'/'+key,anon);
expected(naked.response.status!==200 && naked.body!==bytes,
 'ANON_PRIVATE_OBJECT_CONTENT_LEAKED');
const pub=await requester('/storage/v1/object/public/'+bucket+'/'+key,anon);
expected(pub.response.status!==200&&pub.body!==bytes,'PRIVATE_BUCKET_PUBLIC_URL_EXPOSED');
console.log('T070_LOCAL_SYNTHETIC_STORAGE_OWNER_OBJECT_BYTES=PASS');
console.log('T070_LOCAL_SYNTHETIC_PRIVATE_STORAGE_ANON_NEGATIVE=PASS');
console.log('T070_LOCAL_SYNTHETIC_PRIVATE_BUCKET_PUBLIC_ENDPOINT_NEGATIVE=PASS');
console.log('T070_PRODUCTION_DATA_TESTED_IN_THIS_JOB=false');
console.log('T070_LIVE_AUTH_MFA_EDGE_VERCEL_CONFIG_RECONSTRUCTED=false');
console.log('T070_G19_FINAL_E8=HOLD');
console.log('T070_FINAL_LOCK=HOLD');
