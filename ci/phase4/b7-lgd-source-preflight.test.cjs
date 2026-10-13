'use strict';
// All 55 LGD names/codes in tests are SYNTHETIC; never publish/import.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {parseCsv,validateRows,officialURL,preflight}=require('./b7-lgd-source-preflight.cjs');
function fixture(){
 const a=['State Code,State Name,District Code,District Name'],
       b=['State Code,State Name (In English),District Code,District Name (In English),Sub-District Code,Sub-District Name'];
 for(let i=1;i<=55;i++){
  a.push('23,MADHYA PRADESH,'+(10000+i)+',Synthetic District '+i);
  b.push('23,MADHYA PRADESH,'+(10000+i)+',Synthetic District '+i+','+(20000+i)+',Synthetic Tehsil '+i);
 }
 return {d:a.join('\r\n')+'\r\n',t:b.join('\r\n')+'\r\n'};
}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function manifest(d,t){return {export_date:'2026-10-10',
 districts:{url:'https://lgdirectory.gov.in/downloadDirectory.do',version:'UNVERIFIED-SYNTHETIC',sha256:hash(d)},
 subdistricts:{url:'https://data.gov.in/resource/local-government-directory-lgd-sub-districts',version:'UNVERIFIED-SYNTHETIC',sha256:hash(t)}};}
test('CSV quoted fields, BOM, malformed rows and bad quoting',()=>{
 assert.deepEqual(parseCsv('\ufeffA,B\r\nx,\"b,b\"\r\ny,\"z\"\"z\"\r\n'),[['A','B'],['x','b,b'],['y','z\"z']]);
 for(const s of ['a,b\n1','a,b\n\"bad','a,b\n1,2,3','a,b\n1,\"x\"z'])assert.throws(()=>parseCsv(s),/LGD_PRECHECK_/);
});
test('Synthetic 55/55 format proof must NEVER claim official import or Owner authority',()=>{
 const {d,t}=fixture(),v=preflight(Buffer.from(d),Buffer.from(t),manifest(d,t));
 assert.equal(v.districts,55);assert.equal(v.subdistricts,55);assert.equal(v.parent_districts,55);
 assert.equal(v.structural_preflight,'PASS');
 assert.equal(v.official_source_independently_authenticated,false);
 assert.equal(v.founder_verified,false);assert.equal(v.production_import_authorized,false);
 assert.equal(v.release_status,'DUE_NOT_OFFICIAL_OR_OWNER_VERIFIED');
});
test('Missing/duplicate LGD district codes rejected',()=>{
 const {d,t}=fixture();
 assert.throws(()=>validateRows(d.replace(/23,MADHYA PRADESH,10055,Synthetic District 55\r\n/,'') ,t),/MP_DISTRICT_COUNT/);
 assert.throws(()=>validateRows(d.replace('10002,Synthetic District 2','10001,Synthetic District 1'),t),/DISTRICT_DUPLICATE/);
});
test('Wrong MP state, unknown parent, drifted district and duplicate tehsil rejected',()=>{
 const {d,t}=fixture();
 assert.throws(()=>validateRows(d.replace('23,MADHYA PRADESH,10001','24,MADHYA PRADESH,10001'),t),/MP_DISTRICT_STATE/);
 assert.throws(()=>validateRows(d,t.replace('10002,Synthetic District 2,20002','99999,Synthetic District 2,20002')),/ORPHAN_SUBDISTRICT/);
 assert.throws(()=>validateRows(d,t.replace('10002,Synthetic District 2,20002','10002,Synthetic District 1,20002')),/PARENT_NAME_DRIFT/);
 assert.throws(()=>validateRows(d,t.replace('20002,Synthetic Tehsil 2','20001,Synthetic Tehsil 2')),/SUBDISTRICT_DUPLICATE/);
});
test('Changed file checksum and fake .gov lookalike are rejected',()=>{
 const {d,t}=fixture(),m=manifest(d,t);
 assert.throws(()=>preflight(Buffer.from(d+'x'),Buffer.from(t),m),/SHA256_MISMATCH_districts/);
 assert.throws(()=>preflight(Buffer.from(d),Buffer.from(t),{...m,districts:{...m.districts,url:'https://data.gov.in.attacker.test/'}}),/UNTRUSTED_SOURCE_URL/);
 assert.throws(()=>preflight(Buffer.from(d),Buffer.from(t),{...m,export_date:''}),/NO_EXPORT_DATE/);
});
test('No untrusted or credentialled URL is considered a government source',()=>{
 for(const u of ['https://data.gov.in@evil.test','http://lgdirectory.gov.in','https://lgdirectory.gov.in.attacker.test','https://data.gov.in:8443/'])assert.equal(officialURL(u),false);
 assert.equal(officialURL('https://lgdirectory.gov.in/downloadDirectory.do'),true);
});