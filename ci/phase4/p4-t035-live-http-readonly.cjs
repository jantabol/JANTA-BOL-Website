'use strict';
// P4-T035: read-only production HTTP contract probe. No mutations, no privileged credentials.
// An empty ad feed verifies transport/shape only, NEVER positive campaign eligibility.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const config=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const url=config.match(/url:\s*'([^']+)'/)?.[1];
const key=config.match(/publishableKey:\s*'([^']+)'/)?.[1];
assert(url?.startsWith('https://') && key?.startsWith('sb_publishable_'),'Missing public config');
const timeout=AbortSignal.timeout(15000);
const forbidden=['advertiser_id','payment','provider_ref','verification_state','risk_level','internal_note','contact','created_by','paid_at'];
const expected=['campaign_id','creative_id','creative_type','media_url','text_body','cta_type','cta_target','label'];
let checks=0;
async function rpc(name,args){
 const res=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(args),signal:timeout});
 const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{throw Error(name+' HTTP '+res.status+' non-JSON: '+raw.slice(0,160))}
 assert.equal(res.status,200,name+' HTTP '+res.status+' '+JSON.stringify(data).slice(0,300));
 assert(Array.isArray(data),name+' response must be an array');
 for(const item of data){
  assert(item && typeof item==='object'&&!Array.isArray(item));
  for(const f of forbidden)assert(!(f in item),name+' leaked '+f);
  for(const f of expected.filter(x=>name==='jb_ad_public_feed'||x!=='creative_id'))assert(x in item,name+' missing '+f);
  assert.equal(item.label,'विज्ञापन');
 }
 console.log('PASS HTTP',name,'rows='+data.length);
 checks++;return data;
}
(async()=>{
 const global=await rpc('jb_ad_public_feed',{p_placement:'homepage',p_scope:'global'});
 await rpc('jb_ad_public_feed',{p_placement:'article',p_scope:'global'});
 await rpc('jb_ad_public_feed',{p_placement:'article',p_scope:'district:shivpuri'});
 const invalid=await rpc('jb_ad_public_feed',{p_placement:'invalid',p_scope:'global'});
 assert.equal(invalid.length,0,'invalid placement must fail closed');checks++;
 const badScope=await rpc('jb_ad_public_feed',{p_placement:'homepage',p_scope:''});
 assert.equal(badScope.length,0,'empty scope must fail closed');checks++;
 const oversized=await rpc('jb_ad_public_feed',{p_placement:'homepage',p_scope:'x'.repeat(101)});
 assert.equal(oversized.length,0,'oversized scope must fail closed');checks++;
 const legacy=await rpc('jb_public_active_ads',{p_placement:'homepage'});
 const legacyInvalid=await rpc('jb_public_active_ads',{p_placement:'invalid'});
 assert.equal(legacyInvalid.length,0,'legacy invalid placement must fail closed');checks++;
 // Existing production legacy route may still be vulnerable; fail on any unpaid/unverified leak only
 // after independently establishing eligibility. Never treat an empty result as positive proof.
 if(global.length===0&&legacy.length!==0)throw Error('Legacy public route returns ads absent from canonical feed');
 checks++;
 console.log('HTTP transport/shape checks:',checks,'PASS; positive paid ad flow NOT TESTED');
})().catch(e=>{console.error('FAIL HTTP contract:',e.message);process.exitCode=1});
