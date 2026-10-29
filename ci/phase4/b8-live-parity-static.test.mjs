import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const file=async p=>readFile(new URL(p,root),'utf8');
test('B8 PG17 fixture matches read-only LIVE Article status enum, blocks review/deleted public leakage',async()=>{
 const fixture=await file('ci/phase4/b8-g4-public-article-status-fixture.sql');
 assert.match(fixture,/create type public\.article_status as enum \('draft','published','review','unpublished','deleted'\)/);
 const reg=await file('ci/phase4/b8-g4-cp01-cp03-public-projection-regression.sql');
 assert.match(reg,/ARRAY\['review','deleted'\]/);
 assert.match(reg,/B8_G4_LIVE_ENUM_NONPUBLISHED_ARTICLE_EXPOSED/);
});
test('Repository release preflight is strictly catalog SELECT not production DDL/DML',async()=>{
 const preflight=await file('ci/phase4/b8-predeploy-live-catalog-READ_ONLY.sql');
 const clean=preflight.replace(/--[^\n]*/g,'');
 assert.match(clean,/with facts as \(/);
 assert.match(clean,/not exists\(select 1 from pg_proc/);
 assert.match(clean,/count\(\*\) filter\(where v is distinct from true\)/);
 assert.doesNotMatch(clean,/\b(CREATE|ALTER|DROP|TRUNCATE|INSERT|UPDATE|DELETE|GRANT|REVOKE|EXECUTE|CALL)\b/i);
});
