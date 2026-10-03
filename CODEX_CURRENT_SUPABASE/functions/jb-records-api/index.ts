import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

type JsonRecord=Record<string,unknown>;

function json(body:JsonRecord,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function jwtPayload(token:string):Record<string,unknown>{
  try{
    const part=token.split(".")[1]??"";
    const normalized=part.replace(/-/g,"+").replace(/_/g,"/");
    const padded=normalized.padEnd(Math.ceil(normalized.length/4)*4,"=");
    return JSON.parse(atob(padded));
  }catch{return {};}
}
function recentMfa(claims:Record<string,unknown>,maxAgeSeconds=600){
  if(String(claims.aal??"")!=="aal2")return false;
  const now=Math.floor(Date.now()/1000);
  const amr=Array.isArray(claims.amr)?claims.amr as Array<Record<string,unknown>>:[];
  const ts=amr
    .filter(x=>["totp","phone"].includes(String(x.method??""))&&/^[0-9]+$/.test(String(x.timestamp??"")))
    .map(x=>Number(x.timestamp)).filter(Number.isFinite).sort((a,b)=>b-a)[0];
  if(!ts)return false;
  const age=now-ts;
  return age>=-60&&age<=maxAgeSeconds;
}
function validUuid(v:unknown){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v??""));
}
function clean(v:unknown,max:number){return String(v??"").trim().slice(0,max);}
function safeError(e:unknown){
  const m=String((e as {message?:unknown})?.message??"RECORDS_REQUEST_FAILED");
  const known=[
    "OWNER_REQUIRED","OWNER_AAL2_REQUIRED","OWNER_RECENT_MFA_REQUIRED","INVALID_SESSION",
    "RECORD_IDENTITY_REQUIRED","RETENTION_POLICY_NOT_FOUND","RETENTION_RECORD_NOT_FOUND",
    "RECORD_ALREADY_DISPOSED","RETENTION_HOLD_ACTIVE","RETENTION_HOLD_NOT_ACTIVE",
    "VALID_EXTENSION_DATE_REQUIRED","REASON_REQUIRED","INVALID_RETENTION_ACTION",
    "ARTICLE_NOT_FOUND","INVALID_DISPLAY_OVERRIDE","RETENTION_DUE_REQUIRED",
    "RETENTION_NOT_DUE","TRASH_ARTICLE_REQUIRED","RECENT_MFA_REQUIRED","ARTICLE_ID_RETIRED"
  ];
  return known.find(x=>m.includes(x))??"RECORDS_REQUEST_FAILED";
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")??"";
  const serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
  if(!supabaseUrl||!serviceRoleKey)return json({ok:false,error:"SERVER_CONFIG_ERROR"},500);

  const authHeader=req.headers.get("Authorization")??"";
  if(!authHeader.startsWith("Bearer "))return json({ok:false,error:"AUTH_REQUIRED"},401);
  const token=authHeader.slice(7);

  const userClient=createClient(supabaseUrl,serviceRoleKey,{
    global:{headers:{Authorization:authHeader}},
    auth:{persistSession:false,autoRefreshToken:false}
  });
  const service=createClient(supabaseUrl,serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false}
  });

  try{
    const {data:userData,error:userError}=await userClient.auth.getUser(token);
    if(userError||!userData?.user)return json({ok:false,error:"INVALID_SESSION"},401);

    const claims=jwtPayload(token);
    const sessionId=String(claims.session_id??"");
    if(!validUuid(sessionId))return json({ok:false,error:"INVALID_SESSION"},401);

    const ctx=await service.rpc("jb_records_actor_context_internal",{
      p_user_id:userData.user.id,p_session_id:sessionId
    });
    if(ctx.error)return json({ok:false,error:"SECURITY_CHECK_UNAVAILABLE"},503);
    const context=ctx.data??{};
    if(!context.session_active)return json({ok:false,error:"INVALID_SESSION"},401);
    if(String(context.app_role??"")!=="owner")return json({ok:false,error:"OWNER_REQUIRED"},403);
    if(String(claims.aal??"")!=="aal2")return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);

    const body=await req.json().catch(()=>({}));
    const action=String(body?.action??"");
    const payload=(body?.payload&&typeof body.payload==="object")?body.payload as JsonRecord:{};

    const highRisk=new Set([
      "audit_export","retention_register","retention_action","permanent_delete_article"
    ]);
    if(highRisk.has(action)&&!recentMfa(claims,600)){
      return json({ok:false,error:"OWNER_RECENT_MFA_REQUIRED"},403);
    }

    if(action==="audit_lookup"){
      const recordType=clean(payload.record_type,120)||null;
      const recordId=clean(payload.record_id,240)||null;
      const limit=Math.max(1,Math.min(Number(payload.limit??100)||100,500));
      const x=await service.rpc("jb_records_audit_lookup_internal",{
        p_actor:userData.user.id,p_record_type:recordType,p_record_id:recordId,p_limit:limit
      });
      if(x.error)throw x.error;
      return json({ok:true,rows:x.data??[]});
    }

    if(action==="audit_export"){
      const recordType=clean(payload.record_type,120)||null;
      const recordId=clean(payload.record_id,240)||null;
      const limit=Math.max(1,Math.min(Number(payload.limit??500)||500,2000));
      const x=await service.rpc("jb_records_audit_export_internal",{
        p_actor:userData.user.id,p_record_type:recordType,p_record_id:recordId,p_limit:limit
      });
      if(x.error)throw x.error;
      return json({ok:true,export:x.data});
    }

    if(action==="retention_get"){
      const domain=clean(payload.domain,80).toLowerCase();
      const recordType=clean(payload.record_type,120).toLowerCase();
      const recordId=clean(payload.record_id,240);
      const x=await service.rpc("jb_records_retention_get_internal",{
        p_actor:userData.user.id,p_domain:domain,p_record_type:recordType,p_record_id:recordId
      });
      if(x.error)throw x.error;
      return json({ok:true,record:x.data});
    }

    if(action==="retention_due_list"){
      const q=await service.from("record_retention_state")
        .select("domain,record_type,record_id,policy_key,lifecycle_state,retention_due_at,extension_until,hold_active,hold_reason,archived_at,disposed_at,updated_at")
        .in("lifecycle_state",["due","extended","hold","archived"])
        .order("updated_at",{ascending:false}).limit(100);
      if(q.error)throw q.error;
      return json({ok:true,records:q.data??[]});
    }

    if(action==="retention_register"){
      const domain=clean(payload.domain,80).toLowerCase();
      const recordType=clean(payload.record_type,120).toLowerCase();
      const recordId=clean(payload.record_id,240);
      const policyKey=clean(payload.policy_key,160)||null;
      const dueAt=payload.due_at?String(payload.due_at):null;
      const x=await service.rpc("jb_records_retention_register_internal",{
        p_actor:userData.user.id,p_domain:domain,p_record_type:recordType,p_record_id:recordId,
        p_policy_key:policyKey,p_due_at:dueAt
      });
      if(x.error)throw x.error;
      return json({ok:true,result:x.data});
    }

    if(action==="retention_action"){
      const domain=clean(payload.domain,80).toLowerCase();
      const recordType=clean(payload.record_type,120).toLowerCase();
      const recordId=clean(payload.record_id,240);
      const requested=clean(payload.retention_action,40).toUpperCase();
      const reason=clean(payload.reason,500)||null;
      const dueAt=payload.new_due_at?String(payload.new_due_at):null;
      const x=await service.rpc("jb_records_retention_action_internal",{
        p_actor:userData.user.id,p_domain:domain,p_record_type:recordType,p_record_id:recordId,
        p_action:requested,p_reason:reason,p_new_due_at:dueAt
      });
      if(x.error)throw x.error;
      return json({ok:true,result:x.data});
    }

    if(action==="public_views_get"){
      const articleId=String(payload.article_id??"");
      if(!validUuid(articleId))return json({ok:false,error:"INVALID_ARTICLE_ID"},400);
      const [settings,stats]=await Promise.all([
        service.from("article_public_view_settings")
          .select("article_id,public_views_enabled,display_override,updated_at")
          .eq("article_id",articleId).maybeSingle(),
        service.from("article_stats").select("article_id,views,shares").eq("article_id",articleId).maybeSingle()
      ]);
      if(settings.error)throw settings.error;
      if(stats.error)throw stats.error;
      const rawViews=Number(stats.data?.views??0);
      const enabled=Boolean(settings.data?.public_views_enabled);
      const override=settings.data?.display_override==null?null:Number(settings.data.display_override);
      return json({ok:true,view_state:{
        article_id:articleId,public_views_enabled:enabled,display_override:override,
        raw_views:rawViews,display_views:enabled?(override??rawViews):null,raw_shares:Number(stats.data?.shares??0)
      }});
    }

    if(action==="public_views_set"){
      const articleId=String(payload.article_id??"");
      if(!validUuid(articleId))return json({ok:false,error:"INVALID_ARTICLE_ID"},400);
      const override=payload.display_override==null||payload.display_override===""?null:Number(payload.display_override);
      if(override!=null&&(!Number.isSafeInteger(override)||override<0))return json({ok:false,error:"INVALID_DISPLAY_OVERRIDE"},400);
      const x=await service.rpc("jb_records_set_public_views_internal",{
        p_actor:userData.user.id,p_article_id:articleId,p_enabled:payload.enabled===true,p_display_override:override
      });
      if(x.error)throw x.error;
      return json({ok:true,result:x.data});
    }

    if(action==="permanent_delete_article"){
      const articleId=String(payload.article_id??"");
      if(!validUuid(articleId))return json({ok:false,error:"INVALID_ARTICLE_ID"},400);
      const x=await userClient.rpc("jb_owner_permanent_delete_article",{p_article_id:articleId});
      if(x.error)throw x.error;
      return json({ok:true,result:Boolean(x.data)});
    }

    return json({ok:false,error:"UNKNOWN_ACTION"},400);
  }catch(e){
    const code=safeError(e);
    console.error("jb-records-api",code,String((e as {message?:unknown})?.message??e));
    return json({ok:false,error:code},code==="RECORDS_REQUEST_FAILED"?500:409);
  }
});