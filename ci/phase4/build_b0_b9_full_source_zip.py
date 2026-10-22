#!/usr/bin/env python3
"""Build/verify all-Git-tracked B0..B9 source ZIP at exactly one immutable commit.
No live database, secrets, external media, untracked runtime evidence, or .git.
"""
from __future__ import annotations
import argparse,hashlib,json,os,stat,subprocess,zipfile
from pathlib import Path,PurePosixPath

ROOT=Path(__file__).resolve().parents[2]
PREFIX='JANTA_BOL_MASTER_SOURCE/'
MANIFEST=PREFIX+'MASTER_SHA256_MANIFEST.json'
ESSENTIAL=[
 'index.html','script.js','style.css','README.md',
 'JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
 'JANTA_BOL_PHASE_3C_WORKING/backend-client.js',
 'JANTA_BOL_PHASE_3C_WORKING/phase2-client.js',
 'JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html',
 'JANTA_BOL_PHASE_3C_WORKING/b9-client.js',
 'JANTA_BOL_PHASE_3C_WORKING/b9-search.html',
 'JANTA_BOL_PHASE_3C_WORKING/b9-analytics.html',
 'JANTA_BOL_PHASE_3C_WORKING/b9-article-ui.js',
 'JANTA_BOL_PHASE_4_WORKING/db/20261022_b9_search_analytics_REVIEW_ONLY.sql',
 'ci/phase4/b9-pg17-regression.sql',
 'ci/phase4/b9-client-and-ui.test.mjs',
 'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md',
 '.github/workflows/b9-precode-protected-ci.yml',
 'tools/jb_manual_test.py',
]
def git(*args):
 return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def list_files():
 paths=[p.decode() for p in git('ls-files','-z').split(b'\0') if p]
 if len(paths)<608 or len(set(paths))!=len(paths):raise RuntimeError('Missing tracked baseline/duplicates')
 for p in paths:
  name=PurePosixPath(p)
  if name.is_absolute() or '..' in name.parts or p.startswith(('.git/','dist/','node_modules/')) or Path(p).name.startswith('.env'):
   raise RuntimeError('Refuse untracked/secret/unsafe: '+p)
  f=ROOT/p
  if not f.is_file() or f.is_symlink():raise RuntimeError('Missing or unsafe source: '+p)
 for x in ESSENTIAL:
  if x not in paths:raise RuntimeError('Missing B0-B9 essential: '+x)
 return sorted(paths)
def verify(path):
 with zipfile.ZipFile(path,'r') as z:
  if z.testzip():raise RuntimeError('ZIP CRC failed')
  m=json.loads(z.read(MANIFEST))
  if m['schema']!='janta-bol-b0-to-b9-tracked-source-v1':raise RuntimeError('Manifest schema')
  paths=m['files'];got=z.namelist()
  if len(paths)!=m['files_count'] or len(got)!=len(paths)+1 or len(set(got))!=len(got):raise RuntimeError('ZIP members mismatch')
  for f in paths:
   p=PurePosixPath(f['path'])
   if p.is_absolute() or '..' in p.parts:raise RuntimeError('ZIP slip')
   raw=z.read(PREFIX+f['path'])
   if sha(raw)!=f['sha256'] or len(raw)!=f['size']:raise RuntimeError('SHA256 mismatch '+f['path'])
  if set(got)!={PREFIX+x['path'] for x in paths}|{MANIFEST}:raise RuntimeError('Unexpected archive member')
  for x in ESSENTIAL:
   if PREFIX+x not in got:raise RuntimeError('Missing essential '+x)
 print('VERIFIED:',path,'files',len(paths),'exact git',m['exact_commit_sha'])
def build(path):
 head=git('rev-parse','HEAD').decode().strip()
 if len(head)!=40:raise RuntimeError('Non-pinned Git commit')
 parent='77bd19639d8ffe173fcd109ca234e58aef6720dc'
 subprocess.run(['git','merge-base','--is-ancestor',parent,'HEAD'],cwd=ROOT,check=True)
 paths=list_files();record=[];path.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7,allowZip64=True) as z:
  for rel in paths:
   f=ROOT/rel;raw=f.read_bytes()
   record.append({'path':rel,'sha256':sha(raw),'size':len(raw)})
   info=zipfile.ZipInfo(PREFIX+rel,(2026,10,22,0,0,0))
   info.compress_type=zipfile.ZIP_DEFLATED
   info.external_attr=(0o755 if os.access(f,os.X_OK) else 0o644)<<16
   z.writestr(info,raw)
  meta={
   'schema':'janta-bol-b0-to-b9-tracked-source-v1',
   'source_repo':'jantabol/JANTA-BOL-Website',
   'source_branch':'codex/b9-precode-frozen-20261022',
   'base_b8_commit_sha':parent,
   'exact_commit_sha':head,
   'files_count':len(record),'files':record,
   'b9_implementation':'CODING_CANDIDATE_COMPLETE__EXTERNAL_REAL_TESTS_NOT_RUN',
   'b9_test_status':'P4-T100_TO_T109_NOT_FINAL_PASS',
   'b8_final':'HOLD_PENDING_EDITOR_E9_AND_OPERATIONAL_EVIDENCE',
   'notes':'Includes all tracked B0-B9 code, HTML, CSS, JS, SQL, CI and tests; no live Supabase migration applied.',
   'excluded':['live_database','private_evidence','untracked_secrets','login_credentials','device_recordings','live_media']
  }
  info=zipfile.ZipInfo(MANIFEST,(2026,10,22,0,0,0))
  info.compress_type=zipfile.ZIP_DEFLATED
  z.writestr(info,(json.dumps(meta,ensure_ascii=False,indent=2)+'\n').encode())
 verify(path)
 digest=sha(path.read_bytes())
 (path.parent/'MASTER_ZIP_SHA256.txt').write_text(digest+'  '+path.name+'\n',encoding='utf8')
 print('SHA256:',digest,'tracked_files:',len(record),'source_HEAD:',head)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--out');ap.add_argument('--verify')
 x=ap.parse_args()
 if bool(x.out)==bool(x.verify):ap.error('Provide exactly one of --out/--verify')
 if x.out:build(Path(x.out))
 else:verify(Path(x.verify))
