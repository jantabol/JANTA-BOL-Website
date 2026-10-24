#!/usr/bin/env node
// Deliberately no ability to invoke or mutate Supabase/Backblaze/Production.
import {readFileSync} from 'node:fs';
import {seal,verify,stageDisposable,evaluateHealth,recoveryDecision,syntheticFixture} from './recovery-engine.mjs';
import {attest,verifyTrusted} from './signed-evidence.mjs';
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
 case 'health':output(evaluateHealth(JSON.parse(readFileSync(flag('input'),'utf8'))));break;
 case 'incident':output(recoveryDecision(flag('type'),
  {known_clean_device:flag('known-clean')==='YES',verified_restore:flag('verified-restore')==='YES'}));break;
 default:throw Error('Use: fixture, seal-offline, verify, sign-offline, verify-trusted, stage-trusted, copy-disposable, health, incident');
 }
}catch(e){process.stderr.write('B11_SAFE_FAIL: '+String(e?.message??'unknown')+'\n');process.exitCode=2}
