// P4-T089 E7: Original Founder Master PDF Appendix B → Test → Checkpoint
// Unlike path-name candidates, this really detects orphan/duplicate SECTION IDs.
// Not a deployed implementation semantic duplication or full 1–339 source audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root='JANTA_BOL_PHASE_4_WORKING/review/';
const m=JSON.parse(fs.readFileSync(root+'P4_T089_ORIGINAL_MASTER_109_SECTION_CROSSWALK_20261102.json','utf8'));
const e=JSON.parse(fs.readFileSync(root+'P4_T089_OFFICIAL_E7_REGISTER_EVIDENCE_INDEX_20261102.json','utf8'));
const expected=Array.from({length:109},(_,i)=>'P4-T'+String(i+1).padStart(3,'0'));
const sections=new Map(),codes=new Map(),orphans=[],duplicates=[];
function add(map,key,id){
 if(map.has(key))duplicates.push({checkpoint:key,previous:map.get(key),current:id});
 else map.set(key,id);
}
function parse(spec,id){
 const codeRanges=/([A-Z]{2,7})-(\d{3})\s+to\s+([A-Z]{2,7})-(\d{3})/g;
 const localCodes=new Set();
 for(const mt of spec.matchAll(codeRanges)){
  const [_,from,lo,to,hi]=mt;
  assert.equal(from,to,'mixed-prefix range: '+id);
  assert.ok(+lo<=+hi,'decreasing-code range: '+id);
  for(let n=+lo;n<=+hi;n++)localCodes.add(from+'-'+String(n).padStart(3,'0'));
 }
 for(const mt of spec.matchAll(/([A-Z]{2,7})-(\d{3})/g))localCodes.add(mt[1]+'-'+mt[2]);
 for(const code of localCodes)add(codes,code,id);

 if(spec.includes('Sections')){
  const part=spec.slice(spec.indexOf('Sections')+8);
  const localSecs=new Set();
  for(const mt of part.matchAll(/\b(\d{1,4})\s*[-–]\s*(\d{1,4})\b/g)){
   assert.ok(+mt[1]<=+mt[2],'decreasing Section range: '+id);
   for(let n=+mt[1];n<=+mt[2];n++)localSecs.add(n);
  }
  const bare=part.replace(/\b\d{1,4}\s*[-–]\s*\d{1,4}\b/g,'');
  for(const mt of bare.matchAll(/\b\d{1,4}\b/g))localSecs.add(+mt[0]);
  for(const n of localSecs)add(sections,n,id);
 }
}
for(const row of m.records)parse(row.master_map,row.id);
const grouped=Object.groupBy([...codes.keys()],x=>x.split('-')[0]);
const expectedCodes={GOV:23,GRV:58,CMP:37,TEAM:46,SOC:37,ADS:60,RECOV:52,ACC:51,SRCH:69};
test('T089-S01 Master Test Blueprint has exactly 109 IDs cross-reference, no duplicate/orphan test IDs',()=>{
 assert.equal(m.records.length,109);
 assert.deepEqual(m.records.map(x=>x.id),expected);
 assert.deepEqual(m.records.map(x=>x.id),e.records.map(x=>x.id));
 assert.equal(new Set(m.records.map(x=>x.id)).size,109);
});
test('T089-S02 all original numeric Sections 340–1034 map exactly once to a canonical P4-T###',()=>{
 assert.equal(sections.size,695);
 for(let s=340;s<=1034;s++){
  assert.ok(sections.has(s),'T089_ORPHAN_MASTER_SECTION_'+s);
  assert.ok(expected.includes(sections.get(s)),'T089_BAD_TEST_FOR_SECTION_'+s);
 }
 assert.equal(duplicates.filter(x=>typeof x.checkpoint==='number').length,0,'duplicate numeric requirement mapped to multiple tests');
});
test('T089-S03 original 433 coded checkpoint IDs across nine source domains each mapped ONCE',()=>{
 assert.equal(codes.size,433);
 assert.deepEqual(Object.fromEntries(Object.entries(grouped).map(([k,v])=>[k,v.length])),expectedCodes);
 for(const [prefix,last] of Object.entries(expectedCodes))
   for(let k=1;k<=last;k++)
     assert.ok(codes.has(prefix+'-'+String(k).padStart(3,'0')),
       'T089_ORPHAN_CODED_REQUIREMENT_'+prefix+'-'+k);
 assert.equal(duplicates.filter(x=>typeof x.checkpoint==='string').length,0,'duplicate coded requirement mapped to multiple tests');
});
test('T089-S04 tricky original Sections 352 and 638–656 explicitly mapped with no double counting',()=>{
 assert.equal(sections.get(352),'P4-T043');
 for(let i=638;i<=656;i++)assert.equal(sections.get(i),'P4-T075');
 assert.equal(sections.get(793),'P4-T089');
 assert.equal(sections.get(804),'P4-T089');
 assert.equal(sections.get(1034),'P4-T109');
});
test('T089-S05 Appendix B crosswalk is requirement-address proof ONLY; no fake functional E7 or launch permission',()=>{
 assert.equal(m.full_master_requirements_1_to_1034_semantically_proven,false);
 assert.equal(m.full_code_duplicates_implementation_proven,false);
 assert.ok(m.source_type.includes('TEST STATUS NOT inferred'));
 assert.equal(e.policy.includes('not signed authoritative proof'),true);
});
console.log('T089_BLUEPRINT_695_NUMBERED_SECTIONS_340_TO_1034_UNIQUE=PASS_SCOPED');
console.log('T089_BLUEPRINT_433_CODED_CHECKPOINTS_9_DOMAINS_UNIQUE=PASS_SCOPED');
console.log('T089_REQUIREMENT_ADDRESS_ORPHANS_AND_DUPLICATES=ZERO_IN_APP_B_MAP');
console.log('T089_FULL_1_TO_339_MASTER_SEMANTIC_IMPLEMENTATION_AND_FINAL_E7=HOLD');
