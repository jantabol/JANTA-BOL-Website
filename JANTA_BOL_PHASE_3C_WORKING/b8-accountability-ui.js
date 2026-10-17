/**
 * B8 G3 CP01 Android-first private UI controller — REVIEW ONLY.
 * B0–B7 old frontend untouched. NO dispatch button, no local evidence storage.
 * Server RPC guards remain the final role/session/Case authority.
 */
import {createB8Workflow,validId} from './b8-accountability-client.js';

const $=id=>document.getElementById(id);
const status=$('status'),guard=$('guard'),app=$('app');
const LOCK_MS=15*60*1000;
let workflow=null,role=null,lastActivity=Date.now(),busy=false,locked=false;
let uploadReadyCase=null;
function updateUploadAvailability(){
  const enabled=role==='reporter'&&!locked&&!busy&&
    uploadReadyCase!==null&&$('uploadCase').value.trim()===uploadReadyCase;
  $('uploadBtn').disabled=!enabled;
}
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

const B8_KIND_HI=Object.freeze({
 COST:'लागत',DEADLINE:'समयसीमा',GROUND:'जमीनी स्थिति',
 IMPACT:'जनता पर प्रभाव',ALTERNATIVE:'विकल्प',RESPONSIBILITY:'जिम्मेदार पद',
 CONFLICT:'हितों का टकराव'
});
const B8_FIELD_HI=Object.freeze({
 ESTIMATED_PROPOSED:'अनुमानित / प्रस्तावित लागत — स्वीकृत या खर्च नहीं',
 SANCTIONED:'स्वीकृत बजट',TENDER:'निविदा राशि',REVISED:'संशोधित',
 ACTUAL:'बताया गया वास्तविक खर्च (स्वतंत्र सत्यापन बाकी)',
 ORIGINAL:'मूल समयसीमा',
 AUTHORITY_COMPLETION_CLAIM:'अधिकारी का काम पूरा होने का दावा',
 FIELD_OBSERVATION_REPORTED:'दर्ज जमीनी जानकारी',
 AUTHORITY_STATED:'अधिकारी द्वारा बताया गया प्रभाव',
 GROUND_REPORTED:'दर्ज जमीनी प्रभाव',
 DOCUMENTED_PROPOSAL:'दस्तावेज में दर्ज प्रस्ताव',
 UNVERIFIED_PROPOSAL:'अप्रमाणित प्रस्ताव',
 ROLE_MAP:'जिम्मेदार पद / भूमिका (दोष नहीं)',
 FLAG_RAISED:'हितों के टकराव का संकेत'
});
// Never convert large exact monetary DB decimals to a JS floating-point number.
function formatExactINR(raw){
 const m=/^(0|[1-9][0-9]*)(?:\.([0-9]{1,2}))?$/.exec(String(raw));
 if(!m)return 'राशि स्पष्ट नहीं है';
 const all=m[1],head=all.slice(0,-3),tail=all.slice(-3);
 const grouped=head?head.replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+tail:tail;
 return '₹'+grouped+(m[2]?'.'+m[2]:'');
}
function hindiDateTime(value){
 if(!value)return 'तारीख दर्ज नहीं';
 const time=new Date(value);
 if(Number.isNaN(time.getTime()))return 'तारीख स्पष्ट नहीं';
 return new Intl.DateTimeFormat('hi-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(time);
}
function ledgerRow(root,label,val){
 const row=document.createElement('div');row.className='b8-ledger-row';
 const key=document.createElement('strong');key.textContent=label+': ';
 const value=document.createElement('span');value.textContent=String(val??'उपलब्ध नहीं');
 row.append(key,value);root.append(row);
}
function displayHindiPrivateLedger(node,items){
 if(!Array.isArray(items))throw Error('B8_G5_PRIVATE_HISTORY_INVALID');
 node.replaceChildren();
 const heading=document.createElement('p');
 heading.className='b8-ledger-heading';
 heading.textContent='निजी तथ्य रिकॉर्ड — कुल '+items.length;
 node.append(heading);
 if(items.length===0){
  const empty=document.createElement('p');empty.textContent='इस मामले में अभी कोई निजी तथ्य दर्ज नहीं है।';
  node.append(empty);return;
 }
 for(const event of items){
  const card=document.createElement('section');card.className='b8-ledger-card';
  const name=document.createElement('h3');
  name.textContent=(B8_KIND_HI[event.kind]||'निजी तथ्य')+' का रिकॉर्ड #'+String(event.id??'—');
  card.append(name);
  ledgerRow(card,'रिकॉर्ड का वर्ग',B8_FIELD_HI[event.field]||'अलग दर्ज श्रेणी');
  if(event.kind==='COST'&&event.cost_inr!==null&&event.cost_inr!==undefined){
    ledgerRow(card,'राशि (रुपये)',formatExactINR(event.cost_inr));
    if(event.field==='ESTIMATED_PROPOSED'){
      ledgerRow(card,'महत्वपूर्ण स्पष्टता','यह ऐतिहासिक अनुमान है, स्वीकृत बजट या वास्तविक खर्च नहीं।');
    }else if(event.field==='ACTUAL'){
      ledgerRow(card,'महत्वपूर्ण स्पष्टता','यह दर्ज किया गया खर्च का दावा है, स्वतंत्र सत्यापन नहीं।');
    }
  }
  if(event.date)ledgerRow(card,'दर्ज समयसीमा',event.date);
  ledgerRow(card,'स्रोत और विवरण',event.detail);
  ledgerRow(card,'तथ्य की पुष्टि','स्वतंत्र सत्यापन बाकी; इसे प्रमाणित सरकारी तथ्य न मानें।');
  ledgerRow(card,'रिकॉर्ड बनाया गया',hindiDateTime(event.recorded_at));
  // The only source of authority is the server. No user-supplied HTML rendering.
  node.append(card);
 }
}

function lock(reason){
  locked=true;workflow=null;role=null;busy=false;uploadReadyCase=null;
  $('uploadBtn').disabled=true;
  $('uploadFile').value='';
  ownerKnownCases=[];
  if(ownerCasePick)ownerCasePick.replaceChildren();
  clearOwnerCaseInputs();
  app.classList.add('hide');
  for(const section of ['owner','reporter','editor'])$(section).classList.add('hide');
  $('founderPacket').textContent='Locked — निजी प्रमाण सामग्री स्क्रीन से हटा दी गई।';
  $('editorCard').textContent='Locked — निजी समीक्षा सामग्री स्क्रीन से हटा दी गई।';
  $('reporterCard').textContent='Locked — मामले की निजी जानकारी स्क्रीन से हटा दी गई।';
  $('g5LedgerOutput').textContent='Locked — G5 का निजी इतिहास स्क्रीन से हटा दिया गया।';
  $('g7HistoryOutput').textContent='Locked — G7 के निजी दावे और घटनाक्रम हटाए गए।';
  $('g9DueOutput').textContent='Locked — G9 के निजी लंबित मामले स्क्रीन से हटाए गए।';
  guard.textContent=reason||'सुरक्षा जाँच आवश्यक है। कृपया यह पेज फिर खोलें।';
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
    showStatus('सर्वर से पुष्टि का इंतजार है… अभी कोई सवाल नहीं भेजा गया है।');
    const response=await action();
    showStatus(response||'सर्वर ने कार्रवाई की पुष्टि की। कोई सवाल अधिकारी को नहीं भेजा गया है।','good');
  }catch(e){
    showStatus('कार्रवाई रोक दी गई: '+String(e?.message||'BACKEND_UNAVAILABLE')+
      '\nमसौदा, समीक्षा, प्रमाण अपलोड या सवाल भेजे जाने को सफल नहीं माना गया।','bad');
  }finally{
    busy=false;if(button&&!locked)button.disabled=false;
    // Restore only if still scoped to an independently checked live backend gate.
    updateUploadAvailability();
  }
}
function form(id,fn){$(id).addEventListener('submit',e=>{
  e.preventDefault();
  execute($(id),fn);
});}
const v=id=>$(id).value.trim();


const B8_CASE_FIELDS=[
 'assignCase','linkCase','holdCase','g4Case','g4MilestoneCase',
 'g5FactCase','g5OutcomeCase','g5ReopenCase','g5LedgerCase','g7Case','g7ReadCase'
];
const B8_PRIVATE_OUTPUT_IDS=[
 'founderPacket','g3PacketData','g3TruthData','g3ReplyTruthOutput',
 'g5LedgerOutput','g7HistoryOutput','g9DueOutput'
];
let ownerCasePick=null,ownerCaseRefresh=null,ownerKnownCases=[];
const B8_CASE_STATE_HI=Object.freeze({
 draft:'मसौदा',investigating:'जाँच जारी',monitoring:'निगरानी',
 closed:'बंद'
});
function clearOwnerCaseInputs(){
 for(const name of B8_CASE_FIELDS)$(name).value='';
}
function applyOwnerCaseSelection(id,resetUnsubmitted=true){
 if(!id){clearOwnerCaseInputs();return;}
 if(!validId(id)||!ownerKnownCases.some(c=>c.id===id))
   throw Error('B8_CASE_SELECTION_NOT_SERVER_LISTED');
 // Avoid old-case draft text accidentally being filed under a DIFFERENT case.
 if(resetUnsubmitted){
   for(const current of $('owner').querySelectorAll('form[id]')){
     if(current.id!=='createCase'&&current.id!=='g6Release')current.reset();
   }
   updateG5Classification();
   for(const name of B8_PRIVATE_OUTPUT_IDS)
     $(name).textContent='इस चुने हुए मामले की निजी जानकारी अभी नहीं पढ़ी गई है।';
 }
 for(const name of B8_CASE_FIELDS)$(name).value=id;
}
function drawOwnerCaseChoices(selectedId=''){
 if(!ownerCasePick)return;
 ownerCasePick.replaceChildren();
 const placeholder=document.createElement('option');
 placeholder.value='';placeholder.textContent='मामला चुनें — UUID लिखने की जरूरत नहीं';
 ownerCasePick.append(placeholder);
 for(const c of ownerKnownCases){
   const option=document.createElement('option');option.value=c.id;
   option.textContent=c.title+' — '+c.area+' ('+c.risk_lane+
     ', '+(B8_CASE_STATE_HI[c.state]||'दर्ज मामला')+')';
   ownerCasePick.append(option);
 }
 if(selectedId&&ownerKnownCases.some(c=>c.id===selectedId))
   ownerCasePick.value=selectedId;
 else ownerCasePick.value='';
}
function makeOwnerCaseChooser(parent){
 const label=document.createElement('label');
 label.htmlFor='b8OwnerCasePick';label.textContent='🗂️ अपना मामला नाम से चुनें';
 ownerCasePick=document.createElement('select');ownerCasePick.id='b8OwnerCasePick';
 ownerCasePick.autocomplete='off';
 ownerCaseRefresh=document.createElement('button');
 ownerCaseRefresh.type='button';ownerCaseRefresh.className='secondary';
 ownerCaseRefresh.id='b8OwnerCaseRefresh';
 ownerCaseRefresh.textContent='मेरे मामले फिर से लाएँ';
 const hint=document.createElement('p');hint.className='hint';
 hint.textContent='सिर्फ संस्थापक के निजी मामले। पहले नाम चुनें, फिर नीचे काम चुनें।';
 parent.prepend(label,ownerCasePick,ownerCaseRefresh,hint);
 drawOwnerCaseChoices();
 ownerCasePick.addEventListener('change',()=>{
   if(busy||locked)return;
   applyOwnerCaseSelection(ownerCasePick.value,true);
 });
 ownerCaseRefresh.addEventListener('click',async()=>{
   if(busy||locked)return;
   ownerCaseRefresh.disabled=true;
   try{
     await requireFreshIdentity();
     await loadOwnerCases();
     showStatus('सर्वर से निजी मामले दोबारा लाए गए। कोई रिकॉर्ड बदला नहीं गया।','good');
   }catch(e){
     showStatus('निजी मामले अभी नहीं मिले; सुरक्षा/सर्वर जाँच जरूरी है।','bad');
   }finally{ownerCaseRefresh.disabled=false;}
 });
}
async function loadOwnerCases(){
 if(!workflow||role!=='owner'||locked)throw Error('B8_OWNER_CASE_CHOICES_LOCKED');
 const list=await workflow.ownerCaseChoices();
 if(locked||role!=='owner'||!workflow)throw Error('B8_OWNER_CASE_LIST_SESSION_CHANGED');
 ownerKnownCases=list;
 const current=ownerCasePick?.value||'';
 drawOwnerCaseChoices(current);
 // Never guess a case when none was deliberately selected.
 if(current&&!ownerKnownCases.some(c=>c.id===current)){
    applyOwnerCaseSelection('',true);
 }
 return list;
}
function onOwnerCreatedCase(id){
 if(!validId(id))throw Error('B8_OWNER_CASE_SERVER_UUID_INVALID');
 const item={id,title:v('caseTitle'),area:v('caseArea'),
             risk_lane:v('caseRisk'),state:'draft'};
 ownerKnownCases=[item,...ownerKnownCases.filter(c=>c.id!==id)].slice(0,50);
 drawOwnerCaseChoices(id);
 applyOwnerCaseSelection(id,false);
}

const PHONE_GROUPS={
 owner:[
 ['केस बनाएँ / टीम',['createCase','assignStaff','linkArticle','legalHold']],
 ['प्रमाण / समीक्षा',['packetForm','g3Packet','g3R2Authorization']],
 ['सवाल / जवाब',['g3Truth','g3ReplyTruth','g8Delivery','g7History','g7HistoryRead']],
 ['सार्वजनिक जानकारी',['g4PublicRelease','g4Milestone']],
 ['लागत / तथ्य / निष्कर्ष',['g5Fact','g5Outcome','g5Reopen','g5Ledger','g9Due']],
 ['सुरक्षा',['g6Release']]],
 reporter:[
 ['मेरा केस',['caseLookup']],
 ['सवाल का मसौदा',['draftForm','requestReview']],
 ['प्रमाण',['reporterClaim','uploadForm','g3EvidenceLink']],
 ['भेजना / जवाब',['g3Handoff','g3Observation','g3ReplyClaim']]],
 editor:[['समीक्षा',['editorRead','editorDecision','g3Screen']]]
};
function enablePhoneWorkflow(forRole){
 const section=$(forRole), groups=PHONE_GROUPS[forRole];
 if(!section||!groups)throw Error('B8_PHONE_ROLE_NOT_SUPPORTED');
 const forms=Array.from(section.querySelectorAll('form[id]'));
 const ids=groups.flatMap(g=>g[1]);
 if(ids.length!==forms.length||new Set(ids).size!==ids.length||
    forms.some(f=>!ids.includes(f.id)))throw Error('B8_PHONE_TASK_COVERAGE_MISMATCH');
 const hidden=document.createElement('div');hidden.hidden=true;
 const menu=document.createElement('div');menu.className='b8-phone-menu';
 const label=document.createElement('label');label.htmlFor='b8PhoneTask';
 label.textContent='📱 अभी कौन-सा काम करना है?';
 const pick=document.createElement('select');pick.id='b8PhoneTask';pick.required=true;
 const note=document.createElement('p');note.className='hint';
 note.textContent='एक समय में एक ही सुरक्षित काम। अभी कोई सवाल अधिकारी को नहीं भेजा जाता।';
 const active=document.createElement('div');active.className='b8-phone-active';
 for(const g of groups){
   const optgroup=document.createElement('optgroup');optgroup.label=g[0];
   for(const id of g[1]){
     const form=$(id),opt=document.createElement('option');
     opt.value=id;opt.textContent=form.querySelector('legend')?.textContent||id;
     optgroup.append(opt);
   }
   pick.append(optgroup);
 }
 menu.append(label,pick,note);
 if(forRole==='owner')makeOwnerCaseChooser(menu);
 // Keep all ORIGINAL form IDs in the document, retaining handlers, values and backend guards.
 const oldCards=Array.from(section.querySelectorAll('div.card'));
 for(const form of forms)hidden.append(form);
 for(const card of oldCards)card.hidden=true;
 section.insertBefore(menu,section.firstElementChild?.nextSibling||null);
 section.append(active,hidden);
 function showSelected(){
   if(busy||locked)return;
   const selected=$(pick.value);
   if(!selected||!ids.includes(selected.id))throw Error('B8_PHONE_TASK_INVALID');
   const current=active.querySelector('form');
   if(current)hidden.append(current);
   active.replaceChildren(selected);
 }
 pick.addEventListener('change',showSelected);
 pick.value=ids[0];showSelected();
}
function updateG5Classification(){
 const kind=v('g5Kind'),field=$('g5Field');
 const labels={COST:'लागत',DEADLINE:'समयसीमा',GROUND:'जमीनी स्थिति',IMPACT:'जनता पर प्रभाव',
  ALTERNATIVE:'विकल्प',RESPONSIBILITY:'अन्य',CONFLICT:'अन्य'};
 for(const group of field.querySelectorAll('optgroup'))
  for(const option of group.querySelectorAll('option')){
   option.disabled=group.label!==labels[kind]||
     (kind==='RESPONSIBILITY'&&option.value!=='ROLE_MAP')||
     (kind==='CONFLICT'&&option.value!=='FLAG_RAISED');
  }
 field.value='';
}
$('g5Kind').addEventListener('change',updateG5Classification);
updateG5Classification();

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
    // FIRST DIVERGENCE T092: the existing owner login is NOT proof B8 tables/RPCs
    // exist. Do not show a clickable "Create Case" on a source-only installation.
    // This is a read-only RPC, never an INSERT/SQL migration and not a fake PASS.
    const {data:ready,error:readyError}=await window.JBBackend.client.rpc(
      'jb_b8_g1_runtime_readiness');
    if(readyError||ready?.component!=='JANTA_BOL_B8'||
        ready?.contract!=='G0_G9_20261017'||ready?.db_ready!==true){
      throw Error('B8_DATABASE_NOT_DEPLOYED_OR_PARTIAL_G0_G9');
    }
    role=currentRole;
    // Upload UI remains initially OFF. Paired SQL G6 is server authority, not DOM.
    // Standalone JS never enables a bypass; server default is OFF.
    workflow=createB8Workflow({client:window.JBBackend.client,role,
      allowPrivateUpload:role==='reporter'});
    uploadReadyCase=null;
    locked=false;lastActivity=Date.now();
    $('roleName').textContent='सत्यापित उपयोगकर्ता: '+({owner:'संस्थापक',reporter:'संवाददाता',editor:'संपादक'}[role]||'अधिकृत कर्मचारी');
    guard.classList.add('hide');app.classList.remove('hide');
    $(role).classList.remove('hide');
    enablePhoneWorkflow(role);
    updateUploadAvailability();
    if(role==='owner'){
      try{await loadOwnerCases();}
      catch(e){showStatus('मामलों की नाम-सूची अभी नहीं मिली। सुरक्षा जाँच के बाद दोबारा लाएँ।','warn');}
    }
    showStatus('इस पेज पर आपकी पहचान सत्यापित है। प्रत्येक कार्रवाई के लिए सर्वर की पुष्टि जरूरी है। कोई सवाल नहीं भेजा गया।');
  }catch(e){
    lock('B8 निजी पहुँच बंद: '+String(e?.message||'BACKEND_UNAVAILABLE')+
      '. पहले अधिकृत कर्मचारी का लॉगिन और सुरक्षित सर्वर की पुष्टि जरूरी है।');
  }
}
for(const event of ['pointerdown','keydown','touchstart']){
  document.addEventListener(event,()=>{if(!locked)lastActivity=Date.now();},{passive:true});
}
window.setInterval(()=>{
  if(workflow&&!locked&&Date.now()-lastActivity>LOCK_MS)
    lock('15 मिनट निष्क्रिय रहने से स्क्रीन लॉक हुई। निजी जानकारी छिपा दी गई है। पेज फिर खोलें।');
},30000);
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&workflow&&Date.now()-lastActivity>LOCK_MS)
    lock('लंबे समय तक निष्क्रिय रहने से स्क्रीन लॉक हुई। कृपया फिर लॉगिन जाँचें।');
});
$('refreshLogin').addEventListener('click',()=>window.location.reload());

form('createCase',async()=>{
  const id=await workflow.ownerCreateCase(v('caseTitle'),v('caseArea'),v('caseRisk'));
  onOwnerCreatedCase(id);
  return 'निजी मामला सफलतापूर्वक बना। पहचान (UUID): '+id+'\nकोई खबर प्रकाशित नहीं हुई और कोई सवाल अधिकारी को नहीं भेजा गया।';
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
  return 'मूल खबर से पहचान जोड़ी गई: '+ref+'\nमूल खबर न प्रकाशित की गई, न मिटाई गई।';
});
form('legalHold',async()=>{
  const hold=await workflow.ownerAssertHold(v('holdCase'),v('holdReason'));
  return 'महत्वपूर्ण रिकॉर्ड सुरक्षित रखने की पुष्टि #'+hold+'। आगे के रिकॉर्ड संरक्षण के लिए अलग सुरक्षा जाँच जरूरी है।';
});
form('packetForm',async()=>{
  $('founderPacket').textContent='अधिकृत निजी समीक्षा सामग्री लोड हो रही है…';
  const packet=await workflow.ownerPreliminaryPacket(v('packetId'));
  showJSON($('founderPacket'),packet);
  return 'संस्थापक की दो-चरणीय पुष्टि से प्रारंभिक सामग्री मिली। प्रमाण अधूरे हैं और सवाल अधिकारी को नहीं भेजा गया है।';
});
form('caseLookup',async()=>{
  const c=await workflow.reporterCaseCard(v('reporterCase'));
  showJSON($('reporterCard'),c);
  $('questionCase').value=c.id;
  $('claimCase').value=c.id;
  $('uploadCase').value=c.id;
  uploadReadyCase=null;
  const release=await workflow.reporterPrivateUploadReadiness(c.id);
  if(release.allowed)uploadReadyCase=c.id;
  updateUploadAvailability();
  return 'सर्वर ने मामले की अनुमति जाँची। जोखिम श्रेणी '+c.risk_lane+
    '. निजी प्रमाण अपलोड: '+(release.allowed?'संस्थापक की अनुमति और सर्वर की शर्तों के तहत चालू':'अभी बंद')+
    '. कोई संदेश नहीं भेजा गया।';
});
form('draftForm',async()=>{
  const result=await workflow.reporterCreateDraft(v('questionCase'),v('questionText'),v('recipient'));
  $('reviewDraftId').value=result.draftId;
  return 'सवाल का मसौदा बना। पहचान (UUID): '+result.draftId+'\nतकनीकी स्थिति: '+result.status+
    '. वास्तविक अधिकारी तक कोई सवाल नहीं भेजा गया।';
});
form('requestReview',async()=>{
  const result=await workflow.reporterRequestReview(v('reviewDraftId'));
  return 'संपादक की समीक्षा का अनुरोध बना। पहचान (UUID): '+result.requestId+
    '\nसमीक्षा की स्थिति: '+result.status+'\nबाहरी भेजे जाने की स्थिति: '+result.deliveryStatus;
});
form('reporterClaim',async()=>{
  const r=await workflow.reporterSubmitClaim(
    v('claimCase'),v('claimType'),v('claimLabel'),v('claimHash'));
  return 'प्रमाण का अप्रमाणित दावा दर्ज हुआ। पहचान: '+r.claimId+'\n'+r.state+
    ' — कोई PDF/फोटो वास्तव में Upload या सत्यापित होने का दावा नहीं।';
});
$('uploadCase').addEventListener('input',()=>{
  uploadReadyCase=null;
  updateUploadAvailability();
});
form('uploadForm',async()=>{
  const c=v('uploadCase'),file=$('uploadFile').files?.[0];
  if(!uploadReadyCase||uploadReadyCase!==c)
    throw Error('B8_PRIVATE_UPLOAD_REVERIFY_REPORTER_CASE');
  // Every request reconfirms server state (Founder may emergency disable).
  const gate=await workflow.reporterPrivateUploadReadiness(c);
  if(!gate.allowed){uploadReadyCase=null;updateUploadAvailability();
    throw Error('B8_PRIVATE_UPLOAD_OWNER_RELEASE_OFF');}
  const result=await workflow.reporterUploadCaseEvidence(c,file);
  $('uploadFile').value='';
  // Never display a private Storage URL, object key, identity or uploaded bytes.
  return 'निजी फाइल रसीद की पहचान: '+result.receiptId+
    '\\n'+result.proof+' — केवल byte/hash readback सत्यापित, आधिकारिक दस्तावेज की सच्चाई नहीं।';
});
form('g6Release',async()=>{
  if(!$('g6ReleaseAck').checked)throw Error('B8_G6_FOUNDER_RELEASE_ACK_REQUIRED');
  const target=v('g6ReleaseAction')==='ON';
  const x=await workflow.ownerSetPrivateUploadRelease(target,v('g6ReleaseReason'));
  $('g6ReleaseAck').checked=false;
  return 'संस्थापक की अपलोड अनुमति: '+(x.enabled?'चालू':'बंद')+
    '. स्थायी जाँच रिकॉर्ड सुरक्षित किया गया। पुरानी खबरों और विज्ञापनों पर कोई कार्रवाई नहीं।';
});
form('editorRead',async()=>{
  const data=await workflow.editorReviewCard(v('editorRequest'));
  $('decisionRequest').value=data.request_id;
  showJSON($('editorCard'),data);
  return 'निजी समीक्षा पढ़ी गई। सवाल अभी भेजा नहीं गया और प्रमाण स्वतंत्र रूप से सत्यापित नहीं हैं।';
});
form('editorDecision',async()=>{
  const r=await workflow.editorRecordReview(
    v('decisionRequest'),v('decision'),v('decisionReason'));
  return 'संपादक के स्थायी निर्णय की पहचान: '+r.reviewId+'\n'+r.status+
    '. Official send अभी नहीं हुआ, Founder की वास्तविक E9 proof notification भी नहीं हुई।';
});


form('g3Packet',async()=>{
  $('g3PacketData').textContent='संस्थापक के निजी प्रमाण और संलग्न फाइलें जाँची जा रही हैं…';
  const packet=await workflow.ownerEvidencePacket(v('g3PacketReq'));
  showJSON($('g3PacketData'),packet);
  return 'निजी फाइल के तकनीकी रसीद विवरण प्राप्त हुए। सरकारी दस्तावेज की असलियत अभी सत्यापित नहीं है; सूचना केवल ऐप में है।';
});
form('g3R2Authorization',async()=>{
  const x=await workflow.ownerAuthorizeRestricted(v('g3R2Req'),v('g3R2Reason'));
  return 'R2 में संस्थापक की दो-चरणीय अनुमति दर्ज हुई। पहचान: '+x.approvalId+
    '\nकिसी अधिकारी को संदेश नहीं भेजा गया। तकनीकी स्थिति: '+x.externalStatus;
});
form('g3Truth',async()=>{
  const p=await workflow.ownerHandoffTruth(v('g3TruthQ'));
  showJSON($('g3TruthData'),p);
  return 'सर्वर पर सवाल भेजने की प्रक्रिया का रिकॉर्ड मिला। बाहरी सेवा की स्वीकृति या सरकारी प्राप्ति रसीद अभी सत्यापित नहीं है।';
});
form('g3EvidenceLink',async()=>{
  const x=await workflow.reporterLinkReceipt(v('g3LinkReq'),v('g3LinkReceipt'));
  return 'सर्वर ने निजी रसीद जोड़ी। पहचान: '+x.linkId+
   '\nइससे केवल फाइल की तकनीकी अखंडता जाँची गई है, किसी आरोप की सत्यता नहीं।';
});
form('g3Handoff',async()=>{
  const x=await workflow.reporterPrepareHandoff(v('g3HandoffQ'),v('g3HandoffChannel'));
  $('g3ObsIntent').value=x.handoffId;
  return 'सवाल खुद भेजने की तैयारी दर्ज हुई। पहचान: '+x.handoffId+
    '\n'+x.state+' — इससे अधिकारी को संदेश नहीं भेजा गया।';
});
form('g3Observation',async()=>{
  const type=v('g3ObsType'),receipt=v('g3ObsReceipt')||null;
  const x=await workflow.reporterRecordHandoff(v('g3ObsIntent'),type,receipt);
  return 'भेजने के प्रयास का विवरण दर्ज हुआ। पहचान: '+x.observationId+
    '\nबाहरी भेजने की स्थिति: '+x.externalStatus+
    '. यह वास्तविक प्राप्ति रसीद का स्वतंत्र सत्यापन नहीं है।';
});
form('g3Screen',async()=>{
  const x=await workflow.editorScreenSerious(v('g3ScreenReq'),v('g3ScreenReason'));
  return 'R1 के प्रमाण पर संपादक की स्थायी समीक्षा दर्ज हुई। पहचान: '+x.screeningId+
    '\nसवाल अधिकारी को नहीं भेजा गया। स्थिति: '+x.externalStatus;
});


form('g3ReplyClaim',async()=>{
  const raw=v('g3ReplyReceivedAt'),d=new Date(raw);
  if(!raw||Number.isNaN(+d))throw Error('B8_REPLY_DATE_INVALID');
  const x=await workflow.reporterClaimOfficialReply(
    v('g3ReplyIntent'),v('g3ReplyReceipt'),v('g3ReplyOffice'),
    d.toISOString(),v('g3ReplySummary')
  );
  return 'अधिकारी के जवाब का अप्रमाणित दावा दर्ज हुआ। पहचान: '+x.replyClaimId+
    '\n'+x.accuracy+'; स्वतंत्र आधिकारिक जवाब अभी सत्यापित नहीं।';
});
form('g3ReplyTruth',async()=>{
  const x=await workflow.ownerReplyClaimSummary(v('g3ReplyTruthQ'));
  showJSON($('g3ReplyTruthOutput'),x);
  return 'जवाब के दावे का निजी सारांश मिला। सरकारी जवाब और बाहरी भेजने की पुष्टि अभी नहीं हुई।';
});


form('g4PublicRelease',async()=>{
  const action=v('g4Action'),caseId=v('g4Case');
  if(action!=='HIDE'&&!$('g4Privacy').checked)
    throw Error('B8_FOUNDER_PUBLIC_PRIVACY_REVIEW_REQUIRED');
  const safe=action==='HIDE';
  const result=await workflow.ownerReleasePublicCase(
    caseId,action,safe?null:v('g4Topic'),safe?null:v('g4Area'),
    safe?null:v('g4Status'),safe?false:$('g4Privacy').checked
  );
  $('g4MilestoneCase').value=caseId;
  return 'G4 में सार्वजनिक जानकारी बदलने का स्थायी रिकॉर्ड बना। नंबर: '+result.revisionEventId+
   '\nकार्रवाई: '+({PUBLISH:'सार्वजनिक',REVISE:'सार्वजनिक विवरण बदला',HIDE:'सार्वजनिक दृश्य छिपाया'}[result.action]||result.action)+
   '\nयह संस्थापक की सर्वर-स्वीकृत कार्रवाई है। इससे किसी दावे का स्वतंत्र तथ्य सत्यापन नहीं होता।';
});
form('g4Milestone',async()=>{
  const x=await workflow.ownerAppendPublicMilestone(
    v('g4MilestoneCase'),v('g4MilestoneCode'));
  return 'G4 में सर्वर से जाँची गई सार्वजनिक संपादकीय घटना का नंबर: '+x.eventId+
    '\nसार्वजनिक घटनाक्रम में निजी प्रमाण या नाम नहीं दिखाए जाएँगे।';
});

// G9: own due-case follow-up review only. No automatic official outreach.
form('g9Due',async()=>{
  const out=$('g9DueOutput');
  out.textContent='संस्थापक के लिए लंबित मामले लोड हो रहे हैं…';
  const due=await workflow.ownerDueG9Followups();
  showJSON(out,due);
  return 'मानवीय समीक्षा की जरूरत वाले समयसीमा-पार मामले: '+due.length+
    '. अधिकारी की नीयत या वास्तविक प्राप्ति का कोई दावा नहीं।';
});

// G8: manual proof intake is NOT an outbound official message.
form('g8Delivery',async()=>{
  if(!$('g8Ack').checked)throw Error('B8_G8_FOUNDER_REAL_PROVIDER_EVIDENCE_ACK_REQUIRED');
  const x=await workflow.ownerAttestManualDelivery(
    v('g8Handoff'),v('g8Receipt'),v('g8Basis')
  );
  $('g8Ack').checked=false;
  return 'संस्थापक ने बाहरी प्रमाण की समीक्षा दर्ज की। घटना नंबर: '+x.attestationEventId+
    '\\n'+x.proofClass+'; बाहरी सेवा की प्रामाणिकता स्वतंत्र रूप से सत्यापित नहीं हुई है।'+
    ' ऐप से अधिकारी को कोई संदेश नहीं भेजा गया।';
});

// G7: preserve source-attributed claims & visible correction handoff, never fake E9.
form('g7History',async()=>{
  const x=await workflow.ownerRecordG7History(
    v('g7Case'),v('g7Kind'),v('g7Note'),v('g7Question'),
    v('g7Receipt'),v('g7Prior'),v('g7AsOf')
  );
  return 'G7 निजी स्थायी घटनाक्रम में रिकॉर्ड नंबर: '+x.eventId+
    '\\n'+x.truth+'; सरकारी जवाब या सवाल पहुँचने की पुष्टि नहीं है।';
});
form('g7HistoryRead',async()=>{
  const out=$('g7HistoryOutput');
  out.textContent='संस्थापक का निजी घटनाक्रम पढ़ा जा रहा है…';
  const x=await workflow.ownerG7PrivateHistory(v('g7ReadCase'));
  showJSON(out,x);
  return 'निजी घटनाक्रम में कुल '+x.length+
    ' प्रविष्टियाँ मिलीं। यह प्रकाशित खबर में सुधार नहीं है।';
});

// G5: exact Founder-only private factual ledger. Client never upgrades source authenticity.
form('g5Fact',async()=>{
  const x=await workflow.ownerRecordG5Fact(
    v('g5FactCase'),v('g5Kind'),v('g5Field'),v('g5Detail'),
    v('g5Cost'),v('g5Date'),v('g5Receipt')
  );
  return 'निजी तथ्य स्थायी रूप से दर्ज हुआ। रिकॉर्ड नंबर #'+x.eventId+
   '\n'+x.authenticity+' — सरकारी स्रोत की असलियत और सवाल पहुँचने की स्वतंत्र पुष्टि नहीं हुई है।';
});
form('g5Outcome',async()=>{
  const x=await workflow.ownerRecordG5Outcome(
    v('g5OutcomeCase'),v('g5OutcomeState'),v('g5OutcomeReason'),v('g5OutcomeReceipt')
  );
  return 'मामले की संपादकीय स्थिति '+({closed:'कारण सहित बंद',monitoring:'निगरानी जारी'}[x.state]||x.state)+' / रिकॉर्ड नंबर #'+x.eventId+
   '\nयह स्वतंत्र रूप से सत्यापित नागरिक परिणाम या अदालत का फैसला नहीं है।';
});
form('g5Reopen',async()=>{
  const x=await workflow.ownerReopenG5(
    v('g5ReopenCase'),v('g5ReopenReceipt'),v('g5ReopenReason')
  );
  return 'मामले को दोबारा खोलने की स्थायी प्रविष्टि नंबर #'+x.eventId+
   '\nनए प्रमाण की आगे स्वतंत्र जाँच जरूरी है।';
});
form('g5Ledger',async()=>{
  const out=$('g5LedgerOutput');
  out.textContent='संस्थापक का निजी तथ्य इतिहास पढ़ा जा रहा है…';
  const x=await workflow.ownerG5PrivateLedger(v('g5LedgerCase'));
  displayHindiPrivateLedger(out,x);
  return 'G5 के निजी तथ्य इतिहास में '+x.length+' प्रविष्टियाँ मिलीं। सभी का स्वतंत्र तथ्य सत्यापन बाकी है।';
});

// A wrong/injected DOM click on a hidden role does not bypass the JS role check,
// nor the real G1/G2 server role and case grants.
boot();
