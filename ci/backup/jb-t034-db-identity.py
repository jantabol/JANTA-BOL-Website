#!/usr/bin/env python3
"""T034 B1: compile an encrypted source DB-identity JSON into OFFLINE SQL.

Only a single allowlisted database is supported. Never execute output on LIVE,
never accept SQL/fragments from the source archive, and never print metadata.
"""
import json
import pathlib
import re
import sys

ALLOWED_ROLES = {
    "PUBLIC", "postgres", "dashboard_user", "supabase_etl_admin",
    "supabase_storage_admin", "authenticated", "anon", "service_role",
}
ALLOWED_PRIVS = {"CONNECT", "CREATE", "TEMPORARY"}
ALLOWED_KEYS = {"database", "owner", "encoding", "provider", "collate",
                "ctype", "locale", "collversion", "acl", "database_settings"}


def stop():
    raise SystemExit("T034_DB_IDENTITY_HOLD: invalid/unreviewed metadata (NO source modification)")


def literal(value):
    if not isinstance(value, str) or len(value) > 100:
        stop()
    if not re.fullmatch(r"[a-zA-Z0-9_.@/-]+", value):
        stop()
    return "'" + value.replace("'", "''") + "'"


def require_schema(data):
    if not isinstance(data, dict) or set(data) != ALLOWED_KEYS:
        stop()
    if data["database"] != "postgres" or data["owner"] != "postgres":
        stop()
    if data["encoding"] != "UTF8" or data["provider"] not in ("c", "i"):
        stop()
    for k in ("collate", "ctype"):
        literal(data[k])
    locale = data["locale"]
    if data["provider"] == "i":
        literal(locale)
    elif locale is not None:
        stop()
    if data["collversion"] is not None:
        literal(data["collversion"])
    if not isinstance(data["acl"], list) or not data["acl"]:
        stop()
    seen = set()
    for entry in data["acl"]:
        if not isinstance(entry, dict) or set(entry) != {
            "grantee", "grantor", "privilege", "grantable"
        }:
            stop()
        name = entry["grantee"]
        priv = entry["privilege"]
        if name not in ALLOWED_ROLES or entry["grantor"] != "postgres":
            stop()
        if priv not in ALLOWED_PRIVS or not isinstance(entry["grantable"], bool):
            stop()
        identity = (name, priv)
        if identity in seen:
            stop()
        seen.add(identity)
    settings = data["database_settings"]
    if not isinstance(settings, list):
        stop()
    for rec in settings:
        if not isinstance(rec, dict) or set(rec) != {"role", "options"}:
            stop()
        if rec["role"] != "ALL_ROLES" or not isinstance(rec["options"], list):
            stop()
        for opt in rec["options"]:
            # A setting not explicitly reviewed requires a new audit.
            if not isinstance(opt, str) or not re.fullmatch(
                r"app[.]settings[.]jwt_exp=[0-9]{1,7}", opt
            ):
                stop()
    return data


def compile_sql(data):
    create = [
        "CREATE DATABASE postgres WITH TEMPLATE template0 OWNER postgres",
        "ENCODING 'UTF8'",
        "LOCALE_PROVIDER " + ("icu" if data["provider"] == "i" else "libc"),
        "LC_COLLATE " + literal(data["collate"]),
        "LC_CTYPE " + literal(data["ctype"]),
    ]
    if data["provider"] == "i":
        create.append("ICU_LOCALE " + literal(data["locale"]))
    sql = [" ".join(create) + ";", "SET ROLE postgres;"]
    # Revoke ALL explicit grants first, including effective PUBLIC defaults.
    # Script is allowed ONLY after the disposable bootstrap postgres DB is dropped.
    for name in sorted({entry["grantee"] for entry in data["acl"]} | {"PUBLIC", "postgres"}):
        sql.append(f"REVOKE ALL PRIVILEGES ON DATABASE postgres FROM {name};")
    for entry in sorted(data["acl"], key=lambda z: (z["grantee"], z["privilege"])):
        grant = (f"GRANT {entry['privilege']} ON DATABASE postgres TO "
                 f"{entry['grantee']}")
        if entry["grantable"]:
            grant += " WITH GRANT OPTION"
        sql.append(grant + ";")
    sql.append("RESET ROLE;")
    for setting in data["database_settings"]:
        for opt in setting["options"]:
            val = opt.split("=", 1)[1]
            sql.append(f"ALTER DATABASE postgres SET app.settings.jwt_exp TO {literal(val)};")
    return "\n".join(sql) + "\n"


def main():
    if len(sys.argv) not in (4, 5) or sys.argv[1] not in ("plan", "compare"):
        stop()
    action, input_path, output_path = sys.argv[1:4]
    cross_image_fake = (
        len(sys.argv) == 5 and sys.argv[4] == "--legacy-fake-cross-image"
    )
    if len(sys.argv) == 5 and not cross_image_fake:
        stop()
    if cross_image_fake and action != "compare":
        stop()
    data = require_schema(json.loads(pathlib.Path(input_path).read_text()))
    if action == "plan":
        dest = pathlib.Path(output_path)
        dest.write_text(compile_sql(data))
        dest.chmod(0o600)
        return
    target = require_schema(json.loads(pathlib.Path(output_path).read_text()))
    # Provider/collation-version, grants, grantor, grant-options and settings
    # must match, not just count or successful SELECT as supabase_admin.
    def normal(x):
        x = dict(x)
        # The source and disposable Supabase bootstrap do not share role OIDs.
        # Canonical grants MUST be compared by names+privileges, not OID order.
        x["acl"] = sorted(x["acl"], key=lambda a: (
            a["grantee"], a["grantor"], a["privilege"], a["grantable"]
        ))
        x["database_settings"] = sorted(
            x["database_settings"],
            key=lambda a: (a["role"], json.dumps(a["options"], sort_keys=True))
        )
        return x
    left, right = normal(data), normal(target)
    if cross_image_fake:
        # ONLY caller's exact fake-only GitHub runner is permitted to request
        # this exception: legacy fixture uses postgres:17 Debian as source,
        # but the production-compatible clone uses Supabase image/ICU build.
        # Actual production archive has no such exception; its source
        # collation-version equality remains a HARD restore gate.
        if not (left["provider"] == right["provider"] == "c"):
            stop()
        if left["collversion"] != right["collversion"]:
            print("T034_LEGACY_FAKE_COLLATION_VERSION=NOT_PROVEN_DIFFERENT_SOURCE_IMAGE", file=sys.stderr)
        left["collversion"] = right["collversion"]
    if left != right:
        names = sorted(k for k in ALLOWED_KEYS if left[k] != right[k])
        # Field names ONLY; never expose locale values, ACL rows or settings.
        print("T034_DB_IDENTITY_DIFFERENT_FIELDS=" + ",".join(names), file=sys.stderr)
        stop()


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, UnicodeError):
        stop()
