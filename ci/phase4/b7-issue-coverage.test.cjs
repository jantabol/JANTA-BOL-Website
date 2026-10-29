'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const p=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/B7_20261012_CONSOLIDATED_ISSUE_PUNCHLIST.md','utf8');
const m=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
function ids(pattern){return [...p.matchAll(pattern)].map(x=>x[1]);}
test('B7 no missing Founder problems: A 9 UI / B 16 backend / C 5 environment',()=>{
 const groups=[
  {prefix:'UI',start:1,last:9,items:ids(/^\| (UI\d{2}) \|/gm)},
  {prefix:'BE',start:1,last:16,items:ids(/^\| (BE\d{2}) \|/gm)},
  {prefix:'ENV',start:1,last:5,items:ids(/^- (ENV\d{2}):/gm)}
 ];
 for(const g of groups){
  assert.deepEqual(g.items,Array.from({length:g.last},(_,i)=>g.prefix+String(i+1).padStart(2,'0')),
   g.prefix+' unexpected missing, extra or reordered issue');
 }
 assert.equal(groups.reduce((v,g)=>v+g.items.length,0),30);
 assert.match(p,/ENV06 was moved to BE16/,'preserve old ID alias in audit');
});
test('B7 exact 9 canonical tests remain DUE, do not misrepresent partial CI',()=>{
 assert.equal(m.final_zip_status,'BLOCKED');
 assert.equal(m.canonical_tests.length,9);
 for(let i=0;i<m.canonical_tests.length;i++){
  const item=m.canonical_tests[i];
  assert.equal(item.id,'P4-T'+String(34+i).padStart(3,'0'));
  assert.equal(item.final_status,'DUE');
  assert.equal(item.owner_signoff,null);
 }
 assert.match(p,/0\/9 FINAL PASS\+LOCK/);
});
test('B7 60 ADS checks remain mapped to complete official test spans',()=>{
 const items=m.canonical_tests;
 assert.deepEqual(items.map(x=>x.range),[[1,9],[10,15],[16,23],[24,34],[35,40],[41,47],[48,50],[51,56],[57,60]]);
});
