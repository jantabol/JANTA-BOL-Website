/**
 * JANTA BOL B7 PRIVATE MEDA PREVIEW — REVIEW ONLY / UNDEPLOYED.
 * NO CORS access granted; no write to production or any storage.
 * Requires paired Owner app release, source parity & actual E3/E5 before
 * deliberately deploying. Does NOT implement B7 media asset approval.
 */
import {handlePrivateAdMediaPreview} from './handler.ts';
import {buildPrivateAdImagePreview} from '../_shared/b7-image-sanitize.ts';

async function ownerAal2(token:string){
 const base=Deno.env.get('SUPABASE_URL')||'';
 const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';
 if(!base||!anon||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(base))
   return false;
 const auth={'Authorization':'Bearer '+token,'apikey':anon};
 // Go through canonical Auth service rather than trusting decoded JWT alone.
 const user=await fetch(base.replace(/\/$/,'')+'/auth/v1/user',{
  method:'GET',headers:auth,redirect:'error',signal:AbortSignal.timeout(5000)
 });
 if(!user.ok)return false;
 const obj=await user.json().catch(()=>null);
 if(!obj?.id)return false;
 // Stage capability RPC owns the Founder/AAL2/session policy. Missing
 // migration or revoked Owner fails closed (no alternate service-role path).
 const cap=await fetch(base.replace(/\/$/,'')+
  '/rest/v1/rpc/jb_ad_creative_workflow_capability_internal',{
   method:'POST',headers:{...auth,'Content-Type':'application/json'},
   body:'{}',redirect:'error',signal:AbortSignal.timeout(5000)
  });
 if(!cap.ok)return false;
 const v=await cap.json().catch(()=>null);
 return v==='B7_DRAFT_THEN_EXPLICIT_APPROVE_V1';
}
Deno.serve(req=>handlePrivateAdMediaPreview(req,{
 authorize:ownerAal2,
 convert:buildPrivateAdImagePreview
}));
