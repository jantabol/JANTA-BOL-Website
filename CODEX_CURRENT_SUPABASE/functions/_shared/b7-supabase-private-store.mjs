/* B7 isolated server-side Supabase Storage adapter; caller injects PRIVILEGED
 * server client. REVIEW ONLY. No bucket creation, no URL methods, no deletes. */
import {RAW,DERIV} from './b7-private-media-stage.mjs';
function guard(bucket,path){
 if(bucket!==RAW&&bucket!==DERIV)throw Error('B7_BUCKET_NOT_ALLOWED');
 if(path!==undefined&&!/^staged\/[0-9a-f-]{36}\/[a-f0-9]{64}\.(?:png|jpg|jpeg|webp)$/.test(path))
  throw Error('B7_PATH_NOT_ALLOWED');
}
export function b7SupabasePrivateStore(client){
 if(!client?.storage?.getBucket||!client?.storage?.from)throw Error('B7_SERVER_CLIENT_REQUIRED');
 return Object.freeze({
  async checkPrivate(bucket){
   guard(bucket);
   try{
    const {data,error}=await client.storage.getBucket(bucket);
    return !error&&data?.id===bucket&&data.public===false&&Number(data.file_size_limit)>=8388608;
   }catch{return false}
  },
  async createOnly(bucket,path,bytes,mime){
   guard(bucket,path);
   if(!(bytes instanceof Uint8Array)||bytes.length<16||bytes.length>8388608||
      !['image/png','image/jpeg','image/webp'].includes(mime)||
      bucket===DERIV&&mime!=='image/png')throw Error('B7_PRIVATE_BAD_MEDIA');
   if(!await this.checkPrivate(bucket))return false;
   const safe=new ArrayBuffer(bytes.byteLength);new Uint8Array(safe).set(bytes);
   const {error}=await client.storage.from(bucket).upload(path,new Blob([safe],{type:mime}),
    {upsert:false,cacheControl:'0',contentType:mime});
   return !error;
  },
  async readPrivate(bucket,path){
   guard(bucket,path);
   if(!await this.checkPrivate(bucket))throw Error('B7_BUCKET_BECAME_PUBLIC');
   const {data,error}=await client.storage.from(bucket).download(path);
   if(error||!data||data.size>8388608)throw Error('B7_STORAGE_READ_DENIED');
   return new Uint8Array(await data.arrayBuffer());
  }
 });
}
