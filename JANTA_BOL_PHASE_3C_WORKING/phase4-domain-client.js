(function(g){'use strict';
const b=()=>g.JBBackend,c=()=>{if(!b()?.client)throw Error('BACKEND_NOT_READY');return b().client},owner=()=>b().requireOwner();
async function rpc(n,a){const {data,error}=await c().rpc(n,a||{});if(error)throw error;return data}
async function grievanceRows(status=''){await owner();let q=c().from('grievances').select('*').order('created_at',{ascending:false});if(status)q=q.eq('status',status);const {data,error}=await q;if(error)throw error;return data||[]}
const grievanceTransition=(id,status,note='')=>rpc('jb_grievance_transition_internal',{p_id:id,p_status:status,p_note:note});
const grievanceReopen=(id,note)=>rpc('jb_grievance_reopen_internal',{p_id:id,p_note:note});
const grievanceDuplicate=(id,original,note='')=>rpc('jb_grievance_link_duplicate_internal',{p_id:id,p_original:original,p_note:note});
const grievanceIssueAdd=(id,text)=>rpc('jb_grievance_add_issue_internal',{p_grievance:id,p_issue:text});
async function grievanceHistory(id){await owner();const {data,error}=await c().from('grievance_history').select('*').eq('grievance_id',id).order('created_at');if(error)throw error;return data||[]}
async function complianceRows(){await owner();const {data,error}=await c().from('compliance_tasks').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[]}
const complianceMonth=m=>rpc('jb_compliance_generate_month_internal',{p_month:m});
const complianceApproveMonth=(m,summary)=>rpc('jb_compliance_approve_month_internal',{p_month:m,p_summary:summary||'',p_publish:false});
const complianceTransition=(id,status,ack='')=>rpc('jb_compliance_transition_internal',{p_id:id,p_status:status,p_ack:ack||null});
const publicAdRequest=x=>rpc('jb_ad_public_request',{p_name:x.name,p_contact:x.contact,p_package:x.package||null,p_placement:x.placement||'homepage',p_scope:x.scope||'global',p_risk:x.risk||'normal',p_kind:x.kind||'standard'});
const publicAdPackages=()=>rpc('jb_ad_public_packages',{});
async function adRows(){await owner();const {data,error}=await c().from('ad_campaigns').select('*,advertisers(name,verification_state,risk_level),ad_creatives(*)').order('created_at',{ascending:false});if(error)throw error;return data||[]}
const adTransition=(id,status,note='')=>rpc('jb_ad_transition_internal',{p_id:id,p_status:status,p_note:note});
const adCreative=(id,x)=>rpc('jb_ad_save_creative_internal',{p_campaign:id,p_type:x.type,p_media:x.media||null,p_text:x.text||null,p_cta_type:x.ctaType||null,p_cta_target:x.ctaTarget||null});
const adConfirmPayment=(id,ref,amount)=>rpc('jb_ad_confirm_payment_internal',{p_campaign:id,p_provider_ref:ref||'',p_amount_minor:Number(amount||0)});
const adSchedule=(id,start,end)=>rpc('jb_ad_schedule_internal',{p_campaign:id,p_starts_at:start,p_ends_at:end});
g.JBPhase4={grievanceRows,grievanceTransition,grievanceReopen,grievanceDuplicate,grievanceIssueAdd,grievanceHistory,complianceRows,complianceMonth,complianceApproveMonth,complianceTransition,publicAdRequest,publicAdPackages,adRows,adTransition,adCreative,adConfirmPayment,adSchedule};
})(window);