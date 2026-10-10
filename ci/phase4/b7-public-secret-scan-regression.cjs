'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {inspect,scan}=require('./b7-public-secret-scan.cjs');
function fakeJwt(role){
 const h=Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
 const p=Buffer.from(JSON.stringify({role,exp:1234567890})).toString('base64url');
 return h+'.'+p+'.'+('A'.repeat(24));
}
test('ADS-056 client scanner includes every public/admin/ad browser asset',()=>{
 const r=scan();
 assert.ok(r.examined>=30);
 assert.deepEqual(r.problems,[],'No known privileged credentials may be committed to client code');
});
test('ADS-056 reject synthetic Supabase secret and service role JWT',()=>{
 assert.deepEqual(inspect('const key="sb_secret_aaaaaaaaaaaaaa"'),['SUPABASE_SECRET_PROJECT_KEY']);
 assert.deepEqual(inspect('const key="'+fakeJwt('service_role')+'"'),['PRIVILEGED_JWT_IN_CLIENT']);
});
test('ADS-056 anonymous public JWT is not misclassified as service key',()=>{
 assert.deepEqual(inspect('const SUPABASE_ANON_KEY="'+fakeJwt('anon')+'";'),[]);
});
test('ADS-056 reject synthetic payment/cloud keys without displaying their values',()=>{
 assert.ok(inspect('const p="sk_live_aaaaaaaaaaaaaaaa";').includes('LIVE_PAYMENT_SECRET'));
 assert.ok(inspect('const h="whsec_aaaaaaaaaaaaaaaa";').includes('PAYMENT_WEBHOOK_SIGNING_SECRET'));
 assert.ok(inspect('const ak="AKIAAAAAAAAAAAAAAAAA";').includes('CLOUD_ACCESS_KEY'));
 assert.ok(inspect('const SECRET_ROLE_KEY="short";').length===0);
 assert.ok(inspect('const SERVICE_ROLE_KEY="not_a_real_key_value";').includes('HARDCODED_PRIVILEGED_CONFIG'));
});
test('ADS-056 no false claims about production ACL or external WhatsApp delivery',()=>{
 assert.deepEqual(inspect('const label="Advertisement pending. WhatsApp delivery unconfirmed.";'),[]);
});
