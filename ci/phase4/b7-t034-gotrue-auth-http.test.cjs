'use strict';
// P4-T034 isolated local Supabase Auth GoTrue issued JWT + real MFA TOTP.
// No hosted project, no user passwords/tokens/OTP/PII to logs.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const fs=require('node:fs');

const status=cp.execFileSync('supabase',['status','-o','env'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const vars=Object.fromEntries(status.split(/\r?\n/).map(line=>{
 const at=line.indexOf('=');if(at<0)return [];
 return [line.slice(0,at).trim(),line.slice(at+1).trim().replace(/^["']|["']$/g,'')];
}).filter(x=>x.length===2));
const base=vars.API_URL||'http://127.0.0.1:54321';
const publicKey=vars.ANON_KEY||vars.SUPABASE_ANON_KEY;
if(!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(base)||!publicKey)throw Error('LOCAL_ONLY_API_URL_OR_KEY_INVALID');
const password=crypto.randomBytes(25).toString('hex')+'Aa!';
const uuid=v=>{assert.match(v,/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);return v;};
const id={high:'20000000-0000-4000-8000-000000000001',
 normal:'20000000-0000-4000-8000-000000000002',
 normalAdvertiser:'10000000-0000-4000-8000-000000000002'};
const b64UrlDecode=s=>JSON.parse(Buffer.from(s.split('.')[1],'base64url').toString('utf8'));
function sql(query){
 let r=cp.spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-q','-t','-A','-c',query],{
  encoding:'utf8',env:{...process.env,PGHOST:'127.0.0.1',PGPORT:'54322',
    PGUSER:'postgres',PGPASSWORD:'postgres',PGDATABASE:'postgres'},timeout:10000});
 if(r.status!==0)throw Error('local SQL check failed: '+(r.stderr||'').slice(0,300));
 return r.stdout.trim();
}
async function api(method,path,token,body){
 const r=await fetch(base+path,{method,headers:{
 'apikey':publicKey,
 ...(token?{Authorization:'Bearer '+token}:{}),
 ...(body?{'Content-Type':'application/json'}:{})
 },body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(9000)});
 const raw=await r.text();let out;
 try{out=raw?JSON.parse(raw):null;}catch{out=raw;}
 return {status:r.status,data:out};
}
function ok(r,context){
 if(r.status<200||r.status>=300)
  throw Error(context+' HTTP '+r.status+' code='+String(r.data?.code||r.data?.error_code||r.data?.error||'unknown'));
 return r.data;
}
function deny(r,context,reason){
 assert.ok(r.status>=400&&r.status<500,context+' expected denial status, got '+r.status);
 if(reason)assert.equal(r.data?.message,reason,context+' reason');
 negative++;
}
async function rpc(token,func,body){
 return api('POST','/rest/v1/rpc/'+func,token,body);
}
async function select(token){
 return api('GET','/rest/v1/ad_campaigns?select=id%2Cstatus',token);
}
let negative=0,positive=0;

const signups={};
async function signUp(role){
 const email='t034-e5-'+role+'-'+crypto.randomBytes(6).toString('hex')+'@example.invalid';
 const d=ok(await api('POST','/auth/v1/signup',null,{email,password}),'LOCAL GoTrue '+role+' signup');
 assert.ok(d.access_token&&d.refresh_token&&d.user?.id,'signup session missing');
 uuid(d.user.id);
 const claim=b64UrlDecode(d.access_token);
 assert.equal(claim.sub,d.user.id);assert.equal(claim.aal,'aal1');
 uuid(claim.session_id);
 // Real GoTrue-issued token and real auth.sessions consistency (not fixture session).
 assert.equal(sql("select count(*) from auth.sessions where id='"+uuid(claim.session_id)+
  "'::uuid and user_id='"+uuid(d.user.id)+"'::uuid"),'1',
  'GoTrue session must be persisted');
 let me=ok(await api('GET','/auth/v1/user',d.access_token),'GoTrue /user '+role);
 assert.equal(me.id,d.user.id);
 signups[role]={id:d.user.id,token:d.access_token,refresh:d.refresh_token};
 positive++;
}
function grantFixtureRoles(){
 for(let role of ['owner','reporter','editor']){
  let i=signups[role].id;
  sql("insert into public.user_roles(user_id,role) values('"+i+"','"+role+"')");
  if(role!=='owner')
   sql("insert into public.team_accounts(user_id,status) values('"+i+"','active')");
 }
 sql("insert into public.advertiser_users(user_id,advertiser_id) values('"+
  uuid(signups.advertiser.id)+"'::uuid,'"+id.normalAdvertiser+"'::uuid)");
}
async function rejectOwner(token,context){
 deny(await rpc(token,'jb_ad_confirm_payment_internal',{
  p_campaign:id.normal,p_provider_ref:'CI-NEVER-PRODUCTION',p_amount_minor:5000
 }),context+' confirmed payment','OWNER_AAL2_REQUIRED');
 deny(await rpc(token,'jb_ad_verify_advertiser_internal',{
  p_advertiser:id.normalAdvertiser,p_state:'verified',
  p_note:'T034 local simulated verification',p_evidence_ref:null
 }),context+' verification','OWNER_AAL2_REQUIRED');
}
function noSideEffects(){
 const q="select (select count(*) from public.ad_payments)||','||"+
 "(select count(*) from public.ad_history)||','||"+
 "(select count(*) from public.audit_logs)||','||"+
 "(select count(*) from public.ad_campaigns where status='paid')||','||"+
 "(select count(*) from public.advertisers where verification_state='verified')";
 assert.equal(sql(q),'0,0,0,0,1','Unauthorised request changed real local state');
}
function fromBase32(base32){
 const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 let bits=0,v=0,out=[];
 for(const c of base32.replace(/=+$/,'').toUpperCase()){
  const n=letters.indexOf(c);if(n<0)throw Error('Invalid TOTP secret format');
  v=(v<<5)|n;bits+=5;
  if(bits>=8){bits-=8;out.push((v>>bits)&255);}
 }return Buffer.from(out);
}
function totp(secret,time=Date.now()){
 const buffer=Buffer.alloc(8);
 buffer.writeBigUInt64BE(BigInt(Math.floor(time/1000/30)));
 const digest=crypto.createHmac('sha1',fromBase32(secret)).update(buffer).digest();
 const offset=digest[digest.length-1]&0xf;
 return ((digest.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
async function main(){
 for(const role of ['owner','reporter','advertiser','editor']) await signUp(role);
 grantFixtureRoles();
 console.log('AUTH_REAL_GOTRUE_SIGNUP_SESSION_PERSISTENCE=PASS roles=4 (LOCAL ONLY)');

 // Anonymous API gate. A public anon key is not a GoTrue session.
 deny(await select(null),'anonymous table');
 deny(await rpc(null,'jb_ad_confirm_payment_internal',{
  p_campaign:id.normal,p_provider_ref:'CI-UNAUTH',p_amount_minor:1000
 }),'anonymous payment');
 for(const role of ['reporter','advertiser','editor']){
  const token=signups[role].token;
  const r=await select(token);
  assert.equal(r.status,200,role+' RLS SELECT status');
  if(role==='editor')assert.equal(r.data?.length,3,'Existing Editor staff read path');
  else assert.deepEqual(r.data,[],role+' no ad private rows');
  await rejectOwner(token,role);
 }
 await rejectOwner(signups.owner.token,'Owner AAL1');
 noSideEffects();
 console.log('AUTH_REAL_GOTRUE_JWT_E5_NEGATIVE=PASS classes=anon,reporter,advertiser,editor,owner_aal1');

 const old=signups.owner.token;
 // Genuine GoTrue MFA factor enrollment and challenge (never print TOTP).
 const factor=ok(await api('POST','/auth/v1/factors',old,{
  factor_type:'totp',friendly_name:'T034 local disposable'
 }),'GoTrue MFA enroll');
 uuid(factor.id);assert.ok(factor.totp?.secret,'GoTrue did not issue TOTP secret');
 const challenge=ok(await api('POST','/auth/v1/factors/'+factor.id+'/challenge',old,{}),'MFA challenge');
 uuid(challenge.id);
 const auth2=ok(await api('POST','/auth/v1/factors/'+factor.id+'/verify',old,{
  challenge_id:challenge.id,code:totp(factor.totp.secret)
 }),'GoTrue TOTP MFA verify');
 assert.ok(auth2.access_token,'MFA verify returned no new JWT');
 const claims=b64UrlDecode(auth2.access_token);
 assert.equal(claims.aal,'aal2','Expected GoTrue-issued AAL2 JWT');
 assert.equal(claims.sub,signups.owner.id);
 uuid(claims.session_id);
 assert.equal(sql("select count(*) from auth.sessions where id='"+uuid(claims.session_id)+
 "'::uuid and user_id='"+uuid(signups.owner.id)+"'::uuid"),'1');
 const token2=auth2.access_token;
 console.log('AUTH_REAL_GOTRUE_TOTP_MFA_ISSUED_AAL2=PASS (LOCAL ONLY)');
 positive++;

 // Even genuine Owner AAL2 must never pay historical unverified HIGH risk.
 deny(await rpc(token2,'jb_ad_confirm_payment_internal',{
  p_campaign:id.high,p_provider_ref:'CI-HIGH-PENDING',p_amount_minor:5000
 }),'unverified HIGH risk blocked','B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT');
 noSideEffects();

 // Authorized Owner AAL2 performs genuine HTTP but on disposable fixtures only.
 ok(await rpc(token2,'jb_ad_verify_advertiser_internal',{
  p_advertiser:id.normalAdvertiser,p_state:'verified',
  p_note:'T034 local normal identity verification ONLY',p_evidence_ref:null
 }),'local normal verification');
 positive++;
 const payment=ok(await rpc(token2,'jb_ad_confirm_payment_internal',{
  p_campaign:id.normal,p_provider_ref:'CI-LOCAL-PAID',p_amount_minor:5000
 }),'local Owner AAL2 confirmed-payment positive');
 assert.match(payment,/^[0-9a-f-]{36}$/i);
 positive++;
 assert.equal(sql("select (select count(*) from public.ad_payments where status='confirmed')||','||"+
 "(select count(*) from public.ad_campaigns where status='paid')||','||"+
 "(select count(*) from public.ad_history)||','||"+
 "(select count(*) from public.audit_logs where action='ad_verification')"),'1,1,2,1');
 assert.equal(sql("select status from public.ad_campaigns where id='"+id.high+"'"),'payment_pending');
 console.log('AUTH_REAL_GOTRUE_AAL2_OWNER_POSITIVE_AND_HIGH_RISK_GUARD=PASS (DISPOSABLE)');
 const state=sql("select (select count(*) from public.ad_payments)||','||"+
 "(select count(*) from public.ad_history)||','||"+
 "(select count(*) from public.audit_logs)||','||"+
 "(select count(*) from public.ad_campaigns where status='paid')");
 // Real GoTrue global signout should delete sessions; stale token itself remains
 // cryptographically valid, but our AAL2 security predicate checks auth.sessions.
 ok(await api('POST','/auth/v1/logout?scope=global',token2,{}),'GoTrue global logout');
 assert.equal(sql("select count(*) from auth.sessions where user_id='"+uuid(signups.owner.id)+"'"),'0',
  'GoTrue signout did not remove Owner Auth sessions');
 await rejectOwner(token2,'Owner revoked AAL2 token');
 assert.equal(sql("select (select count(*) from public.ad_payments)||','||"+
 "(select count(*) from public.ad_history)||','||"+
 "(select count(*) from public.audit_logs)||','||"+
 "(select count(*) from public.ad_campaigns where status='paid')"),state,
 'Revoked session unexpectedly changed payment/audit');
 console.log('AUTH_REAL_GOTRUE_LOGOUT_STALE_AAL2_JWT_DENIED=PASS (LOCAL ONLY)');
 console.log('P4_T034_GOTRUE_AUTH_LOCAL_E5_PARTIAL_PASS negative='+negative+' positive='+positive);
 console.log('STAGING_OR_PRODUCTION_E5=HOLD; PRODUCTION_WRITES=ZERO');
}
main().catch(e=>{console.error('FAIL P4-T034 GoTrue real local Auth E5: '+e.message);process.exitCode=1;});
