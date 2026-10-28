/**
 * P4-T072 add-only REVIEW_ONLY browser client candidate.
 * This is NOT wired into the existing B8 UI and does not change Production.
 *
 * The ORIGINAL jb_b8_g1_owner_create_case(text,text,text) is not idempotent.
 * This adapter calls only the proposed, currently UNDEPLOYED protected RPC:
 * jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)
 *
 * Do not turn on in production until separate SQL/RLS, owner/AAL2,
 * Android persistence and hosted release gates pass.
 */
const UID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const VALID_LANES=new Set(['R0','R1','R2']);
const RPC='jb_b8_g1_owner_create_case_idempotent';
const KEY_PREFIX='JB:B8:T072:OWNER_CASE_REQUEST_V1:';

function reject(code){throw new Error('B8_T072_'+code);}
function validUid(value){return typeof value==='string'&&UID.test(value);}
function normalized(args){
 const title=typeof args?.title==='string'?args.title.trim():null;
 const area=typeof args?.area==='string'?args.area.trim():null;
 const lane=args?.lane;
 if(!title||title.length<12||title.length>200||
    !area||area.length<2||area.length>120||!VALID_LANES.has(lane))
  reject('INVALID_CASE_INPUT');
 return Object.freeze({title,area,lane});
}
function serialized(v){return JSON.stringify(v);}
function stateFrom(storage,key){
 let value;
 try{value=storage.getItem(key);}catch{reject('DURABLE_STORAGE_READ_FAILED');}
 if(value===null)return null;
 let x;
 try{x=JSON.parse(value);}catch{reject('DURABLE_STATE_CORRUPT');}
 if(x?.schema!=='T072_OWNER_CASE_V1' || !validUid(x.ownerId) ||
    !validUid(x.requestKey) || !/^[0-9a-f]{64}$/.test(x.payloadDigest) ||
    !['PENDING','CONFIRMED'].includes(x.status))
   reject('DURABLE_STATE_CORRUPT');
 return x;
}
function persist(storage,key,value){
 const json=serialized(value);
 try{
  storage.setItem(key,json);
  if(storage.getItem(key)!==json)reject('DURABLE_WRITE_NOT_VERIFIED');
 }catch(e){
  if(e?.message==='B8_T072_DURABLE_WRITE_NOT_VERIFIED')throw e;
  reject('DURABLE_STORAGE_WRITE_FAILED');
 }
}
async function actor(client,ownerId){
 if(typeof client?.auth?.getUser!=='function'||typeof client.rpc!=='function')
  reject('AUTHENTICATED_CLIENT_REQUIRED');
 let result;
 try{result=await client.auth.getUser();}catch{reject('CURRENT_SESSION_UNAVAILABLE');}
 const actual=result?.data?.user?.id;
 if(result?.error||!validUid(actual)||actual!==ownerId)
  reject('CURRENT_ACTOR_MISMATCH_OR_EXPIRED');
 return actual;
}
function secureDependencies(deps){
 if(!deps?.storage||!deps.locks||typeof deps.locks.request!=='function' ||
    !deps.crypto||typeof deps.crypto.randomUUID!=='function' ||
    typeof deps.crypto.subtle?.digest!=='function')
  reject('DURABLE_LOCK_OR_CRYPTO_UNAVAILABLE');
}
async function digest(crypto,requestKey,payload){
 const data=new TextEncoder().encode(serialized([requestKey,payload.title,payload.area,payload.lane]));
 const hash=await crypto.subtle.digest('SHA-256',data);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
function keyFor(ownerId){return KEY_PREFIX+ownerId.toLowerCase();}
async function withExclusiveLock(locks,ownerId,callback){
 try{
  return await locks.request('JB-B8-T072-CASE-CREATE-'+ownerId.toLowerCase(),
    {mode:'exclusive'},callback);
 }catch(e){
  if(String(e?.message||'').startsWith('B8_T072_'))throw e;
  reject('EXCLUSIVE_TAB_LOCK_FAILED');
 }
}

/**
 * One durable Owner intent, reused across ambiguous acknowledgement, page reload,
 * session refresh and concurrent Android tabs. No sensitive title/area in storage.
 * The server checks current real Owner/AAL2 on EVERY request (including replays).
 * Failed/unknown requests remain pending and may only retry the same payload.
 */
export async function submitOwnerCaseIdempotentCandidate({client,ownerId,payload,storage,locks,crypto}){
 if(!validUid(ownerId))reject('OWNER_UUID_REQUIRED');
 secureDependencies({storage,locks,crypto});
 const args=normalized(payload);
 await actor(client,ownerId);
 return withExclusiveLock(locks,ownerId,async()=>{
  // Revalidate after lock: a different signed-in account MUST NOT inherit intent.
  await actor(client,ownerId);
  const k=keyFor(ownerId);
  let saved=stateFrom(storage,k);
  if(saved&&saved.ownerId.toLowerCase()!==ownerId.toLowerCase())
   reject('DURABLE_OWNER_BINDING_MISMATCH');
  if(!saved){
   const requestKey=crypto.randomUUID();
   if(!validUid(requestKey))reject('INSECURE_REQUEST_KEY');
   saved={schema:'T072_OWNER_CASE_V1',ownerId:ownerId.toLowerCase(),
    requestKey:requestKey.toLowerCase(),payloadDigest:await digest(crypto,requestKey,args),
    status:'PENDING'};
   // Storage MUST be confirmed before network: if it fails, no case is created.
   persist(storage,k,saved);
  }
  if(await digest(crypto,saved.requestKey,args)!==saved.payloadDigest)
   reject('UNRESOLVED_PREVIOUS_INTENT_DIFFERENT_PAYLOAD');
  // Refuse to continue if another tab/app has modified durable state.
  if(serialized(stateFrom(storage,k))!==serialized(saved))
   reject('DURABLE_REQUEST_CHANGED');
  let response;
  try{
   response=await client.rpc(RPC,{
    p_request_key:saved.requestKey,
    p_title:args.title,p_area_label:args.area,p_risk_lane:args.lane
   });
  }catch{
   reject('SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY');
  }
  if(response?.error||!validUid(response?.data))
   reject('SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY');
  // We never cache a case ID client-side or return it without another
  // real protected backend response: server enforces fresh Owner/AAL2.
  const confirmed={...saved,status:'CONFIRMED'};
  persist(storage,k,confirmed);
  return response.data;
 });
}

/**
 * A deliberate new case intent is different from RETRY.
 * Only clear a CONFIRMED old intent, never erase UNKNOWN/PENDING data.
 * Caller must present a distinct, explicit "Create another case" action.
 */
export async function startNewOwnerCaseIntentCandidate({client,ownerId,storage,locks,crypto}){
 if(!validUid(ownerId))reject('OWNER_UUID_REQUIRED');
 secureDependencies({storage,locks,crypto});
 await actor(client,ownerId);
 return withExclusiveLock(locks,ownerId,async()=>{
  await actor(client,ownerId);
  const k=keyFor(ownerId);
  const state=stateFrom(storage,k);
  if(!state||state.status!=='CONFIRMED')
   reject('PENDING_OR_UNKNOWN_CANNOT_BE_DISCARDED');
  if(state.ownerId.toLowerCase()!==ownerId.toLowerCase())
   reject('DURABLE_OWNER_BINDING_MISMATCH');
  try{
   storage.removeItem(k);
   if(storage.getItem(k)!==null)reject('DURABLE_CLEAR_NOT_VERIFIED');
  }catch(e){
   if(e?.message==='B8_T072_DURABLE_CLEAR_NOT_VERIFIED')throw e;
   reject('DURABLE_CLEAR_FAILED');
  }
  return Object.freeze({readyForExplicitNewCase:true,previousConfirmed:true});
 });
}
