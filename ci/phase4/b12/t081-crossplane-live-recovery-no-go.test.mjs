// P4-T081/B13 T084 SOURCE-BOUND READONLY RECOVERY PREFLIGHT.
// This verifies Git SHA/backup guard identity and prevents the 1-Nov metadata
// readback being mislabeled as full cross-plane restore. NO networking, SQL,
// secrets, filesystem mutations, deployment, storage writes or Git merges.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const LIVE='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const PROTECTED_MAIN='f447231c0677644ca5a44cc19f12cf0314ff38ea';
const PROJ='vrffsnkycvjithwtiylt';
const SCHEDULE='.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml';
const MANUAL='.github/workflows/b11-t070-real-joint-restore-MANUAL.yml';
const BACKUP='ci/backup/jb-free-offsite-backup.sh';
const note=readFileSync('JANTA_BOL_PHASE_4_WORKING/b12/P4_T081_NOV01_CROSSPLANE_READONLY_RECOVERY_NO_GO.md','utf8');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:2*1024*1024,timeout:9000}).trimEnd();
const gitblob=(sha,path)=>git('rev-parse',sha+':'+path);
const blob=b=>{
 const value=Buffer.from(b,'utf8');
 return createHash('sha1').update(Buffer.concat([Buffer.from('blob '+value.length+'\0'),value])).digest('hex');
};
const refText=(sha,p)=>execFileSync('git',['show',sha+':'+p],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:9000});
const hasPath=(sha,p)=>git('ls-tree','--name-only',sha,p).split('\n').includes(p);

test('T081 1: pinned LIVE and protected main are distinct existing immutable commits',()=>{
 assert.equal(git('rev-parse',LIVE),LIVE);
 assert.equal(git('rev-parse',PROTECTED_MAIN),PROTECTED_MAIN);
 assert.notEqual(LIVE,PROTECTED_MAIN);
 assert.match(note,/434 commits ahead/);
});
test('T081 2: actual LIVE source scheduled backup is bound to pinned reviewed blob',()=>{
 assert.equal(gitblob(LIVE,SCHEDULE),'0c3a8821ea74b78625b13ffed6696443550aba5b');
 assert.equal(blob(refText(LIVE,SCHEDULE)),gitblob(LIVE,SCHEDULE));
});
test('T081 3: old protected Main has NO auto backup workflow (cannot fake schedule enabled)',()=>{
 assert.equal(hasPath(LIVE,SCHEDULE),true);
 assert.equal(hasPath(PROTECTED_MAIN,SCHEDULE),false);
 assert.match(note,/DOES NOT contain this scheduled workflow file/);
});
test('T081 4: a schedule candidate is never an authorized production backup',()=>{
 const src=refText(LIVE,SCHEDULE);
 for(const literal of [
  "github.event_name == 'schedule'",
  "github.ref == 'refs/heads/main'",
  "JB_T075_SCHEDULED_BACKUP_ENABLED",
  "YES_FOUNDER_RELEASED",
  "JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED",
  "YES_FOUNDER_VERIFIED_ZERO",
  "janta-bol-production-backup"
 ])assert(src.includes(literal),'MISSING_BACKUP_AUTHORIZATION_GATE_'+literal);
 assert.match(note,/cannot be counted as a running protected Main automatic backup/);
});
test('T081 5: Founder-only manual T070 restoration workflow identical on MAIN/LIVE',()=>{
 const orig=gitblob(LIVE,MANUAL),baseline=gitblob(PROTECTED_MAIN,MANUAL);
 assert.equal(orig,'aaff8b254cd3355be17d29e9e360ea8a874221df');
 assert.equal(orig,baseline);
 const src=refText(LIVE,MANUAL);
 assert.match(src,/workflow_dispatch:/);
 assert(src.includes("github.actor == 'jantabol'"));
 assert(src.includes("github.ref == 'refs/heads/main'"));
 assert(src.includes('reviewed_sha == github.sha'));
 assert.match(note,/is not a proof it recently ran/);
});
test('T081 6: original backup script unchanged, pending PR87 hardening not silently deployed',()=>{
 assert.equal(gitblob(LIVE,BACKUP),'d9000654ff7d6fe9ba8484259e307f26cab97311');
 assert.equal(gitblob(PROTECTED_MAIN,BACKUP),gitblob(LIVE,BACKUP));
 assert.match(note,/PR #87 independently proved \*\*67\/67 candidate source-only recovery guards\*\*/);
});
test('T081 7: live JANTA BOL SQL SELECT baseline exactly recorded, not false DB restore',()=>{
 assert(note.includes(PROJ));
 for(const x of ['**2 published, 31 draft, 1 deleted**','**920** rows','**1635** rows'])
   assert(note.includes(x),'METADATA_EVIDENCE_MISSING_'+x);
 assert.match(note,/not a transactional backup/i);
});
test('T081 8: 5 identities + 5 Media objects + 15 Edge are presence only',()=>{
 for(const x of ['**5**; \x60auth.identities\x60 **5**','**5 objects**','**15 total \/ 15 ACTIVE**'])
   assert(note.includes(x),'CROSS_PLANE_COUNT_MISSING_'+x);
 assert.match(note,/NOT.*GoTrue Auth export/);
 assert.match(note,/NOT.*media restore/);
 assert.match(note,/NOT.*active Edge deployed source parity/);
});
test('T081 9: real current domain, source commit and alias identity declared exactly',()=>{
 assert(note.includes('dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF'));
 assert(note.includes(LIVE));
 assert(note.includes('www.jantabol.in'));
 assert.match(note,/redirects to apex with 308/);
 assert.match(note,/No alias reassign\/rollback attempted/);
});
test('T081 10: E8 cannot be inferred from DB/media run, reviewed code or counts',()=>{
 assert.match(note,/DB \+ five original media objects/);
 assert.match(note,/NOT a new Nov 1 current-point E8 proof/);
 assert.match(note,/CURRENT_POINT_E8_FULL_RESTORE=NOT_RUN/);
 assert.match(note,/ROLLBACK_DRILL=NOT_RUN/);
 assert.match(note,/T081_FINAL_PASS_LOCK=HOLD/);
});
test('T081 11: clear three mandatory unsafe paths denied, Founder zero-spend preserved',()=>{
 assert.match(note,/do not create potentially billable Supabase branches/i);
 assert.match(note,/Do not attempt live restore or turn scheduled B2 writes on/);
 assert.match(note,/No Founder manual step/);
});
test('T081 12: readonly gate is audit only, never automatic signoff or B13 close',()=>{
 assert.match(note,/READONLY_CROSSPLANE=PASS_SCOPED/);
 assert.match(note,/T082 E4 and B12 final\/H13 final remain HOLD/);
 assert(!note.includes('T081_FINAL_PASS_LOCK=PASS'));
});
