// JANTA BOL / P4-T082: Real anonymous browser check of CURRENT public domain.
// Deliberately NO Founder auth, service keys, article writes, analytics on a
// published article, share targets, cookies, browser extensions or paid infra.
// Checks visible rendered DOM only; it does not fetch private article details.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const host='https://jantabol.in';
const path='/JANTA_BOL_PHASE_3C_WORKING/article.html';
const existingDraft='fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14';

function browserExecutable(){
 const candidates=[process.env.CHROME_BIN,'google-chrome','google-chrome-stable','chromium','chromium-browser'].filter(Boolean);
 for(const p of candidates){
  const probe=spawnSync(p,['--version'],{timeout:8000,encoding:'utf8'});
  if(probe.status===0)return p;
 }
 throw new Error('HEADLESS_CHROME_NOT_AVAILABLE_NO_E5_VERDICT');
}

function readAnonymousRenderedRoot(params){
 const chrome=browserExecutable();
 const u=new URL(path,host);
 u.searchParams.set('id',existingDraft);
 if(params.preview)u.searchParams.set('preview','admin');
 assert.equal(u.origin,host);
 const privateProfile=mkdtempSync(join(tmpdir(),'jb-t082-empty-anon-profile-'));
 try{
  const output=execFileSync(chrome,[
   '--headless=new','--no-sandbox','--disable-dev-shm-usage',
   '--disable-gpu','--disable-extensions','--disable-sync',
   '--disable-background-networking','--no-first-run','--no-default-browser-check',
   '--incognito','--virtual-time-budget=24000',
   '--user-data-dir='+privateProfile,'--dump-dom',u.href
  ],{encoding:'utf8',timeout:55000,maxBuffer:6*1024*1024,stdio:['ignore','pipe','ignore']});
  const root=output.match(/<div\s+id=["']root["'][^>]*>([\s\S]*?)<\/div>\s*<section\b/i);
  assert.ok(root,'PUBLIC_PAGE_RENDER_UNVERIFIED_ROOT_MISSING');
  return root[1].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 } finally {
  rmSync(privateProfile,{recursive:true,force:true});
 }
}

test('T082 real anonymous Chrome must NOT reveal T006 on ?preview=admin',()=>{
 const rendered=readAnonymousRenderedRoot({preview:true});
 assert.match(rendered,/Admin preview temporarily unavailable\. Please retry securely\./);
 assert.doesNotMatch(rendered,/T006 Normal Publishing Independence Test/i);
 assert.doesNotMatch(rendered,/T082 INTERNAL QA TEST ONLY/i);
 assert.doesNotMatch(rendered,/Yeh article T006 verification ke liye/i);
});

test('T082 real anonymous Chrome ordinary Draft PURL fails closed with no article body',()=>{
 const rendered=readAnonymousRenderedRoot({preview:false});
 assert.match(rendered,/Article available nahi hai ya currently unpublished hai\./);
 assert.doesNotMatch(rendered,/T006 Normal Publishing Independence Test/i);
 assert.doesNotMatch(rendered,/T082 INTERNAL QA TEST ONLY/i);
 assert.doesNotMatch(rendered,/Yeh article T006 verification ke liye/i);
});
