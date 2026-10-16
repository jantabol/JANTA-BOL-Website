'use strict';
// CP04: Vercel preview read-only GET smoke. Exact deployment URL+SHA
// independently obtained from Vercel metadata, pinned here for evidence.
// No auth/session, SQL, browser privacy data, advert submission or payment.
const assert=require('node:assert/strict');
const host='shubham-pichhore-2028-mgj4krww4-shubhamshrivastava295-9848.vercel.app';
const sha='a1f6135cc72e94dca1a2da9a610cfcdf2bd9f38d';
const pages=[
 ['homepage','/index.html','data-jb-ad-placement="homepage"'],
 ['article','/article.html','data-jb-ad-placement="article"'],
 ['owner-adstudio-static','/ads.html','Local File Preview — NO UPLOAD'],
 ['poster-source','/public-ads.js','decodedPoster(']
];
(async()=>{
 for(const [name,path,marker] of pages){
  const url=new URL(path,'https://'+host);
  assert.equal(url.hostname,host);
  const r=await fetch(url,{method:'GET',redirect:'manual',cache:'no-store',
   headers:{Accept:'text/html,application/javascript','Cache-Control':'no-store'},
   signal:AbortSignal.timeout(15000)});
  if(r.status!==200){
   console.log('CP04_DEPLOYED_PREVIEW_HOLD route='+name+' http='+r.status+
    ' access=NOT_CONFIRMED sha='+sha.slice(0,9));
   throw Error('VERIFY_PUBLIC_PREVIEW_BEFORE_ANDROID_'+name);
  }
  const txt=await r.text();
  if(!txt.includes(marker)){
   console.log('CP04_DEPLOYED_PREVIEW_HOLD route='+name+' http=200 marker=MISSING');
   throw Error('WRONG_DEPLOYED_ARTIFACT_'+name);
  }
  console.log('CP04_DEPLOYED_READONLY_GET=PASS route='+name+' HTTP=200 artifact_marker=YES');
 }
 console.log('CP04_VERIFIED_DEPLOYED_SHA_VERCEL_METADATA='+sha);
 console.log('CP04_ANDROID_PHYSICAL_E3=HOLD; AUTHENTICATED_AD_MEDIA_E2=HOLD; LIVE_WRITES=ZERO');
})().catch(e=>{console.error('CP04_PREVIEW_SMOKE_NOT_READY '+e.message);process.exitCode=1});
