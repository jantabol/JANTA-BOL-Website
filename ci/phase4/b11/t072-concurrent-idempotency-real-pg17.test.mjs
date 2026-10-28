// T072 genuine disposable PostgreSQL17 concurrency/ownership retry probe.
// This test never uses live Supabase or a privileged production service.
// Invoked only inside jb_t072_idempotent GitHub Actions service after original
// B8 SQL, proposed add-on and original PG17 test have been loaded.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const base={env:{...process.env,PGHOST:'127.0.0.1',PGDATABASE:'jb_t072_idempotent'}};
function pg(sql){
 return run('psql',['-X','-A','-t','-v','ON_ERROR_STOP=1','-c',sql],{...base,timeout:16000,maxBuffer:100000});
}
const actorA='11111111-1111-1111-1111-111111111111';
const actorB='66666666-6666-6666-6666-666666666666';
const key='77777777-7777-4777-8777-777777777779';
const title='T072 concurrency real original owner request one action';
const area='Pichhore',lane='R1';
function exact(actor){
 return `SET b8.fixture_actor = '${actor}'; SET b8.fixture_session = 'on'; SET b8.fixture_aal = 'aal2'; SET ROLE authenticated; SELECT public.jb_b8_g1_owner_create_case_idempotent('${key}'::uuid,'${title}','${area}','${lane}');`;
}
function uuidFrom(o){
 const match=o.stdout.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g);
 assert(match?.length===1,`single returned case UUID expected; stdout length ${o.stdout.length}`);
 return match[0];
}
test('genuine concurrent same-key 8 PostgreSQL connections return exactly one committed case',async()=>{
 const init=await pg("SELECT current_database();");
 assert.equal(init.stdout.trim(),'jb_t072_idempotent');
 const tasks=Array.from({length:8},()=>pg(exact(actorA)));
 const attempts=await Promise.all(tasks);
 const ids=attempts.map(uuidFrom);
 assert.equal(new Set(ids).size,1,'CRITICAL two overlapping same-request transactions created two case IDs');
 const q=await pg(`SELECT count(*) FROM public.b8_owner_case_idempotency WHERE owner_id='${actorA}' AND request_key='${key}'; SELECT count(*) FROM public.b8_cases WHERE id='${ids[0]}';`);
 assert.deepEqual(q.stdout.trim().split(/\s+/),['1','1']);
 console.log('T072_E2_ACTUAL_PG17_8_PARALLEL_CONNECTIONS_ONE_OWNER_ONE_KEY_ONE_CASE=PASS_SCOPED');
});
test('same key and request from a DISTINCT legitimate Owner never returns first owner private case',async()=>{
 await pg(`INSERT INTO public.user_roles(user_id,role) VALUES('${actorB}'::uuid,'owner'::public.app_role);`);
 const actorBResp=uuidFrom(await pg(exact(actorB)));
 const q=await pg(`SELECT count(*) FROM public.b8_owner_case_idempotency WHERE request_key='${key}'; SELECT count(DISTINCT case_id) FROM public.b8_owner_case_idempotency WHERE request_key='${key}';`);
 assert.deepEqual(q.stdout.trim().split(/\s+/),['2','2']);
 const aResp=uuidFrom(await pg(exact(actorA)));
 assert.notEqual(actorBResp,aResp,'CRITICAL cross-owner idempotent private UUID leaked');
 console.log('T072_E2_OWNER_ISOLATED_REQUEST_KEY_SAME_KEY_DIFFERENT_OWNER_DISTINCT_CASE=PASS_SCOPED');
});
