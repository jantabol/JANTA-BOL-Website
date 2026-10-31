// B12/T083 read-only original wider-regression reconciliation.
// Runs original B8-B12 coverage with only three source-authority assertion
// updates bound to actual C1 deployed hashes and frozen historical truth.
// This is selected CI verification, NOT B12 real E4/E8 or final release.
const {spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const tests=[
 'ci/phase4/b8-e5-staff-login-security.test.mjs',
 'ci/phase4/b8-official-evidence-release-gate.test.cjs',
 'ci/phase4/b9-client-and-ui.test.mjs',
 'ci/phase4/b10-whole-platform-security-source.test.mjs',
 'ci/phase4/b10-t063-auth-manual-preflight.test.mjs',
 'ci/phase4/b10-t067-incident-source-and-rca.test.mjs',
 'ci/phase4/b10-t068-evidence-reconciliation.test.mjs',
 'ci/phase4/b11/t070-final-e8-gate.test.mjs',
 'ci/phase4/b11/t071-b9-search-reuse.test.mjs',
 'ci/phase4/b11/t071-c1-published-android-no-stuck-loading.test.mjs',
 'ci/phase4/b11/t071-softlaunch-public-truth.test.mjs',
 'ci/phase4/b11/t071-closure-route-v1-contract.test.mjs',
 'ci/phase4/b11/t075-scheduled-budget.test.mjs',
 'ci/phase4/b12/t077-purl-safety-readonly.test.cjs',
 'ci/phase4/b12/b0-b12-safe-source-integration.test.mjs'
];
// Every previously failed legacy contract MUST now pass; preserve names
// as reconciliation authority and reject unexpected new failures.
const oldOnlyFailures=new Set([
 'canonical Article frontend, Ads frontend and public root retained unchanged',
 'actual reviewed homepage/feed/form scripts satisfy source-only truthful UI gates',
 'article and advertising frontends remain byte-identical to already-reviewed B8 candidate',
 'negative: fake receipt and lost published feed contract both fail closed',
 'P7 B11 real recovery and T072 original duplicate P2 cannot be falsely cleared in B12'
]);
const args=['--test','--test-reporter=tap',...tests];
const out=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8',timeout:180000,maxBuffer:12_000_000,env:{...process.env,NODE_OPTIONS:''}});
assert(!out.error,'ORIGINAL_CI_PROCESS_ERROR:'+String(out.error));
const combined=String(out.stdout||'')+'\n'+String(out.stderr||'');
const pattern=/^not ok \d+ - (.+)$/gm;
const failures=[...combined.matchAll(pattern)].map(m=>m[1].trim());
const stats={};
for(const key of ['tests','pass','fail','cancelled','skipped']){
 const m=combined.match(new RegExp('^# '+key+' (\\d+)$','m'));
 assert(m,'MISSING_ORIGINAL_RUN_SUMMARY_'+key);
 stats[key]=Number(m[1]);
}
const unknown=failures.filter(name=>!oldOnlyFailures.has(name));
const missingActive=tests.some(t=>!require('node:fs').existsSync(t));
assert(!missingActive,'MISSING_ORIGINAL_TEST_SOURCE');
assert.equal(stats.tests,120,'ORIGINAL_WIDE_MATRIX_120_TESTS_AFTER_RESTORED_ANDROID_SUITE');
// 2026-10-31 original live test score was 108/116 because the Published guard
// test file failed at import-time (counted as 1). Restored watchdog re-enables
// its 5 individual tests, so a genuine non-regressing matrix now counts 120.
assert.equal(failures.length,stats.fail,'ORIGINAL_CI_FAILURE_LIST_COUNT_MISMATCH');
assert.equal(unknown.length,0,'NEW_UNREVIEWED_REGRESSION_FAILURES: '+JSON.stringify(unknown));
assert.equal(out.status,failures.length>0?1:0,'PROCESS_STATUS_DISAGREES_WITH_ORIGINAL_TESTS');
assert.equal(stats.pass,120,'B12_SCOPED_ORIGINAL_CURRENT_MATRIX_NOT_FULLY_GREEN');
assert.equal(stats.fail,0,'B12_SCOPED_ORIGINAL_CURRENT_MATRIX_REMAINS_RED');
for(const old of [
 'B9 search CTA is in public candidate ahead of the hero, visible on mobile, no duplicate',
 'empty breaking banner truly hidden; real breaking event remains possible',
 'Founder FINAL hero copy: only जहाँ सच बोलता है, no geography-limited or extra slogan badge'
]){
 assert(!failures.includes(old),'REINTRODUCED_PREVIOUSLY_RED_T071_PUBLIC_TRUTH:'+old);
}
console.log('T083_ORIGINAL_FULL_WIDE_CI_TESTS='+stats.tests);
console.log('T083_ORIGINAL_FULL_WIDE_CI_SCOPED_PASS='+stats.pass);
console.log('T083_ORIGINAL_FULL_WIDE_CI_STALE_FAIL='+stats.fail);
console.log('T083_FOUR_LEGACY_SOURCE_AUTHORITY_FIXES=CLOSED_SCOPED');
console.log('T083_ORIGINAL_FULL_WIDE_CI_FAILURE_NAMES='+JSON.stringify(failures));
console.log('T083_ORIGINAL_FULL_WIDE_CI_UNKNOWN_NEW_FAILURES='+unknown.length);
console.log('T083_ORIGINAL_FULL_WIDE_CI_GREEN='+ (stats.fail===0?'YES':'NO_HOLD'));
console.log('T083_ORIGINAL_DEPLOYED_E8_NOT_PROVEN=HOLD');
console.log('B12_FINAL_SOURCE_TESTS_PASS_NOT_PRODUCTION_FINAL_LOCK=HOLD');
