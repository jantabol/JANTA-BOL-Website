#!/usr/bin/env python3
"""Complete reproducible SHA256 source ZIP for B0–B11; NO LIVE DB, secrets or evidence uploads."""
from __future__ import annotations
import argparse, hashlib, json, subprocess, stat, zipfile
from pathlib import Path, PurePosixPath
ROOT=Path(__file__).resolve().parents[2]
PREFIX='JANTA_BOL_MASTER_SOURCE/'
MANIFEST=PREFIX+'MASTER_SHA256_MANIFEST.json'
ESSENTIAL=[
  'index.html','script.js','style.css',
  'JANTA_BOL_PHASE_3C_WORKING/index.html',
  'JANTA_BOL_PHASE_3C_WORKING/article.html',
  'JANTA_BOL_PHASE_3C_WORKING/b9-home-entry.css',
  'JANTA_BOL_PHASE_3C_WORKING/b9-search-ui.js',
  'JANTA_BOL_PHASE_3C_WORKING/b9-analytics-ui.js',
  'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md',
  'ci/phase4/b9-pg17-regression.sql',
  'ci/phase4/b10-whole-platform-security-pg17.sql',
  'ci/phase4/b10-whole-platform-security-source.test.mjs',
  '.github/workflows/b10-whole-platform-security-candidate.yml',
  'tools/jb_manual_test.py',
  'ci/phase4/b11/recovery-engine.mjs',
  'ci/phase4/b11/signed-evidence.mjs',
  'ci/phase4/b11/storage-readonly-export.mjs',
  'ci/phase4/b11/media-offsite-companion.sh',
  'ci/phase4/b11/t034-networkless-restore-bridge.sh',
  'ci/phase4/b11/cli.mjs',
  'ci/phase4/b11/recovery-engine.test.mjs',
  'ci/phase4/b11/signed-evidence.test.mjs',
  'ci/phase4/b11/storage-readonly-export.test.mjs',
  'ci/phase4/b11/restore-bridge.test.mjs',
  '.github/workflows/b11-full-development-candidate.yml',
  '.github/workflows/b11-storage-media-MANUAL.yml']
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def paths():
 allfiles=sorted(p.decode('utf8') for p in git('ls-files','-z').split(b'\0') if p)
 if len(allfiles)<700 or len(allfiles)!=len(set(allfiles)):
  raise ValueError('Missing B0–B9 baseline or duplicated tracked path')
 for name in allfiles:
  p=PurePosixPath(name)
  if p.is_absolute() or '..' in p.parts or name.startswith(('.git/','dist/','node_modules/')) or p.name.startswith('.env'):
   raise ValueError('unsafe source '+name)
  f=ROOT/name
  if not f.is_file() or f.is_symlink():raise ValueError('missing file or symlink '+name)
 for req in ESSENTIAL:
  if req not in allfiles:raise ValueError('missing essential '+req)
 return allfiles
def verify(p):
 with zipfile.ZipFile(p) as z:
  if z.testzip():raise ValueError('CRC failure')
  m=json.loads(z.read(MANIFEST))
  if m['schema']!='janta-bol-b0-to-b11-tracked-source-v1':raise ValueError('B11 schema mismatch')
  if m['files_count']!=len(m['files']):raise ValueError('count mismatch')
  expected={MANIFEST}
  for f in m['files']:
   name=PREFIX+f['path'];expected.add(name)
   if '..' in PurePosixPath(f['path']).parts or PurePosixPath(f['path']).is_absolute():
    raise ValueError('ZIP path traversal')
   b=z.read(name)
   if sha(b)!=f['sha256'] or len(b)!=f['size']:raise ValueError('SHA/size mismatch '+name)
  if expected!=set(z.namelist()) or len(expected)!=len(z.namelist()):
   raise ValueError('ZIP member mismatch')
  for essential in ESSENTIAL:
   if PREFIX+essential not in expected:raise ValueError('missing '+essential)
 print('VERIFIED',p,'files',m['files_count'],'source',m['exact_commit_sha'])
def build(p):
 head=git('rev-parse','HEAD').decode().strip()
 subprocess.run(['git','merge-base','--is-ancestor','cb1b972f628104b492ba59659bb1c0f0627c8c77',head],cwd=ROOT,check=True)
 fl=paths();p.parent.mkdir(parents=True,exist_ok=True)
 records=[]
 with zipfile.ZipFile(p,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
  for rel in fl:
   f=ROOT/rel;raw=f.read_bytes()
   records.append({'path':rel,'sha256':sha(raw),'size':len(raw)})
   info=zipfile.ZipInfo(PREFIX+rel,(2026,10,23,0,0,0))
   info.compress_type=zipfile.ZIP_DEFLATED
   info.external_attr=(0o755 if f.stat().st_mode & stat.S_IXUSR else 0o644)<<16
   z.writestr(info,raw)
  meta={
   'schema':'janta-bol-b0-to-b11-tracked-source-v1',
   'source_repo':'jantabol/JANTA-BOL-Website',
   'source_branch':'codex/b10-whole-platform-security-candidate-20261023',
   'exact_commit_sha':head,'files_count':len(fl),'files':records,
   'b11':'DEVELOPMENT_CANDIDATE__T069_TO_T075_REAL_TESTS_NOT_YET_CLOSED',
   'b10_test_gate':'T060_T068_REAL_AUTH_DEVICE_AND_HOSTED_IDENTITY_FINAL_DUE',
   'b11_test_gate':'T069_TO_T075_REAL_DB_MEDIA_OFFSITE_RESTORE_DEVICE_AND_PLATFORM_PROOFS_DUE',
   'b9_test_gate':'T105_REAL_OLD_ARTICLE_AT_SCALE_E3_DUE',
   'b8_gate':'OLDER_ACCOUNTABILITY_FINAL_EVIDENCE_DUE',
   'excluded':['live_supabase_database','auth_secrets','production_storage','untracked_Android_evidence','actual_2024_or_2025_news']
  }
  z.writestr(MANIFEST,(json.dumps(meta,ensure_ascii=False,indent=2)+'\n').encode())
 verify(p)
 digest=sha(p.read_bytes())
 (p.parent/'MASTER_ZIP_SHA256.txt').write_text(digest+'  '+p.name+'\n',encoding='utf8')
 print('ZIP_SHA256',digest)
if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--out');parser.add_argument('--verify');a=parser.parse_args()
 if bool(a.out)==bool(a.verify):parser.error('exactly one of --out/--verify')
 if a.out:build(Path(a.out))
 else:verify(Path(a.verify))
