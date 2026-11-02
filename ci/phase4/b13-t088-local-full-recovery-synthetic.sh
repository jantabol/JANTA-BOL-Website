#!/usr/bin/env bash
# T088 E8: JANTA BOL-ONLY, fake data, ephemeral local Auth/Storage/DB/Edge runtime.
# It DOES NOT recover the real protected production Archive, GoTrue users, B2 media,
# Edge secrets, Vercel deployment or the verified main backup into this runner.
set -Eeuo pipefail
set +x
umask 077
hold(){ echo "T088_ISOLATED_FULL_RUNTIME_HOLD=$1" >&2; exit 3; }
[[ "${GITHUB_REPOSITORY:-}" == 'jantabol/JANTA-BOL-Website' ]] || hold WRONG_REPOSITORY
[[ "${GITHUB_REF:-}" == 'refs/heads/codex/b13-t088-prod-backup-recovery-preflight-20261102' ]] || hold WRONG_BRANCH
for key in SUPABASE_DB_PASSWORD SUPABASE_SERVICE_ROLE_KEY JB_B11_SERVICE_ROLE_KEY JB_BACKUP_B2_APPLICATION_KEY JB_BACKUP_AGE_RECIPIENT JB_DB_URI DATABASE_URL VERCEL_TOKEN; do
  [[ -z "${!key:-}" ]] || hold PRODUCTION_SECRET_PRESENT
done
for cmd in supabase docker node curl; do command -v "$cmd" >/dev/null || hold MISSING_TOOL; done
base="$(pwd)"
tmp="$(mktemp -d)"
net="jb-t088-e8-local"
cleanup(){
  if [[ -n "${edge_pid:-}" ]]; then kill "$edge_pid" 2>/dev/null || true; wait "$edge_pid" 2>/dev/null || true; fi
  (cd "$tmp" && supabase stop --no-backup >/dev/null 2>&1) || true
  docker network rm "$net" >/dev/null 2>&1 || true
  rm -rf -- "$tmp"
}
trap cleanup EXIT INT TERM
cd "$tmp"
supabase init --yes >/dev/null || hold LOCAL_INIT
mkdir -p "$tmp/supabase/functions/t088-test-runtime"
cat >"$tmp/supabase/functions/t088-test-runtime/index.ts" <<'TS'
Deno.serve((req)=>new Response(JSON.stringify({ok:true,synthetic:true,method:req.method}),{
 status:200,headers:{"content-type":"application/json","cache-control":"no-store"}
}));
TS
docker network create -o 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' "$net" >/dev/null || hold LOCAL_LOOPBACK_NETWORK
if ! supabase start --network-id "$net" > "$tmp/start.log" 2>&1; then hold EMPTY_LOCAL_STACK_BOOT; fi
docker ps --format '{{.Names}}' > "$tmp/containers"
for container in db auth storage; do
  grep -Eq "^supabase_${container}_" "$tmp/containers" || hold "MISSING_${container}"
done
db="$(grep -E '^supabase_db_' "$tmp/containers" | head -n 1)"
[[ -n "$db" ]] || hold DB_CONTAINER_NOT_FOUND
docker exec "$db" psql -U postgres -d postgres -X -Atqc 'SELECT 1' | grep -qx 1 || hold LOCAL_PG_CONNECTION
# CLI json includes ephemeral local credentials. Never print/upload this file.
supabase status -o json > "$tmp/local.json" 2> "$tmp/status.err" || hold LOCAL_STATUS
chmod 600 "$tmp/local.json"
cat >"$tmp/schema.sql" <<'SQL'
CREATE TABLE public.t088_recovery_fixture(
 id uuid PRIMARY KEY,
 owner_uid uuid NOT NULL,
 content text NOT NULL
);
ALTER TABLE public.t088_recovery_fixture ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.t088_recovery_fixture TO authenticated;
CREATE POLICY t088_owner_reads ON public.t088_recovery_fixture FOR SELECT TO authenticated
  USING (owner_uid=(SELECT auth.uid()));
CREATE POLICY t088_owner_writes ON public.t088_recovery_fixture FOR INSERT TO authenticated
  WITH CHECK (owner_uid=(SELECT auth.uid()));
CREATE POLICY t088_storage_self_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='t088-private' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY t088_storage_self_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='t088-private' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
SQL
docker exec -i "$db" psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q <"$tmp/schema.sql" >/dev/null || hold LOCAL_RLS_SCHEMA
node "$base/ci/phase4/b13-t088-local-full-recovery-synthetic.mjs" "$tmp/local.json" || hold LOCAL_AUTH_STORAGE_IDENTITY_NEGATIVES
# Fresh disposable Edge source is never a copy of real JANTA BOL Edge code or secrets.
supabase functions serve t088-test-runtime --no-verify-jwt >"$tmp/edge.log" 2>&1 &
edge_pid=$!
ready=0
last_status=0
for i in $(seq 1 60); do
  if last_status="$(curl --silent --show-error --max-time 2 --output "$tmp/edge-response.json" \
     --write-out '%{http_code}' http://127.0.0.1:54321/functions/v1/t088-test-runtime 2>/dev/null)"; then
    if node -e 'let a=require(process.argv[1]);if(a.ok===true&&a.synthetic===true)process.exit(0);process.exit(1)' "$tmp/edge-response.json" 2>/dev/null; then
      ready=1;break
    fi
  fi
  kill -0 "$edge_pid" 2>/dev/null || hold EDGE_RUNTIME_EXITED
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  # Safe diagnostics: status only, never echo local credentials/log bodies.
  echo "T088_EDGE_RUNTIME_LAST_HTTP_STATUS=$last_status"
  # Emit only a classified failure reason; NEVER print local project credentials
  # or raw Edge log/HTTP response content in public CI.
  node -e '
    const fs=require("node:fs");
    let raw="";
    for(const p of process.argv.slice(1)){
      try{raw+="\n"+fs.readFileSync(p,"utf8").toLowerCase()}catch{}
    }
    const flags={
      BOOT_ERROR:raw.includes("boot_error"),
      MODULE_NOT_FOUND:raw.includes("module not found")||raw.includes("no such file"),
      PATH_NOT_FOUND:raw.includes("not found")||raw.includes("not_found"),
      INVALID_JWT:raw.includes("invalid jwt"),
      PORT_ALREADY_IN_USE:raw.includes("address already in use")||raw.includes("port already in use"),
      WORKER_ERROR:raw.includes("worker_error"),
      RUNTIME_UNAVAILABLE:raw.includes("runtime unavailable")||raw.includes("unavailable"),
      WASM_ERROR:raw.includes("wasm")&&raw.includes("error")
    };
    console.log("T088_EDGE_FAILURE_CLASS="+(Object.entries(flags).filter(([,v])=>v).map(([k])=>k).join("_")||"UNCLASSIFIED"));
  ' "$tmp/edge.log" "$tmp/edge-response.json"
  hold EDGE_RUNTIME_HTTP_NOT_READY
fi
echo 'T088_LOCAL_ACTUAL_AUTH_TWO_USER_SESSION=PASS_SCOPED_SYNTHETIC'
echo 'T088_LOCAL_ACTUAL_POSTGREST_TWO_USER_RLS=PASS_SCOPED_SYNTHETIC'
echo 'T088_LOCAL_ACTUAL_PRIVATE_STORAGE_BYTES_AND_DENIAL=PASS_SCOPED_SYNTHETIC'
echo 'T088_LOCAL_ACTUAL_EDGE_HTTP_RUNTIME=PASS_SCOPED_SYNTHETIC'
echo 'T088_LOCAL_GITHUB_RUNNER_NO_PAID_RESOURCE=PASS'
echo 'T088_REAL_PRODUCTION_B2_GOTRUE_EDGE_VERCEL_RESTORED=NO'
echo 'T088_E8_FINAL_FULL_PRODUCTION_PASS_LOCK=HOLD'
