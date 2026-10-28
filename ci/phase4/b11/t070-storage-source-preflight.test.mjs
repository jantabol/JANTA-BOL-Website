import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const q=readFileSync('ci/phase4/b11/t070-storage-source-preflight.sql','utf8');
test('T070 G2 source storage audit SQL is strictly read-only',()=>{
 assert.match(q,/^WITH scoped_buckets AS \(/m);
 assert.doesNotMatch(q,/\b(INSERT|DELETE|UPDATE|ALTER|TRUNCATE|DROP|CREATE|GRANT|REVOKE|COPY|CALL|PERFORM|EXECUTE|SECURITY DEFINER)\b/i);
 assert.doesNotMatch(q,/\b(RETURNING|SELECT\s+\*|json_agg|array_agg|row_to_json)\b/i);
});
test('T070 G2 covers exactly three JANTA BOL Storage buckets, not Cricket',()=>{
 for(const x of ['grievance-private','private-editorial','public-media'])assert.ok(q.includes("'"+x+"'"));
 assert.equal((q.match(/'grievance-private'|'private-editorial'|'public-media'/g)||[]).length,3);
 assert.doesNotMatch(q,/hriakdazkcvplsdwgfle|cricket[_-]/i);
});
test('T070 G2 checks size metadata and grievance evidence path integrity',()=>{
 for(const x of ["o.metadata->>'size'","o.metadata ? 'sha256'",'o.name=e.storage_path','e.sha256','e.byte_size'])assert.ok(q.includes(x),x);
});
test('T070 G2 emits aggregate-only result; cannot be mistaken for actual file recovery',()=>{
 assert.match(q,/SOURCE_METADATA_ONLY_NOT_RESTORED_BYTES/);
 assert.match(q,/count\(o.id\)/);
 assert.doesNotMatch(q,/SELECT\s+o\.name|SELECT\s+e\.storage_path|SELECT\s+e\.sha256|SELECT\s+e\.id/i);
});
