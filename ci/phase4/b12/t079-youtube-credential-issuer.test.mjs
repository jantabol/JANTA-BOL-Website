import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createReadOnlyCredentialIssuer}
 from '../../../CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/credential-issuer.mjs';
const scope='https://www.googleapis.com/auth/youtube.force-ssl',channelId='UC'+'A'.repeat(22);
const b64=b=>Buffer.from(b).toString('base64');
const key=crypto.randomBytes(32),iv=crypto.randomBytes(12);
const plain='private_mock_refresh_token';
const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
const enc=Buffer.concat([cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
const sealed={refresh_token_ciphertext:b64(enc),iv_b64:b64(iv)};
function app({environment='development',credEnv='development',refreshStatus=200,channelMatch=true,
 scopeGood=true,rotation=false,connected=true,tokenType='Bearer',secretValid=true}={}){
 let calls=[];const state={
  connection_state:connected?'CONNECTED':'REAUTH_REQUIRED',
  control_auth_state:'OK',credential_incident_state:'CLEAR',
  expected_channel_id:channelId,verified_channel_id:channelId,
  last_refresh_status:'OK',granted_scopes:[scope]
 };
 const config={
  expectedChannelId:channelId,deploymentEnv:environment,googleCredentialEnv:credEnv,
  tokenKeyB64:b64(key),clientId:'google_mock_client',clientSecret:'google_mock_secret',
  service:{
   from:()=>{const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:state,error:null})};return chain},
   rpc:async()=>({data:secretValid?sealed:null,error:null})
  },
  fetchGoogle:async(url,req)=>{
   calls.push({url,req});
   if(url.includes('/token')){
    assert.equal(req.method,'POST');
    assert.equal(req.redirect,'manual');
    assert.equal(req.body.get('refresh_token'),plain);
    return {status:refreshStatus,json:async()=>({
     access_token:'mock_short_lived_google_token_123456',token_type:tokenType,
     scope:scopeGood?scope:'https://www.googleapis.com/auth/youtube.readonly',
     ...(rotation?{refresh_token:'rotated_server_only'}:{})
    })};
   }
   if(url.includes('/channels')){
    assert.equal(req.method,'GET');
    assert.equal(req.headers.Authorization,'Bearer mock_short_lived_google_token_123456');
    return {status:200,json:async()=>({items:[{id:channelMatch?channelId:'UC'+'B'.repeat(22)}]})};
   }
   throw Error('Unexpected provider');
  }
 };
 return {config,calls,state};
}
test('real AES-GCM ciphertext used server-side and Google mine exact channel verified',async()=>{
 const h=app();
 const issuer=createReadOnlyCredentialIssuer(h.config);
 const r=await issuer({channelId});
 assert.equal(r.channelVerified,true);assert.equal(r.scopeVerified,true);
 assert.equal(r.accessToken,'mock_short_lived_google_token_123456');
 assert.equal(h.calls.length,2);
 assert.equal(h.calls[0].url,'https://oauth2.googleapis.com/token');
 assert.equal(h.calls[1].url,'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true');
 await assert.rejects(issuer({channelId:'UC'+'B'.repeat(22)}),{code:'WRONG_YOUTUBE_CHANNEL'});
 assert.equal(h.calls.length,2);
});
test('server issuer fails closed wrong credential environment, wrong channel, or mismatched Google scope',async()=>{
 for(const env of [{environment:'test',credEnv:'production'},{environment:'unknown'}]){
  const h=app(env);
  assert.throws(()=>createReadOnlyCredentialIssuer(h.config),{code:'OAUTH_ENVIRONMENT_MISMATCH'});
 }
 for(const variant of [{channelMatch:false},{scopeGood:false},{connected:false},
  {refreshStatus:503},{rotation:true},{tokenType:'invalid'},{secretValid:false}]){
  const h=app(variant);
  await assert.rejects(createReadOnlyCredentialIssuer(h.config)({channelId}));
 }
});
test('wrong key rejects AES-GCM authentication without leaking credential',async()=>{
 const h=app();h.config.tokenKeyB64=b64(crypto.randomBytes(32));
 await assert.rejects(createReadOnlyCredentialIssuer(h.config)({channelId}),
  {code:'OAUTH_SECRET_DECRYPT_DENIED'});
});
