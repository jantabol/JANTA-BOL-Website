/* B7 ADS-015 private media QUARANTINE, REVIEW ONLY. No publication,
 * direct browser calls, privileged live writes or asset approval. */
export const RAW='jb-ad-originals-private', DERIV='jb-ad-previews-private';
const error=x=>{throw Error('B7_STAGE_'+x)};
const sha=async bytes=>{
 const ab=new ArrayBuffer(bytes.byteLength);new Uint8Array(ab).set(bytes);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',ab))]
   .map(n=>n.toString(16).padStart(2,'0')).join('');
};
export async function stageB7Image(input,dep){
 const {token,bytes,name,mime}=input||{};
 const {authorize,convert,store,onOrphan,allocateId=()=>crypto.randomUUID()}=dep||{};
 if(typeof token!=='string'||token.length<40||token.length>8000||
    !(bytes instanceof Uint8Array)||bytes.length<16||bytes.length>8388608||
    typeof authorize!=='function'||typeof convert!=='function'||
    typeof onOrphan!=='function'||!store)error('INVALID_INPUT');
 let owner=false;try{owner=(await authorize(token))===true}catch{}
 if(!owner)error('OWNER_AAL2_REQUIRED');
 const ext=String(name||'').toLowerCase().split('.').pop();
 if(!({'image/png':['png'],'image/jpeg':['jpg','jpeg'],'image/webp':['webp']}[mime]||[]).includes(ext))
  error('UNSUPPORTED_SOURCE');
 // Private-only buckets; do NOT reuse public-media, editorial or grievance.
 for(const b of [RAW,DERIV])if(await store.checkPrivate(b)!==true)error('PRIVATE_BUCKET_REQUIRED');
 const id=allocateId();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))error('INVALID_ASSET_ID');
 let img;try{img=await convert(bytes,name,mime)}catch{error('SERVER_DECODER_REFUSED')}
 if(!img||img.status!=='PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED'||
    img.canApprove!==false||img.canPublish!==false||img.contentType!=='image/png'||
    !(img.privatePreviewPng instanceof Uint8Array)||
    img.privatePreviewPng.length<16||img.privatePreviewPng.length>8388608||
    !Number.isInteger(img.width)||!Number.isInteger(img.height)||
    img.width<1||img.height<1||img.width>1200||img.height>1200)
  error('SANITIZER_RECEIPT_REJECTED');
 const rawHash=await sha(bytes),deriv=img.privatePreviewPng,derivHash=await sha(deriv);
 if(rawHash!==img.sourceSha256||derivHash!==img.derivativeSha256)error('DIGEST_MISMATCH');
 const files=[
  {bucket:RAW,path:'staged/'+id+'/'+rawHash+'.'+ext,bytes,sha256:rawHash,mime},
  {bucket:DERIV,path:'staged/'+id+'/'+derivHash+'.png',bytes:deriv,sha256:derivHash,mime:'image/png'}
 ];
 const made=[];
 try{
  for(const f of files){
   if(await store.createOnly(f.bucket,f.path,f.bytes,f.mime)!==true)error('CREATE_ONLY_FAILED');
   made.push({bucket:f.bucket,path:f.path});
   const v=await store.readPrivate(f.bucket,f.path);
   if(!(v instanceof Uint8Array)||v.length!==f.bytes.length||await sha(v)!==f.sha256)
    error('READBACK_SHA256_MISMATCH');
  }
 }catch{
  if(made.length){
   let audited=false;
   try{audited=(await onOrphan({assetId:id,objects:made,status:'RECONCILIATION_REQUIRED'}))===true}catch{}
   if(!audited)error('DURABLE_ORPHAN_AUDIT_REQUIRED');
  }
  error('PRIVATE_STORAGE_UNVERIFIED');
 }
 return Object.freeze({assetId:id,
  source:Object.freeze({bucket:RAW,path:files[0].path,sha256:rawHash,bytes:bytes.length,mime}),
  derivative:Object.freeze({bucket:DERIV,path:files[1].path,sha256:derivHash,
   bytes:deriv.length,mime:'image/png',width:img.width,height:img.height}),
  state:'PRIVATE_QUARANTINE_NOT_REGISTERED',
  verifiedReadback:true,approved:false,publishable:false,
  pending:['DURABLE_DB_EVIDENCE','OWNER_APPROVAL','PUBLIC_CLEAN_DERIVATIVE','REAL_E3_E5_E7']});
}
