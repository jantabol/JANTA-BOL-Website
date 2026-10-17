import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
function sameSecret(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
function b64bytes(v:string){const s=atob(v);return Uint8Array.from(s,c=>c.charCodeAt(0))}
async function decrypt(cipherB64:string,ivB64:string,keyB64:string){const keyRaw=b64bytes(keyB64);if(keyRaw.length!==32)throw new Error("ENC_KEY_INVALID");const key=await crypto.subtle.importKey("raw",keyRaw,"AES-GCM",false,["decrypt"]);const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64bytes(ivB64)},key,b64bytes(cipherB64));return new TextDecoder().decode(plain)}
function safeTitle(v:unknown,max=100){return String(v??"JANTA BOL LIVE").trim().slice(0,max)||"JANTA BOL LIVE"}
function safeCode(v:unknown){return String(v??"PROVIDER_ERROR").replace(/[^A-Z0-9_:-]/gi,"_").slice(0,120)}
function providerError(status:number,data:any){const reason=data?.error?.errors?.[0]?.reason||data?.error?.status||data?.error?.message||("HTTP_"+status);return safeCode(reason)}
function config(){return{
  url:Deno.env.get("SUPABASE_URL")??"",
  service:Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY")??"",
  clientId:Deno.env.get("JB_GOOGLE_CLIENT_ID")??"",
  clientSecret:Deno.env.get("JB_GOOGLE_CLIENT_SECRET")??"",
  encKey:Deno.env.get("JB_OAUTH_TOKEN_ENC_KEY_B64")??"",
  privacy:(Deno.env.get("JB_YOUTUBE_BROADCAST_PRIVACY")??"unlisted").toLowerCase(),
  writeMode:(Deno.env.get("JB_YOUTUBE_WRITE_MODE")??"safe_test").toLowerCase(),
  resolution:Deno.env.get("JB_YOUTUBE_STREAM_RESOLUTION")??"720p",
  frameRate:Deno.env.get("JB_YOUTUBE_STREAM_FRAMERATE")??"30fps"
}}

Deno.serve(async(req:Request)=>{
  const deploymentEnv=(Deno.env.get("JB_DEPLOYMENT_ENV")??"").toLowerCase();
  const credentialEnv=(Deno.env.get("JB_GOOGLE_CREDENTIAL_ENV")??"").toLowerCase();
  if(!["development","test","production"].includes(deploymentEnv)||credentialEnv!==deploymentEnv){
    return json({ok:false,error:"OAUTH_ENVIRONMENT_MISMATCH"},503);
  }
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
  const c=config(),auth=req.headers.get("Authorization")??"",bearer=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!c.url||!c.service||!sameSecret(bearer,c.service))return json({ok:false,error:"PROVIDER_AUTH_REQUIRED"},401);
  const service=createClient(c.url,c.service,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=await req.json().catch(()=>({}));const action=String(body?.action??""),generationId=String(body?.generation_id??"");
  if(!/^[0-9a-f-]{36}$/i.test(generationId))return json({ok:false,error:"INVALID_GENERATION_ID"},400);

  async function integration(){
    const r=await service.from("youtube_integration").select("*").eq("provider","youtube").maybeSingle();
    if(r.error)throw new Error("INTEGRATION_LOOKUP_FAILED");
    if(!r.data||r.data.connection_state!=="CONNECTED"||r.data.control_auth_state==="CONTROL_AUTH_DEGRADED")throw new Error(r.data?.control_auth_state==="CONTROL_AUTH_DEGRADED"?"YOUTUBE_REAUTH_REQUIRED":"YOUTUBE_NOT_CONNECTED");
    return r.data;
  }
  async function accessToken(){
    if(!c.clientId||!c.clientSecret||!c.encKey)throw new Error("YOUTUBE_CONFIG_REQUIRED");
    await integration();
    const sec=await service.rpc("jb_youtube_active_secret_internal");
    const row=Array.isArray(sec.data)?sec.data[0]:sec.data;
    if(sec.error||!row?.refresh_token_ciphertext||!row?.iv_b64)throw new Error("YOUTUBE_REAUTH_REQUIRED");
    let refresh="";try{refresh=await decrypt(String(row.refresh_token_ciphertext),String(row.iv_b64),c.encKey)}catch{throw new Error("YOUTUBE_SECRET_DECRYPT_FAILED")}
    let res:Response;
    try{res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:c.clientId,client_secret:c.clientSecret,refresh_token:refresh,grant_type:"refresh_token"})})}catch{throw new Error("TOKEN_REFRESH_NETWORK_ERROR")}
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data?.access_token){
      const err=String(data?.error??"TOKEN_REFRESH_FAILED");
      if(err==="invalid_grant"){
        const now=new Date().toISOString();
        const live=await service.from("live_sessions").select("id").eq("session_status","LIVE").limit(1);
        const running=Array.isArray(live.data)&&live.data.length>0;
        await service.from("youtube_integration").update({connection_state:"REAUTH_REQUIRED",control_auth_state:running?"CONTROL_AUTH_DEGRADED":"OK",control_auth_degraded_at:running?now:null,admin_warning:running?"LIVE + CONTROL_AUTH_DEGRADED — YouTube management authorization failed; media may still be running. Reauthorize control.":null,last_refresh_status:"invalid_grant",reauth_required_at:now,safe_error_code:"INVALID_GRANT",updated_at:now}).eq("provider","youtube");
        if(running){
          const owners=await service.from("user_roles").select("user_id").eq("role","owner");
          const rows=(owners.data??[]).map((o:any)=>({recipient_user_id:o.user_id,notification_type:"CONTROL_AUTH_DEGRADED",priority:"CRITICAL",title:"YouTube Live control degraded",safe_message:"Running Live media may continue, but YouTube management authorization failed. Reauthorize control.",record_type:"youtube_integration",record_id:"youtube"}));
          if(rows.length)await service.from("live_notifications").insert(rows);
        }
        throw new Error("YOUTUBE_REAUTH_REQUIRED");
      }
      await service.from("youtube_integration").update({last_refresh_status:safeCode(err),updated_at:new Date().toISOString()}).eq("provider","youtube");
      throw new Error("TOKEN_REFRESH_FAILED");
    }
    await service.from("youtube_integration").update({last_refresh_status:"OK",last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("provider","youtube");
    return String(data.access_token);
  }
  async function yt(path:string,token:string,init:RequestInit={}){
    let res:Response;
    try{res=await fetch("https://www.googleapis.com/youtube/v3/"+path,{...init,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json",...(init.headers||{})}})}catch{throw new Error("PROVIDER_NETWORK_UNKNOWN")}
    const text=await res.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{data={}}
    if(!res.ok){const e=new Error("YT_"+providerError(res.status,data));(e as any).httpStatus=res.status;throw e}
    return data;
  }
  async function context(){
    const g=await service.from("live_provider_generations").select("generation_id,session_id,generation_number,provider,provider_state,credential_status,is_current,provider_broadcast_id,provider_stream_id,provider_video_id,playback_reference,provider_broadcast_lifecycle,provider_stream_status,provider_bound_stream_id").eq("generation_id",generationId).maybeSingle();
    if(g.error||!g.data)throw new Error("GENERATION_NOT_FOUND");
    const s=await service.from("live_sessions").select("id,request_id,article_id,assigned_reporter_id,headline,session_status,public_status,current_provider_generation").eq("id",g.data.session_id).maybeSingle();
    if(s.error||!s.data)throw new Error("SESSION_NOT_FOUND");
    if(String(s.data.current_provider_generation)!==generationId||g.data.is_current!==true)throw new Error("STALE_GENERATION");
    return{g:g.data,s:s.data};
  }
  async function updateGen(patch:Record<string,unknown>){const r=await service.from("live_provider_generations").update({...patch,provider_last_checked_at:new Date().toISOString()}).eq("generation_id",generationId).select("*").maybeSingle();if(r.error)throw new Error("GENERATION_UPDATE_FAILED");return r.data}
  async function journalStep(step:string,data:Record<string,unknown>={}){const r=await service.from("live_operations").update({operation_step:step,operation_data:data,updated_at:new Date().toISOString()}).eq("generation_id",generationId).eq("operation_type","PROVISION_LIVE");if(r.error)throw new Error("OPERATION_JOURNAL_UPDATE_FAILED")}
  async function getBroadcast(token:string,id:string){const d=await yt("liveBroadcasts?part=id,snippet,status,contentDetails&id="+encodeURIComponent(id),token);return Array.isArray(d.items)?d.items[0]:null}
  async function getStream(token:string,id:string,includeCdn=true){const parts=includeCdn?"id,snippet,cdn,status,contentDetails":"id,snippet,status,contentDetails";const d=await yt("liveStreams?part="+encodeURIComponent(parts)+"&id="+encodeURIComponent(id),token);return Array.isArray(d.items)?d.items[0]:null}
  async function findBroadcastByMarker(token:string,marker:string){const d=await yt("liveBroadcasts?part=id,snippet,status,contentDetails&mine=true&broadcastType=all&maxResults=50",token);return(Array.isArray(d.items)?d.items:[]).find((x:any)=>String(x?.snippet?.description??"").includes(marker))||null}
  async function findStreamByMarker(token:string,marker:string){const d=await yt("liveStreams?part=id,snippet,status,contentDetails&mine=true&maxResults=50",token);return(Array.isArray(d.items)?d.items:[]).find((x:any)=>String(x?.snippet?.description??"").includes(marker))||null}

  try{
    const {g,s}=await context();
    const token=await accessToken();
    const marker="JB-LIVE-GEN:"+generationId;

    if(action==="provision_generation"){
      await journalStep("BROADCAST_CREATE_CHECK");
      let broadcastId=String(g.provider_broadcast_id??""),streamId=String(g.provider_stream_id??"");
      if(!broadcastId){
        const maybe=await findBroadcastByMarker(token,marker);
        if(maybe?.id){
          broadcastId=String(maybe.id);
          await updateGen({provider_broadcast_id:broadcastId,provider_video_id:broadcastId,playback_reference:broadcastId,provider_broadcast_lifecycle:String(maybe?.status?.lifeCycleStatus??""),provider_state:"CREATING"});
          await journalStep("BROADCAST_CONFIRMED",{broadcast_id:broadcastId,recovered:true});
        }else{
          const privacy=c.writeMode==="production"?(["private","unlisted","public"].includes(c.privacy)?c.privacy:"unlisted"):(c.privacy==="private"?"private":"unlisted");
          const scheduled=new Date(Date.now()+60_000).toISOString();
          let d:any;
          try{
            d=await yt("liveBroadcasts?part=id,snippet,status,contentDetails",token,{method:"POST",body:JSON.stringify({snippet:{title:safeTitle(s.headline,100),description:"JANTA BOL Phase 3A Live\n"+marker+"\nJB-LIVE-SESSION:"+s.id,scheduledStartTime:scheduled},status:{privacyStatus:privacy},contentDetails:{enableEmbed:false,enableDvr:true,recordFromStart:true,enableAutoStart:false,enableAutoStop:false,monitorStream:{enableMonitorStream:false}}})});
          }catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN"){await updateGen({provider_state:"AMBIGUOUS",provider_last_safe_error_code:"BROADCAST_CREATE_AMBIGUOUS"});return json({ok:false,ambiguous:true,error:"BROADCAST_CREATE_AMBIGUOUS"},409)}throw e}
          broadcastId=String(d?.id??"");if(!broadcastId)throw new Error("BROADCAST_ID_MISSING");
          await updateGen({provider_broadcast_id:broadcastId,provider_video_id:broadcastId,playback_reference:broadcastId,provider_broadcast_lifecycle:String(d?.status?.lifeCycleStatus??""),provider_state:"CREATING",provider_last_safe_error_code:null});
          await journalStep("BROADCAST_CONFIRMED",{broadcast_id:broadcastId,recovered:false});
        }
      }

      await journalStep("STREAM_CREATE_CHECK",{broadcast_id:broadcastId});
      if(!streamId){
        const recovered=await findStreamByMarker(token,marker);
        if(recovered?.id){
          streamId=String(recovered.id);
          await updateGen({provider_stream_id:streamId,provider_stream_status:String(recovered?.status?.streamStatus??""),provider_health_status:String(recovered?.status?.healthStatus?.status??""),provider_state:"CREATING",credential_status:"SERVER_ONLY",provider_last_safe_error_code:null});
          await journalStep("STREAM_CONFIRMED",{broadcast_id:broadcastId,stream_id:streamId,recovered:true});
        }else{
          let d:any;
          try{d=await yt("liveStreams?part=id,snippet,cdn,status,contentDetails",token,{method:"POST",body:JSON.stringify({snippet:{title:safeTitle("JB "+s.headline,128),description:"JANTA BOL isolated non-reusable stream\n"+marker},cdn:{ingestionType:"rtmp",resolution:c.resolution,frameRate:c.frameRate},contentDetails:{isReusable:false}})})}
          catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN"){await updateGen({provider_state:"ORPHAN_POSSIBLE",provider_last_safe_error_code:"STREAM_CREATE_AMBIGUOUS"});return json({ok:false,ambiguous:true,error:"STREAM_CREATE_AMBIGUOUS"},409)}throw e}
          streamId=String(d?.id??"");if(!streamId)throw new Error("STREAM_ID_MISSING");
          await updateGen({provider_stream_id:streamId,provider_stream_status:String(d?.status?.streamStatus??""),provider_health_status:String(d?.status?.healthStatus?.status??""),provider_state:"CREATING",credential_status:"SERVER_ONLY",provider_last_safe_error_code:null});
          await journalStep("STREAM_CONFIRMED",{broadcast_id:broadcastId,stream_id:streamId,recovered:false});
        }
      }

      if(streamId)await journalStep("STREAM_CONFIRMED",{broadcast_id:broadcastId,stream_id:streamId});
      await journalStep("BIND_CHECK",{broadcast_id:broadcastId,stream_id:streamId});
      const before=await getBroadcast(token,broadcastId);
      const bound=String(before?.contentDetails?.boundStreamId??"");
      if(bound!==streamId){
        try{await yt("liveBroadcasts/bind?id="+encodeURIComponent(broadcastId)+"&streamId="+encodeURIComponent(streamId)+"&part=id,status,contentDetails",token,{method:"POST",body:"{}"})}
        catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN"){const verify=await getBroadcast(token,broadcastId);if(String(verify?.contentDetails?.boundStreamId??"")!==streamId){await updateGen({provider_state:"AMBIGUOUS",provider_last_safe_error_code:"BIND_AMBIGUOUS"});return json({ok:false,ambiguous:true,error:"BIND_AMBIGUOUS"},409)}}else throw e}
      }

      const b=await getBroadcast(token,broadcastId),st=await getStream(token,streamId,false);
      if(String(b?.contentDetails?.boundStreamId??"")!==streamId)throw new Error("BIND_VERIFY_FAILED");
      await updateGen({provider_state:"READY",provider_broadcast_lifecycle:String(b?.status?.lifeCycleStatus??""),provider_stream_status:String(st?.status?.streamStatus??""),provider_health_status:String(st?.status?.healthStatus?.status??""),provider_bound_stream_id:streamId,playback_reference:broadcastId,provider_last_safe_error_code:null});
      await journalStep("BIND_CONFIRMED",{broadcast_id:broadcastId,stream_id:streamId,bound:true});
      return json({ok:true,action,provider_state:"READY",broadcast_id:broadcastId,stream_id:streamId,playback_reference:broadcastId,broadcast_lifecycle:String(b?.status?.lifeCycleStatus??""),stream_status:String(st?.status?.streamStatus??"")});
    }

    if(action==="get_state"){
      if(!g.provider_broadcast_id||!g.provider_stream_id)throw new Error("PROVIDER_IDS_MISSING");
      const b=await getBroadcast(token,String(g.provider_broadcast_id)),st=await getStream(token,String(g.provider_stream_id),false);
      const lifecycle=String(b?.status?.lifeCycleStatus??""),streamStatus=String(st?.status?.streamStatus??""),health=String(st?.status?.healthStatus?.status??"");
      await updateGen({provider_broadcast_lifecycle:lifecycle,provider_stream_status:streamStatus,provider_health_status:health,provider_bound_stream_id:String(b?.contentDetails?.boundStreamId??""),provider_last_safe_error_code:null});
      return json({ok:true,action,broadcast_lifecycle:lifecycle,stream_status:streamStatus,health_status:health,bound_stream_id:String(b?.contentDetails?.boundStreamId??"")});
    }

    if(action==="get_encoder_ingest"){
      if(!g.provider_stream_id)throw new Error("STREAM_ID_MISSING");
      const st=await getStream(token,String(g.provider_stream_id),true);const info=st?.cdn?.ingestionInfo||{};const streamName=String(info.streamName??""),addr=String(info.rtmpsIngestionAddress??info.ingestionAddress??"");
      if(!streamName||!addr)throw new Error("INGEST_CONFIG_MISSING");
      if(!addr.startsWith("rtmps://")&&!addr.startsWith("rtmp://"))throw new Error("INGEST_PROTOCOL_INVALID");
      return json({ok:true,action,rtmps_address:addr,stream_name:streamName,stream_status:String(st?.status?.streamStatus??"")});
    }

    if(action==="transition_live"){
      if(!g.provider_broadcast_id||!g.provider_stream_id)throw new Error("PROVIDER_IDS_MISSING");
      const st=await getStream(token,String(g.provider_stream_id),false);const streamStatus=String(st?.status?.streamStatus??"");
      if(streamStatus!=="active"){await updateGen({provider_stream_status:streamStatus,provider_health_status:String(st?.status?.healthStatus?.status??"")});return json({ok:false,waiting_signal:true,error:"STREAM_NOT_ACTIVE",stream_status:streamStatus},409)}
      let b=await getBroadcast(token,String(g.provider_broadcast_id));let life=String(b?.status?.lifeCycleStatus??"");
      if(life!=="live"){
        if(life==="liveStarting")return json({ok:false,pending:true,error:"LIVE_TRANSITION_PENDING"},409);
        try{await yt("liveBroadcasts/transition?broadcastStatus=live&id="+encodeURIComponent(String(g.provider_broadcast_id))+"&part=id,status,contentDetails",token,{method:"POST",body:"{}"})}
        catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN"){b=await getBroadcast(token,String(g.provider_broadcast_id));life=String(b?.status?.lifeCycleStatus??"");if(life!=="live"&&life!=="liveStarting")return json({ok:false,ambiguous:true,error:"LIVE_TRANSITION_AMBIGUOUS"},409)}else throw e}
        b=await getBroadcast(token,String(g.provider_broadcast_id));life=String(b?.status?.lifeCycleStatus??"");
      }
      await updateGen({provider_broadcast_lifecycle:life,provider_stream_status:streamStatus,provider_health_status:String(st?.status?.healthStatus?.status??""),provider_state:life==="live"?"ACTIVE":g.provider_state,credential_status:life==="live"?"ACTIVE":g.credential_status,active_at:life==="live"?(g.active_at??new Date().toISOString()):g.active_at});
      if(life!=="live")return json({ok:false,pending:true,error:"LIVE_TRANSITION_PENDING",broadcast_lifecycle:life},409);
      return json({ok:true,action,broadcast_lifecycle:life,stream_status:streamStatus,playback_reference:String(g.playback_reference??g.provider_broadcast_id)});
    }

    if(action==="complete_broadcast"){
      if(!g.provider_broadcast_id)throw new Error("BROADCAST_ID_MISSING");
      let b=await getBroadcast(token,String(g.provider_broadcast_id));let life=String(b?.status?.lifeCycleStatus??"");
      if(life!=="complete"){
        if(["ready","created"].includes(life)){
          const st=g.provider_stream_id?await getStream(token,String(g.provider_stream_id),false):null;
          const streamStatus=String(st?.status?.streamStatus??g.provider_stream_status??"");
          if(streamStatus!=="active"){
            await updateGen({provider_broadcast_lifecycle:life,provider_stream_status:streamStatus,provider_last_safe_error_code:null});
            return json({ok:true,action,never_live:true,broadcast_lifecycle:life,stream_status:streamStatus});
          }
        }
        try{await yt("liveBroadcasts/transition?broadcastStatus=complete&id="+encodeURIComponent(String(g.provider_broadcast_id))+"&part=id,status,contentDetails",token,{method:"POST",body:"{}"})}
        catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN"){b=await getBroadcast(token,String(g.provider_broadcast_id));life=String(b?.status?.lifeCycleStatus??"");if(life!=="complete")return json({ok:false,ambiguous:true,error:"COMPLETE_AMBIGUOUS"},409)}else throw e}
        b=await getBroadcast(token,String(g.provider_broadcast_id));life=String(b?.status?.lifeCycleStatus??"");
      }
      await updateGen({provider_broadcast_lifecycle:life,provider_broadcast_completed_at:life==="complete"?new Date().toISOString():null,provider_state:life==="complete"?"RETIRE_PENDING":g.provider_state,credential_status:life==="complete"?"RETIRE_PENDING":g.credential_status});
      return life==="complete"?json({ok:true,action,broadcast_lifecycle:life}):json({ok:false,pending:true,error:"COMPLETE_PENDING",broadcast_lifecycle:life},409);
    }

    if(action==="retire_stream"){
      if(!g.provider_stream_id){await updateGen({provider_state:"RETIRED",credential_status:"RETIRED",is_current:false,retired_at:new Date().toISOString(),provider_stream_retired_at:new Date().toISOString()});await service.from("live_sessions").update({current_provider_generation:null}).eq("id",String(g.session_id)).eq("current_provider_generation",generationId).eq("session_status","ENDED");return json({ok:true,action,already_absent:true})}
      const id=String(g.provider_stream_id);
      let existing:any=null;try{existing=await getStream(token,id,false)}catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN")return json({ok:false,ambiguous:true,error:"RETIRE_STATE_UNKNOWN"},409);throw e}
      if(existing){
        if(g.provider_broadcast_id){
          try{
            const b=await getBroadcast(token,String(g.provider_broadcast_id));
            const life=String(b?.status?.lifeCycleStatus??"");
            if(life!=="complete"){
              await yt("liveBroadcasts/bind?id="+encodeURIComponent(String(g.provider_broadcast_id))+"&part=id,status,contentDetails",token,{method:"POST",body:"{}"});
            }
          }catch(e){
            const m=String((e as Error).message??"");
            if(m==="PROVIDER_NETWORK_UNKNOWN")return json({ok:false,ambiguous:true,error:"RETIRE_UNBIND_AMBIGUOUS"},409);
            if(m!=="YT_liveBroadcastNotFound")throw e;
          }
        }
        try{await yt("liveStreams?id="+encodeURIComponent(id),token,{method:"DELETE"})}
        catch(e){if(String((e as Error).message)==="PROVIDER_NETWORK_UNKNOWN"){let check:any=null;try{check=await getStream(token,id,false)}catch(recheck){if(String((recheck as Error).message)==="PROVIDER_NETWORK_UNKNOWN")return json({ok:false,ambiguous:true,error:"RETIRE_STATE_UNKNOWN"},409);throw recheck}if(check)return json({ok:false,ambiguous:true,error:"RETIRE_AMBIGUOUS"},409)}else throw e}
      }
      const now=new Date().toISOString();await updateGen({provider_state:"RETIRED",credential_status:"RETIRED",is_current:false,retired_at:now,provider_stream_retired_at:now,provider_last_safe_error_code:null});await service.from("live_sessions").update({current_provider_generation:null}).eq("id",String(g.session_id)).eq("current_provider_generation",generationId).eq("session_status","ENDED");
      return json({ok:true,action,retired:true});
    }

    return json({ok:false,error:"ACTION_NOT_ALLOWED"},400);
  }catch(e){
    const m=safeCode((e as Error)?.message??"PROVIDER_ERROR");
    if(m==="STALE_GENERATION")return json({ok:false,error:m},409);
    if(["YOUTUBE_NOT_CONNECTED","YOUTUBE_REAUTH_REQUIRED","YOUTUBE_CONFIG_REQUIRED","YOUTUBE_SECRET_DECRYPT_FAILED"].includes(m))return json({ok:false,error:m},503);
    console.error("jb-youtube-provider",m);
    try{await service.from("live_provider_generations").update({provider_last_safe_error_code:m,provider_last_checked_at:new Date().toISOString()}).eq("generation_id",generationId)}catch{}
    return json({ok:false,error:m},500);
  }
});