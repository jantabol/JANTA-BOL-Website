#!/usr/bin/env node
// T069 PR-safe media-only CLI: original JANTA BOL protected 3-bucket GET, NEVER PUT.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {exportStorageBytes,verifyStorageExportReceipt} from './storage-readonly-export.mjs';
const cmd=process.argv[2],arg=x=>process.argv[process.argv.indexOf('--'+x)+1];
try{
 if(cmd==='verify-offline'){
  const proof=verifyStorageExportReceipt(arg('root'));
  console.log(JSON.stringify(proof));
 }else if(cmd==='export-manual'){
  const root=arg('root');
  const src=await exportStorageBytes({outDir:root,token:process.env.JB_B11_SERVICE_ROLE_KEY,
   env:process.env,manual:true});
  mkdirSync(join(root,'config'),{mode:0o700,recursive:true});
  const data={
   schema:'janta-bol-b11-storage-readonly-receipt-v1',
   project_ref:src.project_ref,
   capture_method:'MANUAL_OWNER_SERVICE_ROLE_READ_ONLY',
   stable_double_listing:src.stable_double_listing,db_snapshot_bound:false,
   object_count:src.object_count,byte_count:src.byte_count,buckets:src.buckets,
   sha_records:src.storage_manifest_records};
  writeFileSync(join(root,'config/storage-export-readonly-summary.json'),
    JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});
  const v=verifyStorageExportReceipt(root);
  console.log(JSON.stringify({files:v.file_count,bytes:v.byte_count,
   original_storage_sha_valid:true,source_atomic_with_database:false,
   no_production_write:true}));
 }else throw Error('only verify-offline or export-manual commands permitted');
}catch(e){console.error('T069_SAFE_HOLD: '+String(e?.message??'UNKNOWN'));process.exitCode=3}
