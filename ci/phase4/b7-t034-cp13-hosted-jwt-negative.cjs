'use strict';
// P4-T034 CP13: LIVE external JWT authenticity-only NEGATIVES.
// No production logins, signups, MFA actions, mutations, RPC or real JWTs.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const cfg=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const base=cfg.match(/\burl:\s*'([^']+)'/)?.[1];
const key=cfg.match(/\bpublishableKey:\s*'([^']+)'/)?.[1];
assert.equal(base,'https://vrffsnkycvjithwtiylt.supabase.co','PROJECT_BOUNDARY_FAILURE');
assert.ok(key?.startsWith('sb_publishable_'),'PUBLIC_KEY_EXPECTED');
for(const k of ['SUPABASE_ACCESS_TOKEN','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_DB_PASSWORD','JB_BACKUP_B2_APPLICATION_KEY'])
 assert.equal(process.env[k],undefined,'FORBIDDEN_PRIVILEGED_ENV_'+k);
const now=Math.floor(Date.now()/1000),localKey=crypto.randomBytes(32);
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function jwt(payload,alg='HS256'){
 const h=b64({typ:'JWT',alg}),p=b64(payload);
 return h+'.'+p+'.'+crypto.createHmac('sha256',localKey).update(h+'.'+p).digest('base64url');
}
const fakeUuid='11111111-1111-4111-8111-111111111111',session='a1111111-1111-4111-8111-111111111112';
const tokens={
 'FORGED_OWNER_AAL2':jwt({sub:fakeUuid,role:'authenticated',aud:'authenticated',aal:'aal2',session_id:session,iat:now,exp:now+300}),
 'FORGED_OWNER_APP_METADATA':jwt({sub:fakeUuid,role:'authenticated',aud:'authenticated',aal:'aal2',
  app_metadata:{role:'owner'},session_id:session,iat:now,exp:now+300}),
 'FORGED_EXPIRED_OWNER':jwt({sub:fakeUuid,role:'authenticated',aud:'authenticated',aal:'aal2',session_id:session,iat:now-1000,exp:now-900})
};
// URL whitelist: only read paths. Do not call stored procedures, mutation paths or real user IDs.
const checks=[
 ['POSTGREST_FORGED_OWNER_AAL2','/rest/v1/ad_campaigns?select=id&limit=1',tokens.FORGED_OWNER_AAL2],
 ['POSTGREST_FORGED_APP_METADATA','/rest/v1/advertisers?select=id&limit=1',tokens.FORGED_OWNER_APP_METADATA],
 ['POSTGREST_FORGED_EXPIRED','/rest/v1/ad_campaigns?select=id&limit=1',tokens.FORGED_EXPIRED_OWNER],
 ['GOTRUE_FORGED_OWNER_AAL2','/auth/v1/user',tokens.FORGED_OWNER_AAL2]
];
(async()=>{
 let count=0;
 for(const [label,path,token] of checks){
   const target=new URL(path,base);assert.equal(target.origin,base);
   const r=await fetch(target,{method:'GET',headers:{
    apikey:key,Authorization:'Bearer '+token,Accept:'application/json',
    'Cache-Control':'no-store'
   },redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
   // Never print response bodies, Auth JWTs or private rows.
   const raw=await r.text();let obj=null;try{obj=JSON.parse(raw)}catch{}
   const code=String(obj?.code||obj?.error_code||obj?.error||'none');
   if(r.status!==401){
    console.error('CP13 FORGED_JWT_GATE_FAIL '+label+' http='+r.status+' code='+code);
    process.exitCode=1;
   }else{
    console.log('PASS CP13 HOSTED '+label+' HTTP=401 authenticated=NO');
    count++;
   }
 }
 assert.equal(count,checks.length,'FORGED_TOKENS_REJECTED');
 console.log('PASS CP13 HOSTED JWTS SIGNATURE NEGATIVES=4/4');
 console.log('ALL_METHODS_GET_ONLY; NO_REAL_JWT; NO_USER_LOGIN; NO_LIVE_WRITES');
 console.log('HOSTED_GENUINE_PRINCIPAL_E5=HOLD; T034_FINAL_LOCK=HOLD');
})().catch(e=>{console.error('FAIL CP13 LIVE FORGED JWT CHECK: '+e.message);process.exitCode=1;});
