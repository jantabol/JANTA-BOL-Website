#!/usr/bin/env node
'use strict';
/*
 * A PROPOSED, local-only four-conflict reconciliation.
 * Never updates a Git branch, Main, DNS, database or secrets.
 * The resolved tree is a temporary Git object/index for audit ONLY.
 */
const cp=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const conflicts={
 '.github/workflows/b11-t070-real-joint-restore-MANUAL.yml':'MAIN',
 'ci/phase4/b11/storage-media-manual-cli.mjs':'CANDIDATE',
 'ci/phase4/b11/storage-readonly-export.mjs':'CANDIDATE',
 'ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs':'CANDIDATE'
};
function git(args,opts={}) {
 const r=cp.spawnSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024,...opts});
 if(r.error)throw r.error;
 if(r.status!==0&&!opts.allowFailure)throw Error('git '+args.join(' ')+' exit '+r.status+' '+(r.stderr||'').slice(0,180));
 return r;
}
function rev(r){return git(['rev-parse','--verify',r]).stdout.trim();}
function sha(ref,p){const x=git(['rev-parse','--verify',ref+':'+p],{allowFailure:true});return x.status===0?x.stdout.trim():null;}
function changed(base,ref){return new Set(git(['diff','--name-only','-z',base,ref]).stdout.split('\0').filter(Boolean));}
const main=rev('refs/remotes/origin/main'),candidate=rev('HEAD'),base=git(['merge-base',main,candidate]).stdout.trim();
if(main!=='f447231c0677644ca5a44cc19f12cf0314ff38ea') throw Error('Main moved: re-review before proposal');
const mt=git(['merge-tree','--write-tree',main,candidate],{allowFailure:true});
const mergeTree=(mt.stdout||'').split('\n')[0].trim();
if(!/^[0-9a-f]{40}$/.test(mergeTree))throw Error('No tree from merge-tree');
const seen=[...mt.stdout.matchAll(/^CONFLICT \(add\/add\): Merge conflict in (.+)$/gm)].map(x=>x[1]);
if(mt.status!==1||seen.length!==4||seen.some(x=>!Object.hasOwn(conflicts,x))||Object.keys(conflicts).some(x=>!seen.includes(x))){
 console.log(JSON.stringify({decision:'HOLD',merge_status:mt.status,conflicts_found:seen},null,2));
 process.exit(2);
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jb-b12-reconcile-'));
const index=path.join(tmp,'index');
const env={...process.env,GIT_INDEX_FILE:index};
let report;
try{
 git(['read-tree',mergeTree],{env});
 for(const [p,source] of Object.entries(conflicts)){
   const id=sha(source==='MAIN'?main:candidate,p);
   if(!id)throw Error('Missing policy source blob for '+p);
   const mode=git(['ls-tree',source==='MAIN'?main:candidate,'--',p]).stdout.split(/\s+/)[0];
   if(!/^100(644|755)$/.test(mode))throw Error('Unsupported mode for '+p+': '+mode);
   git(['update-index','--add','--cacheinfo',mode,id,p],{env});
 }
 const resolved=git(['write-tree'],{env}).stdout.trim();
 const mainDiff=changed(base,main),candidateDiff=changed(base,candidate);
 const uniqueMain=[...mainDiff].filter(p=>!candidateDiff.has(p));
 const uniqueCandidate=[...candidateDiff].filter(p=>!mainDiff.has(p));
 const errors=[];
 for(const p of uniqueMain)if(sha(main,p)!==sha(resolved,p))errors.push('MAIN_ONLY_NOT_PRESERVED:'+p);
 for(const p of uniqueCandidate)if(sha(candidate,p)!==sha(resolved,p))errors.push('V3_ONLY_NOT_PRESERVED:'+p);
 for(const [p,policy] of Object.entries(conflicts)){
   const expected=sha(policy==='MAIN'?main:candidate,p);
   if(expected!==sha(resolved,p))errors.push('CONFLICT_POLICY_MISMATCH:'+p);
 }
 const essential=[
   'JANTA_BOL_PHASE_3C_WORKING/admin-auth.js',
   'JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
   'JANTA_BOL_PHASE_3C_WORKING/admin-security.html',
   'JANTA_BOL_PHASE_3C_WORKING/backend-client.js',
   'JANTA_BOL_PHASE_3C_WORKING/article.html',
   'JANTA_BOL_PHASE_3C_WORKING/public-c1-projection.js',
   'JANTA_BOL_PHASE_3C_WORKING/website-v3.js',
   'ci/backup/jb-free-offsite-backup.sh',
   'ci/backup/jb-t034-offline-full-pg-restore.sh'
 ];
 for(const p of essential){
  const expected=sha(p.startsWith('ci/backup/')?main:candidate,p);
  if(expected!==sha(resolved,p))errors.push('ESSENTIAL_SOURCE_CHANGED:'+p);
 }
 // Source-level offline regressions on exactly the computed tree; no live DB or remote calls.
 const work=path.join(tmp,'workspace')+path.sep;fs.mkdirSync(work,{recursive:true});
 git(['checkout-index','--all','--prefix='+work],{env});
 const suite=[
  'ci/phase4/b12/v3-c1-public-integration.test.cjs',
  'ci/phase4/b12/founder-auth-readonly-regression.test.cjs',
  'ci/phase4/b11/storage-media-manual-safety.test.mjs',
  'ci/phase4/b11/storage-readonly-export.test.mjs',
  'ci/phase4/b11/t070-joint-storage-snapshot-identity.test.mjs',
  'ci/phase4/b11/t070-real-joint-manual-safety.test.mjs',
  'ci/phase4/b11/t075-scheduled-backup-identity.test.mjs'
 ].filter(f=>fs.existsSync(path.join(work,f)));
 const tests=cp.spawnSync('node',['--test',...suite],{cwd:work,encoding:'utf8',maxBuffer:16*1024*1024,timeout:210000});
 const x=(tests.stdout||'').split('\n').filter(l=>/^# (?:tests|pass|fail|cancelled)\s/.test(l));
 if(tests.status!==0)errors.push('LOCAL_SOURCE_TESTS_FAILED: '+tests.status);
 report={
  gate:'PROPOSED four-file conflict resolution / TEMP TREE ONLY',
  main,candidate,common_base:base,
  conflict_policy:conflicts,
  conflict_count:seen.length,
  Main_only_preserved:uniqueMain.length,
  V3_only_preserved:uniqueCandidate.length,
  source_suite_files:suite,
  source_suite_summary:x.slice(-5),
  checkout_tree:resolved,
  errors:errors.slice(0,30),
  verdict:errors.length?'HOLD — synthetic merge failed':'SYNTHETIC NO-LOSS SOURCE CHECK PASS — NOT MERGED, NOT RELEASE-APPROVED'
 };
 console.log(JSON.stringify(report,null,2));
 if(errors.length){console.log((tests.stdout||'').slice(-4200));process.exitCode=2;}
} finally {
 fs.rmSync(tmp,{recursive:true,force:true});
}
