#!/usr/bin/env node
'use strict';
/*
 * B12 / Main no-loss reconnaissance. READ ONLY:
 * - computes the REAL merge result in temporary Git objects via git merge-tree
 * - DOES NOT change HEAD/index/branch, push, merge a PR, touch DNS or talk to DB
 * - gates non-overlapping Main and V3 candidate files against exact blob SHAs.
 */
const cp = require('node:child_process');
function run(args, allowFailure=false) {
  const r=cp.spawnSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
  if(r.error) throw r.error;
  if(r.status!==0 && !allowFailure) throw new Error('git '+args[0]+' failed ('+r.status+'): '+(r.stderr||'').slice(0,250));
  return r;
}
const rev=(v)=>run(['rev-parse',v]).stdout.trim();
const head=rev('HEAD'), main=rev('refs/remotes/origin/main');
if(main===head) throw Error('Expected isolated candidate, got Main HEAD');
const base=run(['merge-base','HEAD','refs/remotes/origin/main']).stdout.trim();
const changed=(sha)=>new Set(run(['diff','--name-only','-z',base,sha]).stdout.split('\0').filter(Boolean));
const mainPaths=changed(main),candidatePaths=changed(head);
const common=[...mainPaths].filter(p=>candidatePaths.has(p));
const onlyMain=[...mainPaths].filter(p=>!candidatePaths.has(p));
const onlyCandidate=[...candidatePaths].filter(p=>!mainPaths.has(p));
const shaFor=(tree,path)=>{
  const r=run(['rev-parse','--verify',tree+':'+path],true);
  return r.status===0?r.stdout.trim():null;
};
const m=run(['merge-tree','--write-tree','refs/remotes/origin/main','HEAD'],true);
const first=(m.stdout||'').trim().split('\n')[0].trim();
const tree=/^[0-9a-f]{40}$/.test(first)?first:null;
const errors=[];
if(m.status!==0) errors.push('Merge-tree reports conflicts (exit '+m.status+'). Manual conflict resolution required.');
if(!tree) errors.push('Merge-tree did not produce a verified candidate tree.');
const protectedMain=[
  'ci/backup/jb-free-offsite-backup.sh',
  'ci/backup/jb-t034-offline-full-pg-restore.sh',
  '.github/workflows/b11-t070-real-joint-restore-MANUAL.yml',
  '.github/workflows/b11-storage-media-MANUAL.yml'
];
const protectedCandidate=[
  'JANTA_BOL_PHASE_3C_WORKING/admin-auth.js',
  'JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
  'JANTA_BOL_PHASE_3C_WORKING/admin-security.html',
  'JANTA_BOL_PHASE_3C_WORKING/backend-client.js',
  'JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js',
  'JANTA_BOL_PHASE_3C_WORKING/public-c1-projection.js',
  'JANTA_BOL_PHASE_3C_WORKING/article.html',
  'JANTA_BOL_PHASE_3C_WORKING/website-v3.js',
  'JANTA_BOL_PHASE_3C_WORKING/index.html',
  'vercel.json'
];
function compareBlob(origin,path,label){
  const expected=shaFor(origin,path);
  const actual=tree?shaFor(tree,path):null;
  if(expected!==actual)errors.push(label+' altered: '+path);
}
if(tree){
  for(const p of onlyMain)compareBlob(main,p,'Main-only');
  for(const p of onlyCandidate)compareBlob(head,p,'Candidate-only');
  for(const p of protectedMain)if(!candidatePaths.has(p))compareBlob(main,p,'Main critical');
  for(const p of protectedCandidate)if(!mainPaths.has(p))compareBlob(head,p,'Founder/V3 critical');
}
const conflictLines=(m.stdout||'').split('\n').filter(x=>/^(CONFLICT|Auto-merging)/.test(x)).slice(0,35);
const report={
  gate:'B12-main-no-loss-READONLY',
  main_sha:main,
  candidate_sha:head,
  merge_base:base,
  main_changed_paths:mainPaths.size,
  candidate_changed_paths:candidatePaths.size,
  both_changed_paths:common.length,
  main_only_paths:onlyMain.length,
  candidate_only_paths:onlyCandidate.length,
  merged_tree_available:!!tree,
  merge_conflict_status:m.status,
  overlap_examples:common.slice(0,45),
  conflict_lines:conflictLines,
  errors:errors.slice(0,80),
  decision:errors.length?'HOLD — NOT safe to merge or release':'TREE-LEVEL NO-LOSS PASS — release still requires full hosted checks and Founder approval'
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(errors.length)process.exitCode=2;
