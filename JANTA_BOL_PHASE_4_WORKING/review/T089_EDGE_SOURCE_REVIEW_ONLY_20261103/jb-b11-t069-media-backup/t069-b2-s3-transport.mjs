// Candidate-only Backblaze B2 S3 transport: immutable-named ciphertext ONLY.
// The S3 client/credentials are injected from server-side runtime; no frontend keys.
export const JANTA_BOL_B2_BUCKET='jantabol-backup-euc-2026';
const KEY=/^production\/media\/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.jbt069\.age$/i;
export function createB2Transport({s3,PutObjectCommand,GetObjectCommand,bucket=JANTA_BOL_B2_BUCKET}){
 if(bucket!==JANTA_BOL_B2_BUCKET||typeof s3?.send!=='function'||
 typeof PutObjectCommand!=='function'||typeof GetObjectCommand!=='function')
  throw Error('B2_TRANSPORT_DISABLED');
 function keyAllowed(k){if(typeof k!=='string'||!KEY.test(k))throw Error('B2_OUT_OF_SCOPE')}
 return {
  async put(key,bytes){
   keyAllowed(key);
   if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>50*1024*1024)
    throw Error('CIPHERTEXT_BOUND');
   // Key includes per-run UUID. No DeleteObject or ListBucket capability is used.
   const r=await s3.send(new PutObjectCommand({
    Bucket:bucket,Key:key,Body:bytes,ContentType:'application/octet-stream',
    IfNoneMatch:'*',
    Metadata:{purpose:'janta-bol-t069-encrypted-media',format:'age'}
   }));
   if(!r||typeof r!=='object')throw Error('B2_PUT_UNCONFIRMED');
  },
  async get(key){
   keyAllowed(key);
   const r=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key}));
   if(!r?.Body||typeof r.Body.transformToByteArray!=='function')
    throw Error('B2_READBACK_MISSING');
   const bytes=await r.Body.transformToByteArray();
   if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>50*1024*1024)
    throw Error('B2_READBACK_OVERSIZE');
   return bytes;
  }
 };
}
