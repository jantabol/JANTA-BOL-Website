/**
 * B7 ADS-015 ISOLATED PRIVATE MEDIA WORKER — REVIEW ONLY / NOT DEPLOYED.
 *
 * Internal module only; deliberately NO Deno.serve and NO HTTP handler.
 * The public Owner gateway must NEVER receive service_role credentials.
 * Caller injects a private, server-only Supabase client from isolated runtime.
 * Do not integrate into a public Edge Function without a separate authenticated
 * command queue + worker boundary, actual Owner AAL2 E5 and Founder approval.
 *
 * This is strictly source bytes -> actual WASM decode -> 2 private Storage
 * create-only objects -> SHA256 readbacks -> canonical pending Creative/version
 * -> append-only private ledger. Nothing is approved or publicly accessible.
 */
import {identifyAdMediaOwner} from '../jb-ad-media-preview/owner-auth.ts';
import {buildPrivateAdImagePreview} from './b7-image-sanitize.ts';
import {b7SupabasePrivateStore} from './b7-supabase-private-store.mjs';
import {b7MediaServerEvidence} from './b7-media-server-evidence.mjs';
import {linkB7VerifiedPrivateMedia} from './b7-media-coordinator.mjs';

type ServerClient={
  storage:{
    getBucket:(id:string)=>Promise<{data:unknown,error:unknown}>;
    from:(name:string)=>unknown;
  };
  from:(table:string)=>unknown;
  rpc:(name:string,args:Record<string,unknown>)=>Promise<{data:unknown,error:unknown}>;
};
type PrivateImageInput={
 token:string;
 creativeId:string;
 bytes:Uint8Array;
 name:string;
 mime:string;
 // ownerId, submitted paths, hashes and public URLs are NOT accepted.
};
type PrivateWorkerEnvironment={
 serverClient:ServerClient;
 supabaseUrl:string;
 anonKey:string;
 fetcher?:typeof fetch;
 allocateId?:()=>string; // test only; production uses crypto.randomUUID
};

export async function processB7PrivateImageJob(
 input:PrivateImageInput,env:PrivateWorkerEnvironment
){
 if(!env?.serverClient||typeof env.serverClient.rpc!=='function'||
    !env.serverClient.storage?.getBucket||!env.serverClient.storage?.from||
    !env.supabaseUrl||!env.anonKey)
  throw Error('B7_WORKER_SEPARATE_PRIVILEGED_CLIENT_REQUIRED');
 if(!input||!(input.bytes instanceof Uint8Array)||
    input.bytes.length<16||input.bytes.length>8388608)
  throw Error('B7_WORKER_SOURCE_BYTES_DENIED');
 // Owner identity is derived from canonical LIVE Auth user + AAL2 Owner RPC,
 // never from a browser supplied ownerId or JWT user_metadata.
 const identify=(token:string)=>identifyAdMediaOwner(token,{
  baseUrl:env.supabaseUrl,anonKey:env.anonKey,
  request:env.fetcher??fetch
 });
 const ownerId=await identify(input.token);
 if(!ownerId)throw Error('B7_WORKER_OWNER_AAL2_REQUIRED');
 const adapter=b7MediaServerEvidence({
  client:env.serverClient,
  identifyOwner:identify,
  convert:buildPrivateAdImagePreview,
  store:b7SupabasePrivateStore(env.serverClient),
  allocateId:env.allocateId
 });
 return linkB7VerifiedPrivateMedia({
  token:input.token,ownerId,
  creativeId:input.creativeId,
  bytes:input.bytes,name:input.name,mime:input.mime
 },adapter);
}
