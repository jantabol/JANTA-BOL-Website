import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectReleaseSource} from './t071-failure-isolation-contract.mjs';
const observation=JSON.parse(readFileSync('ci/phase4/b11/t071-vercel-production-git-source-observed-20261027.json','utf8'));
test('actual Vercel production deployment bound to preserved GitHub main SHA, NOT newest preview',()=>{
 assert.equal(observation.source_repo,'jantabol/JANTA-BOL-Website');
 assert.equal(observation.source_branch,'main');
 assert.equal(observation.source_commit,'f447231c0677644ca5a44cc19f12cf0314ff38ea');
 assert.equal(observation.source_commit,observation.github_main_commit_at_observation);
 assert.equal(observation.deployment_state,'READY');
 assert.equal(observation.deployment_target,'production');
 assert.equal(observation.source_commit_binding_to_production_deployment_verified,true);
 assert.equal(observation.production_aliases.length,3);
});
test('repo-bound production latest source is static editorial mock risk, not automatic verified published news',()=>{
 const html=readFileSync('index.html','utf8');
 const js=readFileSync('script.js','utf8');
 const staticEvidence=inspectReleaseSource(html,js);
 assert.equal(staticEvidence.static_news_copy_present,true);
 assert.equal(staticEvidence.static_live_badge,true);
 assert.equal(staticEvidence.client_fetch_calls_detected,0);
 assert.equal(observation.checked_in_static_main_html_has_editorially_unverified_corruption_allegation,true);
 assert.equal(observation.checked_in_static_main_html_has_unconditional_live_badge,true);
 assert.equal(observation.checked_in_static_main_script_has_fetch_calls,false);
 assert.equal(observation.source_code_safe_for_soft_launch,false);
});
test('production build HTTP was NOT actually inspected, READY != editorial or auth release PASS',()=>{
 assert.equal(observation.production_build_actual_public_html_http_inspected,false);
 assert.equal(observation.production_public_admin_auth_routes_verified,false);
 assert.equal(observation.direct_web_http_read_failed,true);
 assert.equal(observation.no_production_change_executed,true);
 assert.equal(observation.soft_launch_release_authorized,false);
});
