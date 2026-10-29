#!/usr/bin/env python3
"""P4-T064: inspect all tracked ZIP archives without printing secrets or extracting files.
CI verification only, no network/cloud credentials, no Archive byte mutations.
"""
import re, subprocess, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
archives=[x for x in files if x.lower().endswith('.zip') and x]
tests=[
 ('SUPABASE_SECRET',re.compile(rb'sb_secret_[A-Za-z0-9_-]{10,}')),
 ('PRIVATE_PEM',re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
 ('AWS_KEY',re.compile(rb'AKIA[A-Z0-9]{16}')),
 ('STRIPE_LIVE',re.compile(rb'sk_live_[a-z0-9]{12,}',re.I)),
 ('WEBHOOK_KEY',re.compile(rb'whsec_[a-z0-9]{10,}',re.I)),
 ('SERVICE_ROLE_ASSIGN',re.compile(rb'(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD)\s*[:=]\s*["\x27][^"\x27\r\n]{12,}["\x27]',re.I)),
]
scanned=0
problems=[]
for rel in archives:
    src=ROOT/rel
    if not zipfile.is_zipfile(src):
        problems.append((rel,'BROKEN_ARCHIVE'));continue
    with zipfile.ZipFile(src) as z:
        for m in z.infolist():
            if m.is_dir():continue
            inner=m.filename
            if inner.startswith('/') or '..' in Path(inner).parts or '\\' in inner:
                problems.append((rel,'PATH_TRAVERSAL_MEMBER'));continue
            if m.file_size>20_000_000 or m.compress_size>20_000_000:
                problems.append((rel,'OVERSIZE_MEMBER'));continue
            if not inner.lower().endswith(('.html','.js','.ts','.json','.css','.txt','.md','.sql','.env','.ini','.yaml','.yml','.log')):
                continue
            # Do not print data; binary blobs, if misnamed as text, can be read safely.
            raw=z.read(m)
            scanned+=1
            found=[name for name,pattern in tests if pattern.search(raw)]
            if found:problems.append((f'{rel}::{inner}',','.join(found)))
assert archives, 'T064_TRACKED_BACKUP_ARCHIVE_MISSING_FROM_INVENTORY'
if problems:
    for path,flag in problems:
        print(f'T064_ARCHIVE_HOLD {path} flags={flag} VALUE_SUPPRESSED')
    raise SystemExit(1)
print(f'T064_ARCHIVE_PASS archives={len(archives)} text_members={scanned} high_confidence_secret_hits=0')
