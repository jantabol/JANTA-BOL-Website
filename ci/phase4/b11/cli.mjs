#!/usr/bin/env node
// Deliberately no ability to invoke or mutate Supabase/Backblaze/Production.
import {readFileSync} from 'node:fs';
import {seal,verify,stageDisposable,evaluateHealth,recoveryDecision,syntheticFixture} from './recovery-engine.mjs';
import {attest,verifyTrusted} from './signed-evidence.mjs';
import {exportStorageBytes} from './storage-readonly-export.mjs';
const [cmd,...rest]=process.argv.slice(2);
function flag(name){const pos=rest.indexOf('--'+name);return pos>=0?rest[pos+1]:undefined}
function output(v){process.stdout.write(JSON.stringify(v,null,2)+'\n')}
try{
 switch(cmd){
 case 'fixture':output(syntheticFixture(flag('path')));break;
 case 'sign-offline':output(attest(flag('path'),flag('private-key'),flag('signature'),
   {confirmation:flag('confirm')}));break;
 case 'verify-trusted':output(verifyTrusted(flag('path'),flag('signature'),flag('trust-key')));break;
 case 'stage-trusted':{
  const evidence=verifyTrusted(flag('source'),flag('signature'),flag('trust-key'));
  const copied=stageDisposable(flag('source'),flag('dest'),{confirmation:flag('confirm')});
  output({evidence,copied});break;
 }
 case 'seal-offline':{
  if(flag('confirm')!=='JANTA_BOL_OFFLINE_ONLY')throw Error('OFFLINE_CONFIRMATION_REQUIRED');
  output(seal(flag('path')));break;
 }
 case 'verify':output({result:'PASS',manifest:verify(flag('path'))});break;
 case 'copy-disposable':output(stageDisposable(flag('source'),flag('dest'),
  {confirmation:flag('confirm'),injectFailureAfter:Number(flag('inject-failure-after')||0)}));break;
 case 'storage-export-manual':{
  // Only the exact Founder/manual protected-main workflow may issue LIVE reads.
  const raw=await exportStorageBytes({outDir:flag('out'),token:process.env.JB_B11_SERVICE_ROLE_KEY,
    manual:true,env:process.env});
  const {mkdirSync,writeFileSync}=await import('node:fs');
  const {join}=await import('node:path');
  mkdirSync(join(flag('out'),'config'),{recursive:true,mode:0o700});
  const privateReceipt={
   schema:'janta-bol-b11-storage-readonly-receipt-v1',
   project_ref:raw.project_ref,source_snapshot_is_atomic:false,
   stable_double_listing:raw.stable_double_listing,object_count:raw.object_count,
   byte_count:raw.byte_count,buckets:raw.buckets,sha_records:raw.storage_manifest_records,
   capture_method:'MANUAL_OWNER_SERVICE_ROLE_READ_ONLY',db_snapshot_bound:false
  };
  writeFileSync(join(flag('out'),'config','storage-export-readonly-summary.json'),
    JSON.stringify(privateReceipt,null,2)+'\n',{mode:0o600,flag:'wx'});
  output({project_ref:raw.project_ref,object_count:raw.object_count,
   byte_count:raw.byte_count,source_read_only:true,atomic_database_media_snapshot:false,
   secret_rows_not_logged:true});break;
 }
 case 'health':output(evaluateHealth(JSON.parse(readFileSync(flag('input'),'utf8'))));break;
 case 'incident':output(recoveryDecision(flag('type'),
  {known_clean_device:flag('known-clean')==='YES',verified_restore:flag('verified-restore')==='YES'}));break;
 default:throw Error('Use: fixture, seal-offline, verify, sign-offline, verify-trusted, stage-trusted, storage-export-manual, copy-disposable, health, incident');
 }
}catch(e){process.stderr.write('B11_SAFE_FAIL: '+String(e?.message??'unknown')+'\n');process.exitCode=2}
