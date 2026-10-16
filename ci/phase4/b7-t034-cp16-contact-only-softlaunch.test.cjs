'use strict';
/* P4-T034 CP16 — Contact-only SOFT-LAUNCH gate (not an ADS/T034 full PASS).
   LIVE API: 2 anonymous HTTPS GETs; neither user credentials nor DB writes.
   The future first REAL paid advertisement MUST have a separate release gate.
*/
const fs=require('node:fs'),assert=require('node:assert/strict');
const cfg=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const base=cfg.match(/\burl:\s*'([^']+)'/)?.[1];
const key=cfg.match(/\bpublishableKey:\s*'([^']+)'/)?.[1];
assert.equal(base,'https://vrffsnkycvjithwtiylt.supabase.co','WRONG_SUPABASE_PROJECT');
assert.ok(key?.startsWith('sb_publishable_'),'INVALID_PUBLIC_KEY');
for(const k of ['SUPABASE_SERVICE_ROLE_KEY','SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD','JB_BACKUP_B2_APPLICATION_KEY']){
 assert.equal(process.env[k],undefined,'PRIVILEGED_ENV_NOT_ALLOWED_'+k);
}
const form=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertise-request.html','utf8');
assert.ok(form.includes('यह केवल संपर्क अनुरोध है; विज्ञापन स्वीकृत या LIVE नहीं होगा।'),
 'UNSAFE_SOFT_LAUNCH_PUBLIC_PROMISE');
assert.match(form,/id="adConsent"[^>]*required/,'CONSENT_CHECKBOX_NOT_REQUIRED');
assert.match(form,/name="whatsapp"[^>]*required/,'WHATSAPP_MISSING_REQUIRED');
console.log('CP16 SOURCE: inquiry-only message + explicit consent + required contact = VERIFIED');
async function getPlacement(placement){
 const u=new URL('/rest/v1/rpc/jb_ad_public_feed',base);
 u.searchParams.set('p_placement',placement);
 u.searchParams.set('p_scope','global');
 assert.equal(u.origin,base);
 const resp=await fetch(u,{method:'GET',headers:{
  apikey:key,Accept:'application/json','Cache-Control':'no-store'
 },redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
 const body=await resp.text();
 let parsed;try{parsed=JSON.parse(body)}catch{throw Error('LIVE_FEED_NOT_JSON_'+placement);}
 // Never log private data, URLs or request tokens.
 assert.equal(resp.status,200,'LIVE_FEED_FAILED_'+placement+' HTTP='+resp.status);
 assert.ok(Array.isArray(parsed),'LIVE_FEED_WRONG_SHAPE_'+placement);
 assert.equal(parsed.length,0,'SOFT_LAUNCH_UNAUTHORIZED_PAID_AD_VISIBLE_'+placement);
 console.log('CP16 LIVE '+placement.toUpperCase()+' PUBLIC FEED=EMPTY HTTP 200, no paid ad served');
}
(async()=>{
 await getPlacement('homepage');
 await getPlacement('article');
 console.log('CP16 CONTACT_ONLY_NO_AD_FEED_PRELAUNCH_CHECK=PASS (scoped)');
 console.log('CP16: READ_ONLY_GET=2; NO_ACCOUNT; NO_DB_MUTATION; NO_PRODUCTION_DEPLOY');
 console.log('P4_T034_FULL_E2_E3_E5=HOLD; FIRST_PAID_AD_LAUNCH=HARD_GATED; PHASE4_FINAL=HOLD');
})().catch(e=>{console.error('CP16 FAIL: '+e.message);process.exitCode=1});
