/**
 * JANTA BOL B8 G3/CP01 — narrowly scoped browser workflow client.
 * REVIEW ONLY / NO LIVE BACKEND YET. Uses ONLY existing B8 G1/G2 RPC signatures.
 * It NEVER sends an official question, publishes news, returns fake proof, or grants
 * reporter/editor extra roles. Backend SQL is sole authority for every action.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const deny=code=>{throw Error('B8_'+code)};
export const LANES=Object.freeze(['R0','R1','R2']);
export const EDITOR_DECISIONS=Object.freeze([
  'RETURN_FOR_EVIDENCE','EVIDENCE_REVIEW_PENDING','ESCALATE_TO_FOUNDER'
]);
export const NO_DISPATCH_STATUS='NOT_SENT';
export const UPLOAD_MAX=8_388_608;
export function validId(v){return typeof v==='string'&&UUID.test(v);}
function bounded(v,min,max,code){
  if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)deny(code);
  return v.trim();
}
function id(v){if(!validId(v))deny('UUID_REQUIRED');return v;}
function caseLane(v){if(!LANES.includes(v))deny('LANE_NOT_ALLOWED');return v;}
function validDate(v){if(typeof v!=='string'||Number.isNaN(Date.parse(v)))deny('DATE_REQUIRED');return v;}
function requireRole(role,want){
  if(role!==want)deny('ROLE_'+want.toUpperCase()+'_REQUIRED');
}
/** Inject the current authenticated public Supabase client; never service_role. */
export function createB8Workflow({client,role,allowPrivateUpload=false}){
  if(!client||typeof client.rpc!=='function')deny('AUTHENTICATED_BACKEND_REQUIRED');
  if(!['owner','editor','reporter'].includes(role))deny('ACTIVE_STAFF_LOGIN_REQUIRED');
  async function rpc(name,args){
    const {data,error}=await client.rpc(name,args);
    if(error)deny('SERVER_REJECTED_'+name);
    if(data===null||data===undefined)deny('EMPTY_SERVER_RESULT');
    return data;
  }
  return Object.freeze({
    role,
    async ownerCreateCase(title,area,lane){
      requireRole(role,'owner');
      return id(await rpc('jb_b8_g1_owner_create_case',{
        p_title:bounded(title,12,200,'CASE_TITLE_REQUIRED'),
        p_area_label:bounded(area,2,120,'AREA_REQUIRED'),
        p_risk_lane:caseLane(lane)
      }));
    },
    async ownerAssignReporter(caseId,userId,expiry){
      requireRole(role,'owner');
      const yes=await rpc('jb_b8_g1_owner_assign_reporter',{
        p_case_id:id(caseId),p_reporter_user_id:id(userId),p_expires_at:validDate(expiry)
      });
      if(yes!==true)deny('ASSIGNMENT_NOT_CONFIRMED');
      return true;
    },
    async ownerAssignEditor(caseId,userId,expiry){
      requireRole(role,'owner');
      const yes=await rpc('jb_b8_g1_owner_assign_editor',{
        p_case_id:id(caseId),p_editor_user_id:id(userId),p_expires_at:validDate(expiry)
      });
      if(yes!==true)deny('ASSIGNMENT_NOT_CONFIRMED');
      return true;
    },
    async ownerLinkArticle(caseId,articleId){
      requireRole(role,'owner');
      return id(await rpc('jb_b8_g2_owner_link_article',{
        p_case_id:id(caseId),p_article_id:id(articleId)
      }));
    },
    async ownerAssertHold(caseId,reason){
      requireRole(role,'owner');
      const n=await rpc('jb_b8_g2_owner_assert_hold',{
        p_case_id:id(caseId),p_reason:bounded(reason,12,500,'HOLD_REASON_REQUIRED')
      });
      if(!Number.isSafeInteger(n)||n<1)deny('HOLD_NOT_CONFIRMED');
      return n;
    },
    async ownerPreliminaryPacket(requestId){
      requireRole(role,'owner');
      const packet=await rpc('jb_b8_g1_owner_preliminary_review_packet',{
        p_request_id:id(requestId)
      });
      if(typeof packet!=='object'||packet.complete_proof_pack!==false||
         packet.delivery_status!=='NOT_SENT'||packet.evidence_status!=='EVIDENCE_GAP')
         deny('FALSE_COMPLETE_EVIDENCE_PACK');
      return Object.freeze(packet);
    },
    async ownerProvenance(caseId){
      requireRole(role,'owner');
      return rpc('jb_b8_g2_owner_provenance_summary',{p_case_id:id(caseId)});
    },
    async ownerUploadSummary(caseId){
      requireRole(role,'owner');
      return rpc('jb_b8_g2_owner_verified_upload_summary',{p_case_id:id(caseId)});
    },
    async reporterCaseCard(caseId){
      requireRole(role,'reporter');
      const card=await rpc('jb_b8_g1_reporter_case_card',{p_case_id:id(caseId)});
      if(card.id!==caseId||!LANES.includes(card.risk_lane))deny('CASE_SCOPE_MISMATCH');
      return Object.freeze(card);
    },
    async reporterCreateDraft(caseId,text,recipient){
      requireRole(role,'reporter');
      const draftId=await rpc('jb_b8_g1_reporter_create_draft',{
        p_case_id:id(caseId),
        p_question:bounded(text,20,2000,'QUESTION_REQUIRED'),
        p_recipient_label:bounded(recipient,3,160,'RECIPIENT_REQUIRED')
      });
      return Object.freeze({draftId:id(draftId),status:NO_DISPATCH_STATUS,
        approvalStatus:'DRAFT_ONLY'});
    },
    async reporterRequestReview(questionId){
      requireRole(role,'reporter');
      const requestId=await rpc('jb_b8_g1_reporter_request_review',{p_question_id:id(questionId)});
      return Object.freeze({requestId:id(requestId),status:'EDITOR_REVIEW_PENDING',
        deliveryStatus:NO_DISPATCH_STATUS});
    },
    async editorReviewCard(requestId){
      requireRole(role,'editor');
      const card=await rpc('jb_b8_g1_editor_review_card',{p_request_id:id(requestId)});
      if(card.request_id!==requestId||
          card.state!=='UNSENT_REVIEW_ONLY'||
          card.proof_status!=='EVIDENCE_NOT_VERIFIED')
        deny('UNTRUSTED_EDITOR_CARD');
      return Object.freeze(card);
    },
    async editorRecordReview(requestId,decision,reason){
      requireRole(role,'editor');
      if(!EDITOR_DECISIONS.includes(decision))deny('EDITOR_DECISION_NOT_ALLOWED');
      const reviewId=await rpc('jb_b8_g1_editor_review',{
        p_request_id:id(requestId),p_decision:decision,
        p_reason:bounded(reason,12,500,'EDITOR_REASON_REQUIRED')
      });
      return Object.freeze({reviewId:id(reviewId),status:decision,
        deliveryStatus:NO_DISPATCH_STATUS});
    },
    async reporterSubmitClaim(caseId,kind,label,sha,date=null){
      requireRole(role,'reporter');
      if(!['PUBLIC_DOCUMENT','FIELD_OBSERVATION','OFFICIAL_RESPONSE','OTHER'].includes(kind))
        deny('EVIDENCE_KIND_NOT_ALLOWED');
      if(typeof sha!=='string'||!/^[0-9a-f]{64}$/i.test(sha))deny('CLAIM_HASH_INVALID');
      const receipt=await rpc('jb_b8_g2_reporter_submit_evidence_claim',{
        p_case_id:id(caseId),p_kind:kind,
        p_document_label:bounded(label,5,180,'EVIDENCE_LABEL_REQUIRED'),
        p_sha256:sha.toLowerCase(),p_observation_date:date||null
      });
      return Object.freeze({claimId:id(receipt),state:'CLAIM_UNVERIFIED_NO_BYTES'});
    },
    async ownerEvidencePacket(requestId){
      requireRole(role,'owner');
      const p=await rpc('jb_b8_g3_owner_evidence_packet',{p_request_id:id(requestId)});
      if(!p||p.request_id!==requestId||p.full_proof_pack_verified!==false||
        p.original_official_source_authenticity_verified!==false||
        p.external_delivery_status!=='NOT_SENT')
        deny('INVALID_G3_FOUNDER_EVIDENCE_TRUTH');
      return Object.freeze(p);
    },
    async ownerAuthorizeRestricted(requestId,reason){
      requireRole(role,'owner');
      const approval=await rpc('jb_b8_g3_owner_authorize_r2',{
        p_request_id:id(requestId),
        p_reason:bounded(reason,12,500,'FOUNDER_R2_REASON_REQUIRED')
      });
      return Object.freeze({approvalId:id(approval),externalStatus:'NOT_SENT'});
    },
    async ownerHandoffTruth(questionId){
      requireRole(role,'owner');
      const p=await rpc('jb_b8_g3_owner_handoff_truth',{p_question_id:id(questionId)});
      if(!p||p.question_id!==questionId||p.official_delivery_verified!==false||
        p.provider_acceptance_verified!==false||p.external_delivery_status!=='NOT_VERIFIED')
        deny('FALSE_OFFICIAL_DELIVERY');
      return Object.freeze(p);
    },
    async reporterLinkReceipt(requestId,receiptId){
      requireRole(role,'reporter');
      const x=await rpc('jb_b8_g3_reporter_link_verified_bytes',{
        p_request_id:id(requestId),p_receipt_id:id(receiptId)
      });
      return Object.freeze({linkId:id(x),meaning:'PRIVATE_BYTE_INTEGRITY_NOT_OFFICIAL_TRUTH'});
    },
    async editorScreenSerious(requestId,reason){
      requireRole(role,'editor');
      const x=await rpc('jb_b8_g3_editor_screen_r1',{
        p_request_id:id(requestId),
        p_reason:bounded(reason,12,500,'EDITOR_R1_REASON_REQUIRED')
      });
      return Object.freeze({screeningId:id(x),externalStatus:'NOT_SENT'});
    },
    async reporterPrepareHandoff(questionId,channel){
      requireRole(role,'reporter');
      if(!['EMAIL','WHATSAPP','OFFICIAL_PORTAL','HAND_DELIVERY'].includes(channel))
        deny('HANDOFF_CHANNEL_NOT_ALLOWED');
      const x=await rpc('jb_b8_g3_reporter_prepare_manual_handoff',{
        p_question_id:id(questionId),p_channel:channel
      });
      return Object.freeze({handoffId:id(x),state:'PREPARED_NOT_SENT',
        deliveryVerified:false});
    },
    async reporterRecordHandoff(intentId,observation,receiptId=null){
      requireRole(role,'reporter');
      const allowed=['COMPOSER_OPENED','USER_REPORTED_ATTEMPT',
        'UNVERIFIED_RECEIPT_ATTACHED'];
      if(!allowed.includes(observation)||
        ((observation==='UNVERIFIED_RECEIPT_ATTACHED')!==Boolean(receiptId)))
        deny('UNVERIFIED_OBSERVATION_INPUT');
      const x=await rpc('jb_b8_g3_reporter_record_handoff_observation',{
        p_intent_id:id(intentId),p_observation:observation,
        p_receipt_id:receiptId?id(receiptId):null
      });
      return Object.freeze({observationId:id(x),externalStatus:'NOT_VERIFIED',
        delivered:false});
    },
    async reporterClaimOfficialReply(handoffId,privateReceiptId,office,receivedAt,summary){
      requireRole(role,'reporter');
      const rid=await rpc('jb_b8_g3_reporter_claim_official_reply',{
        p_handoff_id:id(handoffId),p_receipt_id:id(privateReceiptId),
        p_claimed_office:bounded(office,3,160,'REPLY_OFFICE_REQUIRED'),
        p_claimed_received_at:validDate(receivedAt),
        p_reply_summary:bounded(summary,12,1400,'REPLY_SUMMARY_REQUIRED')
      });
      return Object.freeze({replyClaimId:id(rid),accuracy:'REPORTER_CLAIM_UNVERIFIED',
        officiallyVerified:false});
    },
    async ownerReplyClaimSummary(questionId){
      requireRole(role,'owner');
      const p=await rpc('jb_b8_g3_owner_reply_claim_summary',{
        p_question_id:id(questionId)
      });
      if(!p||p.question_id!==questionId||
        p.official_reply_independently_verified!==false||
        p.provider_external_delivery_verified!==false||
        p.accuracy_class!=='REPORTER_CLAIM_UNVERIFIED')
        deny('FALSE_OFFICIAL_REPLY_STATUS');
      return Object.freeze(p);
    },
    async reporterUploadCaseEvidence(caseId,file){
      requireRole(role,'reporter');
      if(!allowPrivateUpload)deny('UPLOAD_HOSTED_GATE_NOT_APPROVED');
      if(!client.functions||typeof client.functions.invoke!=='function'||
          !client.auth||typeof client.auth.getSession!=='function')
        deny('UPLOAD_BACKEND_UNAVAILABLE');
      if(!file||typeof file.arrayBuffer!=='function'||!file.type||
         !['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)||
         !Number.isInteger(file.size)||file.size<8||file.size>UPLOAD_MAX)
        deny('UPLOAD_SIZE_OR_TYPE_INVALID');
      const session=await client.auth.getSession();
      const access=session?.data?.session?.access_token;
      if(!access)deny('AUTH_REQUIRED');
      const raw=new Uint8Array(await file.arrayBuffer());
      if(raw.byteLength!==file.size)deny('UPLOAD_SIZE_CHANGED');
      const {data,error}=await client.functions.invoke('jb-b8-private-evidence',{
        method:'POST',headers:{
          'Authorization':'Bearer '+access,
          'x-b8-case-id':id(caseId),
          'x-b8-file-name':bounded(file.name,5,120,'UPLOAD_LABEL_REQUIRED'),
          'x-b8-mime-type':file.type,
          'Content-Type':'application/octet-stream'
        },body:raw
      });
      if(error||!data?.ok||data.documentaryAuthenticityVerified!==false||
         data.proof!=='PRIVATE_READBACK_SHA256_ONLY'||!validId(data.receiptId))
        deny('UPLOAD_NOT_CONFIRMED');
      return Object.freeze({receiptId:data.receiptId,byteCount:data.byteCount,
        proof:data.proof,officialAuthenticityVerified:false});
    }
  });
}
