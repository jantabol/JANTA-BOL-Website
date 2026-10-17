/**
 * JANTA BOL B8 G4 PUBLIC client — only exact public dictionary fields.
 * Works without staff session using SECURITY DEFINER anon-approved public RPCs.
 * Never reads the PRIVATE case/evidence/source tables or Article editor.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publicStatus=new Set(['UNDER_REVIEW','RECORDS_REQUESTED','AWAITING_RESPONSE','UPDATED','CLOSED']);
const topics=Object.freeze({
 PUBLIC_WORKS:'Public works accountability',
 PUBLIC_SERVICE:'Public service accountability',
 HEALTHCARE:'Healthcare accountability',
 EDUCATION:'Education accountability',
 OTHER:'Public interest accountability'
});
const areas=Object.freeze({
 PICHHORE:'Pichhore',SHIVPURI:'Shivpuri',GUNA:'Guna',
 ASHOKNAGAR:'Ashoknagar',MADHYA_PRADESH:'Madhya Pradesh'
});
const milestones=Object.freeze({
 CASE_REVIEW_STARTED:'Accountability review opened',
 PUBLIC_RECORDS_UNDER_REVIEW:'Public records are under editorial review',
 QUESTION_DRAFT_PREPARED:'An enquiry draft was prepared (not proof of delivery)',
 EDITORIAL_REVIEW_UPDATED:'Editorial review milestone recorded',
 RESPONSE_STATUS_NOT_VERIFIED:'Official response has not been independently verified',
 CASE_STATUS_UPDATED:'Accountability case status updated',
 FOLLOWUP_ARTICLE_LINKED:'A related published article is linked',
 CASE_CLOSED:'Case closure was recorded'
});
const reject=reason=>{throw new Error('B8_PUBLIC_'+reason)};
export function isUuid(v){return typeof v==='string'&&UUID.test(v);}
export function allowlistedCase(row){
 if(row===null)return null;
 if(!row||typeof row!=='object'||!isUuid(row.case_id)
  ||!Object.hasOwn(topics,row.public_topic)
  ||!Object.hasOwn(areas,row.public_area)
  ||!publicStatus.has(row.public_status)
  ||!Number.isSafeInteger(Number(row.public_revision))||Number(row.public_revision)<1
  ||!Array.isArray(row.timeline)||!Array.isArray(row.articles)
  ||row.source_evidence_public!==false
  ||row.official_reply_independently_verified!==false
 )reject('UNTRUSTED_SERVER_PROJECTION');
 const timeline=row.timeline.map(x=>{
  if(!x||!Number.isSafeInteger(Number(x.event_id))||
    !Object.hasOwn(milestones,x.event_code)||!Number.isFinite(Date.parse(x.event_at)))
    reject('INVALID_TIMELINE_CODE');
  return Object.freeze({id:Number(x.event_id),
   date:new Date(x.event_at).toISOString(),title:milestones[x.event_code]});
 });
 const links=row.articles.map(x=>{
  if(!isUuid(x?.article_id))reject('INVALID_ARTICLE_ID');
  return x.article_id;
 });
 if(!Number.isFinite(Date.parse(row.approved_at)))reject('UNAPPROVED_TIMESTAMP');
 return Object.freeze({
  id:row.case_id,topic:topics[row.public_topic],
  area:areas[row.public_area],status:row.public_status,
  revision:Number(row.public_revision),
  approvedAt:new Date(row.approved_at).toISOString(),
  milestones:Object.freeze(timeline),articleIds:Object.freeze(links)
 });
}
export function canonicalArticleHref(articleId){
 if(!isUuid(articleId))reject('ARTICLE_ID_REQUIRED');
 return 'article.html?id='+encodeURIComponent(articleId);
}
export function canonicalCaseHref(caseId){
 if(!isUuid(caseId))reject('CASE_ID_REQUIRED');
 return 'accountability-public.html?id='+encodeURIComponent(caseId);
}
export function createPublicCaseReader(client){
 if(!client||typeof client.rpc!=='function')reject('CLIENT_REQUIRED');
 async function call(method,args){
  const {data,error}=await client.rpc(method,args);
  if(error)reject('PUBLIC_RPC_UNAVAILABLE');
  return data;
 }
 return Object.freeze({
  async case(caseId){
   if(!isUuid(caseId))reject('CASE_ID_REQUIRED');
   return allowlistedCase(await call('jb_b8_g4_public_case',{p_case_id:caseId}));
  },
  async feed(max=12){
   if(!Number.isSafeInteger(max)||max<1||max>24)reject('FEED_LIMIT');
   const list=await call('jb_b8_g4_public_feed',{p_limit:max});
   if(!Array.isArray(list))reject('INVALID_FEED');
   return Object.freeze(list.map(allowlistedCase).filter(Boolean));
  }
 });
}
