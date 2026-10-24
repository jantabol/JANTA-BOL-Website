// DEVELOPMENT CANDIDATE ONLY: JANTA BOL T069 Founder-triggered original media offsite.
// New function, disabled until explicit Founder-approved brief activation.
// Supabase-managed server-only service credential stays in Edge runtime;
// no Github service key, no change to original B5 restrictive RLS.
import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import * as age from 'jsr:@age/age-encryption@0.3.1';
import {S3Client,PutObjectCommand,GetObjectCommand} from 'npm:@aws-sdk/client-s3@3.1156.0';
import {PROJECT,encryptedB2MediaRoundTrip} from './t069-media-age-b2-roundtrip.mjs';
import {createOwnerAAL2Source} from './t069-owner-supabase-media-source.mjs';
import {createB2Transport,JANTA_BOL_B2_BUCKET} from './t069-b2-s3-transport.mjs';

const CONFIRM='JANTA_BOL_B11_T069_FOUNDER_MEDIA_OFFSITE_ONCE';
const headers={'Cache-Control':'no-store, private','Pragma':'no-cache',
 'X-Content-Type-Options':'nosniff','Content-Type':'application/json'};
const fail=(code,message)=>new Response(JSON.stringify({ok:false,error:message}),
 {status:code,headers});
const env=(name)=>Deno.env.get(name)||'';
function settings(){
 const url=env('SUPABASE_URL'),until=Date.parse(env('JB_B11_T069_ENABLED_UNTIL_UTC'));
 const region=env('JB_B11_T069_B2_REGION');
 const now=Date.now();
 return {url,anon:env('SUPABASE_ANON_KEY'),
  server:env('SUPABASE_SERVICE_ROLE_KEY'),
  b2key:env('JB_B11_T069_B2_KEY_ID'),b2secret:env('JB_B11_T069_B2_APP_KEY'),
  ageRecipient:env('JB_B11_T069_AGE_RECIPIENT'),region,
  allowedOrigin:env('JB_B11_T069_ALLOWED_ORIGIN'),
  live:env('JB_B11_T069_ENABLED')==='YES'&&
   Number.isFinite(until)&&until>now&&until<=now+15*60*1000&&
   url==='https://'+PROJECT+'.supabase.co'&&
   /^[a-z]{2}-[a-z0-9-]{4,25}$/.test(region)
 };
}
Deno.serve(async request=>{
 const cfg=settings(),origin=request.headers.get('origin');
 if(!cfg.live)return fail(503,'OWNER_BACKUP_GATE_CLOSED');
 if(!cfg.allowedOrigin||!(new URL(cfg.allowedOrigin).protocol==='https:'))
  return fail(503,'OWNER_BACKUP_ORIGIN_UNSET');
 if(origin&&origin!==cfg.allowedOrigin)return fail(403,'ORIGIN_DENIED');
 if(request.method==='OPTIONS'){
  if(!origin)return fail(403,'PREFLIGHT_DENIED');
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':cfg.allowedOrigin,
   'Access-Control-Allow-Methods':'POST, OPTIONS',
   'Access-Control-Allow-Headers':'authorization, apikey, content-type',
   'Access-Control-Max-Age':'0','Vary':'Origin','Cache-Control':'no-store'
  }});
 }
 if(request.method!=='POST')return fail(405,'POST_ONLY');
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer [^\s]{10,4090}$/.test(authorization))return fail(401,'AUTH_REQUIRED');
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))
  return fail(415,'JSON_REQUIRED');
 if(Number(request.headers.get('content-length')||0)>512)return fail(413,'BODY_TOO_LARGE');
 let payload;
 try{
  const raw=await request.text();
  if(raw.length>512)return fail(413,'BODY_TOO_LARGE');
  payload=JSON.parse(raw);
 }catch{return fail(400,'INVALID_BODY')}
 if(!payload||Object.keys(payload).length!==2||
  payload.action!=='backup-once'||payload.confirm!==CONFIRM)
  return fail(403,'FOUNDER_CONFIRMATION_REQUIRED');
 if(!cfg.anon||!cfg.server||!cfg.b2key||!cfg.b2secret||!cfg.ageRecipient)
  return fail(503,'BACKUP_DEPENDENCIES_NOT_CONFIGURED');
 try{
  const sessionSource=createOwnerAAL2Source({
   authorization,
   getUserClient:auth=>createClient(cfg.url,cfg.anon,{
    global:{headers:{Authorization:auth}},
    auth:{persistSession:false,autoRefreshToken:false}
   }),
   getServiceClient:()=>createClient(cfg.url,cfg.server,{
    auth:{persistSession:false,autoRefreshToken:false}
   })
  });
  const s3=new S3Client({
   region:cfg.region,endpoint:'https://s3.'+cfg.region+'.backblazeb2.com',
   credentials:{accessKeyId:cfg.b2key,secretAccessKey:cfg.b2secret},
   forcePathStyle:true,maxAttempts:2
  });
  const b2=createB2Transport({s3,PutObjectCommand,GetObjectCommand,
   bucket:JANTA_BOL_B2_BUCKET});
  const proof=await encryptedB2MediaRoundTrip({
   ...sessionSource,age,b2,founderRecipient:cfg.ageRecipient
  });
  // Runtime secrets, JWT and per-evidence object paths never leave server.
  return new Response(JSON.stringify({ok:true,proof}),{status:200,headers:{
   ...headers,...(origin?{'Access-Control-Allow-Origin':cfg.allowedOrigin,'Vary':'Origin'}:{})
  }});
 }catch{
  return fail(409,'T069_REAL_BACKUP_EVIDENCE_HOLD');
 }
});
