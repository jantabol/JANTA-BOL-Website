/**
 * B7 canonical Owner AAL2 verifier for BOTH Deno preview and isolated Node
 * worker. A single Auth+backend capability authority, NO second role SOT.
 * No privileged Supabase keys, no direct SQL, no browser-provided user id.
 */
export async function identifyB7OwnerAal2(token,{
 baseUrl,anonKey,request=fetch
}={}){
 if(typeof token!=='string'||!/^[A-Za-z0-9._-]{40,8000}$/.test(token)||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(String(baseUrl||''))||
    !anonKey||typeof request!=='function')return null;
 const base=baseUrl.replace(/\/$/,'');
 const auth={'Authorization':'Bearer '+token,'apikey':anonKey};
 try{
  const user=await request(base+'/auth/v1/user',{
   method:'GET',headers:auth,redirect:'error',signal:AbortSignal.timeout(5000)
  });
  if(!user.ok)return null;
  const obj=await user.json().catch(()=>null);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(obj?.id||'')))return null;
  const cap=await request(
   base+'/rest/v1/rpc/jb_ad_creative_workflow_capability_internal',{
    method:'POST',headers:{...auth,'Content-Type':'application/json'},
    body:'{}',redirect:'error',signal:AbortSignal.timeout(5000)
   });
  if(!cap.ok)return null;
  return await cap.json().catch(()=>null)==='B7_DRAFT_THEN_EXPLICIT_APPROVE_V1'
   ?String(obj.id):null;
 }catch{return null}
}
