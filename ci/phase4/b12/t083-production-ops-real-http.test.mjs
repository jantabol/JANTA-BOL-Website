// P4-T083 real external DNS + HTTPS/TLS read-only probes.
// Scope: original public JANTA BOL domain only. No Founder sessions,
// provider billing, private news data, mutation, promotion, or backups.
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve4,resolveCname} from 'node:dns/promises';
import tls from 'node:tls';
import net from 'node:net';

const root='jantabol.in';
const www='www.jantabol.in';
const site='https://jantabol.in';
const expectedLiveSha='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
// Release SHA is a source/metadata assertion, never a remote HTTP header promise.
assert.match(expectedLiveSha,/^[a-f0-9]{40}$/);

function publicV4(ip){
 if(net.isIP(ip)!==4)return false;
 const [a,b]=ip.split('.').map(Number);
 return !(a===10||a===127||a===0||a>=224||a===169&&b===254
   ||a===172&&b>=16&&b<=31||a===192&&b===168);
}

test('T083 external DNS: live apex A record resolves publicly', {timeout:18000},async()=>{
 const ips=await resolve4(root);
 assert(ips.length>0,'DOMAIN_A_RECORD_EMPTY');
 for(const ip of ips)assert(publicV4(ip),'NOT_PUBLIC_DNS_IP');
 // Explicit known-good Vercel A configuration from real Vercel project GET.
 assert(ips.includes('76.76.21.21'),'VERCEL_APEX_DNS_SOURCE_MISMATCH');
});

test('T083 external DNS: www name has routable DNS', {timeout:18000},async()=>{
 let hasTarget=false;
 try{const names=await resolveCname(www);hasTarget=names.length>0;}
 catch{const ips=await resolve4(www);hasTarget=ips.some(publicV4);}
 assert(hasTarget,'WWW_DNS_UNAVAILABLE');
});

function verifiedCertificate(host){
 return new Promise((resolve,reject)=>{
  const socket=tls.connect({host,port:443,servername:host,rejectUnauthorized:true,timeout:18000},()=>{
   try{
    assert.equal(socket.authorized,true,'UNTRUSTED_TLS_CERTIFICATE');
    const c=socket.getPeerCertificate();
    assert(c&&c.valid_to,'MISSING_TLS_CERTIFICATE');
    const validTo=Date.parse(c.valid_to);
    assert(Number.isFinite(validTo),'INVALID_TLS_EXPIRY');
    assert(validTo>Date.now()+7*24*3600_000,'TLS_EXPIRES_WITHIN_SEVEN_DAYS');
    const protocol=socket.getProtocol()||'';
    assert(['TLSv1.2','TLSv1.3'].includes(protocol),'TLS_PROTOCOL_TOO_OLD');
    resolve({host,expires:c.valid_to,protocol});
   }catch(e){reject(e)}finally{socket.end()}
  });
  socket.once('error',reject);
  socket.once('timeout',()=>{socket.destroy();reject(new Error('TLS_TIMEOUT'))});
 });
}
test('T083 external real apex HTTPS certificate is valid beyond 7 days',{timeout:24000},async()=>{
 const proof=await verifiedCertificate(root);
 assert.equal(proof.host,root);
});
test('T083 external real www HTTPS certificate is valid beyond 7 days',{timeout:24000},async()=>{
 const proof=await verifiedCertificate(www);
 assert.equal(proof.host,www);
});

test('T083 actual public landing returns branded HTML without credentials',{timeout:25000},async()=>{
 const u=new URL('/JANTA_BOL_PHASE_3C_WORKING/index.html',site);
 const r=await fetch(u,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(18000),
  headers:{Accept:'text/html','User-Agent':'JANTA-BOL-T083-GET-ONLY'}});
 assert.equal(r.status,200,'LIVE_PUBLIC_HOME_NOT_200');
 assert.match(r.headers.get('content-type')||'',/text\/html/i);
 const body=await r.text();
 assert.match(body,/JANTA\s*BOL/i);
});
test('T083 www canonical redirect never leaves JANTA BOL domain',{timeout:25000},async()=>{
 const r=await fetch('https://www.jantabol.in/',{redirect:'manual',
  signal:AbortSignal.timeout(18000),headers:{Accept:'text/html'}});
 assert.equal(r.status,308,'WWW_REDIRECT_NOT_308');
 const location=r.headers.get('location');
 assert(location,'WWW_REDIRECT_MISSING');
 const resolved=new URL(location,'https://www.jantabol.in/');
 assert.equal(resolved.origin,site,'REDIRECT_EXTERNAL_DOMAIN');
});

// Gate wiring only — DOES NOT prove any missing runtime evidence.
// Full E8 plus real Founder lifecycle and release signoff are still NOT_RUN.
test('T083 cannot lock Topic-11 using source/HTTPS checks while E8 is DUE',()=>{
 const evidence={
  exactReleaseId:true,domainVerifiedInVercel:true,
  fullCurrentPointE8Restore:false,
  actualControlledRollback:false,
  founderProductionSignoff:false
 };
 const finalLock=Object.values(evidence).every(Boolean);
 assert.equal(finalLock,false);
});
