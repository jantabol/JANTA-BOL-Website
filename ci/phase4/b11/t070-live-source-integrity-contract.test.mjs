import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const query=readFileSync('ci/phase4/b11/t070-live-source-integrity.sql','utf8');
test('G1 SQL contract is read-only and emits only aggregates/no row data',()=>{
 assert.match(query,/^WITH checks AS \(/m);
 assert.match(query,/SELECT check_name, ok, objects,/);
 assert.doesNotMatch(query,/\b(INSERT|DELETE|UPDATE|ALTER|TRUNCATE|DROP|CREATE|GRANT|REVOKE|COPY|CALL|PERFORM|EXECUTE|SECURITY DEFINER)\b/i);
 assert.doesNotMatch(query,/json_agg|array_agg|row_to_json|SELECT \*/i);
});
test('G1 explicitly checks 14 live relations, IDs, permanent URL uniqueness and no omitted dependencies',()=>{
 const required=['articles_slug_uniqueness','article_versions_fk','article_version_duplicate',
 'grievance_public_ids_unique','grievance_article_fk','grievance_history_fk','grievance_evidence_fk',
 'live_session_article_fk','live_update_session_fk','advertiser_campaign_fk','campaign_package_fk',
 'payment_campaign_fk','auth_article_creator_fk','auth_article_versions_fk'];
 for(const rule of required)assert.ok(query.includes("'"+rule+"'"),rule);
 assert.equal((query.match(/UNION ALL SELECT /g)||[]).length+1,required.length);
});
test('G1 no data is classified NOT_EXERCISED, not fake relationship PASS',()=>{
 assert.ok(query.includes("WHEN objects=0 THEN 'NOT_EXERCISED_NO_ROWS'"));
 assert.ok(query.includes("ELSE 'FAIL_SOURCE_INTEGRITY'"));
});
test('G1 query never emits personal IDs, JWT, media bytes or private evidence',()=>{
 assert.doesNotMatch(query,/\b(returning|auth\.jwt\(|storage\.objects|grievance_private_identity)\b/i);
 assert.doesNotMatch(query,/\b(user_id|private_key|service_role_key|password)\b/i);
});
