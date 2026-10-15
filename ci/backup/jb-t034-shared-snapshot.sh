#!/usr/bin/env bash
# JANTA BOL T034 — exported snapshot coordinator for AUTHORITATIVE RAW pg_dump.
# Source this module only in reviewed manual backup or fake CI. READ-ONLY source.
# The coordinator must remain connected until raw archive and manifests finish.
# Do not export/filter the secret DB URI or snapshot id to job logs.
jb_t034_snapshot_start() {
  [[ -n "${JB_DB_URI:-}" && -d "${JB_T034_SNAPSHOT_WORK:-}" ]] || return 1
  # NOT a transaction pooler: JANTA BOL port 5432 must support stable sessions.
  coproc JB_T034_COORD {
    docker run --rm -i --network=host postgres:17 \
      psql -X -qAt -v ON_ERROR_STOP=1 "$JB_DB_URI" \
      2> "$JB_T034_SNAPSHOT_WORK/coordinator.err"
  }
  JB_T034_COORD_PID_SAVE=$JB_T034_COORD_PID
  JB_T034_COORD_RD=${JB_T034_COORD[0]}
  JB_T034_COORD_WR=${JB_T034_COORD[1]}
  printf 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;\nSELECT pg_export_snapshot();\n' \
    >&"$JB_T034_COORD_WR" || return 1
  IFS= read -r -t 35 JB_T034_SNAPSHOT_ID <&"$JB_T034_COORD_RD" || return 1
  [[ "$JB_T034_SNAPSHOT_ID" =~ ^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+$ ]] || return 1
  return 0
}

jb_t034_snapshot_query() {
  [[ "$#" == 2 && -f "$1" && -n "${JB_T034_SNAPSHOT_ID:-}" ]] || return 1
  local file="$1" out="$2"
  {
    printf 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;\n'
    printf "SET TRANSACTION SNAPSHOT '%s';\n" "$JB_T034_SNAPSHOT_ID"
    cat "$file"
    printf '\nCOMMIT;\n'
  } | docker run --rm -i --network=host postgres:17 \
      psql -X -qAt -v ON_ERROR_STOP=1 "$JB_DB_URI" \
      > "$out" 2> "$JB_T034_SNAPSHOT_WORK/reader.err"
}

jb_t034_snapshot_finish() {
  # Never log exported transaction token or connection string.
  if [[ -n "${JB_T034_COORD_WR:-}" ]]; then
    printf 'ROLLBACK;\n\\q\n' >&"$JB_T034_COORD_WR" 2>/dev/null || true
    eval "exec ${JB_T034_COORD_WR}>&-" || true
  fi
  if [[ -n "${JB_T034_COORD_RD:-}" ]]; then
    eval "exec ${JB_T034_COORD_RD}<&-" || true
  fi
  if [[ -n "${JB_T034_COORD_PID_SAVE:-}" ]]; then
    wait "$JB_T034_COORD_PID_SAVE" 2>/dev/null || true
  fi
  unset JB_T034_SNAPSHOT_ID JB_T034_COORD_WR JB_T034_COORD_RD JB_T034_COORD_PID_SAVE
}
