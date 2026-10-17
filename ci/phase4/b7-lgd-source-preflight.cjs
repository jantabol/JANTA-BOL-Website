'use strict';
// B7 G3 LGD OFFLINE STRUCTURAL PRECHECK ONLY. No import/verification or DB writes.
const fs=require('node:fs'),crypto=require('node:crypto');
const MAX=32*1024*1024;
function check(ok,code){if(!ok)throw Error('LGD_PRECHECK_'+code);}
function parseCsv(b){
 const s=Buffer.isBuffer(b)?b.toString('utf8'):String(b);
 check(s.length>0&&Buffer.byteLength(s)<=MAX&&!s.includes('\0'),'BAD_BYTES');
 const v=s.charCodeAt(0)===65279?s.slice(1):s;
 let rows=[],row=[],field='',q=false,closed=false;
 for(let i=0;i<v.length;i++){
  const c=v[i];
  if(q){
   if(c==='"'){if(v[i+1]==='"'){field+='"';i++;}else{q=false;closed=true;}}
   else field+=c;
  }else if(c==='"'){check(!closed&&field.length===0,'BAD_QUOTE');q=true;}
  else if(c===','){row.push(field);field='';closed=false;}
  else if(c==='\r'||c==='\n'){
   if(c==='\r'&&v[i+1]==='\n')i++;
   row.push(field);field='';closed=false;
   if(row.some(x=>x.trim()))rows.push(row);row=[];
  }else{check(!closed,'BAD_QUOTE');field+=c;}
 }
 check(!q,'UNTERMINATED_QUOTE');
 row.push(field);if(row.some(x=>x.trim()))rows.push(row);
 check(rows.length>=2&&rows[0].length<=24,'BAD_RECORDS');
 check(rows.every(r=>r.length===rows[0].length),'BAD_RECORD_WIDTH');
 return rows;
}
function normalize(s){return String(s||'').toLowerCase().trim().replace(/[()]/g,' ').replace(/\bin\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
function records(bytes,sub){
 const rows=parseCsv(bytes);
 const heads=rows[0].map(normalize);
 check(heads.every(Boolean)&&new Set(heads).size===heads.length,'HEADERS_DUPLICATE');
 const spec={statecode:['state code','state lgd code'],statename:['state name','state name english','state ut name'],
  districtcode:['district code','district lgd code'],districtname:['district name','district name english'],
  tehsilcode:['sub district code','sub district lgd code','subdistrict code','tehsil code'],
  tehsilname:['sub district name','sub district name english','subdistrict name','tehsil name']};
 const keys=['statecode','statename','districtcode','districtname',...(sub?['tehsilcode','tehsilname']:[])],cols={};
 for(const k of keys){const i=heads.findIndex(h=>spec[k].includes(h));check(i>=0,'MISSING_HEADER_'+k);cols[k]=i;}
 return rows.slice(1).map((a,i)=>Object.fromEntries([['row',i+2],...keys.map(k=>[k,a[cols[k]].trim()])]));
}
function validateRows(d,t){
 const mp=r=>r.statecode==='23'||normalize(r.statename)==='madhya pradesh';
 const ds=records(d,false).filter(mp),ts=records(t,true).filter(mp);
 check(ds.length===55,'MP_DISTRICT_COUNT_'+ds.length);
 check(ts.length>=55,'SUBDISTRICTS_TOO_FEW');
 const districts=new Map(),names=new Set(),tehsilCodes=new Set(),parents=new Set();
 const num=s=>/^[1-9][0-9]{0,8}$/.test(s);
 for(const r of ds){
  check(r.statecode==='23'&&normalize(r.statename)==='madhya pradesh','MP_DISTRICT_STATE_'+r.row);
  check(num(r.districtcode),'DISTRICT_CODE_'+r.row);
  check(r.districtname.length>=2&&r.districtname.length<=120,'DISTRICT_NAME_'+r.row);
  const name=normalize(r.districtname);
  check(name&&!districts.has(r.districtcode)&&!names.has(name),'DISTRICT_DUPLICATE_'+r.row);
  districts.set(r.districtcode,name);names.add(name);
 }
 for(const r of ts){
  check(r.statecode==='23'&&normalize(r.statename)==='madhya pradesh','MP_SUBDISTRICT_STATE_'+r.row);
  check(num(r.districtcode)&&num(r.tehsilcode),'SUBDISTRICT_CODE_'+r.row);
  check(r.tehsilname.length>=2&&r.tehsilname.length<=120,'SUBDISTRICT_NAME_'+r.row);
  check(districts.has(r.districtcode),'ORPHAN_SUBDISTRICT_'+r.row);
  check(normalize(r.districtname)===districts.get(r.districtcode),'PARENT_NAME_DRIFT_'+r.row);
  check(!tehsilCodes.has(r.tehsilcode),'SUBDISTRICT_DUPLICATE_'+r.row);
  tehsilCodes.add(r.tehsilcode);parents.add(r.districtcode);
 }
 check(parents.size===55,'MISSING_PARENT_COVERAGE');
 return {districts:ds.length,subdistricts:ts.length,parent_districts:parents.size};
}
function officialURL(link){try{
 const u=new URL(link);
 return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
 ['lgdirectory.gov.in','data.gov.in','www.data.gov.in','panchayat.gov.in','www.panchayat.gov.in'].includes(u.hostname.toLowerCase());
}catch{return false;}}
function preflight(d,t,m){
 check(m&&typeof m==='object'&&!Array.isArray(m),'BAD_MANIFEST');
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const [key,buf] of [['districts',d],['subdistricts',t]]){
  const meta=m[key];
  check(meta&&officialURL(meta.url),'UNTRUSTED_SOURCE_URL_'+key);
  check(typeof meta.version==='string'&&meta.version.trim().length>=8,'NO_VERSION_'+key);
  check(meta.sha256===hash(buf),'SHA256_MISMATCH_'+key);
 }
 check(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(m.export_date||''),'NO_EXPORT_DATE');
 return {state_code:'23',...validateRows(d,t),district_sha256:m.districts.sha256,
  subdistrict_sha256:m.subdistricts.sha256,export_date:m.export_date,
  structural_preflight:'PASS',
  official_source_independently_authenticated:false,founder_verified:false,
  production_import_authorized:false,release_status:'DUE_NOT_OFFICIAL_OR_OWNER_VERIFIED'};
}
if(require.main===module){
 try{
  const a=process.argv.slice(2),opt={};
  for(let i=0;i<a.length;i+=2){check(/^--(districts|subdistricts|manifest)$/.test(a[i])&&a[i+1]&&!opt[a[i].slice(2)],'ARGS');opt[a[i].slice(2)]=a[i+1];}
  check(a.length===6&&opt.districts&&opt.subdistricts&&opt.manifest,'ARGS');
  const d=fs.readFileSync(opt.districts),t=fs.readFileSync(opt.subdistricts);
  check(d.length<=MAX&&t.length<=MAX,'OVERSIZE');
  console.log(JSON.stringify(preflight(d,t,JSON.parse(fs.readFileSync(opt.manifest,'utf8'))),null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={parseCsv,validateRows,officialURL,preflight};