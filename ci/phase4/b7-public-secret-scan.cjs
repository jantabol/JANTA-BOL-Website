'use strict';
/* ADS-056 source-level client bundle exposure guard.
 * Scan ALL tracked static JS/HTML/CSS in the one public working website,
 * including admin/advertiser/reader files. No credential printed or logged.
 * This cannot replace Supabase Storage RLS, key rotation, or real incident E2.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function inspect(contents){
 const s=String(contents);
 const errors=[];
 const patterns=[
  [/sb_secret_[a-z0-9_-]{10,}/gi,'SUPABASE_SECRET_PROJECT_KEY'],
  [/sk_live_[a-z0-9]{12,}/gi,'LIVE_PAYMENT_SECRET'],
  [/whsec_[a-z0-9]{10,}/gi,'PAYMENT_WEBHOOK_SIGNING_SECRET'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,'PRIVATE_KEY_MATERIAL'],
  [/\bAKIA[0-9A-Z]{16}\b/g,'CLOUD_ACCESS_KEY'],
  [/\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|STRIPE_SECRET_KEY)\s*[:=]\s*['"][^'"\n]{8,}['"]/gi,
   'HARDCODED_PRIVILEGED_CONFIG']
 ];
 for(const [re,label] of patterns)if(re.test(s))errors.push(label);
 const jwt=/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}\b/g;
 for(const m of s.matchAll(jwt)){
  try{
   const data=JSON.parse(Buffer.from(m[0].split('.')[1],'base64url').toString('utf8'));
   if(data.role&&data.role!=='anon')errors.push('PRIVILEGED_JWT_IN_CLIENT');
  }catch(_){
   // Malformed or fixture strings are NOT trusted as real JWT claims.
  }
 }
 return [...new Set(errors)];
}
function scan(){
 const base=path.join(root,'JANTA_BOL_PHASE_3C_WORKING');
 const problems=[];let examined=0;
 for(const item of fs.readdirSync(base,{withFileTypes:true})){
  if(!item.isFile()||!/\.(?:js|html|css)$/i.test(item.name))continue;
  const content=fs.readFileSync(path.join(base,item.name),'utf8');
  examined++;
  const bad=inspect(content);
  if(bad.length)problems.push({file:item.name,flags:bad});
 }
 assert.ok(examined>=30,'ADS-056_CLIENT_SOURCE_COVERAGE_NOT_SATISFIED');
 return {examined,problems};
}
if(require.main===module){
 const result=scan();
 if(result.problems.length){
  for(const x of result.problems)
   console.error('FAIL [ADS-056 CLIENT SECRET EXPOSURE] '+x.file+
    ' flags='+x.flags.join(',')+' (credential value intentionally never printed)');
  process.exitCode=1;
 }else console.log('PASS [ADS-056 E1] checked '+result.examined+
  ' public/admin/ad HTML+JS+CSS sources: no known privileged key literals; E2 Storage/RLS incident proof remains DUE.');
}
module.exports={inspect,scan};
