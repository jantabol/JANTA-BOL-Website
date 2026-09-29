import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
function sameSecret(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
function safe(v:unknown){return String(v??"WORKER_ERROR").replace(/[^A-Z0-9_:-]/gi,"_").slice(0,120)}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
  const url=Deno.env.get("SUPABASE_URL")??"",serviceRole=Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY")??"";
  if(!url||!serviceRole)return json({ok:false,error:"SERVER_CONFIG_ERROR"},500);
  const service=createClient(url,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
  const auth=req.headers.get("Authorization")??"",token=auth.startsWith("Bearer ")?auth.slice(7):"";
  const scheduledSecret=req.headers.get("x-jb-worker-secret")??"";
  const cronInternal=req.headers.get("x-jb-cron-internal")??"";
  let authorized=sameSecret(token,serviceRole) || sameSecret(cronInternal,serviceRole);
  if(!authorized && scheduledSecret){
    const checked=await service.rpc("jb_live_worker_secret_valid_internal",{p_candidate:scheduledSecret});
    authorized=!checked.error && checked.data===true;
  }
  if(!authorized)return json({ok:false,error:"WORKER_AUTH_REQUIRED"},401);
  const workerId=(Deno.env.get("SB_EXECUTION_ID")??Deno.env.get("DENO_DEPLOYMENT_ID")??crypto.randomUUID()).slice(0,120);

  const claim=await service.rpc("jb_live_claim_operation_internal",{p_worker_id:workerId,p_lease_seconds:90});
  if(claim.error)return json({ok:false,error:"CLAIM_FAILED"},500);
  const op=claim.data as any;
  if(!op)return json({ok:true,state:"IDLE"});

  const operationId=String(op.operation_id??""),operationType=String(op.operation_type??""),sessionId=String(op.session_id??""),generationId=String(op.generation_id??"");
  async function mark(state:string,patch:Record<string,unknown>={}){
    const r=await service.from("live_operations").update({operation_state:state,worker_id:null,lease_until:null,updated_at:new Date().toISOString(),...patch}).eq("operation_id",operationId).eq("worker_id",workerId);
    if(r.error)throw new Error("OPERATION_MARK_FAILED");
  }
  async function retry(code:string,seconds=20){
    const r=await service.rpc("jb_live_mark_operation_retry_internal",{p_operation_id:operationId,p_worker_id:workerId,p_delay_seconds:seconds,p_safe_error_code:code});
    if(r.error||r.data!==true)throw new Error("RETRY_MARK_FAILED");
  }
  async function ambiguous(code:string,seconds=15){
    const current=await service.from("live_operations").select("attempt_count").eq("operation_id",operationId).maybeSingle();
    if(current.error)throw new Error("AMBIGUOUS_BUDGET_READ_FAILED");
    const attempts=Number(current.data?.attempt_count??0);
    const maxAmbiguousAttempts=3;
    if(attempts>=maxAmbiguousAttempts){
      const r=await service.rpc("jb_live_mark_operation_failed_internal",{p_operation_id:operationId,p_worker_id:workerId,p_safe_error_code:"AMBIGUOUS_RETRY_BUDGET_EXHAUSTED"});
      if(r.error||r.data!==true)throw new Error("AMBIGUOUS_BUDGET_STOP_FAILED");
      await audit("live_operation_attention_required",{reason:"AMBIGUOUS_RETRY_BUDGET_EXHAUSTED",attempt_count:attempts});
      return "FAILED_NEEDS_ATTENTION";
    }
    const r=await service.rpc("jb_live_mark_operation_ambiguous_internal",{p_operation_id:operationId,p_worker_id:workerId,p_safe_error_code:code});
    if(r.error||r.data!==true)throw new Error("AMBIGUOUS_MARK_FAILED");
    await service.from("live_operations").update({next_attempt_at:new Date(Date.now()+seconds*1000).toISOString()}).eq("operation_id",operationId);
    return "AMBIGUOUS";
  }
  async function succeed(ref=""){
    const r=await service.rpc("jb_live_mark_operation_succeeded_internal",{p_operation_id:operationId,p_worker_id:workerId,p_provider_result_reference:ref});
    if(r.error||r.data!==true)throw new Error("SUCCESS_MARK_FAILED");
  }
  async function fail(code:string){
    const r=await service.rpc("jb_live_mark_operation_failed_internal",{p_operation_id:operationId,p_worker_id:workerId,p_safe_error_code:code});
    if(r.error||r.data!==true)throw new Error("FAIL_MARK_FAILED");
  }
  async function terminationRetryOrFail(code:string,seconds:number){
    const current=await service.from("live_operations").select("attempt_count").eq("operation_id",operationId).maybeSingle();
    if(current.error)throw new Error("TERMINATION_BUDGET_READ_FAILED");
    const attempts=Number(current.data?.attempt_count??0);
    const maxTerminationAttempts=3;
    if(attempts>=maxTerminationAttempts){
      await fail(code);
      await audit("live_operation_attention_required",{reason:code,attempt_count:attempts,operation_type:operationType});
      return "FAILED_NEEDS_ATTENTION";
    }
    await retry(code,seconds);
    return "RETRY_PENDING";
  }
  async function provider(action:string){
    let res:Response;
    try{res=await fetch(url+"/functions/v1/jb-youtube-provider",{method:"POST",headers:{Authorization:"Bearer "+serviceRole,apikey:serviceRole,"Content-Type":"application/json"},body:JSON.stringify({action,generation_id:generationId})})}
    catch{return{ok:false,status:0,data:{error:"PROVIDER_ADAPTER_NETWORK_ERROR"}}}
    const data=await res.json().catch(()=>({}));
    return{ok:res.ok&&data?.ok===true,status:res.status,data};
  }
  async function audit(action:string,metadata:Record<string,unknown>={}){
    await service.from("audit_logs").insert({actor_user_id:null,action,record_type:"live_operation",record_id:operationId,metadata:{session_id:sessionId,generation_id:generationId,...metadata}});
  }

  try{
    const ctx=await service.rpc("jb_live_operation_context_internal",{p_operation_id:operationId});
    if(ctx.error||!ctx.data)throw new Error("OPERATION_CONTEXT_MISSING");
    const c=ctx.data as any,s=c.session??{},g=c.generation??{},opctx=c.operation??{};
    const savedOperationStep=String(opctx.operation_step??"");
    const savedOperationData=(opctx.operation_data&&typeof opctx.operation_data==="object")?opctx.operation_data:{};
    if(!generationId||String(s.current_provider_generation)!==generationId||g.is_current!==true){
      await mark("CANCELLED_STALE",{completed_at:new Date().toISOString(),last_safe_error_code:"STALE_GENERATION"});
      await audit("live_operation_cancelled_stale");
      return json({ok:true,state:"CANCELLED_STALE",operation_id:operationId});
    }

    if(["PROVISION_LIVE","TRANSITION_LIVE"].includes(operationType)){
      const mem=await service.from("live_session_members").select("status,grant_version").eq("session_id",sessionId).eq("user_id",String(s.assigned_reporter_id??"")).eq("permission","BROADCAST").maybeSingle();
      if(mem.error||!mem.data||mem.data.status!=="ACTIVE"){
        await mark("CANCELLED_STALE",{completed_at:new Date().toISOString(),last_safe_error_code:"LIVE_PERMISSION_NOT_ACTIVE"});
        await audit("live_operation_cancelled_permission");
        return json({ok:true,state:"CANCELLED_STALE",operation_id:operationId});
      }
    }

    if(operationType==="PROVISION_LIVE"){
      if(savedOperationStep){await audit("live_operation_resume_from_journal",{operation_step:savedOperationStep,has_operation_data:Object.keys(savedOperationData).length>0});}
      const p=await provider("provision_generation");
      if(p.ok){
        const now=new Date().toISOString();
        const up=await service.from("live_sessions").update({session_status:"READY",public_status:"OFF",ready_at:now,state_version:Number(s.state_version??1)+1}).eq("id",sessionId).eq("current_provider_generation",generationId);
        if(up.error)throw new Error("SESSION_READY_UPDATE_FAILED");
        await succeed(String(p.data.playback_reference??""));
        await audit("live_provisioning_ready",{broadcast_id:String(p.data.broadcast_id??""),stream_id:String(p.data.stream_id??"")});
        return json({ok:true,state:"SUCCEEDED",operation_id:operationId,session_status:"READY"});
      }
      const code=safe(p.data?.error??"PROVISION_FAILED");
      if(p.data?.ambiguous===true){const a=await ambiguous(code,20);return json({ok:false,state:a,operation_id:operationId,error:a==="FAILED_NEEDS_ATTENTION"?"AMBIGUOUS_RETRY_BUDGET_EXHAUSTED":code},202)}
      if(["YOUTUBE_NOT_CONNECTED","YOUTUBE_REAUTH_REQUIRED","YOUTUBE_CONFIG_REQUIRED","YOUTUBE_SECRET_DECRYPT_FAILED"].includes(code)){await retry(code,30);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      if(p.status===0||p.status>=500){await retry(code,30);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      await fail(code);return json({ok:false,state:"FAILED_NEEDS_ATTENTION",operation_id:operationId,error:code},202);
    }

    if(operationType==="TRANSITION_LIVE"){
      const p=await provider("transition_live");const code=safe(p.data?.error??"TRANSITION_FAILED");
      if(p.ok){
        const playback=String(p.data.playback_reference??"");
        const activated=await service.rpc("jb_live_activate_public_internal",{p_session_id:sessionId,p_generation_id:generationId,p_playback_reference:playback});
        if(activated.error||!activated.data)throw new Error("PUBLIC_LIVE_ACTIVATION_FAILED");
        await succeed(playback);
        await audit("provider_live_confirmed",{broadcast_lifecycle:p.data.broadcast_lifecycle,public_status:"LIVE"});
        return json({ok:true,state:"SUCCEEDED",operation_id:operationId,provider_live:true,public_live:true});
      }
      if(p.data?.waiting_signal===true||p.data?.pending===true){await retry(code,5);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      if(p.data?.ambiguous===true){await ambiguous(code,10);return json({ok:false,state:"AMBIGUOUS",operation_id:operationId,error:code},202)}
      if(["YOUTUBE_NOT_CONNECTED","YOUTUBE_REAUTH_REQUIRED","YOUTUBE_CONFIG_REQUIRED"].includes(code)){await retry(code,30);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      if(p.status===0||p.status>=500){const state=await terminationRetryOrFail(code,20);return json({ok:false,state,operation_id:operationId,error:code},202)}
      await fail(code);return json({ok:false,state:"FAILED_NEEDS_ATTENTION",operation_id:operationId,error:code},202);
    }

    if(operationType==="REFRESH_PROVIDER_STATE"){
      const p=await provider("get_state");const code=safe(p.data?.error??"STATE_REFRESH_FAILED");
      if(p.ok){await succeed(String(p.data.broadcast_lifecycle??""));return json({ok:true,state:"SUCCEEDED",operation_id:operationId,provider:p.data})}
      if(p.status===0||p.status>=500){await retry(code,20);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      await fail(code);return json({ok:false,state:"FAILED_NEEDS_ATTENTION",operation_id:operationId,error:code},202);
    }

    if(operationType==="COMPLETE_LIVE"){
      const p=await provider("complete_broadcast");const code=safe(p.data?.error??"COMPLETE_FAILED");
      if(p.ok){
        if(p.data?.never_live===true){
          const ended=await service.rpc("jb_live_finalize_never_live_internal",{p_session_id:sessionId,p_generation_id:generationId});
          if(ended.error||!ended.data)throw new Error("LIVE_FINALIZE_NEVER_LIVE_FAILED");
          await succeed("never_live_end");
          await audit("provider_never_live_end_confirmed",{session_status:"ENDED",public_status:"OFF"});
          return json({ok:true,state:"SUCCEEDED",operation_id:operationId,session_status:"ENDED",public_status:"OFF",never_live:true});
        }
        const ended=await service.rpc("jb_live_finalize_end_internal",{p_session_id:sessionId,p_generation_id:generationId});
        if(ended.error||!ended.data)throw new Error("LIVE_FINALIZE_END_FAILED");
        await succeed("complete");
        await audit("provider_broadcast_completed",{session_status:"ENDED",public_status:"OFF"});
        return json({ok:true,state:"SUCCEEDED",operation_id:operationId,session_status:"ENDED",public_status:"OFF"});
      }
      if(p.data?.pending===true||p.data?.ambiguous===true){await retry(code,10);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      if(p.status===0||p.status>=500){await retry(code,20);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      await fail(code);return json({ok:false,state:"FAILED_NEEDS_ATTENTION",operation_id:operationId,error:code},202);
    }

    if(operationType==="RETIRE_STREAM"){
      const p=await provider("retire_stream");const code=safe(p.data?.error??"RETIRE_FAILED");
      if(p.ok){await succeed("retired");await audit("provider_stream_retired");return json({ok:true,state:"SUCCEEDED",operation_id:operationId})}
      if(p.data?.ambiguous===true||p.status===0||p.status>=500){const state=await terminationRetryOrFail(code,30);return json({ok:false,state,operation_id:operationId,error:code},202)}
      await fail(code);return json({ok:false,state:"FAILED_NEEDS_ATTENTION",operation_id:operationId,error:code},202);
    }

    if(operationType==="RECONCILE_LIVE"){
      const p=await provider("get_state");const code=safe(p.data?.error??"RECONCILE_FAILED");
      if(p.ok){
        const lifecycle=String(p.data?.broadcast_lifecycle??"");
        const streamStatus=String(p.data?.stream_status??"");
        if(lifecycle==="complete"){
          const ended=await service.rpc("jb_live_finalize_end_internal",{p_session_id:sessionId,p_generation_id:generationId});
          if(ended.error||!ended.data)throw new Error("LIVE_FINALIZE_END_FAILED");
          await succeed("complete");
          await audit("live_reconciled_complete");
          return json({ok:true,state:"SUCCEEDED",operation_id:operationId,session_status:"ENDED",public_status:"OFF"});
        }
        if(lifecycle==="live" && streamStatus==="active"){
          const playback=String(g.playback_reference??g.provider_broadcast_id??"");
          const activated=await service.rpc("jb_live_activate_public_internal",{p_session_id:sessionId,p_generation_id:generationId,p_playback_reference:playback});
          if(activated.error||!activated.data)throw new Error("PUBLIC_LIVE_ACTIVATION_FAILED");
          await retry("RECONCILE_CONTINUE",15);
          return json({ok:true,state:"RETRY_PENDING",operation_id:operationId,session_status:"LIVE",public_status:"LIVE"});
        }
        if(["empty","error","inactive","created","ready"].includes(streamStatus) || lifecycle!=="live"){
          if(String(s.session_status)==="LIVE" || String(s.session_status)==="RECONNECTING" || String(s.public_status)==="LIVE" || String(s.public_status)==="INTERRUPTED"){
            const interrupted=await service.rpc("jb_live_mark_interrupted_internal",{p_session_id:sessionId,p_generation_id:generationId,p_reason:"PROVIDER_SIGNAL_INTERRUPTED"});
            if(interrupted.error)throw new Error("LIVE_INTERRUPT_UPDATE_FAILED");
          }
          await retry("WAITING_FOR_PROVIDER_SIGNAL",10);
          return json({ok:true,state:"RETRY_PENDING",operation_id:operationId,session_status:"RECONNECTING"});
        }
        await retry("RECONCILE_WAIT",10);
        return json({ok:true,state:"RETRY_PENDING",operation_id:operationId});
      }
      if(["YOUTUBE_REAUTH_REQUIRED","YOUTUBE_NOT_CONNECTED","YOUTUBE_CONFIG_REQUIRED"].includes(code)){
        await retry(code,30);
        return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202);
      }
      if(p.status===0||p.status>=500){await retry(code,20);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202)}
      await retry(code,20);return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202);
    }

    await mark("CANCELLED_STALE",{completed_at:new Date().toISOString(),last_safe_error_code:"UNKNOWN_OPERATION_TYPE"});
    return json({ok:true,state:"CANCELLED_STALE",operation_id:operationId});
  }catch(e){
    const code=safe((e as Error)?.message??"WORKER_ERROR");
    try{await retry(code,30)}catch{}
    console.error("jb-live-worker",code);
    return json({ok:false,state:"RETRY_PENDING",operation_id:operationId,error:code},202);
  }
});