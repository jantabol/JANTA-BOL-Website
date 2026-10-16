'use strict';
// T034 E5: local PostgREST verifies real HMAC-signed JWTs on HTTP requests.
// Tokens are minted by a CI-only synthetic issuer, NOT GoTrue/Supabase Auth.
// No production endpoint, secret, data, Auth account, or live payment is used.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const mode=process.argv[2];
if(!['negative','positive'].includes(mode)) throw Error('Expected negative or positive fixture-only test');
const key=process.env.B7_E5_LOCAL_JWT_SECRET;
if(!key||key.length<32)throw Error('Missing LOCAL generated signing key');
const base='http://127.0.0.1:3099';
const IDs={
 owner:'11111111-1111-4111-8111-111111111111',
 reporter:'22222222-2222-4222-8222-222222222222',
 editor:'33333333-3333-4333-8333-333333333333',
 advertiser:'44444444-4444-4444-8444-444444444444',
 ownerAal1:'a1111111-1111-4111-8111-111111111111',
 ownerAal2:'a1111111-1111-4111-8111-111111111112',
 ownerRevoked:'a1111111-1111-4111-8111-111111111113',
 reporterSession:'a2222222-2222-4222-8222-222222222222',
 editorSession:'a3333333-3333-4333-8333-333333333333',
 advertiserSession:'a4444444-4444-4444-8444-444444444444',
 highUnverified:'20000000-0000-4000-8000-000000000001',
 normalUnverified:'10000000-0000-4000-8000-000000000002',
 normalCampaign:'20000000-0000-4000-8000-000000000002',
 normalVerified:'20000000-0000-4000-8000-000000000003'
};
const b64=(s)=>Buffer.from(JSON.stringify(s)).toString('base64url');
function sign(user,session,aal='aal1',extras={}){
 const now=Math.floor(Date.now()/1000);
 const body={aud:'authenticated',role:'authenticated',sub:user,session_id:session,
  aal,iat:now,exp:now+180,...extras};
 const msg=b64({alg:'HS256',typ:'JWT'})+'.'+b64(body);
 const sig=crypto.createHmac('sha256',key).update(msg).digest('base64url');
 return msg+'.'+sig;
}
const actors={
 reporter:sign(IDs.reporter,IDs.reporterSession),
 editor:sign(IDs.editor,IDs.editorSession),
 advertiser:sign(IDs.advertiser,IDs.advertiserSession),
 ownerAal1:sign(IDs.owner,IDs.ownerAal1,'aal1'),
 ownerAal2:sign(IDs.owner,IDs.ownerAal2,'aal2'),
 ownerRevoked:sign(IDs.owner,IDs.ownerRevoked,'aal2'),
 reporterForgedMeta:sign(IDs.reporter,IDs.reporterSession,'aal2',{app_role:'owner'})
};
const payment={p_campaign:IDs.normalCampaign,p_provider_ref:'E5-LOCAL-ONLY-NEVER-PRODUCTION',p_amount_minor:1000};
const highPayment={...payment,p_campaign:IDs.highUnverified};
const verification={p_advertiser:IDs.normalUnverified,p_state:'verified',
 p_note:'E5 LOCAL ONLY safe synthetic verification',p_evidence_ref:null};
const endpoint=(p)=>base+p;
async function api(method,path,token,body){
 let resp;
 try{resp=await fetch(endpoint(path),{method,
 headers:{...(token?{Authorization:'Bearer '+token}:{}),
  ...(body?{'Content-Type':'application/json'}:{})},
 body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(5000)});}
 catch(e){throw Error('E5 localhost HTTP request failed ('+method+' '+path+'): '+e.message);}
 let value;
 const txt=await resp.text();
 try{value=txt?JSON.parse(txt):null}catch{value=txt;}
 return {status:resp.status,data:value};
}
let count=0;
function denied(r,name,exactError){
 assert.ok(r.status>=400&&r.status<500,name+' unexpected HTTP '+r.status);
 if(exactError)assert.equal(r.data?.message,exactError,name+' wrong denied reason');
 count++;
}
async function deniedRpc(name,token,path,payload,exactError){
 const r=await api('POST',path,token,payload);denied(r,name,exactError);
}
async function noRows(name,token){
 const r=await api('GET','/ad_campaigns?select=id%2Cstatus',token);
 assert.equal(r.status,200,name+' GET status '+r.status);
 assert.deepEqual(r.data,[],name+' must see zero private campaign rows');
 count++;
}
async function negative(){
 const unauthorized=await api('GET','/ad_campaigns?select=id',null);
 denied(unauthorized,'anonymous private campaign GET');
 await deniedRpc('anonymous finance',null,'/rpc/jb_ad_confirm_payment_internal',payment);
 await deniedRpc('anonymous verification',null,'/rpc/jb_ad_verify_advertiser_internal',verification);
 for(const [name,token] of Object.entries({
  reporter:actors.reporter,advertiser:actors.advertiser,
  ownerAal1:actors.ownerAal1,ownerRevoked:actors.ownerRevoked,
  reporterForgedMeta:actors.reporterForgedMeta
 })){
   await noRows(name,token);
   await deniedRpc(name+' cannot confirm',token,
    '/rpc/jb_ad_confirm_payment_internal',payment,'OWNER_AAL2_REQUIRED');
   await deniedRpc(name+' cannot verify',token,
    '/rpc/jb_ad_verify_advertiser_internal',verification,'OWNER_AAL2_REQUIRED');
 }
 await deniedRpc('editor cannot confirm',actors.editor,'/rpc/jb_ad_confirm_payment_internal',
  payment,'OWNER_AAL2_REQUIRED');
 await deniedRpc('editor cannot verify',actors.editor,'/rpc/jb_ad_verify_advertiser_internal',
  verification,'OWNER_AAL2_REQUIRED');
 const pieces=actors.reporter.split('.');
 pieces[2]=(pieces[2][0]==='A'?'B':'A')+pieces[2].slice(1);
 const tampered=pieces.join('.');
 denied(await api('GET','/ad_campaigns?select=id',tampered),'tampered JWT signature');
 // PostgREST v12 accepts up to 30s clock skew; -30 is boundary-flaky.
 const expired=sign(IDs.owner,IDs.ownerAal2,'aal2',{exp:Math.floor(Date.now()/1000)-120});
 denied(await api('GET','/ad_campaigns?select=id',expired),'expired signed JWT');
 for(const [name,tok] of Object.entries({reporter:actors.reporter,ownerAal1:actors.ownerAal1,ownerRevoked:actors.ownerRevoked})){
  denied(await api('PATCH','/ad_campaigns?id=eq.'+IDs.highUnverified,tok,
   {status:'paid'}),name+' cannot bypass direct UPDATE');
 }
 const high=await api('POST','/rpc/jb_ad_confirm_payment_internal',actors.ownerAal2,highPayment);
 denied(high,'Owner AAL2 cannot pay high pending','B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT');
 const ownerRows=await api('GET','/ad_campaigns?select=id%2Cstatus',actors.ownerAal2);
 assert.equal(ownerRows.status,200,'Owner AAL2 SELECT allowed');
 assert.equal(ownerRows.data.length,4,'Owner AAL2 must view existing synthetic rows');
 count++;
 console.log('PASS T034 E5 LOCAL VERIFIED-JWT HTTP negative matrix cases='+count);
 console.log('BOUNDARY: fixture JWTs, not Supabase Auth-issued; no production E5 pass');
}
async function positive(){
 const verified=await api('POST','/rpc/jb_ad_verify_advertiser_internal',actors.ownerAal2,verification);
 assert.ok([200,204].includes(verified.status),'Owner AAL2 synthetic verification failed HTTP '+verified.status+
 ' code='+String(verified.data?.code||''));
 count++;
 const paid=await api('POST','/rpc/jb_ad_confirm_payment_internal',actors.ownerAal2,payment);
 assert.ok([200,201].includes(paid.status),'Owner AAL2 synthetic payment positive failed HTTP '+paid.status+
 ' code='+String(paid.data?.code||''));
 assert.match(String(paid.data),/^[0-9a-f-]{36}$/i,'expected receipt UUID');
 count++;
 const rows=await api('GET','/ad_campaigns?select=id%2Cstatus&id=eq.'+IDs.normalCampaign,actors.ownerAal2);
 assert.equal(rows.status,200);
 assert.equal(rows.data?.length,1);
 assert.equal(rows.data[0].status,'paid');
 count++;
 console.log('PASS T034 E5 LOCAL verified Owner AAL2 synthetic verify+paid HTTP positive cases='+count);
 console.log('CAUTION: these are only disposable fixture rows, not real advertisements/payment');
}
(mode==='negative'?negative():positive()).catch(e=>{console.error('FAIL E5 LOCAL '+mode+': '+e.message);process.exitCode=1;});
