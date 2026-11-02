// B13 T088 E6 — real hosted Supabase Edge *unauthenticated* refusal, GET only.
// All targets are listed ACTIVE + verify_jwt=true in live Supabase function inventory.
// Important: absence of Authorization/Key is a gateway negative, NOT a signed
// two-account API/RLS proof, and NOT evidence of a restored Edge deployment.
// No Owner/Reporter JWT, secrets, request bodies, mutation or stream operation.
import assert from 'node:assert/strict';
const project='vrffsnkycvjithwtiylt';
const slugs=['jb-live-api','jb-team-api','jb-records-api','jb-b11-t069-media-backup'];
assert.equal(process.env.SUPABASE_SERVICE_ROLE_KEY,undefined);
assert.equal(process.env.SUPABASE_DB_PASSWORD,undefined);
for(const slug of slugs){
 const url='https://'+project+'.supabase.co/functions/v1/'+slug;
 const response=await fetch(url,{
  method:'GET',
  redirect:'error',
  headers:{accept:'application/json'},
  signal:AbortSignal.timeout(15000)
 });
 assert.ok([401,403].includes(response.status),
  'T088_EDGE_JWT_REQUIRED_UNEXPECTED_STATUS_'+slug+'_'+response.status);
 // Never log response body or any token; this is a public-only 401/403 check.
 console.log('T088_EDGE_NO_JWT_DENIED_'+slug+'=PASS_SCOPED');
}
console.log('T088_LIVE_EDGE_JWT_GATEWAY_NEGATIVES='+slugs.length+'/'+slugs.length);
console.log('T088_SIGNED_OWNER_REPORTER_POSITIVE_API=NOT_RUN');
console.log('T088_EXTERNAL_ENCODER_STREAM_OR_YOUTUBE_DELIVERY=NOT_RUN');
console.log('T088_EDGE_RESTORE_GO_TRUE_AND_VERCEL_RECOVERY=NOT_RUN');
