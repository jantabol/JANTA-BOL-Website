import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {allowlistedCase,createPublicCaseReader,canonicalArticleHref,
 canonicalCaseHref} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-public-case-client.mjs';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.mjs';
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ARTICLE='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const APPROVED='2026-10-17T06:30:00.000Z';
const PRIVATE_SENTINEL='PRIVATE: 9800000000 source-name <script>alert("x")</script>';
const safe=()=>({
 case_id:ID,public_topic:'PUBLIC_WORKS',public_area:'PICHHORE',
 public_status:'UNDER_REVIEW',public_revision:1,approved_at:APPROVED,
 title:'Public works accountability',source_evidence_public:false,
 official_reply_independently_verified:false,
 timeline:[{event_id:1,event_code:'CASE_REVIEW_STARTED',
  event_at:APPROVED,description:'Accountability review opened'}],
 articles:[{article_id:ARTICLE}]
});
function withPublic(response){
 const calls=[];
 const client={rpc:async(name,args)=>{calls.push({name,args});return {data:response,error:null};}};
 return {api:createPublicCaseReader(client),calls};
}
function withOwner(role='owner',opts={}){
 const calls=[];
 const client={rpc:async(name,args)=>{
  calls.push({name,args});
  return opts.reject?{data:null,error:{message:'Backend denied AAL2'}}
  :{data:opts.result??23,error:null};
 }};
 return {api:createB8Workflow({client,role}),calls};
}
test('Strict public projection copies only enumerated topic, area, date and published UUID',()=>{
 const unsafe={...safe(),private_title:PRIVATE_SENTINEL,
  source_name:PRIVATE_SENTINEL,source_url:'https://internal.test/'+PRIVATE_SENTINEL,
  editor_name:'private editor',evidence_object_key:'b8/private/file.pdf',
  timeline:[{...safe().timeline[0],private_note:PRIVATE_SENTINEL}]};
 const cleaned=allowlistedCase(unsafe);
 const asJson=JSON.stringify(cleaned);
 assert.equal(cleaned.topic,'Public works accountability');
 assert.equal(cleaned.area,'Pichhore');
 assert.deepEqual(cleaned.articleIds,[ARTICLE]);
 assert.deepEqual(cleaned.milestones.map(x=>x.title),['Accountability review opened']);
 assert(!asJson.includes(PRIVATE_SENTINEL));
 assert(!asJson.includes('source_url'));
 assert(!asJson.includes('object_key'));
});
test('An unapproved case resolves null, never a phantom Public card',()=>{
 assert.equal(allowlistedCase(null),null);
});
test('Unapproved arbitrary title or area code rejected before rendering',()=>{
 for(const k of [
  {public_topic:PRIVATE_SENTINEL},{public_area:'HOME_PHONE_9800000000'},
  {public_status:'OFFICIALLY_DELIVERED'},{source_evidence_public:true},
  {official_reply_independently_verified:true}
 ]){
  assert.throws(()=>allowlistedCase({...safe(),...k}),/B8_PUBLIC_UNTRUSTED_SERVER_PROJECTION/);
 }
});
test('Unapproved public milestone string or unsafe article UUID refused',()=>{
 assert.throws(()=>allowlistedCase({...safe(),
  timeline:[{...safe().timeline[0],event_code:'OFFICIAL_SENT_AND_CONFIRMED'}]}),
 /B8_PUBLIC_INVALID_TIMELINE_CODE/);
 assert.throws(()=>allowlistedCase({...safe(),
  articles:[{article_id:'javascript:alert(1)'}]}),
 /B8_PUBLIC_INVALID_ARTICLE_ID/);
});
test('Article correction keeps existing Article ID/relative PURL; follow-up uses new ID',()=>{
 assert.equal(canonicalArticleHref(ARTICLE),'article.html?id='+ARTICLE);
 assert.equal(canonicalCaseHref(ID),'accountability-public.html?id='+ID);
 assert.throws(()=>canonicalArticleHref('https://evil.test/'),/B8_PUBLIC_ARTICLE_ID_REQUIRED/);
});
test('Anon Public Case viewer calls only allowlisted public RPC with UUID',async()=>{
 const {api,calls}=withPublic(safe());
 const data=await api.case(ID);
 assert.equal(data.id,ID);
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g4_public_case']);
 assert.deepEqual(calls[0].args,{p_case_id:ID});
});
test('Public feed uses only bounded RPC; no direct private table query',async()=>{
 const {api,calls}=withPublic([safe()]);
 const data=await api.feed(12);
 assert.equal(data.length,1);
 assert.equal(calls[0].name,'jb_b8_g4_public_feed');
 assert.deepEqual(calls[0].args,{p_limit:12});
 await assert.rejects(api.feed(900),/B8_PUBLIC_FEED_LIMIT/);
 assert.equal(calls.length,1);
});
test('Reporter and Editor cannot approve case public projection from browser',async()=>{
 for(const role of ['reporter','editor']){
  const {api,calls}=withOwner(role);
  await assert.rejects(api.ownerReleasePublicCase(
   ID,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true),
   /B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
});
test('Founder explicit privacy review required even if client sends correct safe enum',async()=>{
 const {api,calls}=withOwner();
 await assert.rejects(api.ownerReleasePublicCase(
  ID,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',false),
  /B8_FOUNDER_PRIVACY_REVIEW_REQUIRED/);
 assert.equal(calls.length,0);
});
test('Founder R0/R1 public publication, controlled status and revision only',async()=>{
 const {api,calls}=withOwner();
 const x=await api.ownerReleasePublicCase(
  ID,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true);
 assert.equal(x.action,'PUBLISH');
 assert.equal(x.serverConfirmed,true);
 assert.equal(x.revisionEventId,23);
 assert.equal(calls[0].name,'jb_b8_g4_owner_release_public_projection');
 assert.equal(calls[0].args.p_confirm_privacy_review,true);
 assert.equal(calls[0].args.p_status,'UNDER_REVIEW');
});
test('HIDE must erase all public values even when form previously selected them',async()=>{
 const {api,calls}=withOwner();
 const x=await api.ownerReleasePublicCase(ID,'HIDE',null,null,null,false);
 assert.equal(x.action,'HIDE');
 assert.equal(x.publicApproval,false);
 assert.equal(calls[0].args.p_topic,null);
 assert.equal(calls[0].args.p_area_code,null);
 assert.equal(calls[0].args.p_status,null);
 await assert.rejects(api.ownerReleasePublicCase(
  ID,'HIDE','PUBLIC_WORKS',null,null,false),/B8_PUBLIC_HIDE_MUST_HAVE_NO_DETAILS/);
 assert.equal(calls.length,1);
});
test('Reject fake external official request status before backend',async()=>{
 const {api,calls}=withOwner();
 await assert.rejects(api.ownerReleasePublicCase(
  ID,'PUBLISH','PUBLIC_WORKS','PICHHORE','AWAITING_RESPONSE',true),
 /B8_PUBLIC_ENUM_NOT_APPROVED/);
 assert.equal(calls.length,0);
});
test('Founder public milestone only exact enum and backend confirmation',async()=>{
 const {api,calls}=withOwner();
 const x=await api.ownerAppendPublicMilestone(ID,'CASE_REVIEW_STARTED');
 assert.equal(x.eventId,23);
 assert.equal(calls[0].name,'jb_b8_g4_owner_add_public_milestone');
 await assert.rejects(api.ownerAppendPublicMilestone(ID,'GUILTY_OFFICIAL'),
 /B8_PUBLIC_EVENT_NOT_APPROVED/);
 assert.equal(calls.length,1);
});
test('Back-end rejected privacy approval cannot be displayed as success',async()=>{
 const {api}=withOwner('owner',{reject:true});
 await assert.rejects(api.ownerReleasePublicCase(
  ID,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true),
 /B8_SERVER_REJECTED_jb_b8_g4_owner_release_public_projection/);
});
test('Public pages have no server secret or raw input HTML, and independent Article remains untouched',async()=>{
 const dir=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,ui,privateHtml,privateUi]=await Promise.all([
  readFile(new URL('accountability-public.html',dir),'utf8'),
  readFile(new URL('b8-public-case-ui.mjs',dir),'utf8'),
  readFile(new URL('b8-accountability.html',dir),'utf8'),
  readFile(new URL('b8-accountability-ui.mjs',dir),'utf8')
 ]);
 assert(html.includes('id="cases"')&&html.includes('b8-public-case-ui.mjs'));
 assert(ui.includes('createPublicCaseReader(api)'));
 assert(ui.includes('root.replaceChildren()'));
 assert(ui.includes('document.createElement(tag)'));
 assert(!ui.includes('.innerHTML'));
 assert(!ui.includes('service_role'));
 assert(!html.includes('supabase_service_role'));
 assert(!html.includes('onclick='));
 assert(privateHtml.includes('id="g4PublicRelease"')&&privateHtml.includes('id="g4Milestone"'));
 assert(privateUi.includes("form('g4PublicRelease'"));
 assert(privateUi.includes("form('g4Milestone'"));
});
