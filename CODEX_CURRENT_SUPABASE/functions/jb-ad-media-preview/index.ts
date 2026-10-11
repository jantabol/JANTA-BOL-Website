/**
 * JANTA BOL B7 PRIVATE MEDA PREVIEW — REVIEW ONLY / UNDEPLOYED.
 * NO CORS access granted; no write to production or any storage.
 * Requires paired Owner app release, source parity & actual E3/E5 before
 * deliberately deploying. Does NOT implement B7 media asset approval.
 */
import {handlePrivateAdMediaPreview} from './handler.ts';
import {buildPrivateAdImagePreview} from '../_shared/b7-image-sanitize.ts';
import {verifyAdMediaOwner} from './owner-auth.ts';

// Only the canonical Owner/AAL2 capability authorizes this private gate.
const ownerAal2=(token:string)=>verifyAdMediaOwner(token,{
 baseUrl:Deno.env.get('SUPABASE_URL')||'',
 anonKey:Deno.env.get('SUPABASE_ANON_KEY')||''
});

Deno.serve(req=>handlePrivateAdMediaPreview(req,{
 authorize:ownerAal2,
 convert:buildPrivateAdImagePreview
}));
