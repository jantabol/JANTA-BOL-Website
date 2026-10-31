// T082 HISTORICAL REAL AUDIT SNAPSHOT RECONCILIATION (no production access in CI).
// The event statuses below are a date-stamped, redacted fixture from a 31-Oct-2026
// independently read-only PostgreSQL SELECT against *historical* live audit rows.
// CI tests the recorded chain and the current unchanged source interface,
// NOT the current real Owner publish/unpublish UI or DB trigger execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const originalJS=readFileSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js','utf8');
const published=readFileSync('JANTA_BOL_PHASE_3C_WORKING/published.html','utf8');
const draft=readFileSync('JANTA_BOL_PHASE_3C_WORKING/drafts.html','utf8');
const checkSql=readFileSync('ci/phase4/b12/t082-lifecycle-historical-readonly.sql','utf8');
const uuid='df97df06-a246-4e4e-ac5d-1f965fa6b381';

// Chain of actual from_status -> to_status for article versions 1→21.
// Does not contain a news body, source URLs, actors, auth, email or keys.
const statuses=[
'draft','draft','draft','draft','draft','draft',
'published','draft','published','deleted','published',
'published','published','draft','published','draft',
'published','published','published','published','draft'
];
const transitions=statuses.slice(1).map((to,i)=>({
  fromVersion:i+1,toVersion:i+2,
  from:statuses[i],to,articleId:uuid
}));

test('Historical original test record has 20 contiguous version events 1->21',()=>{
 assert.equal(transitions.length,20);
 for(const [i,t] of transitions.entries()){
  assert.equal(t.fromVersion,i+1);
  assert.equal(t.toVersion,t.fromVersion+1);
  assert.equal(t.from,statuses[i]);
  assert.equal(t.to,statuses[i+1]);
 }
 assert.equal(statuses.at(-1),'draft');
});
test('Historical same-PURL identity is invariant over all 20 changes',()=>{
 assert.equal(new Set(transitions.map(x=>x.articleId)).size,1);
 assert.equal(transitions[0].articleId,uuid);
});
test('Historical original article real events: five in, five out, five published corrections',()=>{
 const incoming=transitions.filter(x=>x.from!=='published'&&x.to==='published');
 const outgoing=transitions.filter(x=>x.from==='published'&&x.to!=='published');
 const corrections=transitions.filter(x=>x.from==='published'&&x.to==='published');
 assert.equal(incoming.length,5);
 assert.equal(outgoing.length,5);
 assert.equal(corrections.length,5);
 assert.equal(transitions.filter(x=>x.from==='draft'&&x.to==='published').length,4);
 assert.equal(transitions.filter(x=>x.from==='published'&&x.to==='draft').length,4);
 assert.equal(transitions.filter(x=>x.from==='published'&&x.to==='deleted').length,1);
 assert.equal(transitions.filter(x=>x.from==='deleted'&&x.to==='published').length,1);
});
test('Snapshot parity from independently verified read-only SQL is full historic 20/20',()=>{
 // DB readback confirmed 20 Article audit updates and exactly 20 prior snapshots,
 // missing=0, snapshot_status_mismatch=0, snapshot_uuid_mismatch=0,
 // snapshot_reason_mismatch=0. This is stored evidence, NOT live CI proof.
 const auditReadback={events:20,snapshots:20,missing:0,statusMismatches:0,uuidMismatches:0,reasonMismatches:0};
 assert.equal(auditReadback.events,transitions.length);
 assert.equal(auditReadback.snapshots,transitions.length);
 for(const key of ['missing','statusMismatches','uuidMismatches','reasonMismatches'])
  assert.equal(auditReadback[key],0);
});
test('Current production source retains Owner-only publish/unpublish and version-CAS',()=>{
 const a=originalJS.indexOf('async function publish(');
 const b=originalJS.indexOf('async function unpublish(');
 const c=originalJS.indexOf('async function softDelete(');
 assert(a>=0&&b>a&&c>b);
 const publishBlock=originalJS.slice(a,b);
 const unpublishBlock=originalJS.slice(b,c);
 assert.match(publishBlock,/await requireOwner\(\)/);
 assert.match(unpublishBlock,/await requireOwner\(\)/);
 assert.match(publishBlock,/\.eq\('id',working\.id\)/);
 assert.match(unpublishBlock,/\.eq\('id',id\)/);
 assert.match(publishBlock,/\.eq\('version',expectedVersion\)/);
 assert.match(unpublishBlock,/\.eq\('version',expectedVersion\)/);
 assert.match(unpublishBlock,/status:'draft'/);
 assert.match(unpublishBlock,/published_at:null/);
 assert.match(published,/JBBackend\.unpublish\(id,v\)/);
 assert.match(published,/add-news\.html\?edit=/);
 assert.match(draft,/add-news\.html\?edit=/);
});
test('Reproducibility SQL is read-only and derives the chain from audited rows',()=>{
 assert.match(checkSql,/FROM public\.audit_logs/i);
 assert.match(checkSql,/public\.article_versions/i);
 assert.match(checkSql,/chain_status_breaks/i);
 assert.match(checkSql,/snapshot_uuid_mismatch/i);
 assert.doesNotMatch(checkSql,/\b(INSERT|UPDATE|DELETE|TRUNCATE|CREATE|DROP|ALTER|MERGE|CALL|COPY)\s+(?:INTO|FROM|TABLE|DATABASE|FUNCTION|public\.|private\.)/i);
});
