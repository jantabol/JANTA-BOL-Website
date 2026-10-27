#!/usr/bin/env python3
"""P4 T071 isolated PG17 RPO/RTO evidence drill.

REAL operations on an ephemeral network-disabled PostgreSQL 17 Docker container;
SYNTHETIC fixture data only, NOT production JANTA BOL, Hosted E8, or an SLA.
Measures observed restorable-point age and real disposable endpoint restoration.
Never reads secrets or private data. Always cleans up Docker and temp files.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import tarfile
import tempfile
import time
from contextlib import ExitStack

class Hold(Exception):
    pass

def must(check: bool, code: str):
    if not check:
        raise Hold(code)

def iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec='microseconds').replace('+00:00','Z')

def stamp(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))

def call(args, input_data=None, ok=True):
    result=subprocess.run(args,input=input_data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False,timeout=100)
    if ok and result.returncode!=0:
        raise Hold('LOCAL_COMMAND_FAILED')
    return result

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def fixture_sql():
    return """CREATE SCHEMA t071_fixture;
CREATE TABLE t071_fixture.articles(id uuid PRIMARY KEY, slug text NOT NULL UNIQUE);
CREATE TABLE t071_fixture.grievances(id uuid PRIMARY KEY, article_id uuid NOT NULL REFERENCES t071_fixture.articles(id), public_id text NOT NULL UNIQUE);
CREATE TABLE t071_fixture.live_sessions(id uuid PRIMARY KEY, article_id uuid NOT NULL REFERENCES t071_fixture.articles(id));
CREATE TABLE t071_fixture.live_updates(id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES t071_fixture.live_sessions(id));
CREATE TABLE t071_fixture.ad_campaigns(id uuid PRIMARY KEY, label text NOT NULL);
CREATE TABLE t071_fixture.ad_payments(id uuid PRIMARY KEY, campaign_id uuid NOT NULL REFERENCES t071_fixture.ad_campaigns(id));
ALTER TABLE t071_fixture.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_test_public ON t071_fixture.articles FOR SELECT TO t071_public_test USING (false);
GRANT USAGE ON SCHEMA t071_fixture TO t071_public_test;
GRANT SELECT ON t071_fixture.articles TO t071_public_test;
INSERT INTO t071_fixture.articles VALUES ('00000000-0000-4000-8000-000000000101','only-synthetic-article');
INSERT INTO t071_fixture.grievances VALUES ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000101','T071-SYNTHETIC-GRIEVANCE');
INSERT INTO t071_fixture.live_sessions VALUES ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000101');
INSERT INTO t071_fixture.live_updates VALUES ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000103');
INSERT INTO t071_fixture.ad_campaigns VALUES ('00000000-0000-4000-8000-000000000105','T071-SYNTHETIC-AD');
INSERT INTO t071_fixture.ad_payments VALUES ('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000105');
"""

def main():
    must(os.getenv('GITHUB_REPOSITORY')=='jantabol/JANTA-BOL-Website','REPO_SCOPE')
    must(os.getenv('GITHUB_EVENT_NAME')=='pull_request','EVENT_SCOPE')
    must(os.getenv('GITHUB_HEAD_REF')=='codex/b11-t071-failure-isolation-preflight-20261027','BRANCH_SCOPE')
    must(os.getenv('T071_ISOLATED_ONLY')=='YES','ISOLATION_OPT_IN')
    for key in ('JB_DB_URI','DATABASE_URL','SUPABASE_DB_PASSWORD','SUPABASE_SERVICE_ROLE_KEY',
                'JB_B11_SERVICE_ROLE_KEY','JB_BACKUP_B2_APPLICATION_KEY','JB_BACKUP_AGE_RECIPIENT'):
        must(not os.getenv(key),'PRODUCTION_CREDENTIAL_IN_ENV')
    must(call(['docker','--version']).returncode==0,'DOCKER_MISSING')
    ref='t071-rpo-rto-'+str(os.getpid())
    # ONLY a local Unix socket inside Docker: --network none, NO TCP port bindings.
    started=False
    with tempfile.TemporaryDirectory(prefix='t071-rpo-rto-') as temp:
      tmp=pathlib.Path(temp)
      def docker(*argv, input_data=None, ok=True):
          return call(['docker',*argv],input_data=input_data,ok=ok)
      def psql(query,db='t071_original',allow_fail=False):
          r=docker('exec',ref,'psql','-U','postgres','-d',db,
                  '-X','-qAt','-v','ON_ERROR_STOP=1','-c',query,
                  ok=not allow_fail)
          return r
      def verify(db):
          # A fresh process/connection, not the restoring connection.
          values=psql("""SELECT concat_ws('|',
          (SELECT slug FROM t071_fixture.articles ORDER BY slug LIMIT 1),
          (SELECT public_id FROM t071_fixture.grievances LIMIT 1),
          (SELECT count(*) FROM t071_fixture.live_updates),
          (SELECT count(*) FROM t071_fixture.ad_payments),
          (SELECT count(*) FROM t071_fixture.articles));""",db).stdout.decode().strip()
          must(values=='only-synthetic-article|T071-SYNTHETIC-GRIEVANCE|1|1|1','INTEGRITY_PARITY')
          orphans=psql("""SELECT
          (SELECT count(*) FROM t071_fixture.grievances g LEFT JOIN t071_fixture.articles a ON a.id=g.article_id WHERE a.id IS NULL)+
          (SELECT count(*) FROM t071_fixture.live_sessions s LEFT JOIN t071_fixture.articles a ON a.id=s.article_id WHERE a.id IS NULL)+
          (SELECT count(*) FROM t071_fixture.live_updates u LEFT JOIN t071_fixture.live_sessions s ON s.id=u.session_id WHERE s.id IS NULL)+
          (SELECT count(*) FROM t071_fixture.ad_payments p LEFT JOIN t071_fixture.ad_campaigns c ON c.id=p.campaign_id WHERE c.id IS NULL);""",db).stdout.decode().strip()
          must(orphans=='0','BROKEN_FK')
          denied=psql("SET ROLE t071_public_test; SELECT count(*) FROM t071_fixture.articles; RESET ROLE;",db).stdout.decode().strip()
          must(denied=='0','ANON_RLS_BYPASS')
          return values
      try:
          print('T071_STAGE=BOOT')
          boot=docker('run','-d','--rm','--name',ref,'--network','none',
                      '-e','POSTGRES_PASSWORD=T071_EPHEMERAL_DUMMY_ONLY',
                      'postgres:17')
          started=True
          must(bool(boot.stdout.strip()),'LOCAL_PG_CONTAINER_BOOT')
          healthy=False
          for _ in range(50):
              r=docker('exec',ref,'pg_isready','-q','-U','postgres','-d','postgres',ok=False)
              if r.returncode==0:healthy=True;break
              time.sleep(.2)
          must(healthy,'PG17_NOT_READY')
          print('T071_STAGE=VERSION')
          pg_version=psql("SHOW server_version_num;",'postgres').stdout.decode().strip()
          must(pg_version.startswith('17'),'WRONG_POSTGRES_MAJOR')
          print('T071_STAGE=ROLE_CREATE')
          role_result=docker('exec',ref,'psql','-U','postgres','-d','postgres','-X','-qAt',
                 '-v','ON_ERROR_STOP=1','-c','CREATE ROLE t071_public_test NOLOGIN;',ok=False)
          if role_result.returncode:
              # This command contains only hard-coded synthetic SQL. Never echo
              # arbitrary production command output from other operations.
              print('T071_LOCAL_ROLE_SQL_ERROR='+role_result.stderr.decode(errors='replace').strip()[:200])
          must(role_result.returncode==0,'PG17_SYNTHETIC_ROLE_CREATE_FAILED')
          print('T071_STAGE=DB_CREATE')
          docker('exec',ref,'createdb','-U','postgres','t071_original')
          print('T071_STAGE=FIXTURE_SQL')
          psql(fixture_sql())
          print('T071_STAGE=BASELINE_VERIFY')
          must(verify('t071_original')=='only-synthetic-article|T071-SYNTHETIC-GRIEVANCE|1|1|1','BASELINE_INVALID')
          # Synthetic five-media bundle, same categories as old G15 rehearsal.
          media=tmp/'media';media.mkdir()
          items={'grievance-private/a.dat':b'T071_SYNTH_GRIEVANCE_A',
                 'grievance-private/b.dat':b'T071_SYNTH_GRIEVANCE_B',
                 'private-editorial/a.dat':b'T071_SYNTH_EDITORIAL',
                 'public-media/a.dat':b'T071_SYNTH_PUBLIC_A',
                 'public-media/b.dat':b'T071_SYNTH_PUBLIC_B'}
          for key,data in items.items():
              f=media/key;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(data)
          fingerprints={key:sha(data) for key,data in items.items()}
          archive=tmp/'media.tar'
          with tarfile.open(archive,'w') as tar:
              for key in sorted(items):tar.add(media/key,arcname=key,recursive=False)
          # Establish last VERIFIED, restorable checkpoint BEFORE fault.
          print('T071_STAGE=PG_DUMP')
          dump=tmp/'trusted_checkpoint.pg17.dump'
          with dump.open('wb') as o:
              r=docker('exec',ref,'pg_dump','-U','postgres','-d','t071_original',
                     '-Fc','-n','t071_fixture')
              must(r.returncode==0 and bool(r.stdout),'SOURCE_BACKUP_FAILED')
              o.write(r.stdout)
          verified_dump_sha=sha(dump.read_bytes())
          print('T071_STAGE=RESTORE_VERIFIED')
          docker('exec',ref,'createdb','-U','postgres','t071_verified')
          with dump.open('rb') as inp:
              docker('exec','-i',ref,'pg_restore','-U','postgres','-d','t071_verified',
                     '--no-owner',input_data=inp.read())
          print('T071_STAGE=VERIFY_CHECKPOINT')
          verify('t071_verified')
          checkpoint_at=iso()
          # One ACKNOWLEDGED COMMITTED row arrives AFTER checkpoint. Restore must
          # surface it as lost, not pretend RPO=0, a key negative test.
          print('T071_STAGE=POST_CHECKPOINT_WRITE')
          psql("""INSERT INTO t071_fixture.articles(id,slug)
              VALUES ('00000000-0000-4000-8000-000000000199','post-checkpoint-committed');""")
          must(psql("SELECT count(*) FROM t071_fixture.articles;").stdout.decode().strip()=='2',
                'POST_CHECKPOINT_WRITE_NOT_COMMITTED')
          time.sleep(.25)
          incident_at=iso()
          incident_clock=time.monotonic()
          print('T071_STAGE=CRASH')
          docker('kill','--signal=KILL',ref)
          down=docker('exec',ref,'psql','-U','postgres','-d','t071_original',
                      '-X','-qAt','-c','SELECT 1;',ok=False)
          must(down.returncode!=0,'INCIDENT_DID_NOT_STOP_SERVICE')
          # Crash recover PostgreSQL engine on same disposable container. Simulate
          # irrecoverable DB loss with ONLY synthetic t071_original, then re-create
          # SAME database endpoint from trusted dump.
          print('T071_STAGE=RESTART')
          docker('start',ref)
          available=False
          for _ in range(70):
              p=docker('exec',ref,'pg_isready','-q','-U','postgres','-d','postgres',ok=False)
              if p.returncode==0:available=True;break
              time.sleep(.2)
          must(available,'PG17_CRASH_RESTART_FAILED')
          print('T071_STAGE=REBUILD_SAME_ENDPOINT')
          docker('exec',ref,'dropdb','-U','postgres','--if-exists','t071_original')
          docker('exec',ref,'createdb','-U','postgres','t071_original')
          with dump.open('rb') as inp:
              docker('exec','-i',ref,'pg_restore','-U','postgres','-d','t071_original',
                     '--no-owner',input_data=inp.read())
          print('T071_STAGE=RESTORED_VERIFY')
          verify('t071_original')
          must(psql("SELECT count(*) FROM t071_fixture.articles WHERE slug='post-checkpoint-committed';"
                    ).stdout.decode().strip()=='0','LOSS_NOT_ACCOUNTED_FOR')
          restored_media=tmp/'media-restored';restored_media.mkdir()
          with tarfile.open(archive,'r') as tar:
              for member in tar.getmembers():
                  # Never extract untrusted archives, only the exact local synthetic bundle.
                  must(member.name in fingerprints and member.isfile() and not member.issym(),'UNSAFE_MEDIA_MEMBER')
                  fd=tar.extractfile(member)
                  must(fd is not None,'MISSING_MEDIA_BYTES')
                  f=restored_media/member.name;f.parent.mkdir(parents=True,exist_ok=True)
                  f.write_bytes(fd.read())
          must(len(list(restored_media.rglob('*.dat')))==5,'MEDIA_COUNT_MISMATCH')
          for key,digest in fingerprints.items():
              must(sha((restored_media/key).read_bytes())==digest,'MEDIA_HASH_MISMATCH')
          # TRUE end marker = independent fresh DB query + synthetic media parity.
          restored_at=iso()
          elapsed_mono=time.monotonic()-incident_clock
          rpo_s=(stamp(incident_at)-stamp(checkpoint_at)).total_seconds()
          rto_s=(stamp(restored_at)-stamp(incident_at)).total_seconds()
          must(rpo_s>0 and rto_s>0 and abs(elapsed_mono-rto_s)<5,'INVALID_REAL_CHRONOLOGY')
          must(verified_dump_sha==sha(dump.read_bytes()),'BACKUP_MUTATED')
          metrics={
              'schema':'JANTA_BOL_T071_RPO_RTO_ISOLATED_PG17_OBSERVED_V1',
              'scope':'DISPOSABLE_OFFLINE_PG17_SYNTHETIC_FIXTURE_ONLY',
              'actual_postgresql_major':17,
              'real_disposable_db_crash_kill':True,
              'real_disposable_db_endpoint_write_failure_observed':True,
              'real_disposable_pg_dump_verified_before_fault':True,
              'same_disposable_db_endpoint_restored':True,
              'independent_new_pg_connection_restored_and_fk_rls_verified':True,
              'media_five_synthetic_sha_verified':True,
              'last_verified_restorable_checkpoint_at_utc':checkpoint_at,
              'incident_start_at_utc':incident_at,
              'independently_observed_service_restored_at_utc':restored_at,
              'observed_local_rpo_seconds':round(rpo_s,3),
              'observed_local_rto_seconds':round(rto_s,3),
              'post_checkpoint_committed_fixture_rows_lost_on_restore':1,
              'source_backup_sha256':verified_dump_sha,
              'founder_approved_production_rpo_target':'NOT_ESTABLISHED',
              'founder_approved_production_rto_target':'NOT_ESTABLISHED',
              'actual_production_rpo_rto':'NOT_MEASURED',
              'auth_edge_vercel_external_services_recovered':False,
              'hosted_integrated_13_family_matrix':'NOT_PROVEN',
              'e8_independent_full_stack':'HOLD',
              't071_final_pass_lock':False,
              't070_final_e8':'HOLD',
              'production_untouched':True
          }
          encoded=json.dumps(metrics,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
          print('T071_RPO_RTO_ISOLATED_REAL_PG17_DUMP_RESTORE=PASS')
          print('T071_LOCAL_POST_CHECKPOINT_ACKNOWLEDGED_WRITE_LOST=1_EXPECTED_AND_DISCLOSED')
          print('T071_RPO_RTO_OBSERVED_JSON='+encoded.decode())
          print('T071_EVIDENCE_SHA256='+sha(encoded))
          print('T071_HOSTED_END_TO_END_RPO_RTO=NOT_MEASURED')
          print('T071_FOUNDER_PRODUCTION_TARGETS=NOT_ESTABLISHED')
          print('T071_FINAL_PASS_LOCK=false')
      finally:
          if started:
              docker('rm','-f',ref,ok=False)

if __name__=='__main__':
    try:main()
    except Hold as e:
        # Only fixed static error class, no DB rows, IPs or credential spill.
        print('T071_ISOLATED_RECOVERY_HOLD='+str(e),file=sys.stderr)
        sys.exit(3)
    except Exception:
        print('T071_ISOLATED_RECOVERY_HOLD=UNCLASSIFIED',file=sys.stderr)
        sys.exit(3)
