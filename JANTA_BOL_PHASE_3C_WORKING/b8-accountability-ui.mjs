/**
 * B8 G3 CP01 Android-first private UI controller — REVIEW ONLY.
 * B0–B7 old frontend untouched. NO dispatch button, no local evidence storage.
 * Server RPC guards remain the final role/session/Case authority.
 */
import {createB8Workflow,validId} from './b8-accountability-client.mjs';

const $=id=>document.getElementById(id);
const status=$('status'),guard=$('guard'),app=$('app');
const LOCK_MS=15*60*1000;
let workflow=null,role=null,lastActivity=Date.now(),busy=false,locked=false;
const ALL_FORMS=['createCase','assignStaff','linkArticle','legalHold','packetForm',
  'caseLookup','draftForm','requestReview','reporterClaim','uploadForm','editorRead','editorDecision'];
function showStatus(text,kind='warn'){
  status.textContent=String(text);
  status.className='status '+kind;
}
function showJSON(node,value){
  // NEVER insert raw data as HTML or use an untrusted inline event handler.
  node.textContent=JSON.stringify(value,null,2);
}
function lock(reason){
  locked=true;workflow=null;role=null;busy=false;
  app.classList.add('hide');
  for(const section of ['owner','reporter','editor'])$(section).classList.add('hide');
  $('founderPacket').textContent='Locked — Private Packet cleared.';
  $('editorCard').textContent='Locked — Private Review cleared.';
  $('reporterCard').textContent='Locked — Case details cleared.';
  guard.textContent=reason||'Security check required. Please reload this page.';
  guard.classList.remove('hide');
}
async function requireFreshIdentity(){
  if(locked||!workflow)throw Error('B8_SCREEN_LOCKED');
  if(Date.now()-lastActivity>LOCK_MS){
    lock('15 मिनट निष्क्रिय — B8 Screen Lock। Page Reload करके फिर Login की पुष्टि करें।');
    throw Error('B8_15_MINUTE_INACTIVITY_LOCK');
  }
  if(!navigator.onLine)throw Error('B8_OFFLINE_NO_SERVER_CONFIRMATION');
  const {data,error}=await window.JBBackend.client.auth.getUser();
  if(error||!data?.user)throw Error('B8_LOGIN_EXPIRED');
  const liveRole=await window.JBBackend.role();
  if(liveRole!==role)throw Error('B8_ROLE_CHANGED');
  if(role==='owner')await window.JBBackend.requireOwner();
}
async function execute(form,action){
  if(busy)return;
  busy=true;
  const button=form.querySelector('[type="submit"]');
  if(button)button.disabled=true;
  try{
    await requireFreshIdentity();
    showStatus('Backend Confirmation का इंतजार… अभी कोई सवाल भेजा नहीं गया है।');
    const response=await action();
    showStatus(response||'Server ने कार्रवाई की पुष्टि की। सवाल अभी नहीं भेजा गया है।','good');
  }catch(e){
    showStatus('कार्रवाई रोक दी गई: '+String(e?.message||'BACKEND_UNAVAILABLE')+
      '\nकिसी Draft, Review, Upload या SEND को सफलता नहीं माना गया।','bad');
  }finally{
    busy=false;if(button&&!locked)button.disabled=false;
    // Uploaded file path remains disabled until reviewed hosted release.
    $('uploadBtn').disabled=true;
  }
}
function form(id,fn){$(id).addEventListener('submit',e=>{
  e.preventDefault();
  execute($(id),fn);
});}
const v=id=>$(id).value.trim();
async function boot(){
  try{
    if(!window.JBBackend?.client||!navigator.onLine)throw Error('B8_BACKEND_OFFLINE_OR_UNAVAILABLE');
    const session=await window.JBBackend.session();
    if(!session?.user)throw Error('B8_EXISTING_STAFF_SESSION_REQUIRED');
    const {data,error}=await window.JBBackend.client.auth.getUser();
    if(error||data?.user?.id!==session.user.id)throw Error('B8_SESSION_NOT_VERIFIED');
    const currentRole=await window.JBBackend.role();
    if(!['owner','editor','reporter'].includes(currentRole))throw Error('B8_STAFF_ROLE_REQUIRED');
    if(currentRole==='owner')await window.JBBackend.requireOwner();
    role=currentRole;
    // Upload is deliberately OFF until paired SQL/Edge deployment receives H1 E2.
    workflow=createB8Workflow({client:window.JBBackend.client,role,allowPrivateUpload:false});
    locked=false;lastActivity=Date.now();
    $('roleName').textContent='Verified Session Role: '+role.toUpperCase();
    guard.classList.add('hide');app.classList.remove('hide');
    $(role).classList.remove('hide');
    showStatus('Role verified for this page. केवल नए B8 RPCs की वास्तविक Server पुष्टि स्वीकार होगी; SEND अभी नहीं।');
  }catch(e){
    lock('B8 PRIVATE ACCESS STOP: '+String(e?.message||'BACKEND_UNAVAILABLE')+
      '. पहले मौजूदा अधिकृत Staff Login और reviewed Backend deployment चाहिए।');
  }
}
for(const event of ['pointerdown','keydown','touchstart']){
  document.addEventListener(event,()=>{if(!locked)lastActivity=Date.now();},{passive:true});
}
window.setInterval(()=>{
  if(workflow&&!locked&&Date.now()-lastActivity>LOCK_MS)
    lock('B8 Screen 15 मिनट के बाद Locked। निजी जानकारी छिपा दी गई है। Reload करें।');
},30000);
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&workflow&&Date.now()-lastActivity>LOCK_MS)
    lock('B8 inactive session locked. Reload for genuine staff check.');
});
$('refreshLogin').addEventListener('click',()=>window.location.reload());

form('createCase',async()=>{
  const id=await workflow.ownerCreateCase(v('caseTitle'),v('caseArea'),v('caseRisk'));
  for(const name of ['assignCase','linkCase','holdCase'])$(name).value=id;
  return 'PRIVATE Case Created: '+id+'\nयह Public News या सवाल का SEND नहीं है।';
});
form('assignStaff',async()=>{
  const expiry=new Date(v('grantUntil'));
  if(Number.isNaN(+expiry))throw Error('B8_INVALID_EXPIRY');
  const iso=expiry.toISOString();
  const good=v('staffRole')==='reporter'
    ?await workflow.ownerAssignReporter(v('assignCase'),v('staffId'),iso)
    :await workflow.ownerAssignEditor(v('assignCase'),v('staffId'),iso);
  return good?'असली Backend ने Case-Specific Staff Permission स्वीकार की। कोई Global Permission नहीं बदली।':'';
});
form('linkArticle',async()=>{
  const ref=await workflow.ownerLinkArticle(v('linkCase'),v('articleUuid'));
  return 'Existing Article Identity Link: '+ref+'\nमूल Article Published/Deleted नहीं हुआ।';
});
form('legalHold',async()=>{
  const hold=await workflow.ownerAssertHold(v('holdCase'),v('holdReason'));
  return 'Append-only Hold Confirmation #'+hold+'; Original Source Protection requires production release gate.';
});
form('packetForm',async()=>{
  $('founderPacket').textContent='Loading gated private preview…';
  const packet=await workflow.ownerPreliminaryPacket(v('packetId'));
  showJSON($('founderPacket'),packet);
  return 'Owner AAL2 preliminary packet मिला। EVIDENCE_GAP, NOT_SENT और complete_proof_pack=false सत्यापित।';
});
form('caseLookup',async()=>{
  const c=await workflow.reporterCaseCard(v('reporterCase'));
  showJSON($('reporterCard'),c);
  $('questionCase').value=c.id;
  $('claimCase').value=c.id;
  $('uploadCase').value=c.id;
  return 'Case Permission Server द्वारा जाँची गई। Risk '+c.risk_lane+'. कोई संदेश नहीं भेजा गया।';
});
form('draftForm',async()=>{
  const result=await workflow.reporterCreateDraft(v('questionCase'),v('questionText'),v('recipient'));
  $('reviewDraftId').value=result.draftId;
  return 'Draft UUID: '+result.draftId+'\nस्थिति: '+result.status+
    '. वास्तविक अधिकारी तक कोई सवाल नहीं भेजा गया।';
});
form('requestReview',async()=>{
  const result=await workflow.reporterRequestReview(v('reviewDraftId'));
  return 'Editor Review Request UUID: '+result.requestId+
    '\nStatus: '+result.status+'\nActual Delivery: '+result.deliveryStatus;
});
form('reporterClaim',async()=>{
  const r=await workflow.reporterSubmitClaim(
    v('claimCase'),v('claimType'),v('claimLabel'),v('claimHash'));
  return 'Evidence Claim ID: '+r.claimId+'\n'+r.state+
    ' — कोई PDF/फोटो वास्तव में Upload या सत्यापित होने का दावा नहीं।';
});
form('uploadForm',async()=>{
  // Hard-disabled until deployment and physical E2/E3; never silently enable.
  throw Error('B8_PRIVATE_UPLOAD_WAIT_HOSTED_E2_AND_G3_ANDROID_RELEASE');
});
form('editorRead',async()=>{
  const data=await workflow.editorReviewCard(v('editorRequest'));
  $('decisionRequest').value=data.request_id;
  showJSON($('editorCard'),data);
  return 'Private Review पढ़ा गया; UNSENT_REVIEW_ONLY / EVIDENCE_NOT_VERIFIED.';
});
form('editorDecision',async()=>{
  const r=await workflow.editorRecordReview(
    v('decisionRequest'),v('decision'),v('decisionReason'));
  return 'Immutable Editor Decision ID: '+r.reviewId+'\n'+r.status+
    '. Official send अभी नहीं हुआ, Founder की वास्तविक E9 proof notification भी नहीं हुई।';
});


form('g3Packet',async()=>{
  $('g3PacketData').textContent='Authenticating Founder evidence and attached files…';
  const packet=await workflow.ownerEvidencePacket(v('g3PacketReq'));
  showJSON($('g3PacketData'),packet);
  return 'Verified private BYTE receipt metadata loaded. Official documentary authenticity is NOT verified; notification is IN_APP only.';
});
form('g3R2Authorization',async()=>{
  const x=await workflow.ownerAuthorizeRestricted(v('g3R2Req'),v('g3R2Reason'));
  return 'R2 Founder AAL2 authorization ID: '+x.approvalId+
    '\nNo official message was sent: '+x.externalStatus;
});
form('g3Truth',async()=>{
  const p=await workflow.ownerHandoffTruth(v('g3TruthQ'));
  showJSON($('g3TruthData'),p);
  return 'Handoff verified from backend; provider acceptance and official receipt remain NOT VERIFIED.';
});
form('g3EvidenceLink',async()=>{
  const x=await workflow.reporterLinkReceipt(v('g3LinkReq'),v('g3LinkReceipt'));
  return 'Private receipt linked by Server: '+x.linkId+
   '\nThis verifies only private byte integrity, not authenticity of accusations.';
});
form('g3Handoff',async()=>{
  const x=await workflow.reporterPrepareHandoff(v('g3HandoffQ'),v('g3HandoffChannel'));
  $('g3ObsIntent').value=x.handoffId;
  return 'Manual handoff prepared: '+x.handoffId+
    '\n'+x.state+' — this did NOT send a message to the official.';
});
form('g3Observation',async()=>{
  const type=v('g3ObsType'),receipt=v('g3ObsReceipt')||null;
  const x=await workflow.reporterRecordHandoff(v('g3ObsIntent'),type,receipt);
  return 'Attempt observation stored: '+x.observationId+
    '\nExternal Delivery: '+x.externalStatus+
    '. This is NOT a delivery receipt verification.';
});
form('g3Screen',async()=>{
  const x=await workflow.editorScreenSerious(v('g3ScreenReq'),v('g3ScreenReason'));
  return 'Immutable Editor R1 evidence screening: '+x.screeningId+
    '\nQuestion NOT SENT: '+x.externalStatus;
});

// A wrong/injected DOM click on a hidden role does not bypass the JS role check,
// nor the real G1/G2 server role and case grants.
boot();
