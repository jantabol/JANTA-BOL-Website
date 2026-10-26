import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root='supabase/functions/jb-b11-t069-media-backup/';
const paths=['t069-media-age-b2-roundtrip.mjs','t069-owner-supabase-media-source.mjs','t069-b2-s3-transport.mjs'];
const read=p=>readFileSync(p,'utf8');
test('T069 production candidate vendors EXACT reviewed, tested original-byte modules',()=>{
 for(const p of paths)assert.equal(read(root+p),read('ci/phase4/b11/'+p),p);
});
test('T069 separate Supabase gateway is opt-in Founder manual, <=15-minute window, exact project',()=>{
 const s=read(root+'index.ts');
 for(const term of ["JB_B11_T069_ENABLED","==='YES'","JB_B11_T069_ENABLED_UNTIL_UTC",
 "15*60*1000","url==='https://'+PROJECT+'.supabase.co","payload.action!=='backup-once'",
 "FOUNDER_CONFIRMATION_REQUIRED"])assert.ok(s.includes(term),term);
 assert.ok(s.includes("Deno.serve("));
});
test('T069 Supabase service-only key stays in server environment, Github must not have it',()=>{
 const s=read(root+'index.ts');
 assert.ok(s.includes("Deno.env.get(name)"));
 assert.ok(s.includes("SUPABASE_SERVICE_ROLE_KEY"));
 assert.ok(s.includes("getServiceClient:()=>createClient"));
 assert.doesNotMatch(s,/console\.log|console\.error|fetch\(['"]https:\/\/github/);
});
test('T069 authenticated Owner RPC must execute before any privileged source read or B2 write',()=>{
 const s=read('ci/phase4/b11/t069-media-age-b2-roundtrip.mjs');
 const x=read('ci/phase4/b11/t069-owner-supabase-media-source.mjs');
 assert.ok(s.indexOf("if(await authorizeFounder()!==true)reject();")<s.indexOf("const first=sortedDescriptors"));
 assert.ok(s.lastIndexOf("if(await authorizeFounder()!==true)reject();")<s.indexOf("await b2.put(key,cipher)"));
 assert.ok(x.includes("jb_owner_list_sessions"));
 assert.ok(x.includes("if(!verified)reject()"));
});
test('T069 edge has no Storage delete/move/upsert operations and no public private evidence output',()=>{
 const s=read(root+'index.ts'),src=read(root+'t069-owner-supabase-media-source.mjs');
 const transport=read(root+'t069-b2-s3-transport.mjs');
 for(const forbidden of [".remove(",".upload(",".update(",".move(","DeleteObjectCommand","CopyObjectCommand"])
  assert.ok(!s.includes(forbidden)&&!src.includes(forbidden)&&!transport.includes(forbidden),forbidden);
 assert.ok(s.includes("T069_REAL_BACKUP_EVIDENCE_HOLD"));
 assert.ok(!s.includes("Access-Control-Allow-Origin':'*'"));
});
test('T069 crypto and storage dependency versions pinned; no unattended schedule or PR-secret injection',()=>{
 const s=read(root+'index.ts'),wf=read('.github/workflows/b11-t069-media-age-b2-offsite-mock-CANDIDATE.yml');
 assert.ok(s.includes("npm:@supabase/supabase-js@2.117.2"));
 assert.ok(s.includes("jsr:@age/age-encryption@0.3.1"));
 assert.ok(s.includes("npm:@aws-sdk/client-s3@3.1156.0"));
 assert.doesNotMatch(wf,/^  (workflow_dispatch|schedule):/m);
 assert.ok(!wf.includes("secrets."));
});
