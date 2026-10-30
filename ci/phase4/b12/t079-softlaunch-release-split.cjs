'use strict';
/**
 * T079 no-fake closure / Soft Launch stage separation.
 * This read-only check never deploys, posts, deletes or changes production.
 * The four-party launch gate is separately managed; YouTube manual proof alone
 * cannot mark that global gate PASS.
 */
const fs=require('node:fs'),path=require('node:path');
function evaluate({manual,truth,flags}){
 if(!manual||!truth||!flags)throw Error('REQUIRED_PROOF_ABSENT');
 const t079=truth.tests?.['P4-T079'],t078=truth.tests?.['P4-T078'];
 if(!t079||!t078)throw Error('MASTER_GATE_MISSING');
 if(manual.scope!=='MANUAL_YOUTUBE_APP_ONLY'||
    manual.channel_handle!=='@jantabolnews'||!(/^[A-Za-z0-9_-]{11}$/).test(manual.video_id||'')||
    manual.full_playback_confirmed_by_founder!==true||
    manual.deletion_toast_observed!=='Video deleted from your uploads'||
    manual.google_data_api_signed_receipt!==false||
    manual.backend_videos_insert_executed!==false||
    manual.automatic_social_post_verified!==false||
    manual.evidence_class!=='FOUNDER_SCREENSHOTS_AND_STATEMENT_ONLY')
  throw Error('MANUAL_EVIDENCE_MISCLASSIFIED');
 if(t079.status==='PASS_LOCK'||(t079.evidence||[]).some(x=>/real\s*provider\s*e6\s*pass/i.test(x)))
  throw Error('AUTOMATIC_YOUTUBE_FALSE_PASS');
 if(t078.status==='PASS_LOCK' && !flags.independentRollbackE8Verified)
  throw Error('ROLLBACK_FALSE_PASS');
 if(flags.productionUploaderEnabled && (
    t078.status!=='PASS_LOCK'||
    !flags.independentRollbackE8Verified||
    !flags.durableLedgerProductionVerified||
    !flags.serverOnlyFounderMediaRightsApproved||
    !flags.providerPrivateVideoReceiptVerified))
  throw Error('UNSAFE_PRODUCTION_YOUTUBE_UPLOADER');
 if(flags.publicSiteReleaseApproved && !flags.independentPublicSecurityAndNewsE1)
  throw Error('PUBLIC_SOFT_LAUNCH_FALSE_PASS');
 return Object.freeze({
  manual_app_lane:'PASS_SCREENSHOT_SCOPE_ONLY',
  youtube_oauth_lane:'PASS_REAL_REFRESH_SEPARATE',
  automatic_youtube_backend:'E6_DUE',
  production_uploader:'DISABLED_UNTIL_RELEASE_GATES',
  public_soft_launch:'INDEPENDENT_SITE_NEWS_SECURITY_PROOFS_REQUIRED',
  b12_full_release:'HOLD',
  message:'Manual YouTube app proof is valid without forcing public site or B12 full PASS. No automatic upload inferred.'
 });
}
function checkRepo(root){
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const proof=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/b12/t079-youtube-manual-proof.json'));
 const truth=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json'));
 const ui=read('JANTA_BOL_PHASE_3C_WORKING/social.html');
 const worker=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/worker.mjs');
 const preflight=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-preflight/index.ts');
 if(!ui.includes("if(value==='Posted') throw new Error")||
    !ui.includes("statuses.filter(s=>s!=='Posted')")||
    !ui.includes("manualShare(row,platform)"))
  throw Error('ORIGINAL_MANUAL_SOCIAL_FAIL_CLOSED_BROKEN');
 if(fs.existsSync(path.join(root,'CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/index.ts'))||
    /Deno\.serve\(/.test(worker)||/\.insert\(|\.upsert\(|\.update\(/.test(preflight))
  throw Error('PRODUCTION_UPLOAD_WRITER_MAY_BE_ENABLED');
 if(!worker.includes("posted:false")||!preflight.includes("posted:false"))
  throw Error('MANUAL_CANNOT_INFER_AUTOMATIC_POSTED');
 return evaluate({manual:proof,truth,flags:{
  productionUploaderEnabled:false,
  independentRollbackE8Verified:false,
  durableLedgerProductionVerified:false,
  serverOnlyFounderMediaRightsApproved:false,
  providerPrivateVideoReceiptVerified:false,
  publicSiteReleaseApproved:false,
  independentPublicSecurityAndNewsE1:false
 }});
}
if(require.main===module) {
 try{console.log(JSON.stringify(checkRepo(path.resolve(__dirname,'../../..')),null,2));}
 catch(error){console.error('T079_SOFTLAUNCH_HOLD:',error.message);process.exitCode=1;}
}
module.exports={evaluate,checkRepo};
