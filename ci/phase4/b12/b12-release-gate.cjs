#!/usr/bin/env node
/* Phase-4 B12/T076-T083 evidence and release-stop engine.
 * This program is intentionally READ ONLY. It cannot deploy, migrate, delete,
 * publish, approve Founder MFA or bypass protected GitHub Environment.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..');
const FILE=path.join(ROOT,'JANTA_BOL_PHASE_4_WORKING','b12','b12-release-truth.json');
const TESTS=Array.from({length:8},(_,i)=>'P4-T'+String(76+i).padStart(3,'0'));
const EVIDENCE={
 'P4-T076':['E1','E6','E7'],
 'P4-T077':['E1','E2','E4','E6'],
 'P4-T078':['E1','E2','E7','E8'],
 'P4-T079':['E2','E6','E7'],
 'P4-T080':['E1','E2','E3','E5','E6'],
 'P4-T081':['E1','E6','E7','E8'],
 'P4-T082':['E1','E2','E3','E4','E5','E6'],
 'P4-T083':['E1','E3','E6','E7','E8']
};
function read(){
 const json=JSON.parse(fs.readFileSync(FILE,'utf8'));
 if(json.schema!=='janta-bol.phase4.b12.production-release-truth.v1')throw Error('B12_SCHEMA_MISMATCH');
 if(json.git_repository!=='jantabol/JANTA-BOL-Website'||json.supabase_project!=='vrffsnkycvjithwtiylt')throw Error('B12_WRONG_PROJECT_DENY');
 if(json.zero_paid!==true||json.protected?.no_fake_pass!==true)throw Error('B12_PAID_OR_FAKE_PASS_DENY');
 if(JSON.stringify(Object.keys(json.tests).sort())!==JSON.stringify([...TESTS].sort()))throw Error('B12_TEST_FAMILY_MISMATCH');
 return json;
}
function audit(doc){
 const issues=[];
 if(doc.production_merged!==true)issues.push('NOT_MERGED_TO_PROTECTED_MAIN');
 if(doc.production_deployed!==true)issues.push('REAL_PRODUCTION_NOT_DEPLOYED');
 if(doc.phase3_baseline_verified_for_this_candidate!==true)issues.push('PHASE3_PROTECTED_CI_NOT_VERIFIED');
 if(doc.b11_full_recovery_locked!==true)issues.push('B11_E8_REAL_RECOVERY_NOT_LOCKED');
 if(doc.b11_t072_real_production_idempotency_closed!==true)issues.push('B11_T072_LIVE_DUPLICATE_RISK_OPEN');
 if(doc.production_real_smoke_complete!==true)issues.push('REAL_PRODUCTION_SMOKE_MISSING');
 for(const id of TESTS){
  const t=doc.tests[id]||{};
  if(!['NOT_RUN','IN_PROGRESS','DUE','BLOCKED','FAIL','PASS'].includes(t.status))issues.push(id+':INVALID_STATUS');
  if(t.status!=='PASS')issues.push(id+':'+String(t.status));
  const seen=new Set((t.evidence||[]).filter(v=>typeof v==='string'));
  for(const code of EVIDENCE[id])if(!seen.has(code))issues.push(id+':MISSING_'+code);
  if(id==='P4-T079'&&t.status==='DUE'&&!doc.external_providers_available){
    // DUE is allowed only in status register, not counted as PASS.
  }
 }
 return {release:'HOLD',ready_to_consider_founder_release:issues.length===0,issues,
  safe_for_zero_paid:'NOT_ATTESTED_BY_CODE',automatic_paid_upgrade:'FORBIDDEN',
  digest:crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex').slice(0,16)};
}
if(require.main===module){
 try{
  if(process.argv.slice(2).some(x=>x!=='--status'))throw Error('NO_DEPLOY_COMMAND_SUPPORTED');
  const state=audit(read());
  process.stdout.write(JSON.stringify(state,null,2)+'\n');
  // 3 denotes explicitly incomplete fail-closed status, NOT test failure.
  process.exitCode=state.ready_to_consider_founder_release?0:3;
 }catch(e){process.stderr.write('B12_GUARD_HOLD:'+e.message+'\n');process.exitCode=3;}
}
module.exports={read,audit,TESTS,EVIDENCE};
