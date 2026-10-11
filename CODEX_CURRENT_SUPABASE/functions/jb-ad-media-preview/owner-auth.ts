/**
 * B7 ADS-009/015 Owner HTTP authorization (REVIEW-ONLY candidate).
 * No elevated service_role and no JWT-claim-only authority: canonical
 * Auth user + existing backend Owner/AAL2 capability must BOTH succeed.
 * Do not deploy before signed Owner E5/session-revocation live testing.
 */
export type OwnerHttpConfig={
 baseUrl:string;
 anonKey:string;
 request?:typeof fetch;
};
export async function identifyAdMediaOwner(
 token:string,{baseUrl,anonKey,request=fetch}:OwnerHttpConfig
):Promise<string|null>{
 if(!/^[A-Za-z0-9._-]{40,8000}$/.test(token)||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(baseUrl)||
    !anonKey||!request)return null;
 const base=baseUrl.replace(/\/$/,'');
 const auth:Record<string,string>={
  'Authorization':'Bearer '+token,'apikey':anonKey
 };
 try{
  const user=await request(base+'/auth/v1/user',{
   method:'GET',headers:auth,redirect:'error',
   signal:AbortSignal.timeout(5000)
  });
  if(!user.ok)return null;
  const obj=await user.json().catch(()=>null);
  // A user ID is NOT proof of owner rights; just a necessary independent
  // condition. Owner authority remains with the SAME canonical p4 RPC.
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
   String(obj?.id||'')))return null;
  const cap=await request(base+'/rest/v1/rpc/jb_ad_creative_workflow_capability_internal',{
   method:'POST',headers:{...auth,'Content-Type':'application/json'},
   body:'{}',redirect:'error',signal:AbortSignal.timeout(5000)
  });
  if(!cap.ok)return null;
  return await cap.json().catch(()=>null)==='B7_DRAFT_THEN_EXPLICIT_APPROVE_V1'
   ? String(obj.id):null;
 }catch(_){return null;}
}

export async function verifyAdMediaOwner(
 token:string,config:OwnerHttpConfig
):Promise<boolean>{
 return (await identifyAdMediaOwner(token,config))!==null;
}
